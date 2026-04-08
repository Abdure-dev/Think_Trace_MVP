"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Problem = {
  id: string;
  problem_number: number;
  problem_text: string;
  created_at?: string;
};

type Assignment = {
  id: string;
  title: string;
  raw_text?: string;
  description?: string;
  created_at?: string;
  problems: Problem[];
};

export default function AssignmentPage() {
  const router = useRouter();
  const params = useParams();
  const assignment_id = params.assignment_id as string;

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [inputMode, setInputMode] = useState<"text" | "pdf" | "image">("text");
  const [newText, setNewText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

  const sortedProblems = useMemo(() => {
    if (!assignment?.problems) return [];
    return [...assignment.problems].sort(
      (a, b) => a.problem_number - b.problem_number
    );
  }, [assignment]);

  useEffect(() => {
    if (!assignment_id) return;
    fetchAssignment();
  }, [assignment_id]);

  async function fetchAssignment() {
    try {
      setLoading(true);
      setPageError("");

      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/assignments/${assignment_id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error("Failed to load problem set.");
      }

      const data = await res.json();
      setAssignment(data);
    } catch (err: any) {
      setPageError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddProblems() {
    if (inputMode === "text" && !newText.trim()) {
      setAddError("Please paste at least one problem.");
      return;
    }

    if ((inputMode === "pdf" || inputMode === "image") && !selectedFile) {
      setAddError(`Please upload a ${inputMode.toUpperCase()} file.`);
      return;
    }

    try {
      setAdding(true);
      setAddError("");

      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const formData = new FormData();
      formData.append("source_type", inputMode);

      if (inputMode === "text") {
        formData.append("raw_text", newText.trim());
      }

      if ((inputMode === "pdf" || inputMode === "image") && selectedFile) {
        formData.append("file", selectedFile);
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/assignments/${assignment_id}/problems`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!res.ok) {
        let message = "Failed to add problems.";
        try {
          const data = await res.json();
          message = data.detail || message;
        } catch {}
        throw new Error(message);
      }

      closeModal();
      await fetchAssignment();
    } catch (err: any) {
      setAddError(err.message || "Failed to add problems.");
    } finally {
      setAdding(false);
    }
  }

  function closeModal() {
    setShowAddModal(false);
    setInputMode("text");
    setNewText("");
    setSelectedFile(null);
    setAddError("");
  }

  function previewProblemText(text: string, maxLength = 180) {
    if (!text) return "";
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] p-10">
        <p className="text-gray-500">Loading problem set...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      <div className="px-10 py-6 bg-white border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-[#667eea] to-[#764ba2]">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <span className="font-bold text-gray-800 text-lg">ThinkTrace</span>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm hover:opacity-90 transition bg-[#800000]"
        >
          Add Problems
        </button>
      </div>

      <div className="p-10">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-400 hover:text-gray-600 transition"
          >
            ← Back
          </button>

          <h1 className="text-3xl font-bold text-gray-800 mt-3">
            {assignment?.title || "Problem Set"}
          </h1>

          <p className="text-gray-400 mt-1">
            Open an existing problem or add more problems to this set.
          </p>
        </div>

        {pageError && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3">
            {pageError}
          </div>
        )}

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Problems</h2>
            <p className="text-gray-400 mt-1">
              {sortedProblems.length} problem
              {sortedProblems.length === 1 ? "" : "s"}
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          >
            Add More
          </button>
        </div>

        {sortedProblems.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100 text-center">
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              No problems yet
            </h3>
            <p className="text-gray-400 mb-6">
              Add your first problem by pasting text or uploading a PDF/image.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="text-white px-5 py-3 rounded-xl font-semibold hover:opacity-90 transition bg-[#800000]"
            >
              Add Problems
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {sortedProblems.map((problem) => (
              <Link
                key={problem.id}
                href={`/problems/${problem.id}`}
                className="block"
              >
                <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition cursor-pointer border border-gray-100 h-full">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-800 text-lg">
                      Problem {problem.problem_number}
                    </h3>
                    <span className="text-xs px-3 py-1 rounded-full font-medium bg-[#eef2ff] text-[#667eea]">
                      Open
                    </span>
                  </div>

                  <p className="text-gray-500 text-sm leading-6">
                    {previewProblemText(problem.problem_text)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center px-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-800">
                  Add Problems
                </h3>
                <p className="text-gray-400 mt-1 text-sm">
                  Add new problems to this existing problem set.
                </p>
              </div>

              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Input Type
                </label>

                <div className="flex gap-3 flex-wrap">
                  {(["text", "pdf", "image"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        setInputMode(mode);
                        if (mode === "text") setSelectedFile(null);
                        else setNewText("");
                        setAddError("");
                      }}
                      className={`px-4 py-2 rounded-xl border text-sm font-medium ${
                        inputMode === mode
                          ? "bg-[#800000] text-white border-[#800000]"
                          : "bg-white text-gray-700 border-gray-300"
                      }`}
                    >
                      {mode === "text"
                        ? "Paste Text"
                        : mode === "pdf"
                        ? "Upload PDF"
                        : "Upload Image"}
                    </button>
                  ))}
                </div>
              </div>

              {inputMode === "text" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Problem Text
                  </label>
                  <textarea
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    rows={12}
                    placeholder="Paste one or more problems here..."
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-transparent"
                  />
                </div>
              )}

              {inputMode === "pdf" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload PDF
                  </label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) =>
                      setSelectedFile(e.target.files?.[0] || null)
                    }
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm bg-white"
                  />
                  {selectedFile && (
                    <p className="text-sm text-gray-500 mt-2">
                      {selectedFile.name}
                    </p>
                  )}
                </div>
              )}

              {inputMode === "image" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setSelectedFile(e.target.files?.[0] || null)
                    }
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm bg-white"
                  />
                  {selectedFile && (
                    <p className="text-sm text-gray-500 mt-2">
                      {selectedFile.name}
                    </p>
                  )}
                </div>
              )}

              {addError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                  {addError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={closeModal}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  onClick={handleAddProblems}
                  disabled={adding}
                  className="text-white px-5 py-2.5 rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50 bg-[#800000]"
                >
                  {adding ? "Adding..." : "Add Problems"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
