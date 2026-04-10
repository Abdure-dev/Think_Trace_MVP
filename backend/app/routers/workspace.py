from fastapi import APIRouter, Security, UploadFile, File, Form, HTTPException
from app.dependencies import get_current_user
from app.database import client
from app.schemas import WorkspaceAIGuidanceRequest
from google import genai
from google.genai import types
from anthropic import Anthropic
import os
import json
import re
import time

router = APIRouter()

gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
claude_client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

GEMINI_MODELS = [
    "models/gemini-2.5-flash",
    "models/gemini-2.5-pro",
    "models/gemini-3-flash-preview",
    "models/gemini-3-pro-preview",
    "models/gemini-flash-latest",
    "models/gemini-2.5-flash-lite",
]


def call_gemini_extraction(contents):
    for model in GEMINI_MODELS:
        for attempt in range(5):
            try:
                return gemini_client.models.generate_content(model=model, contents=contents)
            except Exception as e:
                err = str(e)
                print(f"Model {model} attempt {attempt + 1} failed: {err}")
                if "503" in err or "UNAVAILABLE" in err or "overloaded" in err.lower():
                    wait = min(2 ** attempt, 16)
                    print(f"Retrying in {wait}s...")
                    time.sleep(wait)
                    continue
                if "404" in err or "NOT_FOUND" in err:
                    break
                time.sleep(1)
    raise HTTPException(status_code=503, detail="Extraction service unavailable.")


def call_guidance(prompt: str) -> str:
    fast_models = [
        "models/gemini-2.5-flash",
        "models/gemini-2.5-pro",
        "models/gemini-3-flash-preview",
        "models/gemini-flash-latest",
        "models/gemini-2.5-flash-lite",
    ]
    for model in fast_models:
        for attempt in range(3):
            try:
                response = gemini_client.models.generate_content(model=model, contents=prompt)
                print(f"Guidance served by Gemini: {model}")
                return response.text
            except Exception as e:
                err = str(e)
                if "503" in err or "UNAVAILABLE" in err or "overloaded" in err.lower():
                    wait = min(2 ** attempt, 8)
                    print(f"Retrying in {wait}s...")
                    time.sleep(wait)
                    continue
                if "404" in err or "NOT_FOUND" in err:
                    break
                time.sleep(1)

    print("Gemini unavailable — falling back to Claude Haiku")
    try:
        message = claude_client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=1000,
            messages=[{"role": "user", "content": prompt}]
        )
        return message.content[0].text
    except Exception as e:
        print(f"Claude fallback failed: {e}")
        raise HTTPException(status_code=503, detail="AI service temporarily unavailable. Please try again.")


