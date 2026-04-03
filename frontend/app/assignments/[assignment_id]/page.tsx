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
  return (
    <>
      <main>
        <h1>{assignment?.title}</h1>
        <p>{assignment?.description}</p>
        <h2>Stage: {stage}</h2>
        <textarea
          value={studentinput}
          onChange={(e) => setStudentinput(e.target.value)}
          placeholder={`write your ${stage} here...`}
        />
        <button onClick={handleSubmit}>submit</button>
      </main>
    </>
  );
}
