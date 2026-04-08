from fastapi import APIRouter, Security, HTTPException
from app.database import client
from app.dependencies import get_current_user
from app.schemas import TraceEvent
from datetime import datetime

router = APIRouter()

@router.post('/problems/{problem_id}/traces')
async def create_problem_trace(
    problem_id: str,
    body: TraceEvent,
    current_user=Security(get_current_user)
):
    print(f"Looking for problem_id: {problem_id}")
    problem = client.table("Problems").select("id").eq("id", problem_id).execute()
    print(f"Query result: {problem.data}")
    
    if not problem.data:
        raise HTTPException(status_code=404, detail="Problem not found")

    trace = client.table("Traces").insert({
        "problem_id": problem_id,
        "user_id": current_user["id"],
        "stage": body.stage,
        "action": body.action,
        "content": body.content,
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