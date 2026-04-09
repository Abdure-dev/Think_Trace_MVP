"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const MAROON = "#800000";
const PURPLE = "#4E2A84";
const GRAD = `linear-gradient(135deg, ${MAROON}, ${PURPLE})`;

const MODES = {
  deep_focus: {
    label: "Deep Focus",
    color: "#1e2a4a",
    desc: "No AI — pure independent thinking",
  },
  guided: { label: "Guided", color: MAROON, desc: "Socratic hints only" },
  open: { label: "Open", color: PURPLE, desc: "Full AI collaboration" },
};

const SUBJECTS = [
  "Algorithms",
  "Data Structures",
  "Linear Algebra",
  "Calculus",
  "Statistics",
  "Machine Learning",
  "Physics",
  "Chemistry",
  "Economics",
  "Philosophy",
  "Computer Systems",
  "Other",
];

const TERMS_QUARTER = ["Fall", "Winter", "Spring", "Summer"];
const TERMS_SEMESTER = ["Fall", "Spring", "Summer"];
const YEARS = [2023, 2024, 2025, 2026, 2027];

const EXTRACTION_STEPS = [
  { msg: "Uploading file to server...", pct: 8 },
  { msg: "Reading document structure...", pct: 18 },
  { msg: "Sending to Gemini AI...", pct: 30 },
  { msg: "Identifying problems...", pct: 45 },
  { msg: "Separating individual questions...", pct: 60 },
  { msg: "Converting math to LaTeX...", pct: 75 },
  { msg: "Processing sub-parts...", pct: 85 },
  { msg: "Validating extraction...", pct: 93 },
  { msg: "Almost done...", pct: 97 },
];

