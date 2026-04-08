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


def call_gemini(contents):
    for model in ["models/gemini-2.5-flash", "models/gemini-2.0-flash"]:
        try:
            return client_ai.models.generate_content(model=model, contents=contents)
        except Exception:
            continue
    raise HTTPException(status_code=503, detail="AI service unavailable. Please try again.")


def extract_problems_from_text(raw_text: str) -> list[str]:
    prompt = f"""You are given academic content with LaTeX math expressions.
Extract every distinct problem, question, or topic.
IMPORTANT: If a problem has sub-parts (a), (b), (c), (d) etc — extract EACH sub-part as a SEPARATE item in the array, prefixed with the parent problem context.
For example, if Problem 1 has parts (a) and (b), return them as two separate strings:
"Problem 1(a): [full context of problem 1] — Part (a): [sub-part text]"
"Problem 1(b): [full context of problem 1] — Part (b): [sub-part text]"

Return ONLY a JSON array of strings, one string per problem or sub-problem.
CRITICAL: Preserve ALL LaTeX expressions exactly — do not modify or remove $ delimiters or LaTeX commands.
Do not add commentary.

Content:
{raw_text}

Return format:
["Full text of problem or sub-problem 1 with $LaTeX$ intact", "Full text of problem 2", ...]"""

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
        """Extract all the text from this document.

CRITICAL MATH RULES:
- Convert ALL mathematical expressions, equations, symbols to LaTeX
- Wrap inline math in $ delimiters: $f(n) = O(g(n))$
- Wrap block/display math in $$ delimiters: $$T(n) = 2T(n/2) + n$$
- Convert Greek letters: Ω → $\\Omega$, Θ → $\\Theta$, Σ → $\\Sigma$, ∈ → $\\in$
- Convert summations: ∑ → $\\sum_{i=1}^{n}$
- Convert square roots: √n → $\\sqrt{n}$
- Convert fractions: 1/2 → $\\frac{1}{2}$
- Convert superscripts: n² → $n^2$, n³ → $n^3$
- Convert subscripts: f_k → $f_k$
- Keep all problem text, numbering, and sub-parts (a)(b)(c) intact
- Return raw text only, no commentary"""
    ])
    return response.text.strip()


def extract_text_from_image(file_bytes: bytes, mime_type: str) -> str:
    response = call_gemini([
        types.Part.from_bytes(data=file_bytes, mime_type=mime_type),
        """Extract all the text from this image.

CRITICAL MATH RULES:
- Convert ALL mathematical expressions, equations, symbols to LaTeX
- Wrap inline math in $ delimiters: $f(n) = O(g(n))$
- Wrap block/display math in $$ delimiters: $$T(n) = 2T(n/2) + n$$
- Convert Greek letters: Ω → $\\Omega$, Θ → $\\Theta$, Σ → $\\Sigma$, ∈ → $\\in$
- Convert summations: ∑ → $\\sum_{i=1}^{n}$
- Convert square roots: √n → $\\sqrt{n}$
- Convert fractions: 1/2 → $\\frac{1}{2}$
- Convert superscripts: n² → $n^2$, n³ → $n^3$
- Convert subscripts: f_k → $f_k$
- Keep all problem text, numbering, and sub-parts (a)(b)(c) intact
- Return raw text only, no commentary"""
    ])
    return response.text.strip()


