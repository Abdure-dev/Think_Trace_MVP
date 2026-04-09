from fastapi import APIRouter, Security, UploadFile, File, Form, HTTPException
from app.dependencies import get_current_user, security
from app.database import client
from google import genai
from google.genai import types
import os
import json
import re
import time
from app.schemas import AIGuidanceRequest

router = APIRouter()

client_ai = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

MODELS = [
    "models/gemini-2.5-flash",
    "models/gemini-2.5-pro",
    "models/gemini-3-flash-preview",
    "models/gemini-3-pro-preview",
    "models/gemini-flash-latest",
]

def call_gemini(contents, retries=5):
    for model in MODELS:
        for attempt in range(retries):
            try:
                return client_ai.models.generate_content(model=model, contents=contents)
            except Exception as e:
                err = str(e)
                print(f"Model {model} attempt {attempt + 1} failed: {err}")
                if "503" in err or "UNAVAILABLE" in err or "overloaded" in err.lower():
                    wait = min(2 ** attempt, 30)
                    print(f"Retrying in {wait}s...")
                    time.sleep(wait)
                    continue
                if "404" in err or "NOT_FOUND" in err:
                    break
                time.sleep(2)
    raise HTTPException(
        status_code=503,
        detail="AI service temporarily unavailable. Please try again in a moment."
    )

LATEX_RULES = """LATEX CONVERSION RULES — apply every single one:

GREEK LETTERS: α→$\\alpha$, β→$\\beta$, γ→$\\gamma$, δ→$\\delta$, ε→$\\epsilon$, θ→$\\theta$, λ→$\\lambda$, μ→$\\mu$, π→$\\pi$, σ→$\\sigma$, φ→$\\phi$, ω→$\\omega$, Γ→$\\Gamma$, Δ→$\\Delta$, Θ→$\\Theta$, Λ→$\\Lambda$, Σ→$\\Sigma$, Ω→$\\Omega$

SUPERSCRIPTS/SUBSCRIPTS: n²→$n^2$, n³→$n^3$, A^T→$A^T$, A^{-1}→$A^{-1}$, a_i→$a_i$, x_{ij}→$x_{ij}$

FRACTIONS: 1/2→$\\frac{1}{2}$, n/2→$\\frac{n}{2}$, a/b in math→$\\frac{a}{b}$

ROOTS: √n→$\\sqrt{n}$, √(a+b)→$\\sqrt{a+b}$, ∛n→$\\sqrt[3]{n}$

SUMMATION: ∑→$\\sum_{i=1}^{n}$, ∏→$\\prod_{i=1}^{n}$, ∫→$\\int$

SET NOTATION: ∈→$\\in$, ∉→$\\notin$, ⊆→$\\subseteq$, ⊂→$\\subset$, ∪→$\\cup$, ∩→$\\cap$, ∅→$\\emptyset$, ℝ→$\\mathbb{R}$, ℤ→$\\mathbb{Z}$, ℕ→$\\mathbb{N}$, ℚ→$\\mathbb{Q}$, ℂ→$\\mathbb{C}$

LOGIC: ∀→$\\forall$, ∃→$\\exists$, ¬→$\\neg$, ∧→$\\land$, ∨→$\\lor$, ⟹→$\\Rightarrow$, ⟺→$\\Leftrightarrow$

RELATIONS: ≤→$\\leq$, ≥→$\\geq$, ≠→$\\neq$, ≈→$\\approx$, ≡→$\\equiv$

ARROWS: →→$\\to$, ←→$\\leftarrow$, ↦→$\\mapsto$

MATRICES AND VECTORS:
- Column vector: $\\begin{pmatrix} a \\\\ b \\\\ c \\end{pmatrix}$
- Row vector: $\\begin{pmatrix} a & b & c \\end{pmatrix}$
- Matrix: $\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$ or $\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}$
- Augmented matrix: $\\left[\\begin{array}{cc|c} a & b & c \\\\ d & e & f \\end{array}\\right]$
- Determinant: $\\det(A)$, Transpose: $A^T$, Inverse: $A^{-1}$
- Norm: $\\|v\\|$, Dot product: $u \\cdot v$, Cross product: $u \\times v$
- Bold vectors: $\\mathbf{v}$ or $\\vec{v}$

LINEAR ALGEBRA:
- Span: $\\text{span}\\{v_1, v_2\\}$, Rank: $\\text{rank}(A)$, Null space: $\\ker(A)$
- Eigenvalue: $Av = \\lambda v$, Characteristic polynomial: $\\det(A - \\lambda I)$
- Inner product: $\\langle u, v \\rangle$, Orthogonal: $u \\perp v$
- Linear map: $T: \\mathbb{R}^n \\to \\mathbb{R}^m$, Projection: $\\text{proj}_u v$

CALCULUS: $\\frac{d}{dx}$, $\\frac{\\partial f}{\\partial x}$, $\\nabla f$, $\\lim_{x \\to a}$, ∞→$\\infty$

COMPLEXITY: O(n)→$O(n)$, Ω(n)→$\\Omega(n)$, Θ(n)→$\\Theta(n)$
FLOOR/CEIL: ⌊x⌋→$\\lfloor x \\rfloor$, ⌈x⌉→$\\lceil x \\rceil$
LOG: log_b(n)→$\\log_b n$, ln→$\\ln$
COMBINATIONS: C(n,k)→$\\binom{n}{k}$

DISPLAY MATH: Standalone equations use $$...$$
INLINE MATH: Math within sentences uses $...$"""


