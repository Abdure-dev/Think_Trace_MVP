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
- Return ONLY the JSON, no other text"""

    response = client_ai.models.generate_content(
        model="models/gemini-2.5-flash",
        contents=prompt
    )
    
    import json
    import re
    
    text = response.text.strip()
    text = re.sub(r'```json\n?', '', text)
    text = re.sub(r'```\n?', '', text)
    
    parsed = json.loads(text)
    return parsed

@router.get('/test-models')
async def list_models():
    models = client_ai.models.list()
    return {"models": [m.name for m in models]}