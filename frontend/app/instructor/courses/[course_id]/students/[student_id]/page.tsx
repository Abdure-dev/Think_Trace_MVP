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
    <div className="min-h-screen" style={{ backgroundColor: "#f8f9fc" }}>
      {/* Header */}
      <div className="px-10 py-6 bg-white border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            }}
          >
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <span className="font-bold text-gray-800 text-lg">ThinkTrace</span>
        </div>
        <span
          className="text-xs px-3 py-1 rounded-full font-medium"
          style={{ backgroundColor: "#eef2ff", color: "#667eea" }}
        >
          Instructor View
        </span>
      </div>

      <div className="p-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">
            Select Assignment
          </h1>
          <p className="text-gray-400 mt-1">
            Choose an assignment to view this student's reasoning trace
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {assignment.map((ass: any) => (
            <Link
              key={ass.id}
              href={`/instructor/assignments/${ass.id}/traces/${student_id}`}
            >
              <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition cursor-pointer border border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">
                    {ass.title}
                  </h3>
                  <p className="text-gray-400 text-sm mt-1">
                    {ass.description}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className="text-xs px-3 py-1 rounded-full font-medium"
                    style={{ backgroundColor: "#eef2ff", color: "#667eea" }}
                  >
                    View Trace
                  </span>
                  <span className="text-gray-300 text-xl">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
