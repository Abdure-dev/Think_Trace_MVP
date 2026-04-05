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
      setStudent(studentData.students);
    }
    fetchStudent();
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
          <Link
            href="/dashboard"
            className="text-sm text-gray-400 hover:text-gray-600 transition"
          >
            ← Back to Dashboard
          </Link>
          <div className="flex items-center justify-between mt-2">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Students</h1>
              <p className="text-gray-400 mt-1">
                Click a student to view their reasoning trace
              </p>
            </div>
            <Link href={`/instructor/courses/${course_id}/create-assignment`}>
              <button
                className="text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition"
                style={{
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                }}
              >
                + Create Assignment
              </button>
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {student.map((stud: any) => (
            <Link
              key={stud.id}
              href={`/instructor/courses/${course_id}/students/${stud.student_id}`}
            >
              <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition cursor-pointer border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                    style={{
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    }}
                  >
                    {stud.Users?.first_name?.[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">
                      {stud.Users?.first_name} {stud.Users?.last_name}
                    </p>
                    <p className="text-sm text-gray-400 capitalize">
                      {stud.status}
                    </p>
                  </div>
                </div>
                <span className="text-gray-300 text-xl">→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
