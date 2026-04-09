"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const MAROON = "#800000";
const PURPLE = "#4E2A84";
const GRAD = `linear-gradient(135deg, ${MAROON}, ${PURPLE})`;

export default function SignupPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError("");

    // Validate all fields before hitting the API
    if (!firstName.trim()) {
      setError("First name is required.");
      return;
    }
    if (!lastName.trim()) {
      setError("Last name is required.");
      return;
    }
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email.");
      return;
    }
    if (!password.trim()) {
      setError("Password is required.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim().toLowerCase(),
          password,
          role,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Signup failed. Please try again.");
      }
      router.push("/login");
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
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
        .input-field:focus { border-color: ${PURPLE} !important; box-shadow: 0 0 0 3px rgba(78,42,132,0.08); outline: none; }
        .submit-btn:hover { opacity: 0.9; }
        .submit-btn:active { transform: scale(0.99); }
        .role-btn:hover { border-color: ${PURPLE} !important; }
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
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.05,
            backgroundImage: `repeating-linear-gradient(0deg, white 0px, white 1px, transparent 1px, transparent 60px), repeating-linear-gradient(90deg, white 0px, white 1px, transparent 1px, transparent 60px)`,
          }}
        />
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
            position: "relative",
            zIndex: 1,
            width: "100%",
            maxWidth: "340px",
          }}
        >
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

          <h1
            style={{
              color: "white",
              fontSize: "34px",
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              marginBottom: "16px",
              fontFamily: "Georgia, serif",
            }}
          >
            Stop submitting.
            <br />
            <span
              style={{
                background:
                  "linear-gradient(90deg, rgba(255,255,255,0.9), rgba(255,255,255,0.6))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Start understanding.
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
            ThinkTrace structures your thinking through six rigorous stages. For
            students who want to actually learn.
          </p>

          {/* Stage pills */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              marginBottom: "36px",
            }}
          >
            {[
              "Understand",
              "Concept",
              "Plan",
              "Attempt",
              "Critique",
              "Reflect",
            ].map((s, i) => (
              <div
                key={s}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "rgba(255,255,255,0.1)",
                  borderRadius: "100px",
                  padding: "5px 12px",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
              >
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.5)",
                  }}
                >
                  {i + 1}
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    color: "rgba(255,255,255,0.8)",
                    fontWeight: 500,
                  }}
                >
                  {s}
                </span>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
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
          overflowY: "auto",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "440px",
            animation: "fadeIn 0.4s ease",
          }}
        >
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

          <div style={{ marginBottom: "28px" }}>
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
              Create your account
            </h2>
            <p style={{ color: "#8a7a6a", fontSize: "15px", margin: 0 }}>
              Join ThinkTrace today. It's free.
            </p>
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "14px" }}
          >
            {/* Name row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
              }}
            >
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
                  First name
                </label>
                <input
                  className="input-field"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First"
                  style={{
                    width: "100%",
                    border: "1.5px solid #e5e0d8",
                    borderRadius: "10px",
                    padding: "11px 13px",
                    fontSize: "14px",
                    color: "#1a1208",
                    background: "white",
                    boxSizing: "border-box",
                    transition: "all 0.15s",
                  }}
                />
              </div>
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
                  Last name
                </label>
                <input
                  className="input-field"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last"
                  style={{
                    width: "100%",
                    border: "1.5px solid #e5e0d8",
                    borderRadius: "10px",
                    padding: "11px 13px",
                    fontSize: "14px",
                    color: "#1a1208",
                    background: "white",
                    boxSizing: "border-box",
                    transition: "all 0.15s",
                  }}
                />
              </div>
            </div>

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
                placeholder="your@university.edu"
                style={{
                  width: "100%",
                  border: "1.5px solid #e5e0d8",
                  borderRadius: "10px",
                  padding: "11px 13px",
                  fontSize: "14px",
                  color: "#1a1208",
                  background: "white",
                  boxSizing: "border-box",
                  transition: "all 0.15s",
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
                placeholder="At least 6 characters"
                style={{
                  width: "100%",
                  border: "1.5px solid #e5e0d8",
                  borderRadius: "10px",
                  padding: "11px 13px",
                  fontSize: "14px",
                  color: "#1a1208",
                  background: "white",
                  boxSizing: "border-box",
                  transition: "all 0.15s",
                }}
              />
            </div>

            {/* Role */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#5a4a3a",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: "9px",
                }}
              >
                I am a
              </label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                }}
              >
                {[
                  { key: "student", label: "Student", desc: "I want to learn" },
                  {
                    key: "instructor",
                    label: "Instructor",
                    desc: "I teach a course",
                  },
                ].map((r) => (
                  <button
                    key={r.key}
                    className="role-btn"
                    onClick={() => setRole(r.key)}
                    style={{
                      padding: "14px",
                      borderRadius: "12px",
                      border: `1.5px solid ${
                        role === r.key ? PURPLE : "#e5e0d8"
                      }`,
                      background: role === r.key ? `${PURPLE}0d` : "white",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.15s",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "14px",
                        fontWeight: 700,
                        color: role === r.key ? PURPLE : "#1a1208",
                        margin: "0 0 2px",
                      }}
                    >
                      {r.label}
                    </p>
                    <p
                      style={{ fontSize: "12px", color: "#8a7a6a", margin: 0 }}
                    >
                      {r.desc}
                    </p>
                  </button>
                ))}
              </div>
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
              className="submit-btn"
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
              {loading ? "Creating account..." : "Create account →"}
            </button>

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
              Already have an account?{" "}
              <Link
                href="/login"
                style={{
                  fontWeight: 700,
                  color: PURPLE,
                  textDecoration: "none",
                }}
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
