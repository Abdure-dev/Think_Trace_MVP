"use client";

import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { InlineMath, BlockMath } from "react-katex";

type Problem = {
  id: string;
  workspace_id: string;
  problem_number: number;
  problem_text: string;
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

function WorkspaceProblemInner() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const problem_id = params.problem_id as string;
  const mode = (searchParams.get("mode") || "guided") as
    | "deep_focus"
    | "guided"
    | "open";

  const [stage, setStage] = useState("understand");
  const [studentInput, setStudentInput] = useState("");
  const [problem, setProblem] = useState<Problem | null>(null);
  const [understood, setUnderstood] = useState(false);
  const [conversing, setConversing] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerDone, setTimerDone] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<
    ConversationMessage[]
  >([]);
  const [aiGuidance, setAiGuidance] = useState("");
  const [loading, setLoading] = useState(true);

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
  }, [stage]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  async function handleSubmit() {
    const token = localStorage.getItem("token");
    if (!token || !problem) return;

    const inputToSend = conversing ? aiResponse : studentInput;

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
          problem: problem.problem_text,
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

    setAiGuidance(guidanceData.message);
    setUnderstood(guidanceData.understood);
    setConversing(true);
    setAiResponse("");
    if (!conversing) setStudentInput("");
  }

  function handleContinue() {
    if (currentIndex < stages.length - 1) {
      setStage(stages[currentIndex + 1]);
      setStudentInput("");
      setAiResponse("");
      setUnderstood(false);
      setConversing(false);
      setAiGuidance("");
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

  return (
    <div className="min-h-screen flex bg-[#f8f9fc]">
      {/* Sidebar */}
      <div className="w-64 min-h-screen p-6 bg-[#1e2a4a]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-[#667eea] to-[#764ba2]">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <span className="text-white font-bold text-lg">ThinkTrace</span>
        </div>

        <div className="mb-6">
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full text-white"
            style={{ backgroundColor: modeInfo.color }}
          >
            {modeInfo.label} mode
          </span>
        </div>

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
      <div className="flex-1 p-10">
        <div
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6 select-none"
          onCopy={(e) => e.preventDefault()}
          onContextMenu={(e) => e.preventDefault()}
        >
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-400 hover:text-gray-600 mb-4"
          >
            ← Back
          </button>
          <h1 className="text-xl font-bold text-gray-800 mb-2">
            Problem {problem?.problem_number}
          </h1>
          <div className="text-gray-600">
            {renderMath(problem?.problem_text || "")}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-1">
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

          <p className="text-gray-400 text-sm mb-4">Write your {stage} below</p>

          {!conversing && (
            <textarea
              value={studentInput}
              onChange={(e) => setStudentInput(e.target.value)}
              onPaste={(e) => e.preventDefault()}
              placeholder={`Write your ${stage} here...`}
              className="w-full h-40 p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 resize-none text-gray-700"
              style={{ "--tw-ring-color": modeInfo.color } as any}
            />
          )}

          {conversationHistory.filter((m) => m.stage === stage).length > 0 && (
            <div className="mt-4 flex flex-col gap-3">
              {conversationHistory
                .filter((m) => m.stage === stage)
                .map((msg, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-xl text-sm ${
                      msg.role === "student"
                        ? "bg-gray-50 border border-gray-200 text-gray-700 ml-8"
                        : "border text-gray-700 mr-8"
                    }`}
                    style={
                      msg.role === "ai"
                        ? {
                            backgroundColor: `${modeInfo.color}08`,
                            borderColor: `${modeInfo.color}20`,
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
                  ✓ Ready to move to next stage
                </p>
              )}
              {understood && !timerDone && (
                <p className="text-orange-500 text-sm font-medium mt-1">
                  ✓ Understanding confirmed — waiting for timer
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
              <textarea
                value={aiResponse}
                onChange={(e) => setAiResponse(e.target.value)}
                onPaste={(e) => e.preventDefault()}
                placeholder="Respond here..."
                className="w-full h-24 p-4 border-2 rounded-xl focus:outline-none resize-none text-gray-700"
                style={{ borderColor: modeInfo.color }}
              />
            </div>
          )}

          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-gray-400">
              Stage {currentIndex + 1} of {stages.length}
            </p>
            <button
              onClick={canContinue ? handleContinue : handleSubmit}
              disabled={
                !canContinue &&
                (conversing
                  ? aiResponse.trim() === ""
                  : studentInput.trim() === "")
              }
              className="text-white px-8 py-3 rounded-xl font-semibold transition disabled:opacity-40"
              style={{ backgroundColor: modeInfo.color }}
            >
              {canContinue
                ? currentIndex < stages.length - 1
                  ? "Continue →"
                  : "Complete"
                : conversing && !understood
                ? "Send →"
                : "Submit →"}
            </button>
          </div>
        </div>
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
