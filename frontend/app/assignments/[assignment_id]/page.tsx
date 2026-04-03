"use client";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
export default function Get_single_assignment({
  params,
}: {
  params: Promise<{ assignment_id: string }>;
}) {
  const router = useRouter();
  const { assignment_id } = use(params);
  console.log("assignment_id", assignment_id);
  const [stage, setStage] = useState("understand");
  const [studentinput, setStudentinput] = useState("");
  const [assignment, setAssignment] = useState<any>(null);

  useEffect(() => {
    async function fetchAssignment() {
      if (!assignment_id) return;
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const assignment_response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/assignments/${assignment_id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const assignment_data = await assignment_response.json();
      console.log("assignment data:", assignment_data);
      setAssignment(assignment_data);
    }
    fetchAssignment();
  }, [assignment_id]);
  async function handleSubmit() {
    const token = localStorage.getItem("token");
    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/assignments/${assignment_id}/traces`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "content-type": `application/json`,
        },
        body: JSON.stringify({
          stage: stage,
          action: "text_submission",
          content: studentinput,
        }),
      }
    );
    const stages = [
      "understand",
      "concept",
      "plan",
      "attempt",
      "critique",
      "reflection",
    ];
    const currentIndex = stages.indexOf(stage);
    if (currentIndex < stages.length - 1) {
      setStage(stages[currentIndex + 1]);
      setStudentinput(""); // clear the input
    }
  }
  const stages = [
    "understand",
    "concept",
    "plan",
    "attempt",
    "critique",
    "reflection",
  ];
  const currentIndex = stages.indexOf(stage);

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#f8f9fc" }}>
      {/* Left sidebar - stages */}
      <div
        className="w-64 min-h-screen p-6"
        style={{ backgroundColor: "#1e2a4a" }}
      >
        <div className="flex items-center gap-3 mb-10">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            }}
          >
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

      {/* Main workspace */}
      <div className="flex-1 p-10">
        {/* Problem statement */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <h1 className="text-xl font-bold text-gray-800 mb-2">
            {assignment?.title}
          </h1>
          <p className="text-gray-600">{assignment?.description}</p>
        </div>

        {/* Current stage */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-1 capitalize">
            {stage}
          </h2>
          <p className="text-gray-400 text-sm mb-4">Write your {stage} below</p>

          <textarea
            value={studentinput}
            onChange={(e) => setStudentinput(e.target.value)}
            placeholder={`Write your ${stage} here...`}
            className="w-full h-40 p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none text-gray-700"
          />

          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-gray-400">
              Stage {currentIndex + 1} of {stages.length}
            </p>
            <button
              onClick={handleSubmit}
              className="text-white px-8 py-3 rounded-xl font-semibold hover:opacity-90 transition"
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              }}
            >
              {currentIndex < stages.length - 1
                ? "Submit & Continue →"
                : "Complete Assignment"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