def call_summary(prompt: str) -> str:
    try:
        message = claude_client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1500,
            messages=[{"role": "user", "content": prompt}]
        )
        return message.content[0].text
    except Exception as e:
        print(f"Claude Sonnet failed, trying Haiku: {e}")
        try:
            message = claude_client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=1500,
                messages=[{"role": "user", "content": prompt}]
            )
            return message.content[0].text
        except Exception as e2:
            raise HTTPException(status_code=503, detail="Summary service unavailable.")


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
    json_text = text[start:end]
    json_text = re.sub(r'\\(?!["\\/bfnrtu])', r'\\\\', json_text)
    try:
        problems = json.loads(json_text)
    except json.JSONDecodeError:
        json_text = json_text.replace('\\n', ' ').replace('\\t', ' ')
        json_text = re.sub(r'\\(?!["\\/bfnrtu])', r'\\\\', json_text)
        try:
            problems = json.loads(json_text)
        except json.JSONDecodeError as e:
            print(f"JSON parse failed after cleaning: {e}")
            return []
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
6. Include ALL text within each problem including definitions, algorithms, or context given for that specific problem

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
            response = call_gemini_extraction([
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
            response = call_gemini_extraction([
                types.Part.from_bytes(data=file_bytes, mime_type=mime_type),
                EXTRACTION_PROMPT
            ])
            problems = parse_problems_from_response(response.text)
            if problems:
                print(f"Extracted {len(problems)} problems from image")
                return problems
            time.sleep(2)
        except json.JSONDecodeError as e:
            print(f"JSON error on attempt {attempt + 1}: {e}")
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
4. Count problems carefully before writing JSON

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
            response = call_gemini_extraction(prompt)
            problems = parse_problems_from_response(response.text)
            if problems:
                return problems
            time.sleep(2)
        except Exception as e:
            print(f"Text extraction error attempt {attempt + 1}: {e}")
            time.sleep(2)
    return [{"problem_number": 1, "main_text": raw_text[:3000], "parts": []}]


def build_history_text(conversation_history: list, current_stage: str) -> tuple[str, int]:
    """
    Smart history trimming:
    - Keeps ALL student messages from current stage
    - Keeps last 4 AI messages from current stage only
    - Keeps ALL student messages from previous stages
    - Drops all AI messages from previous stages
    """
    history_text = ""
    questions_asked_in_stage = 0
    current_stage_student_messages = []
    current_stage_ai_messages = []
    previous_stage_student_messages = []

    for msg in conversation_history:
        role = msg.get("role", "student")
        content = msg.get("content", "")
        stage = msg.get("stage", "unknown")
        if not content:
            continue
        if role == "system":
            history_text += f"\n{content}"
            continue
        if stage == current_stage:
            if role == "student":
                current_stage_student_messages.append(msg)
            elif role == "ai":
                current_stage_ai_messages.append(msg)
                questions_asked_in_stage += 1
        else:
            if role == "student":
                previous_stage_student_messages.append(msg)

    if previous_stage_student_messages:
        history_text += "\n--- What the student covered in previous stages ---"
        for msg in previous_stage_student_messages:
            stage_label = msg.get("stage", "unknown").upper()
            history_text += f"\n[{stage_label}] Student: {msg.get('content', '')}"

    if current_stage_student_messages or current_stage_ai_messages:
        history_text += f"\n--- Current stage: {current_stage.upper()} ---"
        current_stage_all = []
        for msg in conversation_history:
            role = msg.get("role", "student")
            stage = msg.get("stage", "unknown")
            content = msg.get("content", "")
            if not content or role == "system":
                continue
            if stage == current_stage:
                current_stage_all.append(msg)

        ai_messages_in_order = [m for m in current_stage_all if m.get("role") == "ai"]
        ai_messages_to_keep = set(id(m) for m in ai_messages_in_order[-4:])

        for msg in current_stage_all:
            role = msg.get("role", "student")
            content = msg.get("content", "")
            stage_label = msg.get("stage", "unknown").upper()
            role_label = "Student" if role == "student" else "ThinkTrace AI"
            if role == "student" or id(msg) in ai_messages_to_keep:
                history_text += f"\n[{stage_label}] {role_label}: {content}"

    return history_text, questions_asked_in_stage


def parse_guidance_response(text: str) -> dict:
    text = text.strip()
    text = re.sub(r'```json\n?', '', text)
    text = re.sub(r'```\n?', '', text)
    text = re.sub(r'\\(?!["\\/bfnrtu])', r'\\\\', text)

    match = re.search(r'\{.*\}', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    msg_match = re.search(r'"message"\s*:\s*"(.*?)"(?=\s*[,}])', text, re.DOTALL)
    understood_match = re.search(r'"understood"\s*:\s*(true|false)', text)
    if msg_match:
        return {
            "message": msg_match.group(1),
            "understood": understood_match.group(1) == "true" if understood_match else False
        }

    return {"message": "Keep working through this step.", "understood": False}


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
        "unlock_when": "Student has restated the problem in their own words AND identified what is given AND identified what is asked AND noted at least one constraint. All four components must be present — partial answers do not unlock this stage.",
        "questions": 4,
        "question_targets": [
            "Ask them to restate the problem in their own words",
            "Ask what information is given or known",
            "Ask what they are being asked to find or prove",
            "Ask if there are any constraints, edge cases, or special conditions",
        ],
    },
    "concept": {
        "objective": "Identify the core concepts, theorems, data structures, or techniques that apply to this problem. Explain WHY each one is relevant.",
        "goal": "Student identifies the right tools and justifies why they apply — not just names them.",
        "rules": [
            "Student must name at least one specific concept, theorem, or technique",
            "Student must explain WHY it applies — not just name it",
            "Student must connect the concept to the specific structure of the problem",
            "Student must NOT start planning steps yet — this is identification only",
            "Saying just a concept name with no justification does NOT unlock this stage",
        ],
        "unlock_when": "Student has named a specific concept AND explained why it applies to THIS problem specifically. A concept name alone without justification does not count.",
        "questions": 4,
        "question_targets": [
            "Ask what type of problem this is (sorting, graph, recursion, proof, etc.)",
            "Ask what concepts or theorems come to mind and why",
            "Ask why that concept fits the structure of this specific problem",
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
            "Vague plans like 'I will solve it step by step' do NOT unlock this stage",
        ],
        "unlock_when": "Student has written a numbered plan with at least 3 specific actionable steps that logically cover the full solution. Vague descriptions, one-step plans, and plans that just restate the problem do not unlock this stage.",
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
        "objective": "Execute your plan step by step. Show ALL your work. Write out every calculation, derivation, or logical inference. Do not skip steps. Do not ask questions — produce the actual solution.",
        "goal": "Student demonstrates they can execute their plan with concrete, complete, step-by-step work showing every calculation or logical step.",
        "rules": [
            "Student must show every step — no skipping, no summarizing",
            "Student must write actual calculations, derivations, or logical inferences — not descriptions of what they would do",
            "Student must NOT ask questions back to the AI — this stage is for doing, not asking",
            "Student must NOT just acknowledge the AI's question — they must produce actual work",
            "A one-sentence or vague answer NEVER counts as completion",
            "Mistakes are allowed — genuine work with errors is better than no work",
            "Student must follow their plan from the previous stage",
        ],
        "unlock_when": "Student has shown concrete step-by-step work with actual calculations, derivations, or logical steps written out in full. Vague answers, one-liners, questions back to the AI, and acknowledgements do NOT count. The student must have actually executed something — not just described it.",
        "questions": 7,
        "question_targets": [
            "Ask them to write out their very first concrete step with actual work shown",
            "Ask them to show the calculation or derivation for the next step — not describe it, write it out",
            "Ask what happens at the most critical or complex step — make them execute it fully",
            "Ask them to show the full working for a specific part they have glossed over",
            "Ask them to verify a specific step by checking it against the problem constraints",
            "Ask if they got stuck anywhere and make them write out exactly where and why",
            "Ask them to write the complete final answer with all steps leading to it shown",
        ],
    },
    "critique": {
        "objective": "Critically examine your own solution. Identify what could go wrong, edge cases it might fail on, assumptions you made, and whether there is a better approach.",
        "goal": "Student demonstrates they can think critically about their own work.",
        "rules": [
            "Student must identify at least one specific weakness or assumption in their solution",
            "Student must think about edge cases — what inputs might break it",
            "Student must consider whether their solution is optimal",
            "Student must NOT just say it looks correct — genuine critical thinking required",
            "Saying 'I think it is correct' or 'I cannot find any issues' does NOT unlock this stage",
        ],
        "unlock_when": "Student has identified at least one specific weakness, assumption, or edge case in their solution. Generic statements like 'it looks correct' or 'I think it works' do not unlock this stage — they must name something specific that could fail or be improved.",
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
        "goal": "Student consolidates learning and articulates a specific, genuine takeaway — not just a summary of what they did.",
        "rules": [
            "Student must state the core insight or lesson in their own words",
            "Student must connect this problem to a broader concept or pattern",
            "Student must NOT just summarize what they did — they must say what they LEARNED",
            "Student must be specific — 'I learned recursion' or 'I learned to think carefully' does not unlock this stage",
        ],
        "unlock_when": "Student has articulated a specific insight that goes beyond summarizing their steps — they must say what they now understand that they did not before, or how this connects to a broader pattern. Vague statements like 'I learned to think step by step' do not unlock this stage.",
        "questions": 4,
        "question_targets": [
            "Ask what the single most important insight from this problem is",
            "Ask how this connects to other problems or concepts they have seen",
            "Ask what they would tell a friend who is stuck on a similar problem",
            "Ask what they found hardest and what made it click",
        ],
    },
}


def build_ai_prompt(mode: str, problem: str, stage: str, student_input: str, history_text: str, questions_asked: int) -> str:
    stage_info = STAGE_DEFINITIONS.get(stage, STAGE_DEFINITIONS["understand"])
    questions_remaining = max(0, stage_info["questions"] - questions_asked)
    next_question_target = stage_info["question_targets"][min(questions_asked, len(stage_info["question_targets"]) - 1)]

    HINT_THRESHOLD = 15
    is_hint_mode = questions_asked >= HINT_THRESHOLD

    if mode == "deep_focus":
        return f"""You are a strict academic coach. Deep focus mode — no AI assistance.
Problem: {problem}
Stage: {stage}
Student input: {student_input}
Respond ONLY with this JSON:
{{"message": "Deep focus mode is active. Work through this independently.", "understood": false}}"""

    if is_hint_mode:
        hint_instruction = f"""
HINT MODE ACTIVATED — The student has been working on this stage for {questions_asked} exchanges and is stuck.
You must now shift your approach completely:

1. Start by acknowledging specifically what they got RIGHT so far — be genuine and specific
2. Identify the exact point where their reasoning broke down or got stuck — be clear and honest
3. Explain WHY that part is conceptually tricky and what the correct way of thinking about it is
4. Give ONE specific directional hint that narrows the search space — "think about X because Y" not "the answer is Z"
5. Correct any fundamental misconception you see explicitly — do not dance around it
6. End by asking them to try again with this new understanding
7. Be warm, encouraging, and thorough — this is a teaching moment not a punishment
8. Write as much as you need to actually help the student — do NOT limit your response length in hint mode
9. Do NOT give the full answer or write the solution for them — guide them to it
"""
    else:
        hint_instruction = ""

    base = f"""You are a Socratic tutor guiding a student through a structured academic reasoning process.

PROBLEM: {problem}

CURRENT STAGE: {stage.upper()}
STAGE OBJECTIVE: {stage_info["objective"]}
STAGE GOAL: {stage_info["goal"]}
UNLOCK CONDITION: {stage_info["unlock_when"]}

STAGE RULES (enforce strictly):
{chr(10).join(f"- {r}" for r in stage_info["rules"])}
{hint_instruction}
CONVERSATION HISTORY:
{history_text if history_text else "(none)"}

NOTE: Previous stage entries show only student messages. Current stage shows full conversation with last 4 AI responses.
Count only YOUR messages in the current stage section to determine questions asked.

STUDENT'S LATEST RESPONSE: {student_input}

YOUR STATUS:
- Questions asked in {stage.upper()} stage so far: {questions_asked}
- Questions remaining before minimum reached: {questions_remaining} of {stage_info["questions"]} required
- Your next question should target: {next_question_target}
- Hint mode active: {"YES — give a thorough directional hint and correction" if is_hint_mode else "NO — pure Socratic only"}

ABSOLUTE RULES — NEVER BREAK THESE:
1. You MUST ask at least {stage_info["questions"]} questions in this stage — this is a MINIMUM, not a maximum
2. Even if the student gives a perfect answer on the first try, you still ask all {stage_info["questions"]} questions
3. After the minimum is reached, keep asking until the student has GENUINELY demonstrated the stage objective
4. Ask ONLY ONE question per response — never two questions at once
5. Never give the full answer or solve it for them — even in hint mode
6. If the student violates a stage rule redirect them firmly back to the stage objective
7. If questions_remaining > 0 → understood MUST be false, no exceptions
8. If questions_remaining = 0 AND student has genuinely demonstrated the unlock condition → understood = true
9. If questions_remaining = 0 BUT student has NOT genuinely demonstrated the unlock condition → keep asking, understood = false
10. In normal mode keep your message to 2-3 sentences maximum
11. In HINT MODE write as much as needed — explain what they got right, where they went wrong, give a real directional hint, and ask them to try again. Do not limit your response length."""

    suffix = f"""

Respond ONLY with valid JSON:
{{"message": "your response", "understood": false}}

CRITICAL JSON FORMATTING: Double-escape LaTeX: \\\\frac not \\frac. Wrap ALL math in $ delimiters."""

    if mode == "open":
        return base + "\nIn open mode you can explain concepts and give examples but do not hand them the answer. Be warm and encouraging." + suffix
    return base + suffix


# ── Routes ───────────────────────────────────────────────────────────────────

@router.post('/workspaces')
async def create_workspace(
    title: str = Form(...),
    mode: str = Form("guided"),
    source_type: str = Form(...),
    raw_text: str = Form(None),
    file: UploadFile = File(None),
    subject: str = Form(None),
    term_type: str = Form(None),
    term_name: str = Form(None),
    term_year: int = Form(None),
    current_user=Security(get_current_user)
):
    if mode not in ("deep_focus", "guided", "open"):
        raise HTTPException(status_code=400, detail="Invalid mode")
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
        problems = extract_and_structure_from_image(await file.read(), file.content_type or "image/jpeg")

    workspace = client.table("Personal_Workspaces").insert({
        "user_id": current_user["id"],
        "title": title,
        "mode": mode,
        "subject": subject,
        "term_type": term_type,
        "term_name": term_name,
        "term_year": term_year,
    }).execute()

    workspace_id = workspace.data[0]["id"]

    for prob in problems:
        problem_row = client.table("Workspace_Problems").insert({
            "workspace_id": workspace_id,
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
            client.table("Workspace_Problem_Parts").insert(part_rows).execute()

    return {
        "workspace": workspace.data[0],
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

    result_problems = []
    for p in problems.data:
        parts = client.table("Workspace_Problem_Parts").select("*").eq("problem_id", p["id"]).order("part_number").execute()
        result_problems.append({**p, "parts": parts.data})

    return {**workspace.data[0], "problems": result_problems}


@router.post('/workspaces/{workspace_id}/problems/{problem_id}/ai-guidance')
async def workspace_ai_guidance(
    workspace_id: str,
    problem_id: str,
    body: WorkspaceAIGuidanceRequest,
    current_user=Security(get_current_user)
):
    # Log if student is in extended session
    student_messages_in_stage = sum(
        1 for msg in body.conversation_history
        if msg.get("role") == "student" and msg.get("stage") == body.stage
    )
    if student_messages_in_stage >= 20:
        print(f"Extended session: student has {student_messages_in_stage} messages in {body.stage} stage")

    # Build smart trimmed history
    history_text, questions_asked_in_stage = build_history_text(
        body.conversation_history, body.stage
    )

    prompt = build_ai_prompt(
        body.mode,
        body.problem,
        body.stage,
        body.student_input,
        history_text,
        questions_asked_in_stage
    )

    raw_text = call_guidance(prompt)
    parsed = parse_guidance_response(raw_text)

    # Enforce minimum question count
    questions_after = questions_asked_in_stage + 1
    questions_needed = STAGE_DEFINITIONS.get(body.stage, {}).get("questions", 5)
    if questions_after < questions_needed:
        parsed["understood"] = False

    return parsed


@router.post('/workspace-problems/{problem_id}/traces')
async def create_workspace_trace(
    problem_id: str,
    body: dict,
    current_user=Security(get_current_user)
):
    problem = client.table("Workspace_Problems").select("id").eq("id", problem_id).execute()
    if not problem.data:
        raise HTTPException(status_code=404, detail="Problem not found")

    trace = client.table("Workspace_Traces").insert({
        "problem_id": problem_id,
        "user_id": current_user["id"],
        "stage": body.get("stage"),
        "action": body.get("action"),
        "content": body.get("content"),
    }).execute()

    return trace.data[0]


@router.get('/workspace-problems/{problem_id}')
async def get_workspace_problem(problem_id: str, current_user=Security(get_current_user)):
    problem = client.table("Workspace_Problems").select("*").eq("id", problem_id).execute()
    if not problem.data:
        raise HTTPException(status_code=404, detail="Problem not found")

    p = problem.data[0]
    parts = client.table("Workspace_Problem_Parts").select("*").eq("problem_id", problem_id).order("part_number").execute()

    siblings = client.table("Workspace_Problems") \
        .select("id, problem_number, problem_text") \
        .eq("workspace_id", p["workspace_id"]) \
        .order("problem_number") \
        .execute()

    sibling_ids = [s["id"] for s in siblings.data if s["problem_number"] < p["problem_number"]]
    sibling_traces = []
    for sid in sibling_ids:
        traces = client.table("Workspace_Traces") \
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


@router.delete('/workspaces/{workspace_id}')
async def delete_workspace(workspace_id: str, current_user=Security(get_current_user)):
    workspace = client.table("Personal_Workspaces").select("id").eq("id", workspace_id).eq("user_id", current_user["id"]).execute()
    if not workspace.data:
        raise HTTPException(status_code=404, detail="Workspace not found")

    problems = client.table("Workspace_Problems").select("id").eq("workspace_id", workspace_id).execute()
    for p in problems.data:
        client.table("Workspace_Traces").delete().eq("problem_id", p["id"]).execute()
        client.table("Workspace_Problem_Parts").delete().eq("problem_id", p["id"]).execute()
    client.table("Workspace_Problems").delete().eq("workspace_id", workspace_id).execute()
    client.table("Personal_Workspaces").delete().eq("id", workspace_id).execute()

    return {"deleted": True}


@router.post('/workspace-problems/{problem_id}/summary')
async def generate_problem_summary(
    problem_id: str,
    body: dict,
    current_user=Security(get_current_user)
):
    problem = client.table("Workspace_Problems").select("*").eq("id", problem_id).execute()
    if not problem.data:
        raise HTTPException(status_code=404, detail="Problem not found")

    problem_text = problem.data[0]["problem_text"]
    conversation_history = body.get("conversation_history", [])

    history_text = ""
    for msg in conversation_history:
        role = msg.get("role", "")
        content = msg.get("content", "")
        stage = msg.get("stage", "")
        if not content or role == "system":
            continue
        role_label = "Student" if role == "student" else "ThinkTrace AI"
        history_text += f"\n[{stage.upper()}] {role_label}: {content}"

    prompt = f"""You are an insightful academic coach reviewing a student's complete reasoning trace for a problem.

PROBLEM: {problem_text}

STUDENT'S FULL REASONING TRACE:
{history_text}

Generate a structured JSON summary of this student's reasoning journey. Be specific, insightful, and genuinely helpful. Reference what they actually wrote.

Return ONLY valid JSON in this exact format:
{{
  "stage_insights": {{
    "understand": "2-3 sentence insight about how well they understood the problem.",
    "concept": "2-3 sentence insight about their conceptual reasoning.",
    "plan": "2-3 sentence insight about their planning.",
    "attempt": "2-3 sentence insight about their execution.",
    "critique": "2-3 sentence insight about their critical thinking.",
    "reflection": "2-3 sentence insight about their reflection."
  }},
  "key_insight": "The single most important thing this student demonstrated or learned. Be specific.",
  "strongest_stage": "understand|concept|plan|attempt|critique|reflection",
  "weakest_stage": "understand|concept|plan|attempt|critique|reflection",
  "growth_note": "One specific actionable thing this student should focus on to improve.",
  "overall_score": 7
}}

overall_score is 1-10 based on depth, genuine engagement, and quality of reasoning."""

    raw = call_summary(prompt)
    raw = re.sub(r'```json\n?', '', raw)
    raw = re.sub(r'```\n?', '', raw)

    match = re.search(r'\{.*\}', raw, re.DOTALL)
    if match:
        try:
            summary = json.loads(match.group())
        except json.JSONDecodeError:
            summary = {"key_insight": "Unable to generate summary.", "stage_insights": {}, "overall_score": 0, "growth_note": "", "strongest_stage": "", "weakest_stage": ""}
    else:
        summary = {"key_insight": "Unable to generate summary.", "stage_insights": {}, "overall_score": 0, "growth_note": "", "strongest_stage": "", "weakest_stage": ""}

    client.table("Workspace_Problems").update({
        "ai_summary": json.dumps(summary),
        "summary_generated_at": "now()",
    }).eq("id", problem_id).execute()

    return summary