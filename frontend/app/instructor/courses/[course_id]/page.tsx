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
  course_code: string;
};

type InviteResult = {
  email: string;
  status: "enrolled" | "already_enrolled" | "not_found";
  name?: string;
};

export default function InstructorCoursePage() {
  const params = useParams();
  const router = useRouter();
  const course_id = params.course_id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [studentCount, setStudentCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [showInvite, setShowInvite] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteResults, setInviteResults] = useState<InviteResult[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/instructor/courses/${course_id}`,
        { headers: { Authorization: `Bearer ${token}` } }
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

  function copyCode() {
    if (course?.course_code) {
      navigator.clipboard.writeText(course.course_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleInvite() {
    const emails = emailInput
      .split(/[\n,]+/)
      .map((e) => e.trim())
      .filter(Boolean);
    if (emails.length === 0) return;

    setInviting(true);
    setInviteResults([]);

    const token = localStorage.getItem("token");
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/instructor/courses/${course_id}/invite`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ emails }),
      }
    );

    const data = await res.json();
    setInviteResults(data.results);
    setInviting(false);

    // Refresh student count
    const enrolled = data.results.filter(
      (r: InviteResult) => r.status === "enrolled"
    ).length;
    if (enrolled > 0) setStudentCount((prev) => prev + enrolled);
  }

  function closeInvite() {
    setShowInvite(false);
    setEmailInput("");
    setInviteResults([]);
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
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              {course?.title}
            </h1>
            <p className="text-gray-400 mt-1">{course?.semester}</p>
          </div>
          <button
            onClick={() => setShowInvite(true)}
            className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition"
            style={{ backgroundColor: "#800000" }}
          >
            + Invite Students
          </button>
        </div>

        {/* Course code banner */}
        {course?.course_code && (
          <div className="bg-white rounded-2xl p-5 border border-gray-100 mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                Course join code
              </p>
              <p
                className="text-3xl font-bold tracking-widest"
                style={{ color: "#800000", fontFamily: "monospace" }}
              >
                {course.course_code}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Share this code with students — they can enter it on their
                dashboard to join
              </p>
            </div>
            <button
              onClick={copyCode}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold border transition"
              style={{
                background: copied ? "#f0fdf4" : "white",
                borderColor: copied ? "#86efac" : "#e5e7eb",
                color: copied ? "#16a34a" : "#374151",
              }}
            >
              {copied ? "✓ Copied!" : "Copy code"}
            </button>
          </div>
        )}

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
          <Link
            href={`/instructor/courses/${course_id}/create-assignment`}
            className="px-4 py-2 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition"
            style={{ backgroundColor: "#800000" }}
          >
            + New Assignment
          </Link>
        </div>

        {assignments.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 border border-gray-100 text-center">
            <p className="text-gray-400 mb-6">No assignments yet.</p>
            <Link
              href={`/instructor/courses/${course_id}/create-assignment`}
              className="px-6 py-3 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition"
              style={{ backgroundColor: "#800000" }}
            >
              Create First Assignment
            </Link>
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
                      {[
                        { label: "Enrolled", value: a.total_students },
                        { label: "Started", value: a.students_started },
                        { label: "Completed", value: a.students_completed },
                      ].map((s) => (
                        <div key={s.label}>
                          <p className="text-2xl font-bold text-gray-800">
                            {s.value}
                          </p>
                          <p className="text-xs text-gray-400">{s.label}</p>
                        </div>
                      ))}
                    </div>

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
                                pct > 0 && startedPct > 0
                                  ? (pct / startedPct) * 100
                                  : 0
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

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center px-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  Invite Students
                </h3>
                <p className="text-gray-400 text-sm mt-1">
                  Add students by email or share the course code
                </p>
              </div>
              <button
                onClick={closeInvite}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Course code */}
            <div className="bg-gray-50 rounded-xl p-4 mb-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Share course code
              </p>
              <div className="flex items-center justify-between">
                <span
                  className="text-2xl font-bold tracking-widest"
                  style={{ color: "#800000", fontFamily: "monospace" }}
                >
                  {course?.course_code}
                </span>
                <button
                  onClick={copyCode}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition"
                  style={{
                    background: copied ? "#f0fdf4" : "white",
                    borderColor: copied ? "#86efac" : "#e5e7eb",
                    color: copied ? "#16a34a" : "#374151",
                  }}
                >
                  {copied ? "✓ Copied!" : "Copy"}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Students enter this on their dashboard to join instantly
              </p>
            </div>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400">or invite by email</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* Email input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Student emails
              </label>
              <textarea
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                rows={4}
                placeholder="Enter emails separated by commas or new lines&#10;e.g. student1@uchicago.edu&#10;student2@uchicago.edu"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#800000]"
              />
              <p className="text-xs text-gray-400 mt-1">
                Students must already have a ThinkTrace account to be enrolled
                directly.
              </p>
            </div>

            {/* Results */}
            {inviteResults.length > 0 && (
              <div className="mb-4 flex flex-col gap-2 max-h-40 overflow-y-auto">
                {inviteResults.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm"
                    style={{
                      background:
                        r.status === "enrolled"
                          ? "#f0fdf4"
                          : r.status === "already_enrolled"
                          ? "#fffbeb"
                          : "#fef2f2",
                    }}
                  >
                    <span
                      style={{
                        color:
                          r.status === "enrolled"
                            ? "#16a34a"
                            : r.status === "already_enrolled"
                            ? "#d97706"
                            : "#dc2626",
                      }}
                    >
                      {r.status === "enrolled"
                        ? "✓"
                        : r.status === "already_enrolled"
                        ? "!"
                        : "✗"}
                    </span>
                    <span className="font-medium text-gray-700">{r.email}</span>
                    <span className="text-gray-400 text-xs ml-auto">
                      {r.status === "enrolled"
                        ? `Enrolled — ${r.name}`
                        : r.status === "already_enrolled"
                        ? "Already enrolled"
                        : "No account found"}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={closeInvite}
                className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
              >
                {inviteResults.length > 0 ? "Done" : "Cancel"}
              </button>
              {inviteResults.length === 0 && (
                <button
                  onClick={handleInvite}
                  disabled={inviting || !emailInput.trim()}
                  className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
                  style={{ backgroundColor: "#800000" }}
                >
                  {inviting ? "Inviting..." : "Send Invites"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
