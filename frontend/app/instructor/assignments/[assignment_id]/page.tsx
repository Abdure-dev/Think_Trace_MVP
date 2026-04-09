"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

const STAGES = [
  "understand",
  "concept",
  "plan",
  "attempt",
  "critique",
  "reflection",
];

const STATUS_CONFIG = {
  not_started: {
    label: "Not started",
    bg: "#f3f4f6",
    color: "#9ca3af",
    dot: "#d1d5db",
  },
  struggling: {
    label: "Struggling",
    bg: "#fef2f2",
    color: "#dc2626",
    dot: "#ef4444",
  },
  in_progress: {
    label: "In progress",
    bg: "#fffbeb",
    color: "#d97706",
    dot: "#f59e0b",
  },
  on_track: {
    label: "On track",
    bg: "#f0fdf4",
    color: "#16a34a",
    dot: "#22c55e",
  },
};

type StudentProgress = {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  completion_pct: number;
  stages_completed: number;
  total_stages: number;
  total_traces: number;
  time_spent_seconds: number;
  status: keyof typeof STATUS_CONFIG;
  problems: {
    problem_id: string;
    problem_number: number;
    stages_completed: number;
    total_stages: number;
    current_stage: string;
    is_complete: boolean;
  }[];
};

type Problem = {
  id: string;
  problem_number: number;
  problem_text: string;
};

export default function AssignmentOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const assignment_id = params.assignment_id as string;

  const [assignment, setAssignment] = useState<any>(null);
  const [course, setCourse] = useState<any>(null);
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/instructor/assignments/${assignment_id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) {
        setLoading(false);
        return;
      }
      const data = await res.json();
      setAssignment(data.assignment);
      setCourse(data.course);
      setStudents(data.students);
      setProblems(data.problems);
      setLoading(false);
    }
    load();
  }, [assignment_id]);

  function formatTime(seconds: number) {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h ${Math.round(
      (seconds % 3600) / 60
    )}m`;
  }

  const filtered =
    filter === "all" ? students : students.filter((s) => s.status === filter);

  if (loading)
    return (
      <div className="min-h-screen bg-[#f8f9fc] p-10 text-gray-500">
        Loading...
      </div>
    );

  const statusCounts = {
    not_started: students.filter((s) => s.status === "not_started").length,
    struggling: students.filter((s) => s.status === "struggling").length,
    in_progress: students.filter((s) => s.status === "in_progress").length,
    on_track: students.filter((s) => s.status === "on_track").length,
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      {/* Nav */}
      <div className="px-10 py-5 bg-white border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "#800000" }}
          >
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <span className="font-bold text-gray-800 text-lg">ThinkTrace</span>
          <span className="text-gray-300 mx-2">·</span>
          <span className="text-gray-500 text-sm">Instructor</span>
        </div>
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          ← Back
        </button>
      </div>

      <div className="p-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <p className="text-sm text-gray-400 mb-1">{course?.title}</p>
          <h1 className="text-3xl font-bold text-gray-800">
            {assignment?.title}
          </h1>
          <p className="text-gray-400 mt-1">
            {problems.length} problem{problems.length !== 1 ? "s" : ""} ·{" "}
            {students.length} students enrolled
          </p>
        </div>

        {/* Status summary cards */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          {(
            Object.entries(STATUS_CONFIG) as [
              keyof typeof STATUS_CONFIG,
              (typeof STATUS_CONFIG)[keyof typeof STATUS_CONFIG]
            ][]
          ).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setFilter(filter === key ? "all" : key)}
              className="rounded-2xl p-5 border-2 text-left transition"
              style={{
                background: cfg.bg,
                borderColor: filter === key ? cfg.dot : "transparent",
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: cfg.dot }}
                />
                <span
                  className="text-xs font-semibold"
                  style={{ color: cfg.color }}
                >
                  {cfg.label}
                </span>
              </div>
              <p className="text-3xl font-bold text-gray-800">
                {statusCounts[key]}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">students</p>
            </button>
          ))}
        </div>

        {/* Student table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {/* Header row */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-4">
            <div style={{ width: "200px", flexShrink: 0 }}>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Student
              </span>
            </div>
            <div className="flex gap-2 flex-1">
              {problems.map((p) => (
                <div key={p.id} className="flex-1 text-center">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    P{p.problem_number}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ width: "80px", flexShrink: 0, textAlign: "right" }}>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Time
              </span>
            </div>
            <div style={{ width: "100px", flexShrink: 0, textAlign: "right" }}>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Progress
              </span>
            </div>
          </div>

          {/* Student rows */}
          {filtered.length === 0 ? (
            <div className="p-10 text-center text-gray-400">
              No students match this filter.
            </div>
          ) : (
            filtered.map((student) => {
              const cfg = STATUS_CONFIG[student.status];
              return (
                <Link
                  key={student.user_id}
                  href={`/instructor/assignments/${assignment_id}/students/${student.user_id}`}
                  className="block"
                >
                  <div className="px-6 py-4 border-b border-gray-50 hover:bg-gray-50 transition flex items-center gap-4 cursor-pointer">
                    {/* Student name */}
                    <div style={{ width: "200px", flexShrink: 0 }}>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ background: "#800000" }}
                        >
                          {student.first_name[0]}
                          {student.last_name[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">
                            {student.first_name} {student.last_name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <div
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ background: cfg.dot }}
                            />
                            <span
                              className="text-xs"
                              style={{ color: cfg.color }}
                            >
                              {cfg.label}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Problem stage dots */}
                    <div className="flex gap-2 flex-1">
                      {problems.map((prob) => {
                        const sp = student.problems.find(
                          (p) => p.problem_id === prob.id
                        );
                        return (
                          <div
                            key={prob.id}
                            className="flex-1 flex justify-center"
                          >
                            <div className="flex gap-0.5">
                              {STAGES.map((s, i) => {
                                const done = sp
                                  ? i < sp.stages_completed
                                  : false;
                                const current = sp
                                  ? s === sp.current_stage && !sp.is_complete
                                  : false;
                                return (
                                  <div
                                    key={s}
                                    className="w-3 h-3 rounded-full"
                                    title={s}
                                    style={{
                                      background: done
                                        ? "#800000"
                                        : current
                                        ? "#fca5a5"
                                        : "#e5e7eb",
                                    }}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Time */}
                    <div
                      style={{
                        width: "80px",
                        flexShrink: 0,
                        textAlign: "right",
                      }}
                    >
                      <span className="text-sm text-gray-600 font-medium">
                        {formatTime(student.time_spent_seconds)}
                      </span>
                    </div>

                    {/* Progress */}
                    <div style={{ width: "100px", flexShrink: 0 }}>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${student.completion_pct}%`,
                              background: "#800000",
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-8 text-right">
                          {student.completion_pct}%
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center gap-6">
          <span className="text-xs text-gray-400">Stage dots:</span>
          <div className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-full"
              style={{ background: "#800000" }}
            />
            <span className="text-xs text-gray-500">Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-200" />
            <span className="text-xs text-gray-500">In progress</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-gray-200" />
            <span className="text-xs text-gray-500">Not started</span>
          </div>
        </div>
      </div>
    </div>
  );
}
