from fastapi import APIRouter, Security, HTTPException
from app.database import client
from app.dependencies import get_current_user
from datetime import datetime

router = APIRouter()


@router.get('/instructor/courses')
async def get_instructor_courses(current_user=Security(get_current_user)):
    courses = client.table("Courses").select("*").eq("instructor_id", current_user["id"]).execute()
    return courses.data


@router.get('/instructor/courses/{course_id}')
async def get_instructor_course(course_id: str, current_user=Security(get_current_user)):
    course = client.table("Courses").select("*").eq("id", course_id).eq("instructor_id", current_user["id"]).execute()
    if not course.data:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Get assignments
    assignments = client.table("Assignments").select("*").eq("course_id", course_id).order("created_at", desc=True).execute()

    # Get enrolled students
    students = client.table("Student_Courses").select("*, Users(id, first_name, last_name, email)").eq("course_id", course_id).execute()

    # For each assignment compute completion stats
    result_assignments = []
    for a in assignments.data:
        problems = client.table("Problems").select("id").eq("assignment_id", a["id"]).execute()
        problem_ids = [p["id"] for p in problems.data]

        # Count students who have at least one trace for this assignment
        started = set()
        completed = set()
        if problem_ids:
            for pid in problem_ids:
                traces = client.table("Traces").select("user_id").eq("problem_id", pid).execute()
                for t in traces.data:
                    started.add(t["user_id"])
                # Check reflection traces for completion
                ref_traces = client.table("Traces").select("user_id").eq("problem_id", pid).eq("stage", "reflection").execute()
                for t in ref_traces.data:
                    completed.add(t["user_id"])

        result_assignments.append({
            **a,
            "problem_count": len(problem_ids),
            "students_started": len(started),
            "students_completed": len(completed),
            "total_students": len(students.data),
        })

    return {
        "course": course.data[0],
        "assignments": result_assignments,
        "students": students.data,
        "student_count": len(students.data),
    }


@router.get('/instructor/assignments/{assignment_id}')
async def get_assignment_overview(assignment_id: str, current_user=Security(get_current_user)):
    # Verify instructor owns this assignment's course
    assignment = client.table("Assignments").select("*").eq("id", assignment_id).execute()
    if not assignment.data:
        raise HTTPException(status_code=404, detail="Assignment not found")

    course_id = assignment.data[0]["course_id"]
    course = client.table("Courses").select("*").eq("id", course_id).eq("instructor_id", current_user["id"]).execute()
    if not course.data:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Get problems with parts
    problems = client.table("Problems").select("*").eq("assignment_id", assignment_id).order("problem_number").execute()
    result_problems = []
    for p in problems.data:
        parts = client.table("Problem_Parts").select("*").eq("problem_id", p["id"]).order("part_number").execute()
        result_problems.append({**p, "parts": parts.data})

    # Get all enrolled students
    students = client.table("Student_Courses").select("*, Users(id, first_name, last_name, email)").eq("course_id", course_id).execute()

    # For each student compute progress
    result_students = []
    stages = ["understand", "concept", "plan", "attempt", "critique", "reflection"]

    for enrollment in students.data:
        user = enrollment.get("Users", {})
        if not user:
            continue
        user_id = user["id"]

        student_problems = []
        total_traces = 0
        stages_completed = 0
        total_time_seconds = 0

        for prob in result_problems:
            problem_id = prob["id"]
            traces = client.table("Traces").select("*").eq("problem_id", problem_id).eq("user_id", user_id).order("created_at").execute()

            stages_done = list(set(t["stage"] for t in traces.data))
            stages_done_count = len(stages_done)
            stages_completed += stages_done_count
            total_traces += len(traces.data)

            # Compute time spent
            if len(traces.data) >= 2:
                first = datetime.fromisoformat(traces.data[0]["created_at"].replace("Z", "+00:00"))
                last = datetime.fromisoformat(traces.data[-1]["created_at"].replace("Z", "+00:00"))
                secs = (last - first).total_seconds()
                total_time_seconds += secs

            # Current stage
            current_stage = None
            for s in stages:
                if s not in stages_done:
                    current_stage = s
                    break
            if not current_stage and stages_done_count == len(stages):
                current_stage = "complete"

            student_problems.append({
                "problem_id": problem_id,
                "problem_number": prob["problem_number"],
                "stages_completed": stages_done_count,
                "total_stages": len(stages),
                "current_stage": current_stage,
                "trace_count": len(traces.data),
                "is_complete": stages_done_count == len(stages),
            })

        # Overall status
        max_possible = len(result_problems) * len(stages)
        pct = (stages_completed / max_possible * 100) if max_possible > 0 else 0

        if pct == 0:
            status = "not_started"
        elif pct < 40:
            status = "struggling"
        elif pct < 80:
            status = "in_progress"
        else:
            status = "on_track"

        result_students.append({
            "user_id": user_id,
            "first_name": user["first_name"],
            "last_name": user["last_name"],
            "email": user.get("email", ""),
            "problems": student_problems,
            "stages_completed": stages_completed,
            "total_stages": max_possible,
            "completion_pct": round(pct),
            "total_traces": total_traces,
            "time_spent_seconds": round(total_time_seconds),
            "status": status,
        })

    # Sort by completion desc
    result_students.sort(key=lambda s: s["completion_pct"], reverse=True)

    return {
        "assignment": assignment.data[0],
        "course": course.data[0],
        "problems": result_problems,
        "students": result_students,
    }


