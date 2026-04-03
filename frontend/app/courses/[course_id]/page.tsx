"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import Link from "next/link";

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
    <div className="min-h-screen" style={{ backgroundColor: "#f8f9fc" }}>
      {/* Header */}
      <div className="px-10 py-6 bg-white border-b border-gray-100">
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
      </div>

      {/* Content */}
      <div className="p-10">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="text-sm text-gray-400 hover:text-gray-600 transition"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 mt-2">Assignments</h1>
          <p className="text-gray-400 mt-1">Select an assignment to begin</p>
        </div>

        <div className="flex flex-col gap-4">
          {assignment.map((a: any) => (
            <Link key={a.id} href={`/assignments/${a.id}`}>
              <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition cursor-pointer border border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">{a.title}</h3>
                  <p className="text-gray-400 text-sm mt-1">{a.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className="text-xs px-3 py-1 rounded-full font-medium"
                    style={{ backgroundColor: "#eef2ff", color: "#667eea" }}
                  >
                    AI Level {a.ai_level}
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
