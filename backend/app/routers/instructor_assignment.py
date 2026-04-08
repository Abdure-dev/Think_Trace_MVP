from fastapi import APIRouter, Security, UploadFile, File
from app.dependencies import get_current_user, security
from app.database import client
from google import genai
import os
import base64
import json
import re

router = APIRouter()
client_ai = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

@router.post('/instructor/assignments/extract-pdf')
async def extract_pdf(
    file: UploadFile = File(...),
    current_user = Security(get_current_user)
):
    # Read and encode PDF
    pdf_bytes = await file.read()
    pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')
    
    prompt = """Extract all problems/questions from this PDF.
For each problem:
- Convert any math equations to LaTeX format (wrap in $ for inline, $$ for block)
- Preserve the problem numbering
- If a problem has sub-parts (a), (b), (c) etc — separate them into individual sub_parts array
- Keep all relevant context

Return ONLY valid JSON in this exact format:
{
  "problems": [
    {
      "number": 1,
      "title": "short title for the problem",
      "description": "main problem description without sub-parts",
      "sub_parts": [
        {"label": "a", "content": "sub-part a content with LaTeX"},
        {"label": "b", "content": "sub-part b content with LaTeX"}
      ]
    }
  ]
}

If a problem has no sub-parts, return an empty array for sub_parts."""

    response = client_ai.models.generate_content(
        model="models/gemini-2.5-flash",
        contents=[
            {
                "parts": [
                    {
                        "inline_data": {
                            "mime_type": "application/pdf",
                            "data": pdf_base64
                        }
                    },
                    {"text": prompt}
                ]
            }
        ]
    )
    
    text = response.text.strip()
    text = re.sub(r'```json\n?', '', text)
    text = re.sub(r'```\n?', '', text)
    
    parsed = json.loads(text)
    return parsed
@router.post('/instructor/courses/{course_id}/assignments')
async def create_assignment(
    course_id: str,
    body: dict,
    current_user = Security(get_current_user)
):
    assignment = client.table("Assignments").insert({
        "title": body["title"],
        "description": body["description"],
        "course_id": course_id,
        "ai_level": body.get("ai_level", 2),
        "due_date": body.get("due_date"),
    }).execute()
    return assignment.data[0]