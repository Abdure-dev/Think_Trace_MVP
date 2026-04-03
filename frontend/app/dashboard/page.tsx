"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
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

      if (userData.role === "instructor") {
        const couresResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/instructor/courses`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const coursesData = await couresResponse.json();
        setCourses(coursesData);
      } else {
        const couresResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/courses`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const courseData = await couresResponse.json();
        setCourses(courseData);
      }
    }
    fetchData();
  }, []);

  return (
    <main>
      <h1>welcome {user?.first_name}</h1>
      {user?.role == "student" && (
        <>
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
        </>
      )}
      {user?.role == "instructor" && (
        <>
          <h2> Your Courses </h2>
          {courses.map((course: any) => (
            <Link key={course.id} href={`/instructor/courses/${course.id}`}>
              <div>
                <h3>{course.title}</h3>
                <p>{course.semester}</p>
              </div>
            </Link>
          ))}
        </>
      )}
    </main>
  );
}
