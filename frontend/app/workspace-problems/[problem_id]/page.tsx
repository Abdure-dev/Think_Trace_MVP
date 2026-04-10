"use client";

import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { InlineMath, BlockMath } from "react-katex";
import MathInput from "@/components/MathInput";

const MAROON = "#800000";
const PURPLE = "#4E2A84";
const GRAD = `linear-gradient(135deg, ${MAROON}, ${PURPLE})`;

type Part = {
  id: string;
  part_label: string;
  part_text: string;
  part_number: number;
};

type Problem = {
  id: string;
  workspace_id: string;
  problem_number: number;
  problem_text: string;
  parts: Part[];
  sibling_traces?: SiblingTrace[];
};

type SiblingTrace = {
  problem_id: string;
  problem_number: number;
  problem_text: string;
  traces: TraceRecord[];
};

type TraceRecord = {
  id: string;
  stage: string;
  content: string;
  created_at: string;
};

type ConversationMessage = {
  role: string;
  content: string;
  stage: string;
};

type SummaryData = {
  stage_insights: Record<string, string>;
  key_insight: string;
  strongest_stage: string;
  weakest_stage: string;
  growth_note: string;
  overall_score: number;
};

const MODES = {
  deep_focus: { label: "Deep Focus", color: "#1e2a4a" },
  guided: { label: "Guided", color: MAROON },
  open: { label: "Open", color: PURPLE },
};

const STAGE_OBJECTIVES: Record<string, string> = {
  understand:
    "Restate the problem in your own words. Identify what is given, what you need to find, and any constraints. Do NOT solve yet.",
  concept:
    "Identify the core concepts, theorems, or techniques that apply. Explain WHY each one is relevant.",
  plan: "Write a numbered step-by-step plan for how you will solve this. Be specific. Do NOT start solving yet.",
  attempt:
    "Execute your plan step by step. Show ALL your work. Explain every step. Do not skip anything.",
  critique:
    "Examine your solution critically. What could go wrong? What edge cases exist? Is there a better approach?",
  reflection:
    "What did you learn? What is the key insight? How does this connect to what you already know?",
};

const STAGE_COLORS: Record<
  string,
  { bg: string; border: string; label: string }
> = {
  understand: { bg: "#eff6ff", border: "#bfdbfe", label: "Understand" },
  concept: { bg: "#f0fdf4", border: "#bbf7d0", label: "Concept" },
  plan: { bg: "#fffbeb", border: "#fde68a", label: "Plan" },
  attempt: { bg: "#faf5ff", border: "#e9d5ff", label: "Attempt" },
  critique: { bg: "#fff7ed", border: "#fed7aa", label: "Critique" },
  reflection: { bg: "#fdf4ff", border: "#f0abfc", label: "Reflect" },
};
function renderMath(text: string) {
  const cleaned = (text || "").replace(/\\\\/g, "\\");
  return cleaned.split(/(\$\$[\s\S]+?\$\$|\$[^$]+?\$)/).map((part, i) => {
    if (part.startsWith("$$"))
      return <BlockMath key={i} math={part.slice(2, -2)} />;
    if (part.startsWith("$"))
      return <InlineMath key={i} math={part.slice(1, -1)} />;
    return <span key={i}>{part}</span>;
  });
}