def parse_problems_from_response(text: str) -> list[dict]:
    text = re.sub(r'```json\s*', '', text)
    text = re.sub(r'```\s*', '', text)
    text = text.strip()
    start = text.find('[')
    end = text.rfind(']') + 1
    if start == -1 or end == 0:
        return []
    problems = json.loads(text[start:end])
    if not isinstance(problems, list) or len(problems) == 0:
        return []
    valid = []
    for i, p in enumerate(problems):
        if isinstance(p, dict):
            valid.append({
                "problem_number": p.get("problem_number", i + 1),
                "main_text": p.get("main_text", p.get("description", p.get("text", ""))),
                "parts": p.get("parts", [])
            })
    return valid


EXTRACTION_PROMPT = f"""You are reading an academic assignment. Extract every problem as a separate structured entry.

CRITICAL RULES:
1. SKIP the course header, instructor name, due date, submission instructions, collaboration policy, and ANY administrative text — these are NOT problems
2. Only extract actual numbered problems/questions that students need to solve
3. Each problem MUST be its own SEPARATE entry — NEVER merge multiple problems together
4. Count the problems carefully — if you see PROBLEM 1, PROBLEM 2, PROBLEM 3, PROBLEM 4 return exactly 4 entries
5. Sub-parts (a), (b), (c) go in the "parts" array of their parent problem
6. Include ALL text within each problem including definitions, algorithms, or context for that specific problem

{LATEX_RULES}

Return ONLY a valid JSON array, no markdown, no backticks, nothing else:
[
  {{
    "problem_number": 1,
    "main_text": "Full problem statement here without sub-part text",
    "parts": [
      {{"label": "a", "text": "Full text of part a with all context needed to understand standalone"}},
      {{"label": "b", "text": "Full text of part b with all context needed to understand standalone"}}
    ]
  }},
  {{
    "problem_number": 2,
    "main_text": "Full problem text if no sub-parts",
    "parts": []
  }}
]

REMINDER: Skip headers and instructions. Only extract actual problems. Each problem is a SEPARATE entry. Return ONLY the JSON array."""


def extract_and_structure_from_pdf(file_bytes: bytes) -> list[dict]:
    for attempt in range(3):
        try:
            response = call_gemini([
                types.Part.from_bytes(data=file_bytes, mime_type="application/pdf"),
                EXTRACTION_PROMPT
            ])
            problems = parse_problems_from_response(response.text)
            if problems:
                print(f"Extracted {len(problems)} problems from PDF")
                return problems
            print(f"Empty result on attempt {attempt + 1}, retrying...")
            time.sleep(2)
        except json.JSONDecodeError as e:
            print(f"JSON error on attempt {attempt + 1}: {e}")
            time.sleep(2)
        except Exception as e:
            print(f"PDF extraction error on attempt {attempt + 1}: {e}")
            time.sleep(2)
    return [{"problem_number": 1, "main_text": "Failed to extract problems. Please try again.", "parts": []}]


def extract_and_structure_from_image(file_bytes: bytes, mime_type: str) -> list[dict]:
    for attempt in range(3):
        try:
            response = call_gemini([
                types.Part.from_bytes(data=file_bytes, mime_type=mime_type),
                EXTRACTION_PROMPT
            ])
            problems = parse_problems_from_response(response.text)
            if problems:
                print(f"Extracted {len(problems)} problems from image")
                return problems
            time.sleep(2)
        except Exception as e:
            print(f"Image extraction error on attempt {attempt + 1}: {e}")
            time.sleep(2)
    return [{"problem_number": 1, "main_text": "Failed to extract problems. Please try again.", "parts": []}]


