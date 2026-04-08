from fastapi import APIRouter, Security, UploadFile, File, Form, HTTPException
from app.dependencies import get_current_user
from app.database import client
from app.schemas import CreateWorkspaceRequest, WorkspaceAIGuidanceRequest
from google import genai
from google.genai import types
import os
import json
import re

router = APIRouter()

client_ai = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


# ── Helpers ──────────────────────────────────────────────────────────────────

def call_gemini(contents):
    for model in ["models/gemini-2.5-flash", "models/gemini-2.0-flash"]:
        try:
            return client_ai.models.generate_content(model=model, contents=contents)
        except Exception:
            continue
    raise HTTPException(status_code=503, detail="AI service unavailable. Please try again.")


def extract_problems_from_text(raw_text: str) -> list[str]:
    prompt = f"""You are given a set of notes, problems, or academic content.
Extract every distinct problem, question, or topic to work through.
Return ONLY a JSON array of strings, one string per item, preserving full text.
Do not add commentary. Do not number them yourself.

Content:
{raw_text}

Return format:
["Full text of item 1", "Full text of item 2", ...]"""

    response = call_gemini(prompt)
    text = response.text.strip()
    text = re.sub(r'```json\n?', '', text)
    text = re.sub(r'```\n?', '', text)
    try:
        problems = json.loads(text)
        if isinstance(problems, list):
            return [str(p) for p in problems]
    except json.JSONDecodeError:
        pass
    return [raw_text]


def extract_text_from_pdf(file_bytes: bytes) -> str:
    response = call_gemini([
        types.Part.from_bytes(data=file_bytes, mime_type="application/pdf"),
        "Extract all the text from this document. Return only the raw text, no commentary."
    ])
    return response.text.strip()


def extract_text_from_image(file_bytes: bytes, mime_type: str) -> str:
    response = call_gemini([
        types.Part.from_bytes(data=file_bytes, mime_type=mime_type),
        "Extract all the text from this image. Return only the raw text, no commentary."
    ])
    return response.text.strip()


def build_ai_prompt(mode: str, problem: str, stage: str, student_input: str, history_text: str) -> str:
    if mode == "deep_focus":
        return f"""You are a strict academic coach. The student is in deep focus mode — no AI assistance.

Problem: {problem}
Stage: {stage}
Student input: {student_input}

Respond with ONLY this JSON — do not give hints, do not ask questions, do not engage:
{{"message": "Deep focus mode is active. Work through this independently.", "understood": false}}"""

    elif mode == "guided":
        return f"""You are a Socratic tutor. Guide with questions only — never give answers directly.

Problem: {problem}
Current stage: {stage}
Conversation so far:{history_text if history_text else " (none)"}
Student's latest response: {student_input}

Ask exactly 5 Socratic questions total before setting understood to true.
Respond ONLY with valid JSON:
{{"message": "your question here", "understood": false}}

Rules:
- Never give the answer
- Ask one question at a time
- Only set understood to true after 5 thoughtful responses
- Keep message to 2-3 sentences
- Return ONLY JSON
CRITICAL: In JSON strings double-escape LaTeX: \\\\frac not \\frac. Wrap math in $ delimiters."""

    else:  # open
        return f"""You are a collaborative academic AI. The student is in open mode — help fully but encourage deep thinking.

Problem: {problem}
Current stage: {stage}
Conversation so far:{history_text if history_text else " (none)"}
Student's latest response: {student_input}

Be helpful, explain concepts clearly, and work through problems together.
After 2-3 exchanges set understood to true if the student shows genuine engagement.
Respond ONLY with valid JSON:
{{"message": "your response here", "understood": false}}

Rules:
- Be warm and collaborative
- Explain reasoning, not just answers
- Return ONLY JSON
CRITICAL: In JSON strings double-escape LaTeX: \\\\frac not \\frac. Wrap math in $ delimiters."""


# ── Routes ───────────────────────────────────────────────────────────────────

