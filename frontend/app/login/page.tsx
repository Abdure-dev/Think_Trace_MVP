"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit() {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      const token = await response.json();
      localStorage.setItem("token", token);
      router.push("/dashboard");
    } catch (error) {
      setError("Invalid email or password");
    }
  }
  return (
    <div className="min-h-screen flex">
      {/* Left side — branding */}
      <div
        className="w-1/2 bg-navy-900 flex flex-col items-center justify-center p-12"
        style={{ backgroundColor: "#1e2a4a" }}
      >
        <h1 className="text-4xl font-bold text-white mb-4">ThinkTrace</h1>
        <p className="text-blue-200 text-lg text-center">
          Guided Problem Solving with AI
        </p>
      </div>

      {/* Right side — form */}
      <div className="w-1/2 flex items-center justify-center bg-gray-50">
        <div className="bg-white p-10 rounded-2xl shadow-lg w-full max-w-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Welcome back
          </h2>
          <p className="text-gray-500 mb-8">Sign in to your account</p>

          <div className="flex flex-col gap-4">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:border-blue-500"
              placeholder="Email"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:border-blue-500"
              placeholder="Password"
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              onClick={handleSubmit}
              className="bg-blue-600 text-white p-3 rounded-lg w-full font-semibold hover:bg-blue-700 transition"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