type Workspace = {
  id: string;
  title: string;
  mode: string;
  subject?: string;
  term_type?: string;
  term_name?: string;
  term_year?: number;
  created_at: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);

  // Filters
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterTerm, setFilterTerm] = useState("all");
  const [groupBy, setGroupBy] = useState<"subject" | "term" | "none">("none");

  // Workspace modal
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
  const [wsSubject, setWsSubject] = useState("");
  const [wsTermType, setWsTermType] = useState<"semester" | "quarter">(
    "semester"
  );
  const [wsTermName, setWsTermName] = useState("");
  const [wsTermYear, setWsTermYear] = useState<number>(2026);
  const [wsCreating, setWsCreating] = useState(false);
  const [wsError, setWsError] = useState("");

  // Extraction progress
  const [extracting, setExtracting] = useState(false);
  const [extractStep, setExtractStep] = useState("");
  const [extractPct, setExtractPct] = useState(0);
  const tickerRef = useRef<NodeJS.Timeout | null>(null);

  // Delete
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Join course
  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [joinSuccess, setJoinSuccess] = useState("");

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

  function startExtractionTicker() {
    let stepIdx = 0;
    let currentPct = 0;
    setExtractPct(0);
    setExtractStep(EXTRACTION_STEPS[0].msg);

    tickerRef.current = setInterval(() => {
      const step =
        EXTRACTION_STEPS[Math.min(stepIdx, EXTRACTION_STEPS.length - 1)];
      const target = step.pct;

      if (currentPct < target - 1) {
        currentPct += 1;
        setExtractPct(currentPct);
      } else if (stepIdx < EXTRACTION_STEPS.length - 1) {
        stepIdx++;
        setExtractStep(EXTRACTION_STEPS[stepIdx].msg);
      }
    }, 400);
  }

  function stopExtractionTicker(success: boolean, problemCount?: number) {
    if (tickerRef.current) clearInterval(tickerRef.current);
    if (success) {
      setExtractStep(
        `Done! Found ${problemCount} problem${problemCount !== 1 ? "s" : ""}`
      );
      setExtractPct(100);
    } else {
      setExtractStep("Extraction failed. Please try again.");
      setExtractPct(0);
    }
  }

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

    // Show extraction progress for PDF/image
    if (wsSourceType === "pdf" || wsSourceType === "image") {
      setShowModal(false);
      setExtracting(true);
      startExtractionTicker();
    }

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("title", wsTitle.trim());
      formData.append("mode", wsMode);
      formData.append("source_type", wsSourceType);
      if (wsSourceType === "text") formData.append("raw_text", wsText.trim());
      else if (wsFile) formData.append("file", wsFile);
      if (wsSubject) formData.append("subject", wsSubject);
      formData.append("term_type", wsTermType);
      if (wsTermName) formData.append("term_name", wsTermName);
      if (wsTermYear) formData.append("term_year", String(wsTermYear));

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

      if (wsSourceType === "pdf" || wsSourceType === "image") {
        stopExtractionTicker(true, data.problem_count);
        await new Promise((r) => setTimeout(r, 1200));
        setExtracting(false);
      }

      closeModal();
      router.push(`/workspaces/${data.workspace.id}`);
    } catch (err: any) {
      if (wsSourceType === "pdf" || wsSourceType === "image") {
        stopExtractionTicker(false);
        await new Promise((r) => setTimeout(r, 1500));
        setExtracting(false);
        setShowModal(true);
      }
      setWsError(err.message);
    } finally {
      setWsCreating(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(true);
    const token = localStorage.getItem("token");
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workspaces/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setWorkspaces((prev) => prev.filter((w) => w.id !== id));
    setDeleteId(null);
    setDeleting(false);
  }

  async function handleJoinCourse() {
    if (!joinCode.trim()) {
      setJoinError("Enter a course code.");
      return;
    }
    setJoining(true);
    setJoinError("");
    setJoinSuccess("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/courses/join`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code: joinCode.trim().toUpperCase() }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to join.");
      setJoinSuccess(`Successfully joined ${data.course.title}!`);
      setJoinCode("");
      const coursesRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/courses`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const coursesData = await coursesRes.json();
      setCourses(Array.isArray(coursesData) ? coursesData : []);
    } catch (err: any) {
      setJoinError(err.message);
    } finally {
      setJoining(false);
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
    setWsSubject("");
    setWsTermType("semester");
    setWsTermName("");
    setWsTermYear(2026);
  }

  function closeJoin() {
    setShowJoin(false);
    setJoinCode("");
    setJoinError("");
    setJoinSuccess("");
  }

  function getTermLabel(ws: Workspace) {
    if (!ws.term_name && !ws.term_year) return null;
    return `${ws.term_name || ""} ${ws.term_year || ""}`.trim();
  }

  const filteredWorkspaces = workspaces.filter((ws) => {
    if (filterSubject !== "all" && ws.subject !== filterSubject) return false;
    if (filterTerm !== "all" && getTermLabel(ws) !== filterTerm) return false;
    return true;
  });

  const allSubjects = [
    ...new Set(workspaces.map((w) => w.subject).filter(Boolean)),
  ] as string[];
  const allTerms = [
    ...new Set(workspaces.map((w) => getTermLabel(w)).filter(Boolean)),
  ] as string[];

  function groupWorkspaces(wsList: Workspace[]) {
    if (groupBy === "none") return { "All Workspaces": wsList };
    if (groupBy === "subject") {
      const groups: Record<string, Workspace[]> = {};
      wsList.forEach((ws) => {
        const key = ws.subject || "Uncategorized";
        if (!groups[key]) groups[key] = [];
        groups[key].push(ws);
      });
      return groups;
    }
    const groups: Record<string, Workspace[]> = {};
    wsList.forEach((ws) => {
      const key = getTermLabel(ws) || "No term";
      if (!groups[key]) groups[key] = [];
      groups[key].push(ws);
    });
    return groups;
  }

  const groupedWorkspaces = groupWorkspaces(filteredWorkspaces);

  return (
    <div
      className="min-h-screen flex"
      style={{ background: "#f8f9fc", fontFamily: "system-ui, sans-serif" }}
    >
      <style>{`
        .ws-card:hover { box-shadow: 0 8px 32px rgba(78,42,132,0.10); transform: translateY(-1px); }
        .ws-card { transition: all 0.2s; }
        .course-card:hover { box-shadow: 0 8px 32px rgba(128,0,0,0.08); transform: translateY(-1px); }
        .course-card { transition: all 0.2s; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Sidebar */}
      <div
        className="w-64 min-h-screen flex flex-col p-6"
        style={{
          background: `linear-gradient(180deg, ${PURPLE} 0%, #3a1a6a 100%)`,
        }}
      >
        <div className="flex items-center gap-3 mb-10">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: GRAD }}
          >
            <span
              style={{
                color: "white",
                fontWeight: 700,
                fontSize: "15px",
                fontFamily: "Georgia, serif",
              }}
            >
              T
            </span>
          </div>
          <span
            style={{
              color: "white",
              fontWeight: 700,
              fontSize: "17px",
              letterSpacing: "-0.02em",
            }}
          >
            ThinkTrace
          </span>
        </div>

        <nav className="flex flex-col gap-1">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 14px",
              borderRadius: "10px",
              background: "rgba(255,255,255,0.18)",
              color: "white",
              fontWeight: 600,
              fontSize: "14px",
            }}
          >
            Dashboard
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 14px",
              borderRadius: "10px",
              color: "rgba(200,180,255,0.8)",
              fontSize: "14px",
              cursor: "pointer",
            }}
            className="hover:bg-white hover:bg-opacity-10 transition"
          >
            Courses
          </div>
          {user?.role === "student" && (
            <div
              onClick={() => setShowJoin(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 14px",
                borderRadius: "10px",
                color: "rgba(200,180,255,0.8)",
                fontSize: "14px",
                cursor: "pointer",
              }}
              className="hover:bg-white hover:bg-opacity-10 transition"
            >
              Join a Course
            </div>
          )}
          <div
            onClick={() => setShowModal(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 14px",
              borderRadius: "10px",
              color: "rgba(200,180,255,0.8)",
              fontSize: "14px",
              cursor: "pointer",
            }}
            className="hover:bg-white hover:bg-opacity-10 transition"
          >
            My Workspaces
          </div>
        </nav>

        <div className="mt-auto">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 14px",
              borderRadius: "10px",
            }}
          >
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                background: GRAD,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "13px",
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {user?.first_name?.[0]}
            </div>
            <div>
              <p
                style={{
                  color: "white",
                  fontSize: "13px",
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                {user?.first_name} {user?.last_name}
              </p>
              <p
                style={{
                  color: "rgba(200,180,255,0.7)",
                  fontSize: "11px",
                  textTransform: "capitalize",
                  margin: 0,
                }}
              >
                {user?.role}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 p-10 overflow-y-auto">
        <div className="mb-8">
          <h1
            style={{
              fontSize: "26px",
              fontWeight: 700,
              color: "#1a1208",
              letterSpacing: "-0.02em",
              fontFamily: "Georgia, serif",
            }}
          >
            Welcome back, {user?.first_name}
          </h1>
          <p style={{ color: "#8a7a6a", marginTop: "4px", fontSize: "15px" }}>
            Your structured learning workspace
          </p>
        </div>

        {/* My Workspaces */}
        <div className="mb-12">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "16px",
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#1a1208",
                  margin: 0,
                }}
              >
                My Workspaces
              </h2>
              <p
                style={{ color: "#8a7a6a", fontSize: "13px", marginTop: "3px" }}
              >
                Organized by subject and term
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              style={{
                padding: "9px 18px",
                borderRadius: "10px",
                background: GRAD,
                color: "white",
                fontSize: "13px",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
              }}
            >
              + New Workspace
            </button>
          </div>

          {/* Filters */}
          {workspaces.length > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "16px",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{ fontSize: "12px", color: "#8a7a6a", fontWeight: 600 }}
              >
                Group by:
              </span>
              {(["none", "subject", "term"] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setGroupBy(g)}
                  style={{
                    padding: "5px 12px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: 600,
                    border: "none",
                    cursor: "pointer",
                    background: groupBy === g ? GRAD : "white",
                    color: groupBy === g ? "white" : "#5a4a3a",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  }}
                >
                  {g === "none" ? "None" : g === "subject" ? "Subject" : "Term"}
                </button>
              ))}
              {allSubjects.length > 0 && (
                <select
                  value={filterSubject}
                  onChange={(e) => setFilterSubject(e.target.value)}
                  style={{
                    fontSize: "12px",
                    border: "1px solid #e5e0d8",
                    borderRadius: "8px",
                    padding: "5px 10px",
                    color: "#5a4a3a",
                    background: "white",
                  }}
                >
                  <option value="all">All subjects</option>
                  {allSubjects.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              )}
              {allTerms.length > 0 && (
                <select
                  value={filterTerm}
                  onChange={(e) => setFilterTerm(e.target.value)}
                  style={{
                    fontSize: "12px",
                    border: "1px solid #e5e0d8",
                    borderRadius: "8px",
                    padding: "5px 10px",
                    color: "#5a4a3a",
                    background: "white",
                  }}
                >
                  <option value="all">All terms</option>
                  {allTerms.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {filteredWorkspaces.length === 0 ? (
            <div
              onClick={() => setShowModal(true)}
              style={{
                background: "white",
                borderRadius: "16px",
                padding: "40px",
                border: "2px dashed #e5e0d8",
                textAlign: "center",
                cursor: "pointer",
              }}
              className="hover:border-purple-200 transition"
            >
              <p
                style={{
                  color: "#8a7a6a",
                  fontSize: "14px",
                  marginBottom: "6px",
                }}
              >
                No workspaces yet
              </p>
              <p style={{ fontSize: "14px", fontWeight: 600, color: PURPLE }}>
                Create your first workspace →
              </p>
            </div>
          ) : (
            Object.entries(groupedWorkspaces).map(([group, wsList]) => (
              <div key={group} style={{ marginBottom: "24px" }}>
                {groupBy !== "none" && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      marginBottom: "12px",
                    }}
                  >
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: GRAD,
                      }}
                    />
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "#8a7a6a",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}
                    >
                      {group}
                    </span>
                    <div
                      style={{ flex: 1, height: "1px", background: "#f0ece6" }}
                    />
                    <span style={{ fontSize: "11px", color: "#8a7a6a" }}>
                      {wsList.length}
                    </span>
                  </div>
                )}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3,1fr)",
                    gap: "14px",
                  }}
                >
                  {wsList.map((ws) => {
                    const m =
                      MODES[ws.mode as keyof typeof MODES] || MODES.guided;
                    const termLabel = getTermLabel(ws);
                    return (
                      <div
                        key={ws.id}
                        className="ws-card"
                        style={{
                          background: "white",
                          borderRadius: "16px",
                          padding: "18px",
                          border: "1px solid rgba(26,18,8,0.06)",
                          position: "relative",
                        }}
                      >
                        <Link
                          href={`/workspaces/${ws.id}`}
                          style={{ textDecoration: "none", display: "block" }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              marginBottom: "10px",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                padding: "3px 10px",
                                borderRadius: "100px",
                                color: "white",
                                background: m.color,
                              }}
                            >
                              {m.label}
                            </span>
                            <span
                              style={{ color: "#d1d0cc", fontSize: "16px" }}
                            >
                              →
                            </span>
                          </div>
                          <h3
                            style={{
                              fontWeight: 700,
                              color: "#1a1208",
                              fontSize: "14px",
                              margin: "0 0 6px",
                            }}
                          >
                            {ws.title}
                          </h3>
                          <div
                            style={{
                              display: "flex",
                              gap: "5px",
                              flexWrap: "wrap",
                            }}
                          >
                            {ws.subject && (
                              <span
                                style={{
                                  fontSize: "11px",
                                  padding: "2px 8px",
                                  borderRadius: "6px",
                                  background: `${PURPLE}10`,
                                  color: PURPLE,
                                  fontWeight: 600,
                                }}
                              >
                                {ws.subject}
                              </span>
                            )}
                            {termLabel && (
                              <span
                                style={{
                                  fontSize: "11px",
                                  padding: "2px 8px",
                                  borderRadius: "6px",
                                  background: `${MAROON}10`,
                                  color: MAROON,
                                  fontWeight: 600,
                                }}
                              >
                                {termLabel}
                              </span>
                            )}
                          </div>
                        </Link>
                        <button
                          onClick={() => setDeleteId(ws.id)}
                          style={{
                            position: "absolute",
                            top: "10px",
                            right: "10px",
                            width: "22px",
                            height: "22px",
                            borderRadius: "50%",
                            background: "#f3f4f6",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "14px",
                            color: "#9ca3af",
                          }}
                          onMouseEnter={(e) => {
                            (e.target as HTMLElement).style.background =
                              "#fee2e2";
                            (e.target as HTMLElement).style.color = "#ef4444";
                          }}
                          onMouseLeave={(e) => {
                            (e.target as HTMLElement).style.background =
                              "#f3f4f6";
                            (e.target as HTMLElement).style.color = "#9ca3af";
                          }}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                  <div
                    onClick={() => setShowModal(true)}
                    style={{
                      background: "white",
                      borderRadius: "16px",
                      border: "2px dashed #e5e0d8",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: "100px",
                      cursor: "pointer",
                    }}
                    className="hover:border-purple-200 transition"
                  >
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: PURPLE,
                      }}
                    >
                      + New
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Courses */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "16px",
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#1a1208",
                  margin: 0,
                }}
              >
                {user?.role === "instructor"
                  ? "My Courses"
                  : "Enrolled Courses"}
              </h2>
              <p
                style={{ color: "#8a7a6a", fontSize: "13px", marginTop: "3px" }}
              >
                {user?.role === "instructor"
                  ? "Courses you teach"
                  : "Courses assigned by your instructors"}
              </p>
            </div>
            {user?.role === "instructor" && (
              <Link href="/courses/create">
                <button
                  style={{
                    padding: "9px 18px",
                    borderRadius: "10px",
                    background: GRAD,
                    color: "white",
                    fontSize: "13px",
                    fontWeight: 600,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  + New Course
                </button>
              </Link>
            )}
          </div>

          {courses.length === 0 ? (
            <div
              style={{
                background: "white",
                borderRadius: "16px",
                padding: "48px",
                border: "1px solid rgba(26,18,8,0.06)",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  color: "#8a7a6a",
                  fontSize: "14px",
                  marginBottom: "20px",
                }}
              >
                {user?.role === "instructor"
                  ? "No courses yet. Create your first course."
                  : "No courses yet. Enter a course code from your instructor."}
              </p>
              {user?.role === "instructor" ? (
                <Link href="/courses/create">
                  <button
                    style={{
                      padding: "10px 24px",
                      borderRadius: "10px",
                      background: GRAD,
                      color: "white",
                      fontSize: "13px",
                      fontWeight: 600,
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Create Course
                  </button>
                </Link>
              ) : (
                <button
                  onClick={() => setShowJoin(true)}
                  style={{
                    padding: "12px 28px",
                    borderRadius: "10px",
                    background: GRAD,
                    color: "white",
                    fontSize: "14px",
                    fontWeight: 600,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Join a Course
                </button>
              )}
            </div>
          ) : (
            <div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2,1fr)",
                  gap: "14px",
                }}
              >
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
                    <Link
                      key={id}
                      href={href}
                      style={{ textDecoration: "none" }}
                    >
                      <div
                        className="course-card"
                        style={{
                          background: "white",
                          borderRadius: "16px",
                          padding: "22px",
                          border: "1px solid rgba(26,18,8,0.06)",
                          cursor: "pointer",
                        }}
                      >
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "10px",
                            marginBottom: "14px",
                            background: `linear-gradient(135deg, ${MAROON}18, ${PURPLE}18)`,
                          }}
                        />
                        <h3
                          style={{
                            fontWeight: 700,
                            color: "#1a1208",
                            fontSize: "15px",
                            margin: "0 0 4px",
                          }}
                        >
                          {title}
                        </h3>
                        <p
                          style={{
                            color: "#8a7a6a",
                            fontSize: "13px",
                            margin: 0,
                          }}
                        >
                          {semester}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
              {user?.role === "student" && (
                <button
                  onClick={() => setShowJoin(true)}
                  style={{
                    marginTop: "12px",
                    width: "100%",
                    padding: "12px",
                    borderRadius: "12px",
                    border: "2px dashed #e5e0d8",
                    background: "transparent",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: PURPLE,
                    cursor: "pointer",
                  }}
                  className="hover:border-purple-300 transition"
                >
                  + Join another course
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Extraction Progress Overlay */}
      {extracting && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "440px",
              background: "white",
              borderRadius: "20px",
              padding: "36px",
              boxShadow: "0 24px 64px rgba(78,42,132,0.2)",
              animation: "fadeIn 0.3s ease",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                marginBottom: "28px",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: `${PURPLE}12`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    border: `3px solid ${PURPLE}`,
                    borderTopColor: "transparent",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
              </div>
              <div>
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "#1a1208",
                    margin: "0 0 3px",
                    fontFamily: "Georgia, serif",
                  }}
                >
                  Extracting Problems
                </h3>
                <p style={{ fontSize: "13px", color: "#8a7a6a", margin: 0 }}>
                  ThinkTrace AI is reading your document
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ marginBottom: "16px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "8px",
                }}
              >
                <span
                  style={{
                    fontSize: "13px",
                    color: "#5a4a3a",
                    fontWeight: 500,
                  }}
                >
                  {extractStep}
                </span>
                <span
                  style={{ fontSize: "13px", fontWeight: 700, color: PURPLE }}
                >
                  {extractPct}%
                </span>
              </div>
              <div
                style={{
                  height: "6px",
                  background: "#f0ece6",
                  borderRadius: "3px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    borderRadius: "3px",
                    background: GRAD,
                    width: `${extractPct}%`,
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
            </div>

            {/* Step indicators */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "6px" }}
            >
              {EXTRACTION_STEPS.slice(0, 6).map((step, i) => {
                const done = extractPct >= step.pct;
                const active = extractStep === step.msg;
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      opacity: done || active ? 1 : 0.35,
                      transition: "opacity 0.3s",
                    }}
                  >
                    <div
                      style={{
                        width: "18px",
                        height: "18px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "10px",
                        fontWeight: 700,
                        flexShrink: 0,
                        background: done
                          ? GRAD
                          : active
                          ? `${PURPLE}15`
                          : "#f0ece6",
                        color: done ? "white" : active ? PURPLE : "#8a7a6a",
                      }}
                    >
                      {done ? "✓" : i + 1}
                    </div>
                    <span
                      style={{
                        fontSize: "12px",
                        color: done ? "#1a1208" : active ? PURPLE : "#8a7a6a",
                        fontWeight: active ? 600 : 400,
                      }}
                    >
                      {step.msg}
                    </span>
                  </div>
                );
              })}
            </div>

            <p
              style={{
                fontSize: "12px",
                color: "#8a7a6a",
                textAlign: "center",
                marginTop: "20px",
              }}
            >
              This may take 15-30 seconds for large PDFs
            </p>
          </div>
        </div>
      )}

      {/* Create Workspace Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "520px",
              background: "white",
              borderRadius: "20px",
              padding: "28px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 24px 64px rgba(78,42,132,0.15)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                marginBottom: "24px",
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: "20px",
                    fontWeight: 700,
                    color: "#1a1208",
                    margin: 0,
                    fontFamily: "Georgia, serif",
                  }}
                >
                  New Workspace
                </h3>
                <p
                  style={{
                    color: "#8a7a6a",
                    fontSize: "14px",
                    marginTop: "4px",
                  }}
                >
                  Your thinking, your rules.
                </p>
              </div>
              <button
                onClick={closeModal}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "22px",
                  color: "#9ca3af",
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {/* Title */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#374151",
                    marginBottom: "6px",
                  }}
                >
                  Title
                </label>
                <input
                  type="text"
                  value={wsTitle}
                  onChange={(e) => setWsTitle(e.target.value)}
                  placeholder="e.g. Algorithms exam prep"
                  style={{
                    width: "100%",
                    border: "1px solid #e5e0d8",
                    borderRadius: "10px",
                    padding: "10px 14px",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Subject */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#374151",
                    marginBottom: "6px",
                  }}
                >
                  Subject
                </label>
                <select
                  value={wsSubject}
                  onChange={(e) => setWsSubject(e.target.value)}
                  style={{
                    width: "100%",
                    border: "1px solid #e5e0d8",
                    borderRadius: "10px",
                    padding: "10px 14px",
                    fontSize: "14px",
                    background: "white",
                    outline: "none",
                  }}
                >
                  <option value="">Select subject (optional)</option>
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Term */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "8px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#374151",
                      marginBottom: "6px",
                    }}
                  >
                    Type
                  </label>
                  <select
                    value={wsTermType}
                    onChange={(e) => setWsTermType(e.target.value as any)}
                    style={{
                      width: "100%",
                      border: "1px solid #e5e0d8",
                      borderRadius: "10px",
                      padding: "10px 10px",
                      fontSize: "13px",
                      background: "white",
                      outline: "none",
                    }}
                  >
                    <option value="semester">Semester</option>
                    <option value="quarter">Quarter</option>
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#374151",
                      marginBottom: "6px",
                    }}
                  >
                    Term
                  </label>
                  <select
                    value={wsTermName}
                    onChange={(e) => setWsTermName(e.target.value)}
                    style={{
                      width: "100%",
                      border: "1px solid #e5e0d8",
                      borderRadius: "10px",
                      padding: "10px 10px",
                      fontSize: "13px",
                      background: "white",
                      outline: "none",
                    }}
                  >
                    <option value="">Select</option>
                    {(wsTermType === "quarter"
                      ? TERMS_QUARTER
                      : TERMS_SEMESTER
                    ).map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#374151",
                      marginBottom: "6px",
                    }}
                  >
                    Year
                  </label>
                  <select
                    value={wsTermYear}
                    onChange={(e) => setWsTermYear(Number(e.target.value))}
                    style={{
                      width: "100%",
                      border: "1px solid #e5e0d8",
                      borderRadius: "10px",
                      padding: "10px 10px",
                      fontSize: "13px",
                      background: "white",
                      outline: "none",
                    }}
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Mode */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#374151",
                    marginBottom: "8px",
                  }}
                >
                  Mode
                </label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3,1fr)",
                    gap: "8px",
                  }}
                >
                  {(
                    Object.entries(MODES) as [
                      string,
                      (typeof MODES)[keyof typeof MODES]
                    ][]
                  ).map(([key, val]) => (
                    <button
                      key={key}
                      onClick={() => setWsMode(key as any)}
                      style={{
                        padding: "12px",
                        borderRadius: "10px",
                        border: `1.5px solid ${
                          wsMode === key ? val.color : "#e5e0d8"
                        }`,
                        background: wsMode === key ? `${val.color}0d` : "white",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          color: val.color,
                          margin: "0 0 2px",
                        }}
                      >
                        {val.label}
                      </p>
                      <p
                        style={{
                          fontSize: "11px",
                          color: "#8a7a6a",
                          margin: 0,
                        }}
                      >
                        {val.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#374151",
                    marginBottom: "8px",
                  }}
                >
                  Content
                </label>
                <div
                  style={{ display: "flex", gap: "6px", marginBottom: "10px" }}
                >
                  {(["text", "pdf", "image"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setWsSourceType(t);
                        setWsFile(null);
                        setWsText("");
                      }}
                      style={{
                        padding: "6px 14px",
                        borderRadius: "8px",
                        border: "none",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        background: wsSourceType === t ? GRAD : "#f3f4f6",
                        color: wsSourceType === t ? "white" : "#374151",
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
                    rows={5}
                    placeholder="Paste your notes, problems, or any content to work through..."
                    style={{
                      width: "100%",
                      border: "1px solid #e5e0d8",
                      borderRadius: "10px",
                      padding: "12px 14px",
                      fontSize: "13px",
                      resize: "none",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                )}

                {wsSourceType === "pdf" && (
                  <div
                    onClick={() =>
                      document.getElementById("ws-pdf-input")?.click()
                    }
                    style={{
                      border: "2px dashed #e5e0d8",
                      borderRadius: "12px",
                      padding: "24px",
                      textAlign: "center",
                      cursor: "pointer",
                      transition: "border-color 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.borderColor = PURPLE)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.borderColor = "#e5e0d8")
                    }
                  >
                    <input
                      id="ws-pdf-input"
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => setWsFile(e.target.files?.[0] || null)}
                      style={{ display: "none" }}
                    />
                    {wsFile ? (
                      <div>
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "8px",
                            background: `${PURPLE}12`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto 8px",
                            fontSize: "18px",
                          }}
                        >
                          📄
                        </div>
                        <p
                          style={{
                            fontWeight: 600,
                            color: "#1a1208",
                            fontSize: "14px",
                            margin: "0 0 3px",
                          }}
                        >
                          {wsFile.name}
                        </p>
                        <p
                          style={{
                            color: "#8a7a6a",
                            fontSize: "12px",
                            margin: 0,
                          }}
                        >
                          {(wsFile.size / 1024).toFixed(0)} KB · Click to change
                        </p>
                      </div>
                    ) : (
                      <div>
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "8px",
                            background: "#f3f4f6",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto 8px",
                            fontSize: "18px",
                          }}
                        >
                          📎
                        </div>
                        <p
                          style={{
                            fontWeight: 600,
                            color: "#374151",
                            fontSize: "14px",
                            margin: "0 0 3px",
                          }}
                        >
                          Click to upload PDF
                        </p>
                        <p
                          style={{
                            color: "#8a7a6a",
                            fontSize: "12px",
                            margin: 0,
                          }}
                        >
                          Assignment, problem set, or homework
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {wsSourceType === "image" && (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setWsFile(e.target.files?.[0] || null)}
                    style={{
                      width: "100%",
                      border: "1px solid #e5e0d8",
                      borderRadius: "10px",
                      padding: "10px 14px",
                      fontSize: "13px",
                      background: "white",
                    }}
                  />
                )}

                {(wsSourceType === "pdf" || wsSourceType === "image") &&
                  wsFile && (
                    <div
                      style={{
                        marginTop: "10px",
                        background: `${PURPLE}06`,
                        border: `1px solid ${PURPLE}20`,
                        borderRadius: "8px",
                        padding: "10px 12px",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "12px",
                          color: PURPLE,
                          margin: 0,
                          fontWeight: 500,
                        }}
                      >
                        ThinkTrace AI will read this file and extract each
                        problem separately. This takes 15-30 seconds.
                      </p>
                    </div>
                  )}
              </div>

              {wsError && (
                <p
                  style={{
                    fontSize: "13px",
                    color: "#dc2626",
                    background: "#fef2f2",
                    padding: "10px 14px",
                    borderRadius: "8px",
                  }}
                >
                  {wsError}
                </p>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  paddingTop: "4px",
                }}
              >
                <button
                  onClick={closeModal}
                  style={{
                    padding: "10px 18px",
                    borderRadius: "10px",
                    border: "1px solid #e5e0d8",
                    background: "white",
                    color: "#374151",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateWorkspace}
                  disabled={wsCreating}
                  style={{
                    padding: "10px 22px",
                    borderRadius: "10px",
                    background: GRAD,
                    color: "white",
                    fontSize: "13px",
                    fontWeight: 600,
                    border: "none",
                    cursor: "pointer",
                    opacity: wsCreating ? 0.5 : 1,
                  }}
                >
                  {wsCreating
                    ? "Creating..."
                    : wsSourceType === "pdf" || wsSourceType === "image"
                    ? "Extract & Create →"
                    : "Create Workspace"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "400px",
              background: "white",
              borderRadius: "20px",
              padding: "28px",
              boxShadow: "0 24px 64px rgba(0,0,0,0.12)",
            }}
          >
            <h3
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: "#1a1208",
                margin: "0 0 8px",
                fontFamily: "Georgia, serif",
              }}
            >
              Delete workspace?
            </h3>
            <p
              style={{
                color: "#8a7a6a",
                fontSize: "14px",
                marginBottom: "24px",
                lineHeight: 1.6,
              }}
            >
              This will permanently delete all problems and reasoning traces.
              This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setDeleteId(null)}
                style={{
                  flex: 1,
                  padding: "11px",
                  borderRadius: "10px",
                  border: "1px solid #e5e0d8",
                  background: "white",
                  color: "#374151",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                disabled={deleting}
                style={{
                  flex: 1,
                  padding: "11px",
                  borderRadius: "10px",
                  background: "#dc2626",
                  color: "white",
                  fontSize: "14px",
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  opacity: deleting ? 0.6 : 1,
                }}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Course Modal */}
      {showJoin && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "380px",
              background: "white",
              borderRadius: "20px",
              padding: "28px",
              boxShadow: "0 24px 64px rgba(78,42,132,0.15)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                marginBottom: "24px",
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: "20px",
                    fontWeight: 700,
                    color: "#1a1208",
                    margin: 0,
                    fontFamily: "Georgia, serif",
                  }}
                >
                  Join a Course
                </h3>
                <p
                  style={{
                    color: "#8a7a6a",
                    fontSize: "14px",
                    marginTop: "4px",
                  }}
                >
                  Enter the code from your instructor
                </p>
              </div>
              <button
                onClick={closeJoin}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "22px",
                  color: "#9ca3af",
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>

            {joinSuccess ? (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <div
                  style={{
                    width: "52px",
                    height: "52px",
                    borderRadius: "50%",
                    background: "#f0fdf4",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 12px",
                  }}
                >
                  <span style={{ color: "#16a34a", fontSize: "22px" }}>✓</span>
                </div>
                <p
                  style={{
                    fontWeight: 600,
                    color: "#1a1208",
                    marginBottom: "16px",
                  }}
                >
                  {joinSuccess}
                </p>
                <button
                  onClick={closeJoin}
                  style={{
                    padding: "10px 24px",
                    borderRadius: "10px",
                    background: GRAD,
                    color: "white",
                    fontSize: "14px",
                    fontWeight: 600,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="A1B2C3"
                  maxLength={6}
                  style={{
                    width: "100%",
                    border: "1.5px solid #e5e0d8",
                    borderRadius: "12px",
                    padding: "14px",
                    textAlign: "center",
                    fontSize: "26px",
                    fontWeight: 700,
                    letterSpacing: "0.15em",
                    color: PURPLE,
                    fontFamily: "monospace",
                    outline: "none",
                    marginBottom: "12px",
                    boxSizing: "border-box",
                  }}
                />
                {joinError && (
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#dc2626",
                      background: "#fef2f2",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      marginBottom: "12px",
                    }}
                  >
                    {joinError}
                  </p>
                )}
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={closeJoin}
                    style={{
                      flex: 1,
                      padding: "11px",
                      borderRadius: "10px",
                      border: "1px solid #e5e0d8",
                      background: "white",
                      color: "#374151",
                      fontSize: "14px",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleJoinCourse}
                    disabled={joining || joinCode.length !== 6}
                    style={{
                      flex: 1,
                      padding: "11px",
                      borderRadius: "10px",
                      background: GRAD,
                      color: "white",
                      fontSize: "14px",
                      fontWeight: 600,
                      border: "none",
                      cursor: "pointer",
                      opacity: joining || joinCode.length !== 6 ? 0.5 : 1,
                    }}
                  >
                    {joining ? "Joining..." : "Join"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
