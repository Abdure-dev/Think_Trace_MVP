"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";

export default function AssignmentPage({
  params,
}: {
  params: Promise<{ course_id: string }>;
}) {
  const { course_id } = use(params);
  const router = useRouter();
  const [assignment, setAssignment] = useState([]);

  useEffect(() => {
    async function fetchAssignment() {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      const Assingnment_response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/courses/${course_id}/assignments`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const assignmentData = await Assingnment_response.json();
      setAssignment(assignmentData);
    }
    fetchAssignment();
  }, [router]);

  return (
    <main>
      <h1>Assignment</h1>
      {assignment.map((a: any) => (
        <div key={a.id}>
          <h3>{a.title}</h3>
          <p>{a.description}</p>
        </div>
      ))}
    </main>
  );
}