STAGE_DEFINITIONS = {
    "understand": {
        "objective": "Read the problem carefully and restate it entirely in your own words. Identify what is given, what you are being asked to find, and any constraints or conditions.",
        "goal": "Student demonstrates they have read and understood the problem before attempting anything.",
        "rules": [
            "Student must restate the problem in their own words — not copy it",
            "Student must identify what is GIVEN (inputs, known values)",
            "Student must identify what is ASKED (output, goal)",
            "Student must identify any constraints or special conditions",
            "Student must NOT attempt to solve yet — this is comprehension only",
        ],
        "unlock_when": "Student has restated the problem, identified givens, identified the goal, and noted constraints. Even if correct, always ask all 5 questions.",
        "questions": 5,
        "question_targets": [
            "Ask them to restate the problem in their own words",
            "Ask what information is given or known",
            "Ask what they are being asked to find or prove",
            "Ask if there are any constraints, edge cases, or special conditions",
            "Ask what a wrong answer would look like — what are the boundaries of a valid answer",
        ],
    },
    "concept": {
        "objective": "Identify the core concepts, theorems, data structures, or techniques that apply to this problem. Explain WHY each one is relevant.",
        "goal": "Student identifies the right tools and justifies why they apply.",
        "rules": [
            "Student must name at least one specific concept, theorem, or technique",
            "Student must explain WHY it applies — not just name it",
            "Student must connect the concept to the specific structure of the problem",
            "Student must NOT start planning steps yet — this is identification only",
        ],
        "unlock_when": "Student has named the right approach and justified why it fits. Even if correct immediately, always ask all 5 questions.",
        "questions": 5,
        "question_targets": [
            "Ask what type of problem this is (sorting, graph, recursion, proof, etc.)",
            "Ask what concepts or theorems come to mind and why",
            "Ask why that concept fits the structure of this specific problem",
            "Ask if there are alternative approaches and why they chose this one",
            "Ask what the key insight is that makes this approach work",
        ],
    },
    "plan": {
        "objective": "Write a clear numbered step-by-step plan for how you will solve this problem BEFORE you start solving. Be specific — each step must be actionable.",
        "goal": "Student produces a concrete, ordered, logical plan they can follow in the attempt stage.",
        "rules": [
            "Plan must be numbered steps — not vague descriptions",
            "Each step must be specific and actionable",
            "Plan must follow logically from the concept identified",
            "Student must NOT execute the plan yet — planning only",
            "Plan must cover the full solution from start to finish",
        ],
        "unlock_when": "Student has a numbered, specific, logical plan. Even if the plan is good immediately, always ask all 5 questions.",
        "questions": 5,
        "question_targets": [
            "Ask them to write out their first step specifically",
            "Ask what comes after that step and why",
            "Ask how they will handle the core complexity of the problem",
            "Ask what their final step will produce and how they will know it is correct",
            "Ask if their plan handles edge cases or boundary conditions",
        ],
    },
    "attempt": {
        "objective": "Execute your plan step by step. Show ALL your work. Do not skip steps. Write out every calculation, derivation, or logical inference.",
        "goal": "Student works through the solution with full reasoning shown.",
        "rules": [
            "Student must show every step — no skipping",
            "Student must explain each step as they do it",
            "Student must follow their plan from the previous stage",
            "Mistakes are allowed — genuine engagement matters more than correctness",
            "Student must NOT just write the final answer — the process must be shown",
        ],
        "unlock_when": "Student has shown genuine step-by-step work with reasoning. Even if the attempt is strong immediately, always ask all 5 questions.",
        "questions": 5,
        "question_targets": [
            "Ask them to walk through their first step in detail",
            "Ask them to explain the reasoning behind a specific calculation or inference",
            "Ask what happens at the critical or most complex step",
            "Ask if they got stuck anywhere and how they resolved it",
            "Ask them to verify their answer makes sense given the original problem",
        ],
    },
    "critique": {
        "objective": "Critically examine your own solution. Identify what could go wrong, edge cases it might fail on, assumptions you made, and whether there is a better approach.",
        "goal": "Student demonstrates they can think critically about their own work.",
        "rules": [
            "Student must identify at least one weakness or assumption in their solution",
            "Student must think about edge cases — what inputs might break it",
            "Student must consider whether their solution is optimal",
            "Student must NOT just say it looks correct — genuine critical thinking required",
        ],
        "unlock_when": "Student has identified at least one real weakness, edge case, or improvement. Even if they critique well immediately, always ask all 5 questions.",
        "questions": 5,
        "question_targets": [
            "Ask what assumptions they made that might not always hold",
            "Ask what input or case might cause their solution to fail",
            "Ask whether their solution is optimal in time or space and why",
            "Ask if there is a simpler or more elegant approach",
            "Ask what they would change if they solved this again from scratch",
        ],
    },
    "reflection": {
        "objective": "Summarize what you learned from solving this problem. What is the key insight? How does this connect to what you already know? What will you remember?",
        "goal": "Student consolidates learning and articulates the key takeaway in their own words.",
        "rules": [
            "Student must state the core insight or lesson in their own words",
            "Student must connect this problem to a broader concept or pattern",
            "Student must NOT just summarize what they did — they must say what they LEARNED",
            "Student must be specific — 'I learned recursion' is not enough",
        ],
        "unlock_when": "Student has articulated a specific, genuine insight. Even if they reflect well immediately, always ask all 5 questions.",
        "questions": 5,
        "question_targets": [
            "Ask what the single most important insight from this problem is",
            "Ask how this connects to other problems or concepts they have seen",
            "Ask what they would tell a friend who is stuck on a similar problem",
            "Ask what they found hardest and what made it click",
            "Ask how they would recognize a similar problem in the future",
        ],
    },
}


