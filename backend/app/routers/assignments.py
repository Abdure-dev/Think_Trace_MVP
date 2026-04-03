from fastapi import APIRouter, Security
from app.dependencies import get_current_user,security
from app.database import client

router = APIRouter()

@router.get('/courses/{course_id}/assignments')
async def get_assignments(course_id: str, current_user = Security(get_current_user)):
    assignments = client.table("Assignments").select("*").eq("course_id", course_id).execute()
    return assignments.data
@router.get('/assignments/{assignment_id}')
async def get_assignment(assignment_id:str, current_user = Security(get_current_user)):
    assignment = client.table("Assignments").select("*").eq("id", assignment_id).execute()
    return assignment.data[0]

