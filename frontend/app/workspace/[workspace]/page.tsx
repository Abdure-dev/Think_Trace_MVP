"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

const MODES = {
  deep_focus: { label: "Deep Focus", color: "#1e2a4a" },
  guided: { label: "Guided", color: "#800000" },
  open: { label: "Open", color: "#2d6a4f" },
};

type Problem = {
  id: string;
  problem_number: number;
  problem_text: string;
};

type Workspace = {
  id: string;
  title: string;
  mode: string;
  created_at: string;
  problems: Problem[];
};

export default function WorkspacePage() {
  const router = useRouter();
  const params = useParams();
  const workspace_id = params.workspace_id as string;

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const sortedProblems = useMemo(() => {
    if (!workspace?.problems) return [];
    return [...workspace.problems].sort(
      (a, b) => a.problem_number - b.problem_number
    );
  }, [workspace]);

  useEffect(() => {
    async function fetch_() {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/workspaces/${workspace_id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        setError("Workspace not found.");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setWorkspace(data);
      setLoading(false);
    }
    fetch_();
  }, [workspace_id]);

  if (loading)
    return (
      <div className="min-h-screen bg-[#f8f9fc] p-10 text-gray-500">
        Loading workspace...
      </div>
    );
  if (error)
    return (
      <div className="min-h-screen bg-[#f8f9fc] p-10 text-red-500">{error}</div>
    );

  const mode = MODES[workspace?.mode as keyof typeof MODES] || MODES.guided;

  function previewText(text: string, max = 160) {
    return text.length > max ? text.slice(0, max) + "..." : text;
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
        <span
          className="text-xs font-semibold px-3 py-1 rounded-full text-white"
          style={{ backgroundColor: mode.color }}
        >
          {mode.label} mode
        </span>
      </div>

      <div className="p-10">
        <div className="mb-8">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm text-gray-400 hover:text-gray-600 transition"
          >
            ← Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-800 mt-3">
            {workspace?.title}
          </h1>
          <p className="text-gray-400 mt-1">
            {sortedProblems.length} problem
            {sortedProblems.length !== 1 ? "s" : ""} — work through each one at
            your own pace
          </p>
        </div>

        {sortedProblems.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 border border-gray-100 text-center">
            <p className="text-gray-400">
              No problems extracted. Try creating a new workspace.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {sortedProblems.map((problem) => (
              <Link
                key={problem.id}
                href={`/workspace-problems/${problem.id}?mode=${workspace?.mode}`}
                className="block"
              >
                <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition cursor-pointer border border-gray-100 h-full">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-800">
                      Problem {problem.problem_number}
                    </h3>
                    <span
                      className="text-xs px-3 py-1 rounded-full font-medium text-white"
                      style={{ backgroundColor: mode.color }}
                    >
                      Start
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm leading-6">
                    {previewText(problem.problem_text)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
