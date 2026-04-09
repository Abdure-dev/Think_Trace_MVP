"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { InlineMath, BlockMath } from "react-katex";

const STAGES = [
  "understand",
  "concept",
  "plan",
  "attempt",
  "critique",
  "reflection",
];

const STAGE_COLORS: Record<
  string,
  { bg: string; border: string; label: string }
> = {
  understand: { bg: "#eff6ff", border: "#bfdbfe", label: "Understand" },
  concept: { bg: "#f0fdf4", border: "#bbf7d0", label: "Concept" },
  plan: { bg: "#fffbeb", border: "#fde68a", label: "Plan" },
  attempt: { bg: "#faf5ff", border: "#e9d5ff", label: "Attempt" },
  critique: { bg: "#fff7ed", border: "#fed7aa", label: "Critique" },
  reflection: { bg: "#fdf4ff", border: "#f0abfc", label: "Reflect" },
};

export default function StudentTracePage() {
  const params = useParams();
  const router = useRouter();
  const { assignment_id, student_id } = params as {
    assignment_id: string;
    student_id: string;
  };

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProblem, setSelectedProblem] = useState(0);

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/instructor/assignments/${assignment_id}/students/${student_id}/trace`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) {
        setLoading(false);
        return;
      }
      const d = await res.json();
      setData(d);
      setLoading(false);
    }
    load();
  }, [assignment_id, student_id]);

  function formatTime(seconds: number) {
    if (!seconds) return "—";
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h ${Math.round(
      (seconds % 3600) / 60
    )}m`;
  }

  function formatTimestamp(ts: string) {
    return new Date(ts).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  function renderMath(text: string) {
    if (!text) return null;
    const cleaned = text.replace(/\\\\/g, "\\");
    return cleaned.split(/(\$\$[\s\S]+?\$\$|\$[^$]+?\$)/).map((part, i) => {
      if (part.startsWith("$$"))
        return <BlockMath key={i} math={part.slice(2, -2)} />;
      if (part.startsWith("$"))
        return <InlineMath key={i} math={part.slice(1, -1)} />;
      return <span key={i}>{part}</span>;
    });
  }

  if (loading)
    return (
      <div className="min-h-screen bg-[#f8f9fc] p-10 text-gray-500">
        Loading trace...
      </div>
    );
  if (!data)
    return (
      <div className="min-h-screen bg-[#f8f9fc] p-10 text-red-500">
        Failed to load.
      </div>
    );

  const { student, assignment, course, problems } = data;
  const problem = problems[selectedProblem];

  const totalTime = problems.reduce(
    (a: number, p: any) => a + p.total_time_seconds,
    0
  );
  const totalStages = problems.reduce(
    (a: number, p: any) => a + p.stages_completed,
    0
  );
  const maxStages = problems.length * STAGES.length;
  const overallPct =
    maxStages > 0 ? Math.round((totalStages / maxStages) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      {/* Nav */}
      <div className="px-10 py-5 bg-white border-b border-gray-100 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "#800000" }}
          >
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <span className="font-bold text-gray-800">ThinkTrace</span>
          <span className="text-gray-300 mx-2">·</span>
          <span className="text-gray-500 text-sm">Instructor</span>
        </div>
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          ← Back to assignment
        </button>
      </div>

      <div className="p-10 max-w-5xl mx-auto">
        {/* Student header */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 mb-6">
          <div className="flex items-center gap-4 mb-5">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
              style={{ background: "#800000" }}
            >
              {student.first_name[0]}
              {student.last_name[0]}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {student.first_name} {student.last_name}
              </h1>
              <p className="text-gray-400 text-sm mt-0.5">
                {student.email} · {course.title} · {assignment.title}
              </p>
            </div>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Overall progress", value: `${overallPct}%` },
              {
                label: "Stages completed",
                value: `${totalStages} / ${maxStages}`,
              },
              { label: "Total time spent", value: formatTime(totalTime) },
              {
                label: "Problems attempted",
                value: `${
                  problems.filter((p: any) => p.stages_completed > 0).length
                } / ${problems.length}`,
              },
            ].map((s) => (
              <div key={s.label} className="bg-gray-50 rounded-xl p-4">
                <p className="text-xl font-bold text-gray-800">{s.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Overall progress bar */}
          <div className="mt-4">
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${overallPct}%`, background: "#800000" }}
              />
            </div>
          </div>
        </div>

        {/* Problem selector */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {problems.map((p: any, i: number) => (
            <button
              key={p.id}
              onClick={() => setSelectedProblem(i)}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition border"
              style={{
                background: selectedProblem === i ? "#800000" : "white",
                color: selectedProblem === i ? "white" : "#374151",
                borderColor: selectedProblem === i ? "#800000" : "#e5e7eb",
              }}
            >
              Problem {p.problem_number}
              {p.is_complete && <span className="ml-1.5">✓</span>}
            </button>
          ))}
        </div>

        {problem && (
          <div>
            {/* Problem statement */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 mb-4 select-none">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-gray-800 text-lg">
                  Problem {problem.problem_number}
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    Time on problem:
                  </span>
                  <span className="text-sm font-semibold text-gray-700">
                    {formatTime(problem.total_time_seconds)}
                  </span>
                  {problem.is_complete && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-700">
                      Complete
                    </span>
                  )}
                </div>
              </div>
              <div className="text-gray-600 leading-relaxed">
                {renderMath(problem.problem_text)}
              </div>

              {/* Stage overview dots */}
              <div className="mt-4 flex gap-2 flex-wrap">
                {problem.stages.map((s: any) => (
                  <div
                    key={s.stage}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{
                      background: s.completed
                        ? "rgba(128,0,0,0.06)"
                        : "#f3f4f6",
                      color: s.completed ? "#800000" : "#9ca3af",
                    }}
                  >
                    {s.completed ? "✓" : "○"}{" "}
                    {s.stage.charAt(0).toUpperCase() + s.stage.slice(1)}
                    {s.time_seconds > 0 && (
                      <span className="ml-1 opacity-60">
                        ({formatTime(s.time_seconds)})
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Stage traces */}
            <div className="flex flex-col gap-4">
              {problem.stages.map((stageData: any) => {
                const cfg = STAGE_COLORS[stageData.stage];
                if (!stageData.completed && stageData.traces.length === 0)
                  return null;

                return (
                  <div
                    key={stageData.stage}
                    className="rounded-2xl border overflow-hidden"
                    style={{
                      borderColor: stageData.completed ? cfg.border : "#e5e7eb",
                    }}
                  >
                    {/* Stage header */}
                    <div
                      className="px-5 py-3 flex items-center justify-between"
                      style={{
                        background: stageData.completed ? cfg.bg : "#f9fafb",
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="text-sm font-bold capitalize"
                          style={{
                            color: stageData.completed ? "#1a1208" : "#9ca3af",
                          }}
                        >
                          {stageData.completed ? "✓" : "○"} {cfg.label}
                        </span>
                        {stageData.trace_count > 0 && (
                          <span className="text-xs text-gray-400">
                            {stageData.trace_count} response
                            {stageData.trace_count !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 font-medium">
                        {formatTime(stageData.time_seconds)}
                      </span>
                    </div>

                    {/* Traces */}
                    {stageData.traces.length > 0 && (
                      <div className="p-5 bg-white flex flex-col gap-3">
                        {stageData.traces.map((trace: any, i: number) => (
                          <div key={trace.id} className="flex gap-3">
                            {/* Timeline dot */}
                            <div className="flex flex-col items-center gap-1 flex-shrink-0">
                              <div
                                className="w-2 h-2 rounded-full mt-1.5"
                                style={{ background: "#800000" }}
                              />
                              {i < stageData.traces.length - 1 && (
                                <div
                                  className="w-px flex-1 bg-gray-100"
                                  style={{ minHeight: "16px" }}
                                />
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 pb-1">
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-xs font-semibold text-gray-500">
                                  {trace.action === "text_submission"
                                    ? "Student wrote"
                                    : trace.action}
                                </span>
                                <span className="text-xs text-gray-300">
                                  {formatTimestamp(trace.created_at)}
                                </span>
                              </div>
                              <div
                                className="rounded-xl p-3 text-sm leading-relaxed text-gray-700"
                                style={{
                                  background: "#faf9f7",
                                  border: "1px solid rgba(26,18,8,0.06)",
                                }}
                              >
                                {trace.content ? (
                                  renderMath(trace.content)
                                ) : (
                                  <span className="text-gray-300 italic">
                                    No content
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {stageData.traces.length === 0 && !stageData.completed && (
                      <div className="px-5 py-4 bg-white">
                        <p className="text-sm text-gray-300 italic">
                          Not started
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
