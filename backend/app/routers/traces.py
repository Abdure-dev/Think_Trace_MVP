from fastapi import APIRouter,Security, Body
from app.database import client
from app.dependencies import get_current_user,security
from app.schemas import TraceEvent

router = APIRouter()

@router.post('/assignments/{assignment_id}/traces')
async def TraceHistory(assignment_id:str, body: TraceEvent, current_user = Security(get_current_user)):
    student_id = current_user["id"]
    client.table("Traces").insert({
        'student_id':student_id, 
        'assignment_id':assignment_id, 
        'content': body.content,
        'action': body.action,
        'stage': body.stage}).execute()
    