def extract_problems_structured(raw_text: str) -> list[dict]:
    prompt = f"""You are extracting problems from academic text. Each numbered problem is a SEPARATE entry.

CRITICAL RULES:
1. Every distinct numbered problem MUST be its own SEPARATE entry
2. NEVER merge multiple problems into one entry
3. Sub-parts (a), (b), (c) go in the parts array

{LATEX_RULES}

Return ONLY a valid JSON array:
[
  {{
    "problem_number": 1,
    "main_text": "Full problem statement without sub-parts",
    "parts": [
      {{"label": "a", "text": "Full text of part a"}},
      {{"label": "b", "text": "Full text of part b"}}
    ]
  }}
]

Content:
{raw_text}

Return ONLY the JSON array."""

    for attempt in range(3):
        try:
            response = call_gemini(prompt)
            problems = parse_problems_from_response(response.text)
            if problems:
                return problems
            time.sleep(2)
        except Exception as e:
            print(f"Text extraction error attempt {attempt + 1}: {e}")
            time.sleep(2)
    return [{"problem_number": 1, "main_text": raw_text[:3000], "parts": []}]


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


def build_ai_prompt(problem: str, stage: str, student_input: str, history_text: str, questions_asked: int) -> str:
    stage_info = STAGE_DEFINITIONS.get(stage, STAGE_DEFINITIONS["understand"])
    questions_remaining = max(0, stage_info["questions"] - questions_asked)
    next_question_target = stage_info["question_targets"][min(questions_asked, len(stage_info["question_targets"]) - 1)]

    return f"""You are a Socratic tutor guiding a student through a structured academic reasoning process.

PROBLEM: {problem}

CURRENT STAGE: {stage.upper()}
STAGE OBJECTIVE: {stage_info["objective"]}
STAGE GOAL: {stage_info["goal"]}
UNLOCK CONDITION: {stage_info["unlock_when"]}

STAGE RULES (enforce strictly):
{chr(10).join(f"- {r}" for r in stage_info["rules"])}

FULL CONVERSATION HISTORY (all stages and all previous parts):
{history_text if history_text else "(none)"}

NOTE: Messages labeled [STAGE] show which stage they came from.
Lines starting with "---" are separators between different problem parts.
Count only YOUR messages labeled [{stage.upper()}] to determine questions asked in this stage.
Use the full history to avoid repeating questions and build on what the student already demonstrated.
If this is a sub-part, reference what the student did in previous parts where relevant.

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
5. If the student violates a stage rule redirect them firmly back to the stage objective
6. If questions_remaining > 0 → understood MUST be false, no exceptions
7. If questions_remaining = 0 AND student has engaged genuinely → understood = true
8. Keep your message to 2-3 sentences maximum
9. Briefly acknowledge what the student said then ask the next targeted question
10. If this is a sub-part, reference what the student did in previous parts where relevant

Respond ONLY with valid JSON:
{{"message": "your response", "understood": false}}

CRITICAL JSON FORMATTING: Double-escape LaTeX backslashes: \\\\frac not \\frac. Wrap ALL math in $ delimiters."""


# ── Routes ───────────────────────────────────────────────────────────────────