@router.get('/instructor/assignments/{assignment_id}/students/{student_id}/trace')
async def get_student_trace(assignment_id: str, student_id: str, current_user=Security(get_current_user)):
    # Verify instructor
    assignment = client.table("Assignments").select("*").eq("id", assignment_id).execute()
    if not assignment.data:
        raise HTTPException(status_code=404, detail="Assignment not found")

    course_id = assignment.data[0]["course_id"]
    course = client.table("Courses").select("*").eq("id", course_id).eq("instructor_id", current_user["id"]).execute()
    if not course.data:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Get student info
    student = client.table("Users").select("id, first_name, last_name, email").eq("id", student_id).execute()
    if not student.data:
        raise HTTPException(status_code=404, detail="Student not found")

    # Get problems with parts
    problems = client.table("Problems").select("*").eq("assignment_id", assignment_id).order("problem_number").execute()

    stages = ["understand", "concept", "plan", "attempt", "critique", "reflection"]
    result_problems = []

    for prob in problems.data:
        parts = client.table("Problem_Parts").select("*").eq("problem_id", prob["id"]).order("part_number").execute()
        traces = client.table("Traces").select("*").eq("problem_id", prob["id"]).eq("user_id", student_id).order("created_at").execute()

        # Group traces by stage
        stage_traces = {}
        for t in traces.data:
            s = t["stage"]
            if s not in stage_traces:
                stage_traces[s] = []
            stage_traces[s].append(t)

        # Build stage breakdown
        stage_breakdown = []
        for s in stages:
            s_traces = stage_traces.get(s, [])
            time_seconds = 0
            if len(s_traces) >= 2:
                first = datetime.fromisoformat(s_traces[0]["created_at"].replace("Z", "+00:00"))
                last = datetime.fromisoformat(s_traces[-1]["created_at"].replace("Z", "+00:00"))
                time_seconds = round((last - first).total_seconds())

            stage_breakdown.append({
                "stage": s,
                "completed": len(s_traces) > 0,
                "trace_count": len(s_traces),
                "time_seconds": time_seconds,
                "traces": s_traces,
            })

        # Total time
        all_times = [t for t in traces.data]
        total_time = 0
        if len(all_times) >= 2:
            first = datetime.fromisoformat(all_times[0]["created_at"].replace("Z", "+00:00"))
            last = datetime.fromisoformat(all_times[-1]["created_at"].replace("Z", "+00:00"))
            total_time = round((last - first).total_seconds())

        result_problems.append({
            **prob,
            "parts": parts.data,
            "stages": stage_breakdown,
            "total_time_seconds": total_time,
            "stages_completed": len([s for s in stage_breakdown if s["completed"]]),
            "is_complete": len([s for s in stage_breakdown if s["completed"]]) == len(stages),
        })

    return {
        "student": student.data[0],
        "assignment": assignment.data[0],
        "course": course.data[0],
        "problems": result_problems,
    }


@router.get('/courses/{course_id}/students')
async def instructor_dashboard(course_id: str, current_user=Security(get_current_user)):
    course = client.table("Courses").select("*").eq("id", course_id).eq("instructor_id", current_user["id"]).execute()
    if not course.data:
        raise HTTPException(status_code=403, detail="Not authorized")
    students = client.table("Student_Courses").select("*, Users(first_name, last_name)").eq("course_id", course_id).execute()
    return {"courses": course.data[0], "students": students.data}