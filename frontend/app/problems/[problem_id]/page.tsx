"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { InlineMath, BlockMath } from "react-katex";

type Problem = {
  id: string;
  assignment_id?: string;
  problem_number: number;
  problem_text: string;
};

type ConversationMessage = {
  role: string;
  content: string;
  stage: string;
};

export default function ProblemWorkspacePage() {
  const router = useRouter();
  const params = useParams();
  const problem_id = params.problem_id as string;

  const [stage, setStage] = useState("understand");
  const [studentInput, setStudentInput] = useState("");
  const [problem, setProblem] = useState<Problem | null>(null);
  const [aiGuidance, setAiGuidance] = useState("");
  const [understood, setUnderstood] = useState(false);
  const [conversing, setConversing] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerDone, setTimerDone] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<
    ConversationMessage[]
  >([]);
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

  useEffect(() => {
    async function fetchProblem() {
      if (!problem_id) return;
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/problems/${problem_id}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
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
  }, [problem_id, router]);

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

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  async function handleSubmit() {
    const token = localStorage.getItem("token");
    if (!token || !problem) return;

    const inputToSend = conversing ? aiResponse : studentInput;

    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/problems/${problem_id}/traces`,
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
    );

    const guidanceResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/problems/${problem_id}/ai-guidance`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stage,
          student_input: inputToSend,
          conversation_history: conversationHistory,
        }),
      }
    );

    const guidanceData = await guidanceResponse.json();

    const updatedHistory = [
      ...conversationHistory,
      { role: "student", content: inputToSend, stage },
      { role: "ai", content: guidanceData.message, stage },
    ];

    setConversationHistory(updatedHistory);
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
    const parts = cleaned.split(/(\$\$[\s\S]+?\$\$|\$[^$]+?\$)/);

    return parts.map((part, i) => {
      if (part.startsWith("$$")) {
        return <BlockMath key={i} math={part.slice(2, -2)} />;
      } else if (part.startsWith("$")) {
        return <InlineMath key={i} math={part.slice(1, -1)} />;
      }
      return <span key={i}>{part}</span>;
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] p-10 text-gray-500">
        Loading problem...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#f8f9fc]">
      <div className="w-64 min-h-screen p-6 bg-[#1e2a4a]">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-[#667eea] to-[#764ba2]">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <span className="text-white font-bold text-lg">ThinkTrace</span>
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

      <div className="flex-1 p-10">
        <div
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6 select-none"
          style={{ userSelect: "none" }}
          onCopy={(e) => e.preventDefault()}
          onContextMenu={(e) => e.preventDefault()}
        >
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-400 hover:text-gray-600 transition mb-4"
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
              onCopy={(e) => e.preventDefault()}
              onContextMenu={(e) => e.preventDefault()}
              placeholder={`Write your ${stage} here...`}
              className="w-full h-40 p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none text-gray-700"
            />
          )}

          {conversationHistory.filter((msg) => msg.stage === stage).length >
            0 && (
            <div className="mt-4 flex flex-col gap-3">
              {conversationHistory
                .filter((msg) => msg.stage === stage)
                .map((msg, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-xl text-sm ${
                      msg.role === "student"
                        ? "bg-gray-50 border border-gray-200 text-gray-700 ml-8"
                        : "border border-purple-200 text-gray-700 mr-8 select-none"
                    }`}
                    style={
                      msg.role === "ai"
                        ? { backgroundColor: "#f5f3ff", userSelect: "none" }
                        : {}
                    }
                    onCopy={(e) => e.preventDefault()}
                    onContextMenu={(e) => e.preventDefault()}
                  >
                    <p
                      className="text-xs font-semibold mb-1"
                      style={{
                        color: msg.role === "student" ? "#6b7280" : "#8b5cf6",
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
              <p className="text-sm font-medium text-purple-600 mb-2">
                Your response to ThinkTrace AI:
              </p>
              <textarea
                value={aiResponse}
                onChange={(e) => setAiResponse(e.target.value)}
                onPaste={(e) => e.preventDefault()}
                onCopy={(e) => e.preventDefault()}
                onContextMenu={(e) => e.preventDefault()}
                placeholder="Respond to the AI question here..."
                className="w-full h-24 p-4 border-2 border-purple-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none text-gray-700"
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
              className={`text-white px-8 py-3 rounded-xl font-semibold transition ${
                !canContinue &&
                (conversing
                  ? aiResponse.trim() === ""
                  : studentInput.trim() === "")
                  ? "opacity-40 cursor-not-allowed"
                  : "hover:opacity-90"
              }`}
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              }}
            >
              {canContinue
                ? currentIndex < stages.length - 1
                  ? "Continue to next stage →"
                  : "Complete Problem"
                : conversing && !understood
                ? "Send Response →"
                : "Submit →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
