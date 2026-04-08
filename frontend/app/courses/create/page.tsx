"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const AI_LEVELS = [
  {
    level: 0,
    label: "No AI",
    description:
      "Students work entirely on their own. No hints or AI assistance.",
  },
  {
    level: 1,
    label: "Minimal Guidance",
    description: "Students can request a single clarifying hint per stage.",
  },
  {
    level: 2,
    label: "Structured Hints",
    description:
      "Progressive hints available. AI nudges without giving answers.",
  },
  {
    level: 3,
    label: "Active Assistance",
    description: "AI can explain concepts and suggest approaches on request.",
  },
  {
    level: 4,
    label: "Full Collaboration",
    description: "Full AI collaboration. Every interaction is still traced.",
  },
];

const SEMESTERS = [
  "Spring 2025",
  "Summer 2025",
  "Fall 2025",
  "Spring 2026",
  "Summer 2026",
  "Fall 2026",
];

export default function CreateCoursePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [semester, setSemester] = useState(SEMESTERS[3]); // default: Spring 2026
  const [aiLevel, setAiLevel] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!title.trim()) {
      setError("Course title is required.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          semester,
          default_ai_level: aiLevel,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to create course.");
      }

      const course = await res.json();
      router.push(`/courses/${course.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center px-4 pt-16">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Create a Course</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Set up your course and choose how AI assists your students.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
          {/* Course Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Course Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. MATH 161 — Calculus I"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-transparent"
            />
          </div>

          {/* Semester */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Semester
            </label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#800000] bg-white"
            >
              {SEMESTERS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* AI Governance Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Default AI Governance Level
            </label>
            <div className="space-y-2">
              {AI_LEVELS.map((opt) => (
                <button
                  key={opt.level}
                  onClick={() => setAiLevel(opt.level)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                    aiLevel === opt.level
                      ? "border-[#800000] bg-[#800000]/5 ring-1 ring-[#800000]"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">
                      Level {opt.level} — {opt.label}
                    </span>
                    {aiLevel === opt.level && (
                      <span className="text-[#800000] text-xs font-semibold">
                        Selected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {opt.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-[#800000] text-white py-3 rounded-xl text-sm font-semibold hover:bg-[#6a0000] transition-colors disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Course"}
          </button>
        </div>
      </div>
    </div>
  );
}
