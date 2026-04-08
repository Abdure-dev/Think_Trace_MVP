"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const MODES = {
  deep_focus: {
    label: "Deep Focus",
    color: "#1e2a4a",
    desc: "No AI — pure independent thinking",
  },
  guided: { label: "Guided", color: "#800000", desc: "Socratic hints only" },
  open: { label: "Open", color: "#2d6a4f", desc: "Full AI collaboration" },
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [courses, setCourses] = useState([]);
  const [workspaces, setWorkspaces] = useState<any[]>([]);

  // Workspace modal state
  const [showModal, setShowModal] = useState(false);
  const [wsTitle, setWsTitle] = useState("");
  const [wsMode, setWsMode] = useState<"deep_focus" | "guided" | "open">(
    "guided"
  );
  const [wsSourceType, setWsSourceType] = useState<"text" | "pdf" | "image">(
    "text"
  );
  const [wsText, setWsText] = useState("");
  const [wsFile, setWsFile] = useState<File | null>(null);
  const [wsCreating, setWsCreating] = useState(false);
  const [wsError, setWsError] = useState("");

  useEffect(() => {
    async function fetchData() {
      if (typeof window === "undefined") return;
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      const [meRes, wsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/me`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/workspaces`, { headers }),
      ]);

      const userData = await meRes.json();
      setUser(userData);
      const wsData = await wsRes.json();
      setWorkspaces(Array.isArray(wsData) ? wsData : []);

      const coursesRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/${
          userData.role === "instructor" ? "instructor/courses" : "courses"
        }`,
        { headers }
      );
      const coursesData = await coursesRes.json();
      setCourses(Array.isArray(coursesData) ? coursesData : []);
    }
    fetchData();
  }, []);

  async function handleCreateWorkspace() {
    if (!wsTitle.trim()) {
      setWsError("Title is required.");
      return;
    }
    if (wsSourceType === "text" && !wsText.trim()) {
      setWsError("Please enter some content.");
      return;
    }
    if ((wsSourceType === "pdf" || wsSourceType === "image") && !wsFile) {
      setWsError("Please upload a file.");
      return;
    }

    setWsCreating(true);
    setWsError("");
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("title", wsTitle.trim());
      formData.append("mode", wsMode);
      formData.append("source_type", wsSourceType);
      if (wsSourceType === "text") formData.append("raw_text", wsText.trim());
      else if (wsFile) formData.append("file", wsFile);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workspaces`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to create workspace.");
      }

      const data = await res.json();
      closeModal();
      router.push(`/workspaces/${data.workspace.id}`);
    } catch (err: any) {
      setWsError(err.message);
    } finally {
      setWsCreating(false);
    }
  }

  function closeModal() {
    setShowModal(false);
    setWsTitle("");
    setWsMode("guided");
    setWsSourceType("text");
    setWsText("");
    setWsFile(null);
    setWsError("");
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#f8f9fc" }}>
      {/* Sidebar */}
      <div
        className="w-64 min-h-screen flex flex-col p-6"
        style={{ backgroundColor: "#5c0000" }}
      >
        <div className="flex items-center gap-3 mb-10">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white">
            <span className="font-bold text-sm" style={{ color: "#800000" }}>
              T
            </span>
          </div>
          <span className="text-white font-bold text-lg">ThinkTrace</span>
        </div>
        <nav className="flex flex-col gap-2">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white bg-opacity-20 text-white font-medium">
            <span>Dashboard</span>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-200 hover:bg-white hover:bg-opacity-10 cursor-pointer transition">
            <span>Courses</span>
          </div>
          <div
            onClick={() => setShowModal(true)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-200 hover:bg-white hover:bg-opacity-10 cursor-pointer transition"
          >
            <span>My Workspaces</span>
          </div>
        </nav>
        <div className="mt-auto">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-200">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ backgroundColor: "#800000" }}
            >
              {user?.first_name?.[0]}
            </div>
            <div>
              <p className="text-white text-sm font-medium">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-red-300 text-xs capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-10 overflow-y-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">
            Welcome back, {user?.first_name}
          </h1>
          <p className="text-gray-400 mt-1">Your learning workspace</p>
        </div>

        {/* My Workspaces */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-800">My Workspaces</h2>
              <p className="text-gray-400 text-sm mt-0.5">
                Personal reasoning spaces — your thinking, your rules
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition"
              style={{ backgroundColor: "#800000" }}
            >
              + New Workspace
            </button>
          </div>

          {workspaces.length === 0 ? (
            <div
              onClick={() => setShowModal(true)}
              className="bg-white rounded-2xl p-8 border-2 border-dashed border-gray-200 text-center cursor-pointer hover:border-red-200 transition"
            >
              <p className="text-gray-400 text-sm mb-1">
                No personal workspaces yet
              </p>
              <p className="text-sm font-medium" style={{ color: "#800000" }}>
                Create your first workspace →
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {workspaces.map((ws: any) => {
                const m = MODES[ws.mode as keyof typeof MODES];
                return (
                  <Link key={ws.id} href={`/workspaces/${ws.id}`}>
                    <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition cursor-pointer border border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className="text-xs font-semibold px-2.5 py-1 rounded-full text-white"
                          style={{ backgroundColor: m.color }}
                        >
                          {m.label}
                        </span>
                        <span className="text-gray-300 text-lg">→</span>
                      </div>
                      <h3 className="font-bold text-gray-800 text-sm">
                        {ws.title}
                      </h3>
                      <p className="text-gray-400 text-xs mt-1">{m.desc}</p>
                    </div>
                  </Link>
                );
              })}
              <div
                onClick={() => setShowModal(true)}
                className="bg-white rounded-2xl p-5 border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-red-200 transition"
              >
                <span
                  className="text-sm font-medium"
                  style={{ color: "#800000" }}
                >
                  + New
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Courses */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                {user?.role === "instructor"
                  ? "My Courses"
                  : "Enrolled Courses"}
              </h2>
              <p className="text-gray-400 text-sm mt-0.5">
                {user?.role === "instructor"
                  ? "Courses you teach"
                  : "Courses assigned by your instructors"}
              </p>
            </div>
            {user?.role === "instructor" && (
              <Link href="/courses/create">
                <button
                  className="px-4 py-2 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition"
                  style={{ backgroundColor: "#800000" }}
                >
                  + New Course
                </button>
              </Link>
            )}
          </div>

          {courses.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 border border-gray-100 text-center">
              <p className="text-gray-400 text-sm mb-4">
                {user?.role === "instructor"
                  ? "No courses yet. Create your first course."
                  : "No courses yet. Ask your instructor for a course code."}
              </p>
              {user?.role === "instructor" && (
                <Link href="/courses/create">
                  <button
                    className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition"
                    style={{ backgroundColor: "#800000" }}
                  >
                    Create Course
                  </button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {courses.map((item: any) => {
                const isInstructor = user?.role === "instructor";
                const id = isInstructor ? item.id : item.course_id;
                const title = isInstructor ? item.title : item.Courses?.title;
                const semester = isInstructor
                  ? item.semester
                  : item.Courses?.semester;
                const href = isInstructor
                  ? `/instructor/courses/${id}`
                  : `/courses/${id}`;
                return (
                  <Link key={id} href={href}>
                    <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition cursor-pointer border border-gray-100">
                      <div
                        className="w-10 h-10 rounded-xl mb-4"
                        style={{ backgroundColor: "#f5e6e6" }}
                      />
                      <h3 className="font-bold text-gray-800">{title}</h3>
                      <p className="text-gray-400 text-sm mt-1">{semester}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create Workspace Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center px-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  New Personal Workspace
                </h3>
                <p className="text-gray-400 text-sm mt-1">
                  Your thinking, your rules.
                </p>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={wsTitle}
                  onChange={(e) => setWsTitle(e.target.value)}
                  placeholder="e.g. Algorithms exam prep"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#800000]"
                />
              </div>

              {/* Mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    Object.entries(MODES) as [
                      string,
                      (typeof MODES)[keyof typeof MODES]
                    ][]
                  ).map(([key, val]) => (
                    <button
                      key={key}
                      onClick={() => setWsMode(key as any)}
                      className="p-3 rounded-xl border text-left transition"
                      style={{
                        borderColor: wsMode === key ? val.color : "#e5e7eb",
                        background: wsMode === key ? `${val.color}10` : "white",
                      }}
                    >
                      <p
                        className="text-xs font-bold"
                        style={{ color: val.color }}
                      >
                        {val.label}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 leading-tight">
                        {val.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Source type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <div className="flex gap-2 mb-3">
                  {(["text", "pdf", "image"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setWsSourceType(t);
                        setWsFile(null);
                        setWsText("");
                      }}
                      className="px-3 py-1.5 rounded-lg border text-xs font-medium transition"
                      style={{
                        background: wsSourceType === t ? "#800000" : "white",
                        color: wsSourceType === t ? "white" : "#374151",
                        borderColor: wsSourceType === t ? "#800000" : "#d1d5db",
                      }}
                    >
                      {t === "text"
                        ? "Paste text"
                        : t === "pdf"
                        ? "Upload PDF"
                        : "Upload image"}
                    </button>
                  ))}
                </div>

                {wsSourceType === "text" && (
                  <textarea
                    value={wsText}
                    onChange={(e) => setWsText(e.target.value)}
                    rows={6}
                    placeholder="Paste your notes, problems, or any content to work through..."
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#800000]"
                  />
                )}
                {(wsSourceType === "pdf" || wsSourceType === "image") && (
                  <input
                    type="file"
                    accept={
                      wsSourceType === "pdf" ? "application/pdf" : "image/*"
                    }
                    onChange={(e) => setWsFile(e.target.files?.[0] || null)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm bg-white"
                  />
                )}
              </div>

              {wsError && (
                <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">
                  {wsError}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={closeModal}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateWorkspace}
                  disabled={wsCreating}
                  className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
                  style={{ backgroundColor: "#800000" }}
                >
                  {wsCreating ? "Creating..." : "Create Workspace"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
