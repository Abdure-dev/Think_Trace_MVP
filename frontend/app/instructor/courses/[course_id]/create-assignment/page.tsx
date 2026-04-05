"use client";
import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CreateAssignmentPage({
  params,
}: {
  params: Promise<{ course_id: string }>;
}) {
  const { course_id } = use(params);
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [problems, setProblems] = useState<any[]>([]);
  const [selectedProblems, setSelectedProblems] = useState<number[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [aiLevel, setAiLevel] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleExtract() {
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/instructor/assignments/extract-pdf`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );
      const data = await response.json();
      setProblems(data.problems);
    } catch (e) {
      setError("Failed to extract problems from PDF");
    }
    setLoading(false);
  }

  async function handleAssign() {
    if (selectedProblems.length === 0 || !dueDate) return;
    const token = localStorage.getItem("token");

    for (const index of selectedProblems) {
      const problem = problems[index];
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/instructor/courses/${course_id}/assignments`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: problem.title,
            description: problem.description,
            due_date: dueDate,
            ai_level: aiLevel,
          }),
        }
      );
    }
    router.push(`/instructor/courses/${course_id}`);
  }

  function toggleProblem(index: number) {
    setSelectedProblems((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  }

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

      <div className="p-10 max-w-4xl mx-auto">
        <div className="mb-8">
          <Link
            href={`/instructor/courses/${course_id}`}
            className="text-sm text-gray-400 hover:text-gray-600 transition"
          >
            ← Back to Course
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 mt-2">
            Create Assignment
          </h1>
          <p className="text-gray-400 mt-1">Upload a PDF to extract problems</p>
        </div>

        {/* Step 1 - Upload PDF */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <h2 className="font-bold text-gray-800 mb-4">Step 1 — Upload PDF</h2>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-semibold file:text-white cursor-pointer"
            style={{ "--file-bg": "#667eea" } as any}
          />
          {file && (
            <p className="text-sm text-gray-500 mt-2">Selected: {file.name}</p>
          )}
          <button
            onClick={handleExtract}
            disabled={!file || loading}
            className={`mt-4 text-white px-6 py-3 rounded-xl font-semibold transition ${
              !file || loading
                ? "opacity-40 cursor-not-allowed"
                : "hover:opacity-90"
            }`}
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            }}
          >
            {loading ? "Extracting..." : "Extract Problems"}
          </button>
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </div>

        {/* Step 2 - Select Problems */}
        {problems.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
            <h2 className="font-bold text-gray-800 mb-4">
              Step 2 — Select Problems ({selectedProblems.length} selected)
            </h2>
            <div className="flex flex-col gap-3">
              {problems.map((problem, index) => (
                <div
                  key={index}
                  onClick={() => toggleProblem(index)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition ${
                    selectedProblems.includes(index)
                      ? "border-purple-400 bg-purple-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold ${
                        selectedProblems.includes(index)
                          ? "bg-purple-500 text-white"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {selectedProblems.includes(index) ? "✓" : index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">
                        {problem.title}
                      </p>
                      <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                        {problem.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3 - Settings */}
        {selectedProblems.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
            <h2 className="font-bold text-gray-800 mb-4">
              Step 3 — Assignment Settings
            </h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-600 mb-2 block">
                  Due Date
                </label>
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="border border-gray-200 p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600 mb-2 block">
                  AI Level
                </label>
                <select
                  value={aiLevel}
                  onChange={(e) => setAiLevel(Number(e.target.value))}
                  className="border border-gray-200 p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  <option value={1}>Level 1 — Minimal AI (hints only)</option>
                  <option value={2}>
                    Level 2 — Socratic guidance (default)
                  </option>
                  <option value={3}>Level 3 — Full AI assistance</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Assign Button */}
        {selectedProblems.length > 0 && dueDate && (
          <button
            onClick={handleAssign}
            className="w-full text-white py-4 rounded-2xl font-bold text-lg hover:opacity-90 transition"
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            }}
          >
            Assign {selectedProblems.length} Problem
            {selectedProblems.length > 1 ? "s" : ""} to Course →
          </button>
        )}
      </div>
    </div>
  );
}
