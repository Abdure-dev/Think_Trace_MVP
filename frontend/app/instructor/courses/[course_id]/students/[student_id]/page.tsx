"use client";

import { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function get_student_traces({
  params,
}: {
  params: Promise<{ course_id: string; student_id: string }>;
}) {
  const router = useRouter();
  const { course_id, student_id } = use(params);
  const [assignment, setAssignment] = useState([]);

  useEffect(() => {
    async function FetchAssignments() {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      const assignmentresponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/courses/${course_id}/assignments`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const assignmentData = await assignmentresponse.json();
      setAssignment(assignmentData);
    }
    FetchAssignments();
  }, [course_id]);

  return (
    <>
      <h1>Traces</h1>
      {assignment.map((ass: any) => (
        <Link
          key={ass.id}
          href={`/instructor/assignments/${ass.id}/traces/${student_id}`}
        >
          <div>
            <h3>{ass.title}</h3>
            <p>{ass.description}</p>
          </div>
        </Link>
      ))}
    </>
  );
}