@router.post('/courses/{course_id}/assignments')
async def create_assignment(
    course_id: str,
    title: str = Form(...),
    source_type: str = Form(...),
    raw_text: str = Form(None),
    file: UploadFile = File(None),
    current_user=Security(get_current_user)
):
    if source_type not in ("pdf", "image", "text"):
        raise HTTPException(status_code=400, detail="source_type must be pdf, image, or text")

    problems = []

    if source_type == "text":
        if not raw_text:
            raise HTTPException(status_code=400, detail="raw_text required")
        problems = extract_problems_structured(raw_text)
    elif source_type == "pdf":
        if not file:
            raise HTTPException(status_code=400, detail="File required")
        problems = extract_and_structure_from_pdf(await file.read())
    elif source_type == "image":
        if not file:
            raise HTTPException(status_code=400, detail="File required")
        problems = extract_and_structure_from_image(await file.read(), file.content_type or "image/jpeg")

    assignment = client.table("Assignments").insert({
        "course_id": course_id,
        "title": title,
        "uploaded_by": current_user["id"],
        "source_type": source_type,
        "raw_text": "",
    }).execute()

    assignment_id = assignment.data[0]["id"]

    for prob in problems:
        problem_row = client.table("Problems").insert({
            "assignment_id": assignment_id,
            "problem_number": prob["problem_number"],
            "problem_text": prob["main_text"],
        }).execute()

        problem_id = problem_row.data[0]["id"]

        if prob.get("parts"):
            part_rows = [
                {
                    "problem_id": problem_id,
                    "part_label": p["label"],
                    "part_text": p["text"],
                    "part_number": i + 1,
                }
                for i, p in enumerate(prob["parts"])
            ]
            client.table("Problem_Parts").insert(part_rows).execute()

    return {
        "assignment": assignment.data[0],
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

    result_problems = []
    for p in problems.data:
        parts = client.table("Problem_Parts").select("*").eq("problem_id", p["id"]).order("part_number").execute()
        result_problems.append({**p, "parts": parts.data})

    return {**assignment.data[0], "problems": result_problems}


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
    questions_asked_in_stage = 0
    for msg in body.conversation_history:
        role = msg.get("role", "student")
        content = msg.get("content", "")
        if not content:
            continue
        if role == "system":
            history_text += f"\n{content}"
            continue
        role_label = "Student" if role == "student" else "ThinkTrace AI"
        stage_label = msg.get("stage", "unknown").upper()
        history_text += f"\n[{stage_label}] {role_label}: {content}"
        if role == "ai" and msg.get("stage") == body.stage:
            questions_asked_in_stage += 1

    prompt = build_ai_prompt(
        problem_text,
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

    questions_after = questions_asked_in_stage + 1
    if questions_after < STAGE_DEFINITIONS.get(body.stage, {}).get("questions", 5):
        parsed["understood"] = False

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

    problems = []
    if source_type == "text":
        if not raw_text:
            raise HTTPException(status_code=400, detail="raw_text required")
        problems = extract_problems_structured(raw_text)
    elif source_type == "pdf":
        if not file:
            raise HTTPException(status_code=400, detail="File required")
        problems = extract_and_structure_from_pdf(await file.read())
    elif source_type == "image":
        if not file:
            raise HTTPException(status_code=400, detail="File required")
        problems = extract_and_structure_from_image(await file.read(), file.content_type)

    existing = client.table("Problems") \
        .select("problem_number") \
        .eq("assignment_id", assignment_id) \
        .order("problem_number", desc=True) \
        .limit(1) \
        .execute()

    start_index = existing.data[0]["problem_number"] if existing.data else 0

    for i, prob in enumerate(problems):
        problem_row = client.table("Problems").insert({
            "assignment_id": assignment_id,
            "problem_number": start_index + i + 1,
            "problem_text": prob["main_text"],
        }).execute()

        problem_id = problem_row.data[0]["id"]

        if prob.get("parts"):
            part_rows = [
                {
                    "problem_id": problem_id,
                    "part_label": p["label"],
                    "part_text": p["text"],
                    "part_number": j + 1,
                }
                for j, p in enumerate(prob["parts"])
            ]
            client.table("Problem_Parts").insert(part_rows).execute()

    return {"added_count": len(problems)}


@router.get('/problems/{problem_id}')
async def get_problem(problem_id: str, current_user=Security(get_current_user)):
    problem = client.table("Problems").select("*").eq("id", problem_id).execute()
    if not problem.data:
        raise HTTPException(status_code=404, detail="Problem not found")

    p = problem.data[0]
    parts = client.table("Problem_Parts").select("*").eq("problem_id", problem_id).order("part_number").execute()

    siblings = client.table("Problems") \
        .select("id, problem_number, problem_text") \
        .eq("assignment_id", p["assignment_id"]) \
        .order("problem_number") \
        .execute()

    sibling_ids = [s["id"] for s in siblings.data if s["problem_number"] < p["problem_number"]]
    sibling_traces = []
    for sid in sibling_ids:
        traces = client.table("Traces") \
            .select("*") \
            .eq("problem_id", sid) \
            .eq("user_id", current_user["id"]) \
            .order("created_at") \
            .execute()
        if traces.data:
            sibling_traces.append({
                "problem_id": sid,
                "problem_number": next(s["problem_number"] for s in siblings.data if s["id"] == sid),
                "problem_text": next(s["problem_text"] for s in siblings.data if s["id"] == sid),
                "traces": traces.data
            })

    return {
        **p,
        "parts": parts.data,
        "siblings": siblings.data,
        "sibling_traces": sibling_traces
    }