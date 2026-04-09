"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Assignment = {
  id: string;
  title: string;
  created_at: string;
  problem_count: number;
  students_started: number;
  students_completed: number;
  total_students: number;
};

type Course = {
  id: string;
  title: string;
  semester: string;
};

export default function InstructorCoursePage() {
  const params = useParams();
  const router = useRouter();
  const course_id = params.course_id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [studentCount, setStudentCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/instructor/courses/${course_id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        setLoading(false);
        return;
      }
      const data = await res.json();
      setCourse(data.course);
      setAssignments(data.assignments);
      setStudentCount(data.student_count);
      setLoading(false);
    }
    load();
  }, [course_id]);

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  if (loading)
    return (
      <div className="min-h-screen bg-[#f8f9fc] p-10 text-gray-500">
        Loading...
      </div>
    );

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
        <Link
          href="/dashboard"
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          ← Dashboard
        </Link>
      </div>

      <div className="p-10 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">{course?.title}</h1>
          <p className="text-gray-400 mt-1">{course?.semester}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { label: "Enrolled students", value: studentCount },
            { label: "Assignments", value: assignments.length },
            {
              label: "Avg completion",
              value: assignments.length
                ? Math.round(
                    assignments.reduce(
                      (a, b) =>
                        a +
                        (b.students_completed / Math.max(b.total_students, 1)) *
                          100,
                      0
                    ) / assignments.length
                  ) + "%"
                : "—",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-2xl p-6 border border-gray-100"
            >
              <p className="text-3xl font-bold text-gray-800">{s.value}</p>
              <p className="text-sm text-gray-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Assignments */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Assignments</h2>
        </div>

        {assignments.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 border border-gray-100 text-center">
            <p className="text-gray-400">
              No assignments yet. Create one from the course page.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {assignments.map((a) => {
              const pct =
                a.total_students > 0
                  ? Math.round((a.students_completed / a.total_students) * 100)
                  : 0;
              const startedPct =
                a.total_students > 0
                  ? Math.round((a.students_started / a.total_students) * 100)
                  : 0;
              return (
                <Link key={a.id} href={`/instructor/assignments/${a.id}`}>
                  <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md transition cursor-pointer">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-gray-800 text-lg">
                          {a.title}
                        </h3>
                        <p className="text-sm text-gray-400 mt-0.5">
                          {formatDate(a.created_at)} · {a.problem_count} problem
                          {a.problem_count !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <span
                        className="text-sm font-semibold px-3 py-1 rounded-full"
                        style={{
                          background: "rgba(128,0,0,0.06)",
                          color: "#800000",
                        }}
                      >
                        View traces →
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-2xl font-bold text-gray-800">
                          {a.total_students}
                        </p>
                        <p className="text-xs text-gray-400">Enrolled</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-800">
                          {a.students_started}
                        </p>
                        <p className="text-xs text-gray-400">Started</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-800">
                          {a.students_completed}
                        </p>
                        <p className="text-xs text-gray-400">Completed</p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>Started {startedPct}%</span>
                        <span>Completed {pct}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full relative"
                          style={{
                            width: `${startedPct}%`,
                            background: "#e5d0d0",
                          }}
                        >
                          <div
                            className="absolute inset-y-0 left-0 rounded-full"
                            style={{
                              width: `${
                                pct > 0 ? (pct / startedPct) * 100 : 0
                              }%`,
                              background: "#800000",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
