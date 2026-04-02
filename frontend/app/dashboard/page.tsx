"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    async function fetchData() {
      if (typeof window === "undefined") return;
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const userData = await response.json();
      setUser(userData);

      const couresResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/courses`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const courseData = await couresResponse.json();
      console.log("courses data:", courseData);
      setCourses(courseData);
    }
    fetchData();
  }, []);

  return (
    <main>
      <h1>Dashboard</h1>
      <h2>Your Courses</h2>
      {courses.map((enrollement: any) => (
        <Link
          key={enrollement.course_id}
          href={`/courses/${enrollement.course_id}`}
        >
          <div>
            <h3> {enrollement.Courses?.title}</h3>
            <p>{enrollement.Courses?.semester}</p>
          </div>
        </Link>
      ))}
    </main>
  );
}
