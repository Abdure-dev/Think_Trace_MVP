"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import Link from "next/link";

export default function InstructorCoursePage({
  params,
}: {
  params: Promise<{ course_id: string }>;
}) {
  const { course_id } = use(params);
  const router = useRouter();
  const [student, setStudent] = useState([]);

  useEffect(() => {
    async function fetchStudent() {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      const students = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/courses/${course_id}/students`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const studentData = await students.json();
      console.log("studnt data:", studentData);
      setStudent(studentData.students);
    }
    fetchStudent();
  }, [course_id]);

  return (
    <>
      <h1> Students</h1>
      {student.map((stud: any) => (
        <Link
          key={stud.id}
          href={`/instructor/courses/${course_id}/students/${stud.student_id}`}
        >
          <div>
            <p>
              {stud.Users?.first_name}
              {stud.Users?.last_name}
            </p>
          </div>
        </Link>
      ))}
    </>
  );
}
