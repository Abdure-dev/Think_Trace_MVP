from fastapi import APIRouter,Security
from app.database import client
from app.dependencies import get_current_user, security

router = APIRouter()

@router.get('/courses')
async def get_courses(authorization = Security(get_current_user)):
    user_id = authorization["id"]
    courses = client.table("Student_Courses").select("*, Courses(*)").eq("student_id", user_id).execute()
    return courses.data
@router.post('/courses')
async def create_course(body: dict, current_user = Security(get_current_user)):
    course = client.table("Courses").insert({
        "title": body["title"],
        "semester": body.get("semester", "Self Study"),
        "instructor_id": current_user["id"],
        "default_ai_level": body.get("ai_level", 2)
    }).execute()
    
    # Auto-enroll the creator as a student too
    client.table("Student_Courses").insert({
        "student_id": current_user["id"],
        "course_id": course.data[0]["id"],
        "status": "Accepted"
    }).execute()
    
    return course.data[0]