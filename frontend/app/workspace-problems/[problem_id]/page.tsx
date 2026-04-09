"use client";

import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { InlineMath, BlockMath } from "react-katex";
import MathInput from "@/components/MathInput";

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

const MODES = {
  deep_focus: { label: "Deep Focus", color: "#1e2a4a" },
  guided: { label: "Guided", color: "#800000" },
  open: { label: "Open", color: "#2d6a4f" },
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
  const canContinue = timerDone && understood;
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

  // Persist state
  useEffect(() => {
    localStorage.setItem(`ws_stage_${problem_id}`, stage);
  }, [stage, problem_id]);

  useEffect(() => {
    localStorage.setItem(`ws_part_${problem_id}`, String(currentPartIndex));
  }, [currentPartIndex, problem_id]);

  useEffect(() => {
    if (conversationHistory.length > 0) {
      localStorage.setItem(
        `ws_trace_${problem_id}`,
        JSON.stringify(conversationHistory)
      );
    }
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
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        setLoading(false);
        return;
      }
      const data = await res.json();
      setProblem(data);

      // Only seed from sibling traces if no saved history
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
            if (trace.content) {
              seeded.push({
                role: "student",
                content: trace.content,
                stage: trace.stage,
              });
            }
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

  if (loading)
    return (
      <div className="min-h-screen bg-[#f8f9fc] p-10 text-gray-500">
        Loading...
      </div>
    );

  if (allPartsComplete) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] flex items-center justify-center">
        <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100 text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-green-600 text-2xl">✓</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Problem Complete!
          </h2>
          <p className="text-gray-400 mb-6">
            You've worked through all parts with full reasoning traces.
          </p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 rounded-xl text-white font-semibold hover:opacity-90 transition"
            style={{ backgroundColor: modeInfo.color }}
          >
            Back to Problems
          </button>
        </div>
      </div>
    );
  }

  const currentStageMessages = conversationHistory.filter(
    (msg) => msg.stage === stage && msg.role !== "system"
  );

  return (
    <div className="min-h-screen flex bg-[#f8f9fc]">
      {/* Sidebar */}
      <div className="w-64 min-h-screen p-6 bg-[#1e2a4a] flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-[#667eea] to-[#764ba2]">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <span className="text-white font-bold text-lg">ThinkTrace</span>
        </div>

        <div className="mb-4">
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full text-white"
            style={{ backgroundColor: modeInfo.color }}
          >
            {modeInfo.label} mode
          </span>
        </div>

        {hasMultipleParts && (
          <div className="mb-6">
            <p className="text-blue-300 text-xs uppercase tracking-wide font-semibold mb-2">
              Parts
            </p>
            <div className="flex gap-2 flex-wrap">
              {problem!.parts.map((part, i) => (
                <div
                  key={part.id}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                  style={{
                    background:
                      i < currentPartIndex
                        ? "#4ade80"
                        : i === currentPartIndex
                        ? "white"
                        : "rgba(255,255,255,0.2)",
                    color:
                      i < currentPartIndex
                        ? "white"
                        : i === currentPartIndex
                        ? "#1e2a4a"
                        : "rgba(255,255,255,0.5)",
                  }}
                >
                  {i < currentPartIndex ? "✓" : `(${part.part_label})`}
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-blue-300 text-xs uppercase tracking-wide font-semibold mb-4">
          Stages
        </p>
        <div className="flex flex-col gap-2">
          {stages.map((s, i) => (
            <div
              key={s}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                s === stage
                  ? "bg-white bg-opacity-20 text-white font-medium"
                  : i < currentIndex
                  ? "text-green-400"
                  : "text-blue-300"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                  i < currentIndex
                    ? "bg-green-400 text-white"
                    : s === stage
                    ? "bg-white text-blue-800"
                    : "bg-white bg-opacity-20 text-white"
                }`}
              >
                {i < currentIndex ? "✓" : i + 1}
              </div>
              <span className="capitalize text-sm">{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 p-10 overflow-y-auto">
        {problem?.sibling_traces && problem.sibling_traces.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">
              Context from previous parts
            </p>
            <p className="text-sm text-amber-800">
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
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6 select-none"
          style={{ userSelect: "none" }}
          onCopy={(e) => e.preventDefault()}
          onContextMenu={(e) => e.preventDefault()}
        >
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-400 hover:text-gray-600 mb-4"
          >
            ← Back
          </button>
          <div className="flex items-center gap-3 mb-3">
            <h1 className="text-xl font-bold text-gray-800">
              Problem {problem?.problem_number}
            </h1>
            {currentPart && (
              <span className="text-sm font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-600">
                Part ({currentPart.part_label})
              </span>
            )}
          </div>
          {problem?.parts && problem.parts.length > 0 && (
            <div className="text-gray-400 text-sm mb-3 pb-3 border-b border-gray-100">
              {renderMath(problem.problem_text)}
            </div>
          )}
          <div className="text-gray-700 leading-relaxed font-medium">
            {renderMath(activeProblemText)}
          </div>
        </div>

        {/* Part complete banner */}
        {partComplete && !allPartsComplete && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-6 flex items-center justify-between">
            <div>
              <p className="font-bold text-green-800 text-lg">
                Part ({currentPart?.part_label}) Complete! 🎉
              </p>
              <p className="text-green-600 text-sm mt-1">
                {isLastPart
                  ? "You've completed all parts."
                  : `Ready for Part (${
                      problem?.parts[currentPartIndex + 1]?.part_label
                    })`}
              </p>
            </div>
            <button
              onClick={handleNextPart}
              className="px-6 py-3 rounded-xl text-white font-semibold hover:opacity-90 transition"
              style={{ backgroundColor: modeInfo.color }}
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
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-800 capitalize">
                {stage}
              </h2>
              <div
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${
                  timerDone
                    ? "bg-green-100 text-green-600"
                    : timeLeft < 60
                    ? "bg-red-100 text-red-500"
                    : "bg-orange-100 text-orange-500"
                }`}
              >
                {timerDone
                  ? "✓ Time complete"
                  : `⏱ ${formatTime(timeLeft)} remaining`}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-4">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">
                Objective
              </p>
              <p className="text-sm text-blue-800">{STAGE_OBJECTIVES[stage]}</p>
            </div>

            {!conversing && (
              <MathInput
                value={studentInput}
                onChange={setStudentInput}
                placeholder={`Write your ${stage} here...`}
                accentColor={modeInfo.color}
              />
            )}

            {currentStageMessages.length > 0 && (
              <div className="mt-4 flex flex-col gap-3">
                {currentStageMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-xl text-sm ${
                      msg.role === "student"
                        ? "bg-gray-50 border border-gray-200 text-gray-700 ml-8"
                        : "border text-gray-700 mr-8"
                    }`}
                    style={
                      msg.role === "ai"
                        ? {
                            backgroundColor: `${modeInfo.color}08`,
                            borderColor: `${modeInfo.color}30`,
                          }
                        : {}
                    }
                  >
                    <p
                      className="text-xs font-semibold mb-1"
                      style={{
                        color:
                          msg.role === "student" ? "#6b7280" : modeInfo.color,
                      }}
                    >
                      {msg.role === "student" ? "You" : "ThinkTrace AI"}
                    </p>
                    <div>{renderMath(msg.content || "")}</div>
                  </div>
                ))}
                {understood && timerDone && (
                  <p className="text-green-500 text-sm font-medium mt-1">
                    ✓ Ready for next stage
                  </p>
                )}
                {understood && !timerDone && (
                  <p className="text-orange-500 text-sm font-medium mt-1">
                    ✓ Stage complete — waiting for timer
                  </p>
                )}
              </div>
            )}

            {conversing && !understood && (
              <div className="mt-4">
                <p
                  className="text-sm font-medium mb-2"
                  style={{ color: modeInfo.color }}
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

            <div className="flex justify-between items-center mt-4">
              <p className="text-sm text-gray-400">
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
                className="text-white px-8 py-3 rounded-xl font-semibold transition disabled:opacity-40 hover:opacity-90"
                style={{ backgroundColor: modeInfo.color }}
              >
                {submitting
                  ? "..."
                  : canContinue
                  ? isLastStage
                    ? isLastPart
                      ? "Complete Problem ✓"
                      : `Complete Part (${currentPart?.part_label}) ✓`
                    : "Continue →"
                  : conversing && !understood
                  ? "Send →"
                  : "Submit →"}
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
        <div className="min-h-screen bg-[#f8f9fc] p-10 text-gray-500">
          Loading...
        </div>
      }
    >
      <WorkspaceProblemInner />
    </Suspense>
  );
}
