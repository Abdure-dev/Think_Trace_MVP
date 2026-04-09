"use client";
import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { InlineMath, BlockMath } from "react-katex";

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
  const [loadingStep, setLoadingStep] = useState("");
  const [loadingPct, setLoadingPct] = useState(0);
  const [error, setError] = useState("");
  const [assigning, setAssigning] = useState(false);

  function renderMath(text: string) {
    if (!text) return null;
    const cleaned = text.replace(/\\\\/g, "\\");
    return cleaned.split(/(\$\$[\s\S]+?\$\$|\$[^$]+?\$)/).map((part, i) => {
      if (part.startsWith("$$")) {
        try {
          return <BlockMath key={i} math={part.slice(2, -2)} />;
        } catch {
          return (
            <span key={i} className="text-red-400 text-xs">
              {part}
            </span>
          );
        }
      }
      if (part.startsWith("$")) {
        try {
          return <InlineMath key={i} math={part.slice(1, -1)} />;
        } catch {
          return (
            <span key={i} className="text-red-400 text-xs">
              {part}
            </span>
          );
        }
      }
      return <span key={i}>{part}</span>;
    });
  }

  async function handleExtract() {
    if (!file) return;
    setLoading(true);
    setError("");
    setProblems([]);
    setSelectedProblems([]);

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", file);

      setLoadingStep("Uploading PDF...");
      setLoadingPct(15);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/instructor/assignments/extract-pdf`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );

      setLoadingStep("Extracting problems...");
      setLoadingPct(60);

      const data = await response.json();

      setLoadingStep("Converting math to LaTeX...");
      setLoadingPct(85);
      await new Promise((r) => setTimeout(r, 400));

      setLoadingStep("Done!");
      setLoadingPct(100);
      await new Promise((r) => setTimeout(r, 300));

      setProblems(data.problems);
      setSelectedProblems(data.problems.map((_: any, i: number) => i));
    } catch (e) {
      setError("Failed to extract problems from PDF. Please try again.");
    }

    setLoading(false);
    setLoadingStep("");
    setLoadingPct(0);
  }

  async function handleAssign() {
    if (selectedProblems.length === 0 || !dueDate) return;
    setAssigning(true);
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
            sub_parts: problem.sub_parts || [],
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

  function toggleAll() {
    if (selectedProblems.length === problems.length) {
      setSelectedProblems([]);
    } else {
      setSelectedProblems(problems.map((_, i) => i));
    }
  }

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
          href={`/instructor/courses/${course_id}`}
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          ← Back to Course
        </Link>
      </div>

      <div className="p-10 max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Create Assignment
          </h1>
          <p className="text-gray-400 mt-1">
            Upload a PDF to extract and assign problems
          </p>
        </div>

        {/* Step 1 — Upload */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: "#800000" }}
            >
              1
            </div>
            <h2 className="font-bold text-gray-800">Upload PDF</h2>
          </div>

          <div
            className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center mb-4 hover:border-gray-300 transition cursor-pointer"
            onClick={() => document.getElementById("pdf-input")?.click()}
          >
            <input
              id="pdf-input"
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                setFile(e.target.files?.[0] || null);
                setProblems([]);
                setSelectedProblems([]);
              }}
            />
            {file ? (
              <div>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: "rgba(128,0,0,0.08)" }}
                >
                  <span style={{ color: "#800000", fontSize: "20px" }}>📄</span>
                </div>
                <p className="font-semibold text-gray-800">{file.name}</p>
                <p className="text-sm text-gray-400 mt-1">
                  {(file.size / 1024).toFixed(0)} KB · Click to change
                </p>
              </div>
            ) : (
              <div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3 bg-gray-100">
                  <span style={{ fontSize: "20px" }}>📎</span>
                </div>
                <p className="font-semibold text-gray-700">
                  Click to upload PDF
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Assignment, problem set, or homework
                </p>
              </div>
            )}
          </div>

          {/* Progress */}
          {loading && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 font-medium">
                  {loadingStep}
                </span>
                <span
                  className="text-sm font-bold"
                  style={{ color: "#800000" }}
                >
                  {loadingPct}%
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${loadingPct}%`, background: "#800000" }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleExtract}
            disabled={!file || loading}
            className="w-full py-3 rounded-xl font-semibold text-white transition disabled:opacity-40"
            style={{ background: "#800000" }}
          >
            {loading ? `Extracting... ${loadingPct}%` : "Extract Problems"}
          </button>
        </div>

        {/* Step 2 — Select Problems */}
        {problems.length > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: "#800000" }}
                >
                  2
                </div>
                <h2 className="font-bold text-gray-800">Select Problems</h2>
                <span className="text-sm text-gray-400">
                  ({selectedProblems.length} of {problems.length} selected)
                </span>
              </div>
              <button
                onClick={toggleAll}
                className="text-sm font-semibold"
                style={{ color: "#800000" }}
              >
                {selectedProblems.length === problems.length
                  ? "Deselect all"
                  : "Select all"}
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {problems.map((problem, index) => {
                const isSelected = selectedProblems.includes(index);
                return (
                  <div
                    key={index}
                    onClick={() => toggleProblem(index)}
                    className="rounded-xl border-2 cursor-pointer transition p-4"
                    style={{
                      borderColor: isSelected ? "#800000" : "#e5e7eb",
                      background: isSelected ? "rgba(128,0,0,0.03)" : "white",
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                        style={{
                          background: isSelected ? "#800000" : "#f3f4f6",
                          color: isSelected ? "white" : "#6b7280",
                        }}
                      >
                        {isSelected ? "✓" : index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-800 mb-2">
                          {problem.title}
                        </p>
                        <div className="text-sm text-gray-600 leading-relaxed">
                          {renderMath(problem.description)}
                        </div>
                        {problem.sub_parts && problem.sub_parts.length > 0 && (
                          <div className="mt-3 flex flex-col gap-2">
                            {problem.sub_parts.map((part: any, pi: number) => (
                              <div
                                key={pi}
                                className="flex gap-2 pl-3 border-l-2"
                                style={{ borderColor: "#e5e7eb" }}
                              >
                                <span className="text-xs font-bold text-gray-400 mt-0.5 flex-shrink-0">
                                  ({part.label})
                                </span>
                                <div className="text-sm text-gray-600 leading-relaxed">
                                  {renderMath(part.content)}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3 — Settings */}
        {selectedProblems.length > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: "#800000" }}
              >
                3
              </div>
              <h2 className="font-bold text-gray-800">Assignment Settings</h2>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Due Date
                </label>
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="border border-gray-200 p-3 rounded-xl w-full focus:outline-none focus:ring-2 text-gray-700"
                  style={{ "--tw-ring-color": "#800000" } as any}
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  AI Governance Level
                </label>
                <div className="flex flex-col gap-2">
                  {[
                    {
                      value: 0,
                      label: "Level 0 — No AI",
                      desc: "Students work entirely independently",
                    },
                    {
                      value: 1,
                      label: "Level 1 — Minimal",
                      desc: "Single clarifying hint per stage",
                    },
                    {
                      value: 2,
                      label: "Level 2 — Socratic",
                      desc: "Five targeted questions per stage (default)",
                    },
                    {
                      value: 3,
                      label: "Level 3 — Active",
                      desc: "AI explains concepts on request",
                    },
                    {
                      value: 4,
                      label: "Level 4 — Open",
                      desc: "Full collaboration, everything still traced",
                    },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setAiLevel(opt.value)}
                      className="flex items-center gap-3 p-3 rounded-xl border text-left transition"
                      style={{
                        borderColor:
                          aiLevel === opt.value ? "#800000" : "#e5e7eb",
                        background:
                          aiLevel === opt.value
                            ? "rgba(128,0,0,0.04)"
                            : "white",
                      }}
                    >
                      <div
                        className="w-4 h-4 rounded-full border-2 flex-shrink-0"
                        style={{
                          borderColor:
                            aiLevel === opt.value ? "#800000" : "#d1d5db",
                          background:
                            aiLevel === opt.value ? "#800000" : "white",
                        }}
                      />
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          {opt.label}
                        </p>
                        <p className="text-xs text-gray-400">{opt.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Assign Button */}
        {selectedProblems.length > 0 && dueDate && (
          <button
            onClick={handleAssign}
            disabled={assigning}
            className="w-full py-4 rounded-2xl font-bold text-lg text-white hover:opacity-90 transition disabled:opacity-50"
            style={{ background: "#800000" }}
          >
            {assigning
              ? "Creating..."
              : `Assign ${selectedProblems.length} Problem${
                  selectedProblems.length > 1 ? "s" : ""
                } to Course →`}
          </button>
        )}
      </div>
    </div>
  );
}
