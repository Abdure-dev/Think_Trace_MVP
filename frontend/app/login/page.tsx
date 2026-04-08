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
        className="w-1/2 flex flex-col items-center justify-center p-12"
        style={{ backgroundColor: "#5c0000" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white">
            <span className="font-bold text-xl" style={{ color: "#800000" }}>
              T
            </span>
          </div>
          <span className="text-white font-bold text-3xl tracking-tight">
            ThinkTrace
          </span>
        </div>

        <p className="text-red-200 text-lg text-center mb-12 max-w-xs">
          Guided Problem Solving with AI
        </p>

        {/* Features */}
        <div className="flex flex-col gap-4 w-full max-w-xs">
          {[
            "Structured reasoning stages",
            "Socratic AI guidance",
            "Complete reasoning trace",
            "Instructor oversight",
          ].map((feature) => (
            <div key={feature} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-white bg-opacity-20 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs">✓</span>
              </div>
              <span className="text-red-100 text-sm">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right side — form */}
      <div className="w-1/2 flex items-center justify-center bg-gray-50">
        <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100 w-full max-w-md">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              Welcome back
            </h2>
            <p className="text-gray-500 text-sm">
              Sign in to your ThinkTrace account
            </p>
          </div>

          <div className="flex flex-col gap-5">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                Email
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border border-gray-200 p-3 rounded-xl w-full focus:outline-none focus:ring-2 transition text-gray-800"
                style={{ focusBorderColor: "#800000" }}
                onFocus={(e) => (e.target.style.borderColor = "#800000")}
                onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border border-gray-200 p-3 rounded-xl w-full focus:outline-none transition text-gray-800"
                onFocus={(e) => (e.target.style.borderColor = "#800000")}
                onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              onClick={handleSubmit}
              className="text-white p-3 rounded-xl w-full font-semibold transition hover:opacity-90 mt-2"
              style={{ backgroundColor: "#800000" }}
              onMouseEnter={(e) =>
                ((e.target as HTMLElement).style.backgroundColor = "#5c0000")
              }
              onMouseLeave={(e) =>
                ((e.target as HTMLElement).style.backgroundColor = "#800000")
              }
            >
              Sign In
            </button>

            <p className="text-center text-sm text-gray-400">
              Don't have an account?{" "}
              <span
                className="font-semibold cursor-pointer"
                style={{ color: "#800000" }}
              >
                Sign up for free
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
