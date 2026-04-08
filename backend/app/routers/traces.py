from fastapi import APIRouter,Security, Body, HTTPException
from app.database import client
from app.dependencies import get_current_user,security
from app.schemas import TraceEvent
from datetime import datetime

router = APIRouter()



@router.post('/problems/{problem_id}/traces')
async def create_problem_trace(
    problem_id: str,
    body: dict,
    current_user=Security(get_current_user)
):
    problem = client.table("Problems").select("*").eq("id", problem_id).execute()
    if not problem.data:
        raise HTTPException(status_code=404, detail="Problem not found")

    trace = client.table("Traces").insert({
        "problem_id": problem_id,
        "user_id": current_user["id"],
        "stage": body.get("stage"),
        "action": body.get("action"),
        "content": body.get("content"),
        "created_at": datetime.utcnow().isoformat()
    }).execute()

    return trace.data[0]
@router.get('/problems/{problem_id}/traces')
async def get_problem_traces(problem_id: str, current_user=Security(get_current_user)):
    traces = client.table("Traces") \
        .select("*") \
        .eq("problem_id", problem_id) \
        .eq("user_id", current_user["id"]) \
        .order("created_at") \
        .execute()

    return traces.data

    
    
