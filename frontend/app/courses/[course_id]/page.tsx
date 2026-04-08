"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Course = {
  id: string;
  title: string;
  semester?: string;
};

type ProblemSet = {
  id: string;
  title: string;
  description?: string;
  raw_text?: string;
  ai_level?: number;
  due_date?: string | null;
  created_at?: string;
};

export default function CoursePage() {
  const router = useRouter();
  const params = useParams();
  const course_id = params.course_id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [problemSets, setProblemSets] = useState<ProblemSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [inputMode, setInputMode] = useState<"text" | "pdf" | "image">("text");
  const [newTitle, setNewTitle] = useState("");
  const [newText, setNewText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const sortedProblemSets = useMemo(() => {
    return [...problemSets].sort((a, b) => {
      return (
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime()
      );
    });
  }, [problemSets]);

  useEffect(() => {
    if (!course_id) return;
    fetchPageData();
  }, [course_id]);

  async function fetchPageData() {
    try {
      setLoading(true);
      setPageError("");

      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [courseRes, problemSetsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses/${course_id}`, {
          method: "GET",
          headers,
        }),
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/courses/${course_id}/assignments`,
          {
            method: "GET",
            headers,
          }
        ),
      ]);

      if (!courseRes.ok) {
        throw new Error("Failed to load course.");
      }

      if (!problemSetsRes.ok) {
        throw new Error("Failed to load problem sets.");
      }

      const courseData = await courseRes.json();
      const problemSetsData = await problemSetsRes.json();

      setCourse(courseData);
      setProblemSets(Array.isArray(problemSetsData) ? problemSetsData : []);
    } catch (err: any) {
      setPageError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateProblemSet() {
    if (!newTitle.trim()) {
      setCreateError("Problem set title is required.");
      return;
    }

    if (inputMode === "text" && !newText.trim()) {
      setCreateError("Please paste the problem set text.");
      return;
    }

    if ((inputMode === "pdf" || inputMode === "image") && !selectedFile) {
      setCreateError(`Please upload a ${inputMode.toUpperCase()} file.`);
      return;
    }

    try {
      setCreating(true);
      setCreateError("");

      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const formData = new FormData();
      formData.append("title", newTitle.trim());
      formData.append("source_type", inputMode);

      if (inputMode === "text") {
        formData.append("raw_text", newText.trim());
      }

      if ((inputMode === "pdf" || inputMode === "image") && selectedFile) {
        formData.append("file", selectedFile);
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/courses/${course_id}/assignments`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!res.ok) {
        let message = "Failed to create problem set.";
        try {
          const data = await res.json();
          message = data.detail || message;
        } catch {}
        throw new Error(message);
      }

      const data = await res.json();
      const assignmentId = data?.assignment?.id;

      closeModal();
      await fetchPageData();

      if (assignmentId) {
        router.push(`/assignments/${assignmentId}`);
      }
    } catch (err: any) {
      setCreateError(err.message || "Failed to create problem set.");
    } finally {
      setCreating(false);
    }
  }

  function closeModal() {
    setShowCreateModal(false);
    setInputMode("text");
    setNewTitle("");
    setNewText("");
    setSelectedFile(null);
    setCreateError("");
  }

  function formatDate(date?: string | null) {
    if (!date) return "No due date";
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "No due date";
    return parsed.toLocaleDateString();
  }

  function getPreviewText(problemSet: ProblemSet) {
    return (
      problemSet.description ||
      problemSet.raw_text ||
      "Open this problem set to view and work on its problems."
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fc]">
        <div className="px-10 py-6 bg-white border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-[#667eea] to-[#764ba2]">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="font-bold text-gray-800 text-lg">ThinkTrace</span>
          </div>
        </div>

        <div className="p-10">
          <p className="text-gray-500">Loading course...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      <div className="px-10 py-6 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-[#667eea] to-[#764ba2]">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="font-bold text-gray-800 text-lg">ThinkTrace</span>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm hover:opacity-90 transition bg-[#800000]"
          >
            New Problem Set
          </button>
        </div>
      </div>

      <div className="p-10">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="text-sm text-gray-400 hover:text-gray-600 transition"
          >
            ← Back to Dashboard
          </Link>

          <h1 className="text-3xl font-bold text-gray-800 mt-3">
            {course?.title || "Course"}
          </h1>

          <p className="text-gray-400 mt-1">
            {course?.semester ||
              "Open an existing problem set or create a new one."}
          </p>
        </div>

        {pageError && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3">
            {pageError}
          </div>
        )}

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Problem Sets</h2>
            <p className="text-gray-400 mt-1">
              Continue an existing set or start a new one.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          >
            Create New
          </button>
        </div>

        {sortedProblemSets.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100 text-center">
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              No problem sets yet
            </h3>
            <p className="text-gray-400 mb-6">
              Create your first problem set by pasting text or uploading a
              PDF/image.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-white px-5 py-3 rounded-xl font-semibold hover:opacity-90 transition bg-[#800000]"
            >
              New Problem Set
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {sortedProblemSets.map((setItem) => (
              <Link key={setItem.id} href={`/assignments/${setItem.id}`}>
                <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition cursor-pointer border border-gray-100 flex items-center justify-between">
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-800 text-lg">
                      {setItem.title}
                    </h3>

                    <p className="text-gray-400 text-sm mt-1">
                      Due: {formatDate(setItem.due_date)}
                    </p>

                    <p className="text-gray-500 text-sm mt-3 line-clamp-3">
                      {getPreviewText(setItem)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 ml-6">
                    {typeof setItem.ai_level === "number" && (
                      <span className="text-xs px-3 py-1 rounded-full font-medium bg-[#eef2ff] text-[#667eea]">
                        AI Level {setItem.ai_level}
                      </span>
                    )}
                    <span className="text-gray-300 text-xl">→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center px-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-800">
                  Create New Problem Set
                </h3>
                <p className="text-gray-400 mt-1 text-sm">
                  Start a new set from pasted text, a PDF, or an image.
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
                  Problem Set Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Homework 3 — Divide and Conquer"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-transparent"
                />
              </div>

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
                        setCreateError("");
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
                    Problem Set Text
                  </label>
                  <textarea
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    rows={12}
                    placeholder="Paste the full problem set here..."
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

              {createError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                  {createError}
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
                  onClick={handleCreateProblemSet}
                  disabled={creating}
                  className="text-white px-5 py-2.5 rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50 bg-[#800000]"
                >
                  {creating ? "Creating..." : "Create Problem Set"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