def build_ai_prompt(mode: str, problem: str, stage: str, student_input: str, history_text: str, questions_asked: int) -> str:
    stage_info = STAGE_DEFINITIONS.get(stage, STAGE_DEFINITIONS["understand"])
    questions_remaining = max(0, stage_info["questions"] - questions_asked)
    next_question_target = stage_info["question_targets"][min(questions_asked, len(stage_info["question_targets"]) - 1)]

    if mode == "deep_focus":
        return f"""You are a strict academic coach. Deep focus mode — no AI assistance.

Problem: {problem}
Stage: {stage}
Student input: {student_input}

Respond ONLY with this JSON:
{{"message": "Deep focus mode is active. Work through this independently.", "understood": false}}"""

    base_prompt = f"""You are a Socratic tutor guiding a student through a structured academic reasoning process.

PROBLEM: {problem}

CURRENT STAGE: {stage.upper()}
STAGE OBJECTIVE: {stage_info["objective"]}
STAGE GOAL: {stage_info["goal"]}
UNLOCK CONDITION: {stage_info["unlock_when"]}

STAGE RULES (enforce strictly):
{chr(10).join(f"- {r}" for r in stage_info["rules"])}

FULL CONVERSATION HISTORY (all stages):
{history_text if history_text else "(none)"}

NOTE: Messages are labeled by stage. You are currently in {stage.upper()}.
Count only YOUR messages labeled [{stage.upper()}] to determine questions asked in this stage.
Use the full history to understand the student's thinking arc — what they understood, planned, and attempted.

STUDENT'S LATEST RESPONSE: {student_input}

YOUR STATUS:
- Questions asked in {stage.upper()} stage so far: {questions_asked}
- Questions remaining: {questions_remaining} of {stage_info["questions"]} required
- Your next question should target: {next_question_target}

ABSOLUTE RULES — NEVER BREAK THESE:
1. You MUST ask exactly {stage_info["questions"]} questions in this stage before setting understood to true — NO EXCEPTIONS
2. Even if the student gives a perfect answer on the first try, you still ask all {stage_info["questions"]} questions
3. Ask ONLY ONE question per response — never two questions at once
4. Never give the answer or solve it for them
5. If the student violates a stage rule, redirect them firmly back to the stage objective
6. If questions_remaining > 0 → understood MUST be false, no exceptions
7. If questions_remaining = 0 AND student has engaged genuinely → understood = true
8. Keep your message to 2-3 sentences maximum
9. Briefly acknowledge what the student said, then ask the next targeted question
10. Use the conversation history to avoid repeating questions and to build on what the student has already shown"""

    if mode == "guided":
        return base_prompt + f"""

Respond ONLY with valid JSON:
{{"message": "your response", "understood": false}}

CRITICAL JSON FORMATTING: Double-escape LaTeX backslashes: \\\\frac not \\frac. Wrap ALL math in $ delimiters."""

    else:  # open
        return base_prompt + f"""

In open mode you can explain concepts and give examples, but do not just hand them the answer.
Be warm and encouraging.

Respond ONLY with valid JSON:
{{"message": "your response", "understood": false}}

CRITICAL JSON FORMATTING: Double-escape LaTeX backslashes: \\\\frac not \\frac. Wrap ALL math in $ delimiters."""


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

    return {**workspace.data[0], "problems": problems.data}


@router.post('/workspaces/{workspace_id}/problems/{problem_id}/ai-guidance')
async def workspace_ai_guidance(
    workspace_id: str,
    problem_id: str,
    body: WorkspaceAIGuidanceRequest,
    current_user=Security(get_current_user)
):
    # Build full history with stage labels + count questions in current stage
    history_text = ""
    questions_asked_in_stage = 0
    for msg in body.conversation_history:
        role = "Student" if msg["role"] == "student" else "ThinkTrace AI"
        stage_label = msg.get("stage", "unknown").upper()
        history_text += f"\n[{stage_label}] {role}: {msg['content']}"
        if msg["role"] == "ai" and msg.get("stage") == body.stage:
            questions_asked_in_stage += 1

    prompt = build_ai_prompt(
        body.mode,
        body.problem,
        body.stage,
        body.student_input,
        history_text,
        questions_asked_in_stage
    )

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

    # Enforce 5 questions rule on backend too
    questions_after = questions_asked_in_stage + 1
    if questions_after < STAGE_DEFINITIONS.get(body.stage, {}).get("questions", 5):
        parsed["understood"] = False

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