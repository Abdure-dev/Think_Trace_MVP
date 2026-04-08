from fastapi import APIRouter, Security
from app.dependencies import get_current_user,security
from app.database import client
from google import genai
import os
from app.schemas import AIGuidanceRequest


router = APIRouter()

client_ai = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

@router.get('/courses/{course_id}/assignments')
async def get_assignments(course_id: str, current_user = Security(get_current_user)):
    assignments = client.table("Assignments").select("*").eq("course_id", course_id).execute()
    return assignments.data
@router.get('/assignments/{assignment_id}')
async def get_assignment(assignment_id:str, current_user = Security(get_current_user)):
    assignment = client.table("Assignments").select("*").eq("id", assignment_id).execute()
    return assignment.data[0]
@router.post('/assignments/{assignment_id}/ai-guidance')
async def get_ai_guidance(assignment_id: str, body: AIGuidanceRequest, current_user = Security(get_current_user)):
    
    # Build conversation history text
    history_text = ""
    for msg in body.conversation_history:
        role = "Student" if msg["role"] == "student" else "ThinkTrace AI"
        stage_label = f" [{msg.get('stage', 'unknown')} stage]" if msg.get('stage') else ""
        history_text += f"\n{role}{stage_label}: {msg['content']}"
    
    prompt = f"""You are a Socratic tutor helping a student deeply understand a problem.

Problem: {body.problem}
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
- Write math in plain text, NOT LaTeX — for example write "f(n) = O(g(n))" not "$f(n) = O(g(n))$"
- Your message is a question, not a math display — keep it conversational
CRITICAL JSON FORMATTING RULES:
- Return ONLY valid JSON
- In JSON strings, LaTeX backslashes MUST be double-escaped: write \\\\frac not \\frac
- Example: "What is \\\\frac{{1}}{{2}}?" not "What is \\frac{1}{2}?"
- All LaTeX commands must use double backslashes in JSON strings
- Always wrap ALL mathematical expressions in $ delimiters — write $X^1$ not X^1, write $F_j$ not F_j
- Every variable, equation, matrix, or formula must be inside $ or $$ delimiters
- For matrices, use simple notation like [[a, b], [c, d]] instead of \\begin{{pmatrix}}
- Only use LaTeX for simple inline math like $F_0$, $X^k$, $\frac{{a}}{{b}}$
- Avoid complex multi-line LaTeX environments like pmatrix, bmatrix, align

"""

    response = client_ai.models.generate_content(
        model="models/gemini-2.5-flash",
        contents=prompt
    )
    
    import json
    import re
    
    text = response.text.strip()
    text = re.sub(r'```json\n?', '', text)
    text = re.sub(r'```\n?', '', text)

    # Fix single backslashes that aren't valid JSON escapes
    text = re.sub(r'\\(?!["\\/bfnrtu])', r'\\\\', text)

    match = re.search(r'\{.*\}', text, re.DOTALL)
    if match:
        json_str = match.group()
        try:
            parsed = json.loads(json_str)
        except json.JSONDecodeError:
            # Last resort — extract message manually
            msg_match = re.search(r'"message"\s*:\s*"(.*?)"(?=\s*,\s*"understood")', json_str, re.DOTALL)
            understood_match = re.search(r'"understood"\s*:\s*(true|false)', json_str)
            parsed = {
            "message": msg_match.group(1) if msg_match else "Could you explain further?",
            "understood": understood_match.group(1) == "true" if understood_match else False
        }
    else:
        parsed = {"message": "Could you explain your reasoning further?", "understood": False}

   # Log AI interaction
    client.table("AI_Interactions").insert({
        "question": body.student_input,
        "rewritten_prompt": prompt,
        "response": parsed["message"],
        "intervention_level": 2,
        "allowed_mode": "socratic",
        "ai_model": "gemini-2.5-flash"
    }).execute()


    return parsed
