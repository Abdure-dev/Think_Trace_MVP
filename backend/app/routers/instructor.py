from fastapi import APIRouter,Security, HTTPException
from app.database import client
from app.dependencies import get_current_user, security




router = APIRouter()

@router.get('/courses/{course_id}/students')
async def instructor_dashboard(course_id:str,current_user = Security(get_current_user)):
    course = client.table("Courses").select("*").eq("id", course_id).eq("instructor_id", current_user["id"]).execute()

    if not course.data:
        raise HTTPException(status_code=403, detail="Not authorized")
    students = client.table("Student_Courses").select("*, Users(first_name, last_name)").eq("course_id", course_id).execute()
    return {"courses": course.data[0],
            "students": students.data} 
@router.get('/assignments/{assignment_id}/traces/{student_id}')
async def get_traces(assignment_id:str,student_id:str, current_user = Security(get_current_user)):
    try: 
        course_id = client.table("Assignments").select("course_id").eq("id", assignment_id).execute()
        user_id = current_user["id"]
        courses = client.table("Courses").select("*").eq("instructor_id",user_id).eq("id",course_id.data[0]["course_id"]).execute()
        if not courses.data:
            raise HTTPException(status_code=403,detail='')
        tracing = client.table("Traces").select("*").eq("student_id", student_id).eq("assignment_id", assignment_id).execute()
        return tracing.data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get('/instructor/courses')
async def get_instructor_course(current_user = Security(get_current_user)):
    user_id = current_user["id"]
    courses = client.table("Courses").select("*").eq("instructor_id", user_id).execute()
    return courses.data