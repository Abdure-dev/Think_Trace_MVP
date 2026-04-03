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
    <div className="min-h-screen flex" style={{ backgroundColor: "#f8f9fc" }}>
      {/* Sidebar */}
      <div
        className="w-64 min-h-screen flex flex-col p-6"
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
        <nav className="flex flex-col gap-2">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white bg-opacity-10 text-white font-medium">
            <span>Dashboard</span>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-blue-200 hover:bg-white hover:bg-opacity-10 cursor-pointer transition">
            <span>Courses</span>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-blue-200 hover:bg-white hover:bg-opacity-10 cursor-pointer transition">
            <span>Progress</span>
          </div>
        </nav>
        <div className="mt-auto">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-blue-200">
            <div className="w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center text-white text-sm font-bold">
              {user?.first_name?.[0]}
            </div>
            <div>
              <p className="text-white text-sm font-medium">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-blue-300 text-xs">{user?.role}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">
            Welcome back, {user?.first_name}
          </h1>
          <p className="text-gray-400 mt-1">Here are your courses</p>
        </div>

        {/* Student courses */}
        {user?.role === "student" && (
          <div className="grid grid-cols-2 gap-6">
            {courses.map((enrollment: any) => (
              <Link
                key={enrollment.course_id}
                href={`/courses/${enrollment.course_id}`}
              >
                <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition cursor-pointer border border-gray-100">
                  <div
                    className="w-10 h-10 rounded-xl mb-4"
                    style={{
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    }}
                  ></div>
                  <h3 className="font-bold text-gray-800 text-lg">
                    {enrollment.Courses?.title}
                  </h3>
                  <p className="text-gray-400 text-sm mt-1">
                    {enrollment.Courses?.semester}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Instructor courses */}
        {user?.role === "instructor" && (
          <div className="grid grid-cols-2 gap-6">
            {courses.map((course: any) => (
              <Link key={course.id} href={`/instructor/courses/${course.id}`}>
                <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition cursor-pointer border border-gray-100">
                  <div
                    className="w-10 h-10 rounded-xl mb-4"
                    style={{
                      background:
                        "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                    }}
                  ></div>
                  <h3 className="font-bold text-gray-800 text-lg">
                    {course.title}
                  </h3>
                  <p className="text-gray-400 text-sm mt-1">
                    {course.semester}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
