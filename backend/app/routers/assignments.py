from fastapi import APIRouter, Security, UploadFile, File, Form, HTTPException
from app.dependencies import get_current_user, security
from app.database import client
from google import genai
from google.genai import types
import os
import json
import re
import base64
from app.schemas import AIGuidanceRequest

router = APIRouter()

client_ai = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


# ── Helpers ──────────────────────────────────────────────────────────────────

def extract_problems_from_text(raw_text: str) -> list[str]:
    """Ask Gemini to extract individual problems from assignment text."""
    prompt = f"""You are given an assignment. Extract every distinct problem or question.
Return ONLY a JSON array of strings, one string per problem, preserving the full problem text.
Do not add commentary. Do not number them yourself.

Assignment:
{raw_text}

Return format:
["Full text of problem 1", "Full text of problem 2", ...]"""

    response = client_ai.models.generate_content(
        model="models/gemini-2.5-flash",
        contents=prompt
    )

    text = response.text.strip()
    text = re.sub(r'```json\n?', '', text)
    text = re.sub(r'```\n?', '', text)

    try:
        problems = json.loads(text)
        if isinstance(problems, list):
            return [str(p) for p in problems]
    except json.JSONDecodeError:
        pass

    # Fallback — treat the whole thing as one problem
    return [raw_text]


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Send PDF to Gemini and extract all text content."""
    b64 = base64.standard_b64encode(file_bytes).decode("utf-8")

    response = client_ai.models.generate_content(
        model="models/gemini-2.5-flash",
        contents=[
            types.Part.from_bytes(data=file_bytes, mime_type="application/pdf"),
            "Extract all the text from this document. Return only the raw text, no commentary."
        ]
    )
    return response.text.strip()


def extract_text_from_image(file_bytes: bytes, mime_type: str) -> str:
    """Send image to Gemini and extract all text content."""
    response = client_ai.models.generate_content(
        model="models/gemini-2.5-flash",
        contents=[
            types.Part.from_bytes(data=file_bytes, mime_type=mime_type),
            "Extract all the text from this image. Return only the raw text, no commentary."
        ]
    )
    return response.text.strip()


# ── Routes ───────────────────────────────────────────────────────────────────

@router.post('/courses/{course_id}/assignments')
async def create_assignment(
    course_id: str,
    title: str = Form(...),
    source_type: str = Form(...),  # "pdf" | "image" | "text"
    raw_text: str = Form(None),
    file: UploadFile = File(None),
    current_user=Security(get_current_user)
):
    if source_type not in ("pdf", "image", "text"):
        raise HTTPException(status_code=400, detail="source_type must be pdf, image, or text")

    # ── Step 1: Get raw text ──────────────────────────────────────────────
    extracted_text = ""

    if source_type == "text":
        if not raw_text:
            raise HTTPException(status_code=400, detail="raw_text is required for text assignments")
        extracted_text = raw_text

    elif source_type == "pdf":
        if not file:
            raise HTTPException(status_code=400, detail="File is required for PDF assignments")
        file_bytes = await file.read()
        extracted_text = extract_text_from_pdf(file_bytes)

    elif source_type == "image":
        if not file:
            raise HTTPException(status_code=400, detail="File is required for image assignments")
        file_bytes = await file.read()
        mime = file.content_type or "image/jpeg"
        extracted_text = extract_text_from_image(file_bytes, mime)

    # ── Step 2: Save assignment ───────────────────────────────────────────
    assignment = client.table("Assignments").insert({
        "course_id": course_id,
        "title": title,
        "uploaded_by": current_user["id"],
        "source_type": source_type,
        "raw_text": extracted_text,
    }).execute()

    assignment_id = assignment.data[0]["id"]

    # ── Step 3: Extract problems ──────────────────────────────────────────
    problems = extract_problems_from_text(extracted_text)

    problem_rows = [
        {
            "assignment_id": assignment_id,
            "problem_number": i + 1,
            "problem_text": p,
        }
        for i, p in enumerate(problems)
    ]

    client.table("Problems").insert(problem_rows).execute()

    # ── Step 4: Return assignment + problems ──────────────────────────────
    return {
        "assignment": assignment.data[0],
        "problems": problem_rows,
        "problem_count": len(problems)
    }


@router.get('/courses/{course_id}/assignments')
async def get_assignments(course_id: str, current_user=Security(get_current_user)):
    assignments = client.table("Assignments").select("*").eq("course_id", course_id).execute()
    return assignments.data


@router.get('/assignments/{assignment_id}')
async def get_assignment(assignment_id: str, current_user=Security(get_current_user)):
    assignment = client.table("Assignments").select("*").eq("id", assignment_id).execute()
    if not assignment.data:
        raise HTTPException(status_code=404, detail="Assignment not found")

    problems = client.table("Problems").select("*").eq("assignment_id", assignment_id).order("problem_number").execute()

    return {
        **assignment.data[0],
        "problems": problems.data
    }


@router.post('/problems/{problem_id}/ai-guidance')
async def get_problem_ai_guidance(
    problem_id: str,
    body: AIGuidanceRequest,
    current_user=Security(get_current_user)
):
    problem = client.table("Problems").select("*").eq("id", problem_id).execute()
    if not problem.data:
        raise HTTPException(status_code=404, detail="Problem not found")

    problem_text = problem.data[0]["problem_text"]

    history_text = ""
    for msg in body.conversation_history:
        role = "Student" if msg["role"] == "student" else "ThinkTrace AI"
        stage_label = f" [{msg.get('stage', 'unknown')} stage]" if msg.get('stage') else ""
        history_text += f"\n{role}{stage_label}: {msg['content']}"

    prompt = f"""You are a Socratic tutor helping a student deeply understand a problem.

