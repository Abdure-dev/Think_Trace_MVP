from fastapi import APIRouter,Security, HTTPException
from app.database import client
from app.dependencies import get_current_user, security




router = APIRouter()

@router.get('/courses/{course_id}/students')
async def instructor_dashboard(course_id:str,current_user = Security(get_current_user)):
    course = client.table("Courses").select("*").eq("id", course_id).eq("instructor_id", current_user["id"]).execute()

    if not course.data:
        raise HTTPException(status_code=403, detail="Not authorized")
    students = client.table("Student_Courses").select("*").eq("course_id", course_id).execute()
    return {"courses": course.data[0],
            "students": students.data} 
