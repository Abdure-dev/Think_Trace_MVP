"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const MAROON = "#800000";
const PURPLE = "#4E2A84";
const GRAD = `linear-gradient(135deg, ${MAROON}, ${PURPLE})`;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError("");
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    if (!password.trim()) {
      setError("Password is required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Invalid email or password.");
      }
      const token = await res.json();
      localStorage.setItem("token", token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSubmit();
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        fontFamily: "system-ui, sans-serif",
        background: "#f8f9fc",
      }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        .input-field:focus { border-color: ${PURPLE} !important; box-shadow: 0 0 0 3px rgba(78,42,132,0.08); outline: none; }
        .sign-in-btn:hover { opacity: 0.9; }
        .sign-in-btn:active { transform: scale(0.99); }
      `}</style>

      {/* Left panel */}
      <div
        style={{
          width: "45%",
          minHeight: "100vh",
          background: `linear-gradient(160deg, ${PURPLE} 0%, #2a0f50 50%, ${MAROON} 100%)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 48px",
          position: "relative",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {/* Background grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.05,
            backgroundImage: `repeating-linear-gradient(0deg, white 0px, white 1px, transparent 1px, transparent 60px), repeating-linear-gradient(90deg, white 0px, white 1px, transparent 1px, transparent 60px)`,
          }}
        />
        {/* Glow */}
        <div
          style={{
            position: "absolute",
            top: "20%",
            left: "10%",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "10%",
            right: "10%",
            width: "200px",
            height: "200px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)",
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            maxWidth: "340px",
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "48px",
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "10px",
                background: "rgba(255,255,255,0.15)",
                backdropFilter: "blur(8px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              <span
                style={{
                  color: "white",
                  fontWeight: 700,
                  fontSize: "20px",
                  fontFamily: "Georgia, serif",
                }}
              >
                T
              </span>
            </div>
            <span
              style={{
                color: "white",
                fontWeight: 700,
                fontSize: "22px",
                letterSpacing: "-0.02em",
                fontFamily: "Georgia, serif",
              }}
            >
              ThinkTrace
            </span>
          </div>

          {/* Headline */}
          <h1
            style={{
              color: "white",
              fontSize: "36px",
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              marginBottom: "16px",
              fontFamily: "Georgia, serif",
            }}
          >
            AI that makes you
            <br />
            <span
              style={{
                background:
                  "linear-gradient(90deg, rgba(255,255,255,0.9), rgba(255,255,255,0.6))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              think deeper.
            </span>
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: "15px",
              lineHeight: 1.7,
              marginBottom: "40px",
            }}
          >
            Six structured stages. Socratic guidance. Complete reasoning traces.
            ThinkTrace won't do the work for you.
          </p>

          {/* Features */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {[
              { icon: "⟳", text: "Six structured reasoning stages" },
              { icon: "◎", text: "Socratic AI that questions, not answers" },
              {
                icon: "◈",
                text: "Self-governance — your AI level, your rules",
              },
              { icon: "⊞", text: "Instructor visibility into every trace" },
            ].map((f) => (
              <div
                key={f.text}
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "7px",
                    background: "rgba(255,255,255,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px" }}
                  >
                    {f.icon}
                  </span>
                </div>
                <span
                  style={{
                    color: "rgba(255,255,255,0.7)",
                    fontSize: "13px",
                    lineHeight: 1.4,
                  }}
                >
                  {f.text}
                </span>
              </div>
            ))}
          </div>

          {/* University badges */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              marginTop: "40px",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "rgba(255,255,255,0.1)",
                borderRadius: "100px",
                padding: "4px 12px",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              <div
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.6)",
                }}
              />
              <span
                style={{
                  fontSize: "11px",
                  color: "rgba(255,255,255,0.7)",
                  fontWeight: 600,
                }}
              >
                UChicago
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "rgba(255,255,255,0.1)",
                borderRadius: "100px",
                padding: "4px 12px",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              <div
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.6)",
                }}
              />
              <span
                style={{
                  fontSize: "11px",
                  color: "rgba(255,255,255,0.7)",
                  fontWeight: 600,
                }}
              >
                Northwestern
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 32px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "420px",
            animation: "fadeIn 0.4s ease",
          }}
        >
          {/* Back to landing */}
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              color: "#8a7a6a",
              textDecoration: "none",
              marginBottom: "32px",
            }}
          >
            ← Back to home
          </Link>

          <div style={{ marginBottom: "32px" }}>
            <h2
              style={{
                fontSize: "28px",
                fontWeight: 700,
                color: "#1a1208",
                letterSpacing: "-0.02em",
                margin: "0 0 6px",
                fontFamily: "Georgia, serif",
              }}
            >
              Welcome back
            </h2>
            <p style={{ color: "#8a7a6a", fontSize: "15px", margin: 0 }}>
              Sign in to your ThinkTrace account
            </p>
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {/* Email */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#5a4a3a",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: "7px",
                }}
              >
                Email
              </label>
              <input
                className="input-field"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="your@email.com"
                style={{
                  width: "100%",
                  border: "1.5px solid #e5e0d8",
                  borderRadius: "10px",
                  padding: "12px 14px",
                  fontSize: "14px",
                  color: "#1a1208",
                  background: "white",
                  transition: "all 0.15s",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Password */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#5a4a3a",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: "7px",
                }}
              >
                Password
              </label>
              <input
                className="input-field"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="••••••••"
                style={{
                  width: "100%",
                  border: "1.5px solid #e5e0d8",
                  borderRadius: "10px",
                  padding: "12px 14px",
                  fontSize: "14px",
                  color: "#1a1208",
                  background: "white",
                  transition: "all 0.15s",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Error */}
            {error && (
              <div
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "10px",
                  padding: "10px 14px",
                }}
              >
                <p style={{ color: "#dc2626", fontSize: "13px", margin: 0 }}>
                  {error}
                </p>
              </div>
            )}

            {/* Submit */}
            <button
              className="sign-in-btn"
              onClick={handleSubmit}
              disabled={loading}
              style={{
                width: "100%",
                padding: "13px",
                borderRadius: "10px",
                background: GRAD,
                color: "white",
                fontSize: "15px",
                fontWeight: 600,
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                transition: "all 0.15s",
                marginTop: "4px",
              }}
            >
              {loading ? "Signing in..." : "Sign in →"}
            </button>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ flex: 1, height: "1px", background: "#f0ece6" }} />
              <span style={{ fontSize: "12px", color: "#8a7a6a" }}>or</span>
              <div style={{ flex: 1, height: "1px", background: "#f0ece6" }} />
            </div>

            <p
              style={{
                textAlign: "center",
                fontSize: "14px",
                color: "#8a7a6a",
                margin: 0,
              }}
            >
              Don't have an account?{" "}
              <Link
                href="/signup"
                style={{
                  fontWeight: 700,
                  color: PURPLE,
                  textDecoration: "none",
                }}
              >
                Sign up for free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