Problem: {problem_text}
Current stage: {body.stage}

Conversation so far:{history_text if history_text else " (no previous conversation)"}

Student's latest response: {body.student_input}

Your job is to ask exactly 5 Socratic questions before marking the student as understood.
Count the number of questions already asked in the conversation history.
Only set understood to true after the student has answered at least 5 questions thoughtfully.

Respond ONLY with valid JSON:
{{
  "message": "your response here",
  "understood": false
}}

Rules:
- Count questions already asked from conversation history
- If the student didn't address the current question properly → rephrase and re-ask the SAME question differently, do NOT move to a new question
- If the student answered the current question well → move to a new deeper question
- NEVER ask a question that has already been answered satisfactorily
- If fewer than 5 questions have been answered satisfactorily → understood is false
- If 5 questions have been answered satisfactorily AND student shows genuine understanding → set understood to true, congratulate, NO more questions
- Never give the answer directly
- Keep message to 2-3 sentences maximum
- Return ONLY the JSON, no other text
- Write math in plain text, NOT LaTeX
CRITICAL JSON FORMATTING RULES:
- Return ONLY valid JSON
- In JSON strings, LaTeX backslashes MUST be double-escaped: write \\\\frac not \\frac
- All LaTeX commands must use double backslashes in JSON strings
- Always wrap ALL mathematical expressions in $ delimiters
- Every variable, equation, matrix, or formula must be inside $ or $$ delimiters
- For matrices, use simple notation like [[a, b], [c, d]] instead of \\begin{{pmatrix}}
- Avoid complex multi-line LaTeX environments
"""

    response = client_ai.models.generate_content(
        model="models/gemini-2.5-flash",
        contents=prompt
    )

    text = response.text.strip()
    text = re.sub(r'```json\n?', '', text)
    text = re.sub(r'```\n?', '', text)
    text = re.sub(r'\\(?!["\\/bfnrtu])', r'\\\\', text)

    match = re.search(r'\{.*\}', text, re.DOTALL)
    if match:
        json_str = match.group()
        try:
            parsed = json.loads(json_str)
        except json.JSONDecodeError:
            msg_match = re.search(r'"message"\s*:\s*"(.*?)"(?=\s*,\s*"understood")', json_str, re.DOTALL)
            understood_match = re.search(r'"understood"\s*:\s*(true|false)', json_str)
            parsed = {
                "message": msg_match.group(1) if msg_match else "Could you explain further?",
                "understood": understood_match.group(1) == "true" if understood_match else False
            }
    else:
        parsed = {"message": "Could you explain your reasoning further?", "understood": False}

    client.table("AI_Interactions").insert({
        "question": body.student_input,
        "rewritten_prompt": prompt,
        "response": parsed["message"],
        "intervention_level": 2,
        "allowed_mode": "socratic",
        "ai_model": "gemini-2.5-flash"
    }).execute()

    return parsed
@router.post('/assignments/{assignment_id}/problems')
async def add_problems(
    assignment_id: str,
    source_type: str = Form(...),
    raw_text: str = Form(None),
    file: UploadFile = File(None),
    current_user=Security(get_current_user)
):
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
        file_bytes = await file.read()
        extracted_text = extract_text_from_pdf(file_bytes)

    elif source_type == "image":
        if not file:
            raise HTTPException(status_code=400, detail="File required")
        file_bytes = await file.read()
        extracted_text = extract_text_from_image(file_bytes, file.content_type)

    # get current max problem_number
    existing = client.table("Problems") \
        .select("problem_number") \
        .eq("assignment_id", assignment_id) \
        .order("problem_number", desc=True) \
        .limit(1) \
        .execute()

    start_index = existing.data[0]["problem_number"] if existing.data else 0

    problems = extract_problems_from_text(extracted_text)

    rows = [
        {
            "assignment_id": assignment_id,
            "problem_number": start_index + i + 1,
            "problem_text": p,
        }
        for i, p in enumerate(problems)
    ]

    client.table("Problems").insert(rows).execute()

    return {
        "added_count": len(rows),
        "problems": rows
    }
@router.get('/problems/{problem_id}')
async def get_problem(problem_id: str, current_user=Security(get_current_user)):
    problem = client.table("Problems").select("*").eq("id", problem_id).execute()

    if not problem.data:
        raise HTTPException(status_code=404, detail="Problem not found")

    return problem.data[0]