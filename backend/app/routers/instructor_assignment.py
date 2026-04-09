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
    pdf_bytes = await file.read()
    pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')
    
    prompt = """Extract all problems/questions from this PDF.
For each problem:
- Convert any math equations to LaTeX format (wrap in $ for inline, $$ for block)
- Convert Greek letters: Ω → $\\Omega$, Θ → $\\Theta$, Σ → $\\Sigma$, ∈ → $\\in$
- Convert summations: ∑ → $\\sum_{i=1}^{n}$
- Convert square roots: √n → $\\sqrt{n}$
- Convert fractions to $\\frac{a}{b}$
- Convert superscripts: n² → $n^2$
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
    # Save assignment
    assignment = client.table("Assignments").insert({
        "title": body["title"],
        "description": body.get("description", ""),
        "course_id": course_id,
        "ai_level": body.get("ai_level", 2),
        "due_date": body.get("due_date"),
        "source_type": "text",
        "raw_text": body.get("description", ""),
        "uploaded_by": current_user["id"],
    }).execute()

    assignment_id = assignment.data[0]["id"]
    sub_parts = body.get("sub_parts", [])

    if sub_parts:
        # Create one problem per sub-part
        for i, part in enumerate(sub_parts):
            problem_text = f"{body.get('description', '')}\n\nPart ({part['label']}): {part['content']}"
            problem_row = client.table("Problems").insert({
                "assignment_id": assignment_id,
                "problem_number": i + 1,
                "problem_text": problem_text,
            }).execute()

            problem_id = problem_row.data[0]["id"]

            client.table("Problem_Parts").insert({
                "problem_id": problem_id,
                "part_label": part["label"],
                "part_text": part["content"],
                "part_number": i + 1,
            }).execute()
    else:
        # Single problem no sub-parts
        client.table("Problems").insert({
            "assignment_id": assignment_id,
            "problem_number": 1,
            "problem_text": body.get("description", body.get("title", "")),
        }).execute()

    return assignment.data[0]