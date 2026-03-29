from fastapi import APIRouter,Security
from app.database import client
from app.dependencies import get_current_user, security

router = APIRouter()

@router.get('/courses')
async def get_courses(authorization = Security(get_current_user)):
    user_id = authorization["id"]
    courses = client.table("Student_Courses").select("*, Courses(*)").eq("student_id", user_id).execute()
    return courses.data