@router.post('/workspaces')
async def create_workspace(
    title: str = Form(...),
    mode: str = Form("guided"),
    source_type: str = Form(...),
    raw_text: str = Form(None),
    file: UploadFile = File(None),
    current_user=Security(get_current_user)
):
    if mode not in ("deep_focus", "guided", "open"):
        raise HTTPException(status_code=400, detail="Invalid mode")
    if source_type not in ("pdf", "image", "text"):
        raise HTTPException(status_code=400, detail="Invalid source_type")

    extracted_text = ""
    if source_type == "text":
        if not raw_text:
            raise HTTPException(status_code=400, detail="raw_text required")
        extracted_text = raw_text
    elif source_type == "pdf":
        if not file:
            raise HTTPException(status_code=400, detail="File required")
        extracted_text = extract_text_from_pdf(await file.read())
    elif source_type == "image":
        if not file:
            raise HTTPException(status_code=400, detail="File required")
        extracted_text = extract_text_from_image(await file.read(), file.content_type or "image/jpeg")

    workspace = client.table("Personal_Workspaces").insert({
        "user_id": current_user["id"],
        "title": title,
        "mode": mode,
    }).execute()

    workspace_id = workspace.data[0]["id"]

    problems = extract_problems_from_text(extracted_text)
    problem_rows = [
        {"workspace_id": workspace_id, "problem_number": i + 1, "problem_text": p}
        for i, p in enumerate(problems)
    ]
    client.table("Workspace_Problems").insert(problem_rows).execute()

    return {
        "workspace": workspace.data[0],
        "problems": problem_rows,
        "problem_count": len(problems)
    }


@router.get('/workspaces')
async def get_workspaces(current_user=Security(get_current_user)):
    workspaces = client.table("Personal_Workspaces") \
        .select("*") \
        .eq("user_id", current_user["id"]) \
        .order("created_at", desc=True) \
        .execute()
    return workspaces.data


@router.get('/workspaces/{workspace_id}')
async def get_workspace(workspace_id: str, current_user=Security(get_current_user)):
    workspace = client.table("Personal_Workspaces") \
        .select("*") \
        .eq("id", workspace_id) \
        .eq("user_id", current_user["id"]) \
        .execute()
    if not workspace.data:
        raise HTTPException(status_code=404, detail="Workspace not found")

    problems = client.table("Workspace_Problems") \
        .select("*") \
        .eq("workspace_id", workspace_id) \
        .order("problem_number") \
        .execute()

    return {
        **workspace.data[0],
        "problems": problems.data
    }


@router.post('/workspaces/{workspace_id}/problems/{problem_id}/ai-guidance')
async def workspace_ai_guidance(
    workspace_id: str,
    problem_id: str,
    body: WorkspaceAIGuidanceRequest,
    current_user=Security(get_current_user)
):
    history_text = ""
    for msg in body.conversation_history:
        role = "Student" if msg["role"] == "student" else "ThinkTrace AI"
        history_text += f"\n{role}: {msg['content']}"

    prompt = build_ai_prompt(body.mode, body.problem, body.stage, body.student_input, history_text)

    response = call_gemini(prompt)

    text = response.text.strip()
    text = re.sub(r'```json\n?', '', text)
    text = re.sub(r'```\n?', '', text)
    text = re.sub(r'\\(?!["\\/bfnrtu])', r'\\\\', text)

    match = re.search(r'\{.*\}', text, re.DOTALL)
    if match:
        try:
            parsed = json.loads(match.group())
        except json.JSONDecodeError:
            parsed = {"message": "Keep working through this step.", "understood": False}
    else:
        parsed = {"message": "Keep working through this step.", "understood": False}

    return parsed


@router.get('/workspace-problems/{problem_id}')
async def get_workspace_problem(problem_id: str, current_user=Security(get_current_user)):
    problem = client.table("Workspace_Problems") \
        .select("*") \
        .eq("id", problem_id) \
        .execute()
    if not problem.data:
        raise HTTPException(status_code=404, detail="Problem not found")
    return problem.data[0]