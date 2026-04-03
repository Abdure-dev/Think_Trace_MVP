"use client";

import { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function get_Assignment_traces({
  params,
}: {
  params: Promise<{ assignment_id: string; student_id: string }>;
}) {
  const router = useRouter();
  const { assignment_id, student_id } = use(params);
  const [traces, setTrace] = useState([]);

  useEffect(() => {
    async function fetchTraces() {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      const traceresponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/assignments/${assignment_id}/traces/${student_id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const TraceData = await traceresponse.json();
      setTrace(TraceData);
    }
    fetchTraces();
  }, [assignment_id]);

  return (
    <>
      <h1>Traces</h1>
      {traces.map((trace: any) => (
        <div key={trace.id}>
          <h3>{trace.stage}</h3>
          <p>{trace.action}</p>
          <p>{trace.action}</p>
          <p>{trace.content}</p>
          <p>{trace.created_at}</p>
        </div>
      ))}
    </>
  );
}
