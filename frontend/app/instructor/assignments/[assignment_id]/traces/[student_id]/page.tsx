"use client";

import { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function get_Assignment_traces({
  params,
}: {
  params: Promise<{ assignment_id: string; student_id: string }>;
}) {
  const router = useRouter();
  const { assignment_id, student_id } = use(params);
  const [traces, setTrace] = useState([]);

  useEffect(() => {
    async function fetchTraces() {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      const traceresponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/assignments/${assignment_id}/traces/${student_id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const TraceData = await traceresponse.json();
      setTrace(TraceData);
    }
    fetchTraces();
  }, [assignment_id]);

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
            Student Reasoning Trace
          </h1>
          <p className="text-gray-400 mt-1">
            Complete reasoning timeline for this assignment
          </p>
        </div>

        {/* Timeline */}
        <div className="flex flex-col gap-4">
          {traces.map((trace: any, index: number) => (
            <div key={trace.id} className="flex gap-4">
              {/* Timeline indicator */}
              <div className="flex flex-col items-center">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  }}
                >
                  {index + 1}
                </div>
                {index < traces.length - 1 && (
                  <div className="w-0.5 flex-1 bg-gray-200 mt-2"></div>
                )}
              </div>

              {/* Trace card */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex-1 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="text-xs px-3 py-1 rounded-full font-semibold capitalize"
                      style={{ backgroundColor: "#eef2ff", color: "#667eea" }}
                    >
                      {trace.stage}
                    </span>
                    <span className="text-xs px-3 py-1 rounded-full font-medium bg-gray-100 text-gray-500 capitalize">
                      {trace.action}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(trace.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-gray-700">{trace.content}</p>
              </div>
            </div>
          ))}
        </div>

        {traces.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <p className="text-gray-400">
              No traces recorded yet for this student.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
