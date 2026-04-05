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
    prompt = f"""You are a Socratic tutor evaluating a student's understanding.
The student is solving this problem: {body.problem}
They are at the {body.stage} stage and wrote: {body.student_input}

Evaluate if the student truly understands the concept at this stage.

Respond ONLY with valid JSON in this exact format:
{{
  "message": "your Socratic question or encouraging response here",
  "understood": false
}}

Rules:
- If the student shows clear understanding → set understood to true and congratulate them
- If the student is vague, incomplete, or wrong → set understood to false and ask one probing question
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
    # Remove markdown code blocks if present
    text = re.sub(r'```json\n?', '', text)
    text = re.sub(r'```\n?', '', text)
    
    parsed = json.loads(text)
    return parsed

@router.get('/test-models')
async def list_models():
    models = client_ai.models.list()
    return {"models": [m.name for m in models]}