function SummaryCard({
  summary,
  problem,
  onDownload,
  downloading,
}: {
  summary: SummaryData;
  problem: Problem;
  onDownload: () => void;
  downloading: boolean;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const stages = [
    "understand",
    "concept",
    "plan",
    "attempt",
    "critique",
    "reflection",
  ];
  const score = summary.overall_score || 0;

  return (
    <div
      style={{
        background: "white",
        borderRadius: "20px",
        border: "1px solid rgba(26,18,8,0.06)",
        overflow: "hidden",
        marginTop: "24px",
      }}
    >
      {/* Header */}
      <div style={{ background: GRAD, padding: "28px 28px 24px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <div>
            <p
              style={{
                color: "rgba(255,255,255,0.65)",
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                margin: "0 0 6px",
              }}
            >
              Problem {problem.problem_number} Complete
            </p>
            <h2
              style={{
                color: "white",
                fontSize: "22px",
                fontWeight: 700,
                margin: "0 0 4px",
                fontFamily: "Georgia, serif",
              }}
            >
              Reasoning Summary
            </h2>
            <p
              style={{
                color: "rgba(255,255,255,0.65)",
                fontSize: "13px",
                margin: 0,
              }}
            >
              Your ThinkTrace AI analysis
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                color: "white",
                fontSize: "40px",
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              {score}
              <span style={{ fontSize: "18px", opacity: 0.5 }}>/10</span>
            </div>
            <p
              style={{
                color: "rgba(255,255,255,0.55)",
                fontSize: "11px",
                margin: "4px 0 0",
              }}
            >
              Reasoning depth
            </p>
          </div>
        </div>
        <div
          style={{
            marginTop: "16px",
            height: "4px",
            background: "rgba(255,255,255,0.2)",
            borderRadius: "2px",
          }}
        >
          <div
            style={{
              height: "100%",
              background: "white",
              borderRadius: "2px",
              width: `${score * 10}%`,
              transition: "width 1s ease",
            }}
          />
        </div>
      </div>

      <div style={{ padding: "24px 28px" }}>
        {/* Key insight */}
        <div
          style={{
            background: `linear-gradient(135deg, ${MAROON}08, ${PURPLE}08)`,
            border: `1px solid ${PURPLE}20`,
            borderRadius: "12px",
            padding: "16px",
            marginBottom: "20px",
          }}
        >
          <p
            style={{
              fontSize: "10px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: PURPLE,
              margin: "0 0 8px",
            }}
          >
            Key Insight
          </p>
          <p
            style={{
              color: "#1a1208",
              fontWeight: 500,
              lineHeight: 1.6,
              margin: 0,
              fontSize: "15px",
            }}
          >
            {summary.key_insight}
          </p>
        </div>

        {/* Strongest / weakest */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: "12px",
              padding: "12px 14px",
            }}
          >
            <p
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "#16a34a",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                margin: "0 0 4px",
              }}
            >
              Strongest stage
            </p>
            <p
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "#166534",
                textTransform: "capitalize",
                margin: 0,
              }}
            >
              {summary.strongest_stage}
            </p>
          </div>
          <div
            style={{
              background: "#fff7ed",
              border: "1px solid #fed7aa",
              borderRadius: "12px",
              padding: "12px 14px",
            }}
          >
            <p
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "#d97706",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                margin: "0 0 4px",
              }}
            >
              Focus area
            </p>
            <p
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "#92400e",
                textTransform: "capitalize",
                margin: 0,
              }}
            >
              {summary.weakest_stage}
            </p>
          </div>
        </div>

        {/* Stage breakdown */}
        <p
          style={{
            fontSize: "13px",
            fontWeight: 700,
            color: "#374151",
            margin: "0 0 10px",
          }}
        >
          Stage-by-stage analysis
        </p>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            marginBottom: "20px",
          }}
        >
          {stages.map((s) => {
            const insight = summary.stage_insights?.[s];
            if (!insight) return null;
            const cfg = STAGE_COLORS[s];
            return (
              <div
                key={s}
                style={{
                  borderRadius: "10px",
                  border: `1px solid ${cfg.border}`,
                  overflow: "hidden",
                }}
              >
                <button
                  onClick={() => setExpanded(expanded === s ? null : s)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: cfg.bg,
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "#1a1208",
                      }}
                    >
                      {cfg.label}
                    </span>
                    {s === summary.strongest_stage && (
                      <span
                        style={{
                          fontSize: "10px",
                          padding: "2px 8px",
                          borderRadius: "100px",
                          background: "#dcfce7",
                          color: "#16a34a",
                          fontWeight: 700,
                        }}
                      >
                        strongest
                      </span>
                    )}
                    {s === summary.weakest_stage && (
                      <span
                        style={{
                          fontSize: "10px",
                          padding: "2px 8px",
                          borderRadius: "100px",
                          background: "#ffedd5",
                          color: "#ea580c",
                          fontWeight: 700,
                        }}
                      >
                        focus here
                      </span>
                    )}
                  </div>
                  <span style={{ color: "#9ca3af", fontSize: "12px" }}>
                    {expanded === s ? "▲" : "▼"}
                  </span>
                </button>
                {expanded === s && (
                  <div
                    style={{
                      padding: "12px 14px",
                      background: "white",
                      borderTop: `1px solid ${cfg.border}`,
                    }}
                  >
                    <p
                      style={{
                        fontSize: "13px",
                        color: "#5a4a3a",
                        lineHeight: 1.6,
                        margin: 0,
                      }}
                    >
                      {insight}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Growth note */}
        <div
          style={{
            background: `${PURPLE}06`,
            border: `1px solid ${PURPLE}15`,
            borderRadius: "12px",
            padding: "14px 16px",
            marginBottom: "20px",
          }}
        >
          <p
            style={{
              fontSize: "10px",
              fontWeight: 700,
              color: PURPLE,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              margin: "0 0 6px",
            }}
          >
            To improve next time
          </p>
          <p
            style={{
              fontSize: "13px",
              color: "#5a4a3a",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            {summary.growth_note}
          </p>
        </div>

        {/* Download */}
        <button
          onClick={onDownload}
          disabled={downloading}
          style={{
            width: "100%",
            padding: "13px",
            borderRadius: "12px",
            background: GRAD,
            color: "white",
            fontSize: "14px",
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
            opacity: downloading ? 0.6 : 1,
          }}
        >
          {downloading ? "Generating PDF..." : "Download as PDF Notes ↓"}
        </button>
      </div>
    </div>
  );
}

function WorkspaceProblemInner() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const problem_id = params.problem_id as string;
  const mode = (searchParams.get("mode") || "guided") as
    | "deep_focus"
    | "guided"
    | "open";

  const [stage, setStage] = useState<string>(() => {
    if (typeof window === "undefined") return "understand";
    return localStorage.getItem(`ws_stage_${problem_id}`) || "understand";
  });

  const [currentPartIndex, setCurrentPartIndex] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    return parseInt(localStorage.getItem(`ws_part_${problem_id}`) || "0");
  });

  const [conversationHistory, setConversationHistory] = useState<
    ConversationMessage[]
  >(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(`ws_trace_${problem_id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [conversing, setConversing] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(`ws_conversing_${problem_id}`) === "true";
  });

  const [studentInput, setStudentInput] = useState("");
  const [problem, setProblem] = useState<Problem | null>(null);
  const [understood, setUnderstood] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerDone, setTimerDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [partComplete, setPartComplete] = useState(false);
  const [allPartsComplete, setAllPartsComplete] = useState(false);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const stages = [
    "understand",
    "concept",
    "plan",
    "attempt",
    "critique",
    "reflection",
  ];
  const stageTimes: Record<string, number> = {
    understand: 3 * 60,
    concept: 4 * 60,
    plan: 5 * 60,
    attempt: 8 * 60,
    critique: 4 * 60,
    reflection: 3 * 60,
  };

  const currentIndex = stages.indexOf(stage);

  // ── KEY FIX: timer is informational only, not a gate ──
  const canContinue = understood;

  const modeInfo = MODES[mode] || MODES.guided;
  const currentPart =
    problem?.parts && problem.parts.length > 0
      ? problem.parts[currentPartIndex]
      : null;
  const activeProblemText = currentPart
    ? currentPart.part_text
    : problem?.problem_text || "";
  const hasMultipleParts = (problem?.parts?.length || 0) > 1;
  const isLastPart =
    !problem?.parts?.length || currentPartIndex >= problem.parts.length - 1;
  const isLastStage = currentIndex === stages.length - 1;

  useEffect(() => {
    localStorage.setItem(`ws_stage_${problem_id}`, stage);
  }, [stage, problem_id]);
  useEffect(() => {
    localStorage.setItem(`ws_part_${problem_id}`, String(currentPartIndex));
  }, [currentPartIndex, problem_id]);
  useEffect(() => {
    if (conversationHistory.length > 0)
      localStorage.setItem(
        `ws_trace_${problem_id}`,
        JSON.stringify(conversationHistory)
      );
  }, [conversationHistory, problem_id]);
  useEffect(() => {
    localStorage.setItem(`ws_conversing_${problem_id}`, String(conversing));
  }, [conversing, problem_id]);

  function clearProblemStorage() {
    localStorage.removeItem(`ws_trace_${problem_id}`);
    localStorage.removeItem(`ws_stage_${problem_id}`);
    localStorage.removeItem(`ws_conversing_${problem_id}`);
    localStorage.removeItem(`ws_part_${problem_id}`);
  }

  useEffect(() => {
    async function fetchProblem() {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/workspace-problems/${problem_id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const data = await res.json();
      setProblem(data);
      const savedHistory = localStorage.getItem(`ws_trace_${problem_id}`);
      if (
        !savedHistory &&
        data.sibling_traces &&
        data.sibling_traces.length > 0
      ) {
        const seeded: ConversationMessage[] = [];
        for (const sibling of data.sibling_traces) {
          seeded.push({
            role: "system",
            content: `--- Previous problem ${sibling.problem_number}: ${sibling.problem_text} ---`,
            stage: "understand",
          });
          for (const trace of sibling.traces) {
            if (trace.content)
              seeded.push({
                role: "student",
                content: trace.content,
                stage: trace.stage,
              });
          }
        }
        setConversationHistory(seeded);
      }
      setLoading(false);
    }
    fetchProblem();
  }, [problem_id]);

  useEffect(() => {
    setTimeLeft(stageTimes[stage]);
    setTimerDone(false);
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimerDone(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [stage, currentPartIndex]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  async function handleSubmit() {
    const token = localStorage.getItem("token");
    if (!token || !problem || submitting) return;
    const inputToSend = conversing ? aiResponse : studentInput;
    if (!inputToSend.trim()) return;
    setSubmitting(true);
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/workspace-problems/${problem_id}/traces`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stage,
          action: "text_submission",
          content: inputToSend,
        }),
      }
    ).catch(() => {});
    const guidanceRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/workspaces/${problem.workspace_id}/problems/${problem_id}/ai-guidance`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stage,
          student_input: inputToSend,
          problem: activeProblemText,
          mode,
          conversation_history: conversationHistory,
        }),
      }
    );
    const guidanceData = await guidanceRes.json();
    setConversationHistory([
      ...conversationHistory,
      { role: "student", content: inputToSend, stage },
      { role: "ai", content: guidanceData.message, stage },
    ]);
    setUnderstood(guidanceData.understood);
    setConversing(true);
    setAiResponse("");
    if (!conversing) setStudentInput("");
    setSubmitting(false);
  }

  function handleContinueStage() {
    if (currentIndex < stages.length - 1) {
      setStage(stages[currentIndex + 1]);
      setStudentInput("");
      setAiResponse("");
      setUnderstood(false);
      setConversing(false);
    } else {
      setPartComplete(true);
    }
  }

  function handleNextPart() {
    if (!isLastPart) {
      const nextPartIndex = currentPartIndex + 1;
      setCurrentPartIndex(nextPartIndex);
      const nextPart = problem!.parts[nextPartIndex];
      setConversationHistory((prev) => [
        ...prev,
        {
          role: "system",
          content: `--- Moving to Part (${nextPart.part_label}): ${nextPart.part_text} ---`,
          stage: "understand",
        },
      ]);
      setStage("understand");
      setStudentInput("");
      setAiResponse("");
      setUnderstood(false);
      setConversing(false);
      setPartComplete(false);
    } else {
      clearProblemStorage();
      setAllPartsComplete(true);
    }
  }

  async function generateSummary() {
    setGeneratingSummary(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/workspace-problems/${problem_id}/summary`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ conversation_history: conversationHistory }),
        }
      );
      const data = await res.json();
      setSummary(data);
    } catch (e) {
      console.error("Summary generation failed", e);
    }
    setGeneratingSummary(false);
  }

  async function downloadPdf() {
    if (!summary || !problem) return;
    setDownloadingPdf(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();

      doc.setFillColor(128, 0, 0);
      doc.rect(0, 0, 210, 42, "F");
      doc.setFillColor(78, 42, 132);
      doc.rect(140, 0, 70, 42, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("ThinkTrace", 14, 16);
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text("Reasoning Summary", 14, 26);
      doc.text(`Problem ${problem.problem_number}`, 14, 35);

      doc.setFontSize(28);
      doc.setFont("helvetica", "bold");
      doc.text(`${summary.overall_score}/10`, 148, 26);

      let y = 56;

      doc.setTextColor(90, 74, 58);
      doc.setFontSize(9);
      doc.setFont("helvetica", "italic");
      const probLines = doc.splitTextToSize(
        problem.problem_text.replace(/\$[^$]+\$/g, "[math]"),
        180
      );
      doc.text(probLines, 14, y);
      y += probLines.length * 4.5 + 10;

      doc.setFillColor(245, 240, 255);
      const insightLines = doc.splitTextToSize(summary.key_insight, 172);
      doc.roundedRect(10, y - 4, 190, insightLines.length * 5 + 18, 3, 3, "F");
      doc.setTextColor(78, 42, 132);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("KEY INSIGHT", 14, y + 4);
      doc.setTextColor(40, 20, 60);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(insightLines, 14, y + 11);
      y += insightLines.length * 5 + 24;

      doc.setFillColor(240, 253, 244);
      doc.roundedRect(10, y - 3, 90, 20, 2, 2, "F");
      doc.setTextColor(22, 163, 74);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("STRONGEST STAGE", 14, y + 4);
      doc.setTextColor(20, 83, 45);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(
        summary.strongest_stage?.charAt(0).toUpperCase() +
          summary.strongest_stage?.slice(1) || "",
        14,
        y + 12
      );

      doc.setFillColor(255, 247, 237);
      doc.roundedRect(110, y - 3, 90, 20, 2, 2, "F");
      doc.setTextColor(217, 119, 6);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("FOCUS AREA", 114, y + 4);
      doc.setTextColor(146, 64, 14);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(
        summary.weakest_stage?.charAt(0).toUpperCase() +
          summary.weakest_stage?.slice(1) || "",
        114,
        y + 12
      );
      y += 28;

      doc.setTextColor(78, 42, 132);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Stage Analysis", 14, y);
      y += 8;

      const stageList = [
        "understand",
        "concept",
        "plan",
        "attempt",
        "critique",
        "reflection",
      ];
      for (const s of stageList) {
        const insight = summary.stage_insights?.[s];
        if (!insight) continue;
        if (y > 255) {
          doc.addPage();
          y = 20;
        }
        doc.setFillColor(250, 248, 252);
        const lines = doc.splitTextToSize(insight, 170);
        doc.roundedRect(10, y - 3, 190, lines.length * 5 + 14, 2, 2, "F");
        doc.setTextColor(128, 0, 0);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text(s.charAt(0).toUpperCase() + s.slice(1), 14, y + 4);
        doc.setTextColor(60, 40, 40);
        doc.setFont("helvetica", "normal");
        doc.text(lines, 14, y + 10);
        y += lines.length * 5 + 18;
      }

      if (y > 245) {
        doc.addPage();
        y = 20;
      }
      doc.setFillColor(248, 244, 255);
      const growthLines = doc.splitTextToSize(summary.growth_note, 172);
      doc.roundedRect(10, y - 3, 190, growthLines.length * 5 + 18, 3, 3, "F");
      doc.setTextColor(78, 42, 132);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("TO IMPROVE NEXT TIME", 14, y + 4);
      doc.setTextColor(40, 20, 60);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(growthLines, 14, y + 11);

      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setTextColor(160, 140, 130);
        doc.setFontSize(8);
        doc.text(
          `ThinkTrace — Built at UChicago & Northwestern · ${new Date().toLocaleDateString()} · Page ${i} of ${pageCount}`,
          14,
          290
        );
      }

      doc.save(`thinktrace-problem-${problem.problem_number}-summary.pdf`);
    } catch (e) {
      console.error("PDF generation failed", e);
    }
    setDownloadingPdf(false);
  }

  if (loading)
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f8f9fc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              border: `3px solid ${PURPLE}`,
              borderTopColor: "transparent",
              margin: "0 auto 12px",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <p style={{ color: "#8a7a6a", fontSize: "14px" }}>
            Loading problem...
          </p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );

  if (allPartsComplete) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8f9fc" }}>
        <div
          style={{
            padding: "16px 32px",
            background: "white",
            borderBottom: "1px solid rgba(26,18,8,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: GRAD,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  color: "white",
                  fontWeight: 700,
                  fontSize: "14px",
                  fontFamily: "Georgia, serif",
                }}
              >
                T
              </span>
            </div>
            <span
              style={{ fontWeight: 700, fontSize: "16px", color: "#1a1208" }}
            >
              ThinkTrace
            </span>
          </div>
          <button
            onClick={() => router.back()}
            style={{
              fontSize: "13px",
              color: "#8a7a6a",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            ← Back
          </button>
        </div>

        <div style={{ padding: "40px", maxWidth: "680px", margin: "0 auto" }}>
          <div
            style={{
              background: "white",
              borderRadius: "20px",
              padding: "36px",
              border: "1px solid rgba(26,18,8,0.06)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${MAROON}18, ${PURPLE}18)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <span style={{ fontSize: "28px" }}>✓</span>
            </div>
            <h2
              style={{
                fontSize: "24px",
                fontWeight: 700,
                color: "#1a1208",
                margin: "0 0 8px",
                fontFamily: "Georgia, serif",
              }}
            >
              Problem Complete!
            </h2>
            <p
              style={{
                color: "#8a7a6a",
                marginBottom: "28px",
                fontSize: "15px",
                lineHeight: 1.6,
              }}
            >
              You have worked through all stages with full reasoning traces
              saved.
            </p>

            {!summary && !generatingSummary && (
              <button
                onClick={generateSummary}
                style={{
                  padding: "13px 32px",
                  borderRadius: "12px",
                  background: GRAD,
                  color: "white",
                  fontSize: "15px",
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Generate AI Summary Notes
              </button>
            )}

            {generatingSummary && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    border: `3px solid ${PURPLE}`,
                    borderTopColor: "transparent",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                <p style={{ color: "#8a7a6a", fontSize: "14px" }}>
                  ThinkTrace AI is analyzing your reasoning...
                </p>
              </div>
            )}
          </div>

          {summary && problem && (
            <SummaryCard
              summary={summary}
              problem={problem}
              onDownload={downloadPdf}
              downloading={downloadingPdf}
            />
          )}
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const currentStageMessages = conversationHistory.filter(
    (msg) => msg.stage === stage && msg.role !== "system"
  );

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#f8f9fc" }}>
      <style>{`@keyframes fadeUp { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }`}</style>

      {/* Sidebar */}
      <div
        style={{
          width: "220px",
          minHeight: "100vh",
          padding: "22px 16px",
          background: `linear-gradient(180deg, ${PURPLE} 0%, #3a1a6a 100%)`,
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "7px",
              background: GRAD,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                color: "white",
                fontWeight: 700,
                fontSize: "13px",
                fontFamily: "Georgia, serif",
              }}
            >
              T
            </span>
          </div>
          <span style={{ color: "white", fontWeight: 700, fontSize: "15px" }}>
            ThinkTrace
          </span>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 700,
              padding: "3px 10px",
              borderRadius: "100px",
              color: "white",
              background: modeInfo.color,
            }}
          >
            {modeInfo.label} mode
          </span>
        </div>

        {hasMultipleParts && (
          <div style={{ marginBottom: "16px" }}>
            <p
              style={{
                color: "rgba(200,180,255,0.6)",
                fontSize: "9px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                margin: "0 0 8px",
              }}
            >
              Parts
            </p>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {problem!.parts.map((part, i) => (
                <div
                  key={part.id}
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "7px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "10px",
                    fontWeight: 700,
                    background:
                      i < currentPartIndex
                        ? "#4ade80"
                        : i === currentPartIndex
                        ? "white"
                        : "rgba(255,255,255,0.15)",
                    color:
                      i < currentPartIndex
                        ? "white"
                        : i === currentPartIndex
                        ? PURPLE
                        : "rgba(255,255,255,0.4)",
                  }}
                >
                  {i < currentPartIndex ? "✓" : `(${part.part_label})`}
                </div>
              ))}
            </div>
          </div>
        )}

        <p
          style={{
            color: "rgba(200,180,255,0.6)",
            fontSize: "9px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            margin: "0 0 8px",
          }}
        >
          Stages
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {stages.map((s, i) => (
            <div
              key={s}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 10px",
                borderRadius: "8px",
                background:
                  s === stage ? "rgba(255,255,255,0.18)" : "transparent",
              }}
            >
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "10px",
                  fontWeight: 700,
                  flexShrink: 0,
                  background:
                    i < currentIndex
                      ? "#4ade80"
                      : s === stage
                      ? MAROON
                      : "rgba(255,255,255,0.15)",
                  color: "white",
                }}
              >
                {i < currentIndex ? "✓" : i + 1}
              </div>
              <span
                style={{
                  fontSize: "12px",
                  textTransform: "capitalize",
                  color:
                    i < currentIndex
                      ? "#4ade80"
                      : s === stage
                      ? "white"
                      : "rgba(200,180,255,0.5)",
                  fontWeight: s === stage ? 600 : 400,
                }}
              >
                {s}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: "32px 40px", overflowY: "auto" }}>
        {problem?.sibling_traces && problem.sibling_traces.length > 0 && (
          <div
            style={{
              background: "#fffbeb",
              border: "1px solid #fde68a",
              borderRadius: "10px",
              padding: "10px 14px",
              marginBottom: "16px",
            }}
          >
            <p
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "#d97706",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                margin: "0 0 2px",
              }}
            >
              Context from previous parts
            </p>
            <p style={{ fontSize: "13px", color: "#92400e", margin: 0 }}>
              ThinkTrace AI has full context from{" "}
              {problem.sibling_traces
                .map((s) => `Problem ${s.problem_number}`)
                .join(", ")}
              .
            </p>
          </div>
        )}

        {/* Problem card */}
        <div
          style={{
            background: "white",
            borderRadius: "16px",
            padding: "22px",
            border: "1px solid rgba(26,18,8,0.06)",
            marginBottom: "18px",
            userSelect: "none",
          }}
          onCopy={(e) => e.preventDefault()}
          onContextMenu={(e) => e.preventDefault()}
        >
          <button
            onClick={() => router.back()}
            style={{
              fontSize: "13px",
              color: "#8a7a6a",
              background: "none",
              border: "none",
              cursor: "pointer",
              marginBottom: "12px",
              padding: 0,
            }}
          >
            ← Back
          </button>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "10px",
            }}
          >
            <h1
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: "#1a1208",
                margin: 0,
                fontFamily: "Georgia, serif",
              }}
            >
              Problem {problem?.problem_number}
            </h1>
            {currentPart && (
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  padding: "3px 10px",
                  borderRadius: "100px",
                  background: "#f3f4f6",
                  color: "#6b7280",
                }}
              >
                Part ({currentPart.part_label})
              </span>
            )}
          </div>
          {problem?.parts && problem.parts.length > 0 && (
            <div
              style={{
                color: "#8a7a6a",
                fontSize: "13px",
                marginBottom: "10px",
                paddingBottom: "10px",
                borderBottom: "1px solid #f0ece6",
              }}
            >
              {renderMath(problem.problem_text)}
            </div>
          )}
          <div
            style={{
              color: "#1a1208",
              lineHeight: 1.6,
              fontWeight: 500,
              fontSize: "14px",
            }}
          >
            {renderMath(activeProblemText)}
          </div>
        </div>

        {/* Part complete banner */}
        {partComplete && !allPartsComplete && (
          <div
            style={{
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: "16px",
              padding: "20px 24px",
              marginBottom: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <p
                style={{
                  fontWeight: 700,
                  color: "#166534",
                  fontSize: "16px",
                  margin: "0 0 4px",
                }}
              >
                Part ({currentPart?.part_label}) Complete!
              </p>
              <p style={{ color: "#16a34a", fontSize: "13px", margin: 0 }}>
                {isLastPart
                  ? "You have completed all parts."
                  : `Ready for Part (${
                      problem?.parts[currentPartIndex + 1]?.part_label
                    })`}
              </p>
            </div>
            <button
              onClick={handleNextPart}
              style={{
                padding: "11px 22px",
                borderRadius: "10px",
                background: GRAD,
                color: "white",
                fontSize: "14px",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
              }}
            >
              {isLastPart
                ? "Finish Problem"
                : `Next Part (${
                    problem?.parts[currentPartIndex + 1]?.part_label
                  }) →`}
            </button>
          </div>
        )}

        {/* Stage workspace */}
        {!partComplete && (
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "22px",
              border: "1px solid rgba(26,18,8,0.06)",
            }}
          >
            {/* Stage header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "14px",
              }}
            >
              <h2
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#1a1208",
                  textTransform: "capitalize",
                  margin: 0,
                  fontFamily: "Georgia, serif",
                }}
              >
                {stage}
              </h2>
              {/* Timer — informational only, not a gate */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "5px 12px",
                  borderRadius: "100px",
                  fontSize: "12px",
                  fontWeight: 600,
                  background: timerDone
                    ? "#f0fdf4"
                    : timeLeft < 60
                    ? "#fff7ed"
                    : "#f8f9fc",
                  color: timerDone
                    ? "#16a34a"
                    : timeLeft < 60
                    ? "#d97706"
                    : "#8a7a6a",
                }}
              >
                {timerDone
                  ? "✓ Time complete"
                  : `⏱ ${formatTime(timeLeft)} remaining`}
              </div>
            </div>

            {/* Objective */}
            <div
              style={{
                background: `${PURPLE}08`,
                border: `1px solid ${PURPLE}18`,
                borderRadius: "10px",
                padding: "12px 14px",
                marginBottom: "16px",
              }}
            >
              <p
                style={{
                  fontSize: "9px",
                  fontWeight: 700,
                  color: PURPLE,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  margin: "0 0 4px",
                }}
              >
                Objective
              </p>
              <p
                style={{
                  fontSize: "13px",
                  color: "#3b1e6e",
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                {STAGE_OBJECTIVES[stage]}
              </p>
            </div>

            {/* Progress bar */}
            <div
              style={{
                height: "3px",
                background: "#f0ece6",
                borderRadius: "2px",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  height: "100%",
                  borderRadius: "2px",
                  width: `${(currentIndex / stages.length) * 100}%`,
                  background: GRAD,
                  transition: "width 0.5s ease",
                }}
              />
            </div>

            {/* Initial input */}
            {!conversing && (
              <MathInput
                value={studentInput}
                onChange={setStudentInput}
                placeholder={`Write your ${stage} here...`}
                accentColor={modeInfo.color}
              />
            )}

            {/* Conversation history */}
            {currentStageMessages.length > 0 && (
              <div
                style={{
                  marginTop: "14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                {currentStageMessages.map((msg, index) => (
                  <div
                    key={index}
                    style={{
                      padding: "12px 14px",
                      borderRadius: "12px",
                      fontSize: "13px",
                      lineHeight: 1.6,
                      marginLeft: msg.role === "student" ? "24px" : "0",
                      marginRight: msg.role === "ai" ? "24px" : "0",
                      background:
                        msg.role === "student" ? "#f8f9fc" : `${PURPLE}08`,
                      border: `1px solid ${
                        msg.role === "student"
                          ? "rgba(26,18,8,0.06)"
                          : `${PURPLE}18`
                      }`,
                      animation: "fadeUp 0.3s ease",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        margin: "0 0 5px",
                        color: msg.role === "student" ? "#9ca3af" : PURPLE,
                      }}
                    >
                      {msg.role === "student" ? "You" : "ThinkTrace AI"}
                    </p>
                    <div
                      style={{
                        color: msg.role === "student" ? "#374151" : "#3b1e6e",
                      }}
                    >
                      {renderMath(msg.content || "")}
                    </div>
                  </div>
                ))}

                {/* ── KEY FIX: single understood check, no timer gate ── */}
                {understood && (
                  <p
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#16a34a",
                    }}
                  >
                    ✓ Ready for next stage
                  </p>
                )}
              </div>
            )}

            {/* Response input when conversing and not yet understood */}
            {conversing && !understood && (
              <div style={{ marginTop: "14px" }}>
                <p
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: PURPLE,
                    margin: "0 0 8px",
                  }}
                >
                  Your response:
                </p>
                <MathInput
                  value={aiResponse}
                  onChange={setAiResponse}
                  placeholder="Respond here..."
                  height="h-24"
                  accentColor={modeInfo.color}
                />
              </div>
            )}

            {/* Footer */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: "16px",
              }}
            >
              <p style={{ fontSize: "12px", color: "#8a7a6a", margin: 0 }}>
                {hasMultipleParts && `Part (${currentPart?.part_label}) · `}
                Stage {currentIndex + 1} of {stages.length}
              </p>
              <button
                onClick={canContinue ? handleContinueStage : handleSubmit}
                disabled={
                  submitting ||
                  (!canContinue &&
                    (conversing
                      ? aiResponse.trim() === ""
                      : studentInput.trim() === ""))
                }
                style={{
                  padding: "11px 28px",
                  borderRadius: "10px",
                  background: GRAD,
                  color: "white",
                  fontSize: "14px",
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  opacity:
                    submitting ||
                    (!canContinue &&
                      (conversing
                        ? aiResponse.trim() === ""
                        : studentInput.trim() === ""))
                      ? 0.4
                      : 1,
                }}
              >
                {submitting
                  ? "..."
                  : canContinue
                  ? isLastStage
                    ? isLastPart
                      ? "Complete Problem ✓"
                      : `Complete Part (${currentPart?.part_label}) ✓`
                    : "Continue →"
                  : "Send →"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function WorkspaceProblemPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            background: "#f8f9fc",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <p style={{ color: "#8a7a6a" }}>Loading...</p>
        </div>
      }
    >
      <WorkspaceProblemInner />
    </Suspense>
  );
}
