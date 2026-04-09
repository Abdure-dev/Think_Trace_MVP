"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const MAROON = "#800000";
const PURPLE = "#4E2A84";
const MAROON_LIGHT = "rgba(128,0,0,0.08)";
const PURPLE_LIGHT = "rgba(78,42,132,0.08)";

const STAGES = [
  "Understand",
  "Concept",
  "Plan",
  "Attempt",
  "Critique",
  "Reflect",
];
const TIMERS = ["2:47", "3:51", "4:22", "7:14", "3:38", "2:55"];
const OBJECTIVES = [
  "Restate the problem in your own words. Identify what is given, what you need to find, and any constraints. Do NOT solve yet.",
  "Identify the core concepts or theorems that apply. Explain WHY each one is relevant to this specific problem.",
  "Write a numbered step-by-step plan before solving. Be specific — each step must be actionable.",
  "Execute your plan step by step. Show ALL your work. Explain every step as you go.",
  "Examine your solution critically. What could go wrong? What edge cases exist?",
  "What did you learn? What is the key insight? How does this connect to what you already know?",
];
const CONVERSATIONS = [
  [
    {
      r: "student",
      t: "This problem asks me to find the time complexity of T(n) = 2T(n/2) + n. The input is split into 2 halves each of size n/2, and we do n work at each level.",
    },
    {
      r: "ai",
      t: 'Good restatement. What does the "2T(n/2)" part specifically tell you about how the algorithm divides the problem?',
    },
    {
      r: "student",
      t: "It means we always split into exactly 2 sub-problems, each half the size of the original.",
    },
  ],
  [
    {
      r: "student",
      t: "This matches the Master Theorem form T(n) = aT(n/b) + f(n) with a=2, b=2, f(n)=n.",
    },
    {
      r: "ai",
      t: "Which case of the Master Theorem applies here — and what is your reasoning for that choice?",
    },
    {
      r: "student",
      t: "log_b(a) = log_2(2) = 1. f(n) = n = Θ(n¹), so f(n) = Θ(n^log_b(a)). That's Case 2.",
    },
  ],
  [
    {
      r: "student",
      t: "1. Identify a, b, f(n)\n2. Compute log_b(a)\n3. Compare f(n) to n^log_b(a)\n4. Apply the matching case\n5. State the result in Θ notation",
    },
    {
      r: "ai",
      t: "Clear plan. Before you execute — how will you verify which case applies without just pattern matching?",
    },
  ],
  [
    {
      r: "student",
      t: "a=2, b=2, f(n)=n. log_2(2)=1. f(n)=Θ(n^1). Case 2 applies → T(n) = Θ(n log n).",
    },
    {
      r: "ai",
      t: "Correct result. Now explain in your own words WHY Case 2 produces that extra log factor.",
    },
  ],
  [
    {
      r: "student",
      t: "My solution assumes n is a power of 2. It also assumes the Master Theorem conditions hold: a≥1, b>1, f(n) positive.",
    },
    {
      r: "ai",
      t: "Good critical thinking. When would the Master Theorem completely fail to apply to a recurrence of this form?",
    },
  ],
  [
    {
      r: "student",
      t: "I learned that when work per level equals the branching factor, we get Θ(n log n). The log factor comes from the recursion depth.",
    },
    {
      r: "ai",
      t: "That's precise. How would you quickly recognize this pattern in a new problem you've never seen before?",
    },
  ],
];

const STUDENTS = [
  {
    n: "Amir Hassan",
    i: "AH",
    c: MAROON,
    s: 5,
    t: "The recurrence splits into 2 sub-problems each of size n/2. The n term at each level gives us the log factor...",
  },
  {
    n: "Sara Chen",
    i: "SC",
    c: PURPLE,
    s: 3,
    t: "I need Master Theorem. a=2, b=2, log_b(a)=1. Comparing f(n)=n to n^1 shows this is Case 2...",
  },
  {
    n: "Marcus Webb",
    i: "MW",
    c: "#1e2a4a",
    s: 2,
    t: "This is divide and conquer. The algorithm splits the input in half at every step of the recursion...",
  },
  {
    n: "Lena Okafor",
    i: "LO",
    c: "#2d6a4f",
    s: 1,
    t: "T(n) = 2T(n/2) + n means we divide into 2 halves and do n additional work at each level...",
  },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [demoView, setDemoView] = useState<"student" | "instructor">("student");
  const [demoStage, setDemoStage] = useState(0);
  const [visibleBubbles, setVisibleBubbles] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setDemoStage((s) => (s + 1) % STAGES.length);
      setVisibleBubbles(0);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setVisibleBubbles(0);
    const convos = CONVERSATIONS[demoStage];
    convos.forEach((_, i) => {
      setTimeout(
        () => setVisibleBubbles((v) => Math.max(v, i + 1)),
        i * 900 + 400
      );
    });
  }, [demoStage]);

  function StudentDemo() {
    const convos = CONVERSATIONS[demoStage];
    return (
      <div style={{ display: "flex", minHeight: "360px" }}>
        {/* Sidebar — Northwestern Purple */}
        <div
          style={{
            width: "148px",
            background: PURPLE,
            padding: "16px 12px",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                width: "24px",
                height: "24px",
                background: MAROON,
                borderRadius: "5px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  color: "white",
                  fontWeight: 700,
                  fontSize: "12px",
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
                fontSize: "13px",
                fontFamily: "system-ui",
              }}
            >
              ThinkTrace
            </span>
          </div>
          <div
            style={{
              fontSize: "9px",
              color: "rgba(255,255,255,0.5)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontWeight: 600,
              marginBottom: "8px",
              fontFamily: "system-ui",
            }}
          >
            Stages
          </div>
          {STAGES.map((s, i) => (
            <div
              key={s}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                padding: "6px 8px",
                borderRadius: "8px",
                marginBottom: "2px",
                background:
                  i === demoStage ? "rgba(255,255,255,0.2)" : "transparent",
                transition: "all 0.4s",
              }}
            >
              <div
                style={{
                  width: "17px",
                  height: "17px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "9px",
                  fontWeight: 700,
                  flexShrink: 0,
                  fontFamily: "system-ui",
                  transition: "all 0.4s",
                  background:
                    i < demoStage
                      ? "#4ade80"
                      : i === demoStage
                      ? MAROON
                      : "rgba(255,255,255,0.15)",
                  color: "white",
                }}
              >
                {i < demoStage ? "✓" : i + 1}
              </div>
              <span
                style={{
                  fontSize: "11px",
                  fontFamily: "system-ui",
                  color:
                    i < demoStage
                      ? "#4ade80"
                      : i === demoStage
                      ? "white"
                      : "rgba(255,255,255,0.4)",
                  fontWeight: i === demoStage ? 600 : 400,
                  transition: "all 0.4s",
                }}
              >
                {s}
              </span>
            </div>
          ))}
        </div>

        {/* Main panel */}
        <div
          style={{
            flex: 1,
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {/* Problem */}
          <div
            style={{
              background: "#faf9f7",
              borderRadius: "8px",
              padding: "10px 12px",
              border: "1px solid rgba(26,18,8,0.06)",
            }}
          >
            <div
              style={{
                fontSize: "10px",
                fontWeight: 700,
                background: `linear-gradient(90deg, ${MAROON}, ${PURPLE})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: "4px",
                fontFamily: "system-ui",
              }}
            >
              Problem 1(a)
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "#1a1208",
                lineHeight: 1.5,
                fontFamily: "system-ui",
              }}
            >
              Solve T(n) = 2T(n/2) + n using the Master Theorem. Express in Θ
              notation.
            </div>
          </div>

          {/* Stage header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "#1a1208",
                fontFamily: "system-ui",
              }}
            >
              {STAGES[demoStage]}
            </span>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                padding: "3px 8px",
                borderRadius: "20px",
                background: "#fff3e0",
                color: "#e65100",
                fontFamily: "system-ui",
              }}
            >
              {TIMERS[demoStage]} remaining
            </span>
          </div>

          {/* Objective */}
          <div
            style={{
              background: PURPLE_LIGHT,
              border: `1px solid rgba(78,42,132,0.15)`,
              borderRadius: "8px",
              padding: "8px 10px",
            }}
          >
            <div
              style={{
                fontSize: "9px",
                fontWeight: 700,
                color: PURPLE,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: "3px",
                fontFamily: "system-ui",
              }}
            >
              Objective
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "#3b1e6e",
                lineHeight: 1.4,
                fontFamily: "system-ui",
              }}
            >
              {OBJECTIVES[demoStage]}
            </div>
          </div>

          {/* Progress bar — maroon to purple gradient */}
          <div
            style={{
              height: "3px",
              background: "#f0ece6",
              borderRadius: "2px",
            }}
          >
            <div
              style={{
                height: "100%",
                borderRadius: "2px",
                width: `${(demoStage / STAGES.length) * 100}%`,
                background: `linear-gradient(90deg, ${MAROON}, ${PURPLE})`,
                transition: "width 0.8s ease",
              }}
            />
          </div>

          {/* Chat bubbles */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "7px",
              flex: 1,
            }}
          >
            {convos.slice(0, visibleBubbles).map((msg, i) => (
              <div
                key={i}
                style={{
                  padding: "8px 10px",
                  borderRadius: "8px",
                  fontSize: "11px",
                  lineHeight: 1.5,
                  fontFamily: "system-ui",
                  marginLeft: msg.r === "student" ? "20px" : "0",
                  marginRight: msg.r === "ai" ? "20px" : "0",
                  background: msg.r === "student" ? "#f3f4f6" : PURPLE_LIGHT,
                  border:
                    msg.r === "student"
                      ? "1px solid #e5e7eb"
                      : `1px solid rgba(78,42,132,0.15)`,
                  color: msg.r === "student" ? "#374151" : "#3b1e6e",
                  animation: "fadeUp 0.4s ease",
                }}
              >
                <div
                  style={{
                    fontSize: "9px",
                    fontWeight: 700,
                    marginBottom: "3px",
                    color: msg.r === "student" ? "#9ca3af" : PURPLE,
                  }}
                >
                  {msg.r === "student" ? "You" : "ThinkTrace AI"}
                </div>
                {msg.t}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function InstructorDemo() {
    return (
      <div style={{ padding: "16px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "14px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "#1a1208",
                fontFamily: "system-ui",
              }}
            >
              CSCI 301 — Problem Set 3
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "#8a7a6a",
                fontFamily: "system-ui",
              }}
            >
              Real-time student reasoning traces
            </div>
          </div>
          <div
            style={{
              background: `linear-gradient(135deg, ${MAROON}, ${PURPLE})`,
              color: "white",
              fontSize: "11px",
              fontWeight: 600,
              padding: "5px 12px",
              borderRadius: "20px",
              fontFamily: "system-ui",
            }}
          >
            Live
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: "8px",
            marginBottom: "14px",
          }}
        >
          {[
            { n: "24", l: "Students active", c: "#1a1208" },
            { n: "18", l: "On track", c: "#16a34a" },
            { n: "6", l: "Need attention", c: MAROON },
          ].map((s) => (
            <div
              key={s.l}
              style={{
                background: "#faf9f7",
                borderRadius: "8px",
                padding: "10px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: s.c,
                  fontFamily: "system-ui",
                }}
              >
                {s.n}
              </div>
              <div
                style={{
                  fontSize: "10px",
                  color: "#8a7a6a",
                  marginTop: "2px",
                  fontFamily: "system-ui",
                }}
              >
                {s.l}
              </div>
            </div>
          ))}
        </div>

        {STUDENTS.map((s) => (
          <div
            key={s.n}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              padding: "8px 10px",
              borderRadius: "8px",
              marginBottom: "6px",
              background: "#faf9f7",
            }}
          >
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: s.c,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "11px",
                fontWeight: 700,
                color: "white",
                flexShrink: 0,
                fontFamily: "system-ui",
              }}
            >
              {s.i}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#1a1208",
                  fontFamily: "system-ui",
                }}
              >
                {s.n}
              </div>
              <div
                style={{
                  fontSize: "10px",
                  color: "#8a7a6a",
                  marginBottom: "4px",
                  fontFamily: "system-ui",
                }}
              >
                {STAGES[s.s]} stage
              </div>
              <div style={{ display: "flex", gap: "3px" }}>
                {STAGES.map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: "14px",
                      height: "14px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "8px",
                      fontWeight: 700,
                      fontFamily: "system-ui",
                      background:
                        i < s.s
                          ? `linear-gradient(135deg, ${MAROON}, ${PURPLE})`
                          : i === s.s
                          ? PURPLE
                          : "#e5e0d8",
                      color: i <= s.s ? "white" : "#8a7a6a",
                    }}
                  >
                    {i < s.s ? "✓" : i + 1}
                  </div>
                ))}
              </div>
              <div
                style={{
                  fontSize: "10px",
                  color: "#6b5a4a",
                  background: "white",
                  border: "1px solid #e5e0d8",
                  borderRadius: "6px",
                  padding: "5px 8px",
                  marginTop: "5px",
                  fontStyle: "italic",
                  lineHeight: 1.4,
                  fontFamily: "system-ui",
                }}
              >
                "{s.t.slice(0, 80)}..."
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      style={{
        fontFamily: "'Georgia', 'Times New Roman', serif",
        background: "#faf9f7",
        minHeight: "100vh",
        color: "#1a1208",
      }}
    >
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes float { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        .gradient-text {
          background: linear-gradient(135deg, ${MAROON} 0%, ${PURPLE} 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .shimmer-text {
          background: linear-gradient(90deg, ${MAROON} 0%, ${PURPLE} 40%, ${MAROON} 80%, ${PURPLE} 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }
        .cta-primary {
          background: linear-gradient(135deg, ${MAROON} 0%, ${PURPLE} 100%);
          color: white;
          padding: 16px 40px;
          border-radius: 8px;
          font-size: 16px;
          text-decoration: none;
          font-family: system-ui;
          font-weight: 700;
          display: inline-block;
          transition: opacity 0.2s;
        }
        .cta-primary:hover { opacity: 0.9; }
        .cta-secondary {
          background: white;
          color: #1a1208;
          padding: 16px 40px;
          border-radius: 8px;
          font-size: 16px;
          text-decoration: none;
          font-family: system-ui;
          font-weight: 500;
          border: 1px solid rgba(26,18,8,0.15);
          display: inline-block;
          transition: all 0.2s;
        }
        .cta-secondary:hover { border-color: ${PURPLE}; color: ${PURPLE}; }
        .feature-card:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(78,42,132,0.1); }
        .feature-card { transition: all 0.2s; }
      `}</style>

      {/* Nav */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: scrolled ? "rgba(250,249,247,0.95)" : "transparent",
          backdropFilter: scrolled ? "blur(8px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(128,0,0,0.1)" : "none",
          transition: "all 0.3s ease",
          padding: "0 48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "68px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              background: `linear-gradient(135deg, ${MAROON}, ${PURPLE})`,
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                color: "white",
                fontWeight: 700,
                fontSize: "16px",
                fontFamily: "Georgia, serif",
              }}
            >
              T
            </span>
          </div>
          <span
            style={{
              fontWeight: 700,
              fontSize: "18px",
              letterSpacing: "-0.02em",
              color: "#1a1208",
            }}
          >
            ThinkTrace
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
          <a
            href="#features"
            style={{
              fontSize: "14px",
              color: "#5a4a3a",
              textDecoration: "none",
              fontFamily: "system-ui",
            }}
          >
            Features
          </a>
          <a
            href="#how-it-works"
            style={{
              fontSize: "14px",
              color: "#5a4a3a",
              textDecoration: "none",
              fontFamily: "system-ui",
            }}
          >
            How it works
          </a>
          <Link
            href="/login"
            style={{
              fontSize: "14px",
              color: "#5a4a3a",
              textDecoration: "none",
              fontFamily: "system-ui",
            }}
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            style={{
              background: `linear-gradient(135deg, ${MAROON}, ${PURPLE})`,
              color: "white",
              padding: "8px 20px",
              borderRadius: "6px",
              fontSize: "14px",
              textDecoration: "none",
              fontFamily: "system-ui",
              fontWeight: 600,
            }}
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "120px 48px 80px",
          position: "relative",
          overflow: "hidden",
          textAlign: "center",
        }}
      >
        {/* Background elements */}
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          {/* Grid */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0.025,
              backgroundImage: `repeating-linear-gradient(0deg, ${PURPLE} 0px, ${PURPLE} 1px, transparent 1px, transparent 60px), repeating-linear-gradient(90deg, ${MAROON} 0px, ${MAROON} 1px, transparent 1px, transparent 60px)`,
            }}
          />
          {/* Maroon glow left */}
          <div
            style={{
              position: "absolute",
              top: "20%",
              left: "-10%",
              width: "500px",
              height: "500px",
              borderRadius: "50%",
              background: `radial-gradient(circle, rgba(128,0,0,0.08) 0%, transparent 70%)`,
            }}
          />
          {/* Purple glow right */}
          <div
            style={{
              position: "absolute",
              top: "10%",
              right: "-10%",
              width: "500px",
              height: "500px",
              borderRadius: "50%",
              background: `radial-gradient(circle, rgba(78,42,132,0.08) 0%, transparent 70%)`,
            }}
          />
          {/* Bottom blend */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "200px",
              background: "linear-gradient(to bottom, transparent, #faf9f7)",
            }}
          />
        </div>

        {/* University badges */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            gap: "12px",
            marginBottom: "40px",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "white",
              border: `1px solid rgba(128,0,0,0.15)`,
              borderRadius: "100px",
              padding: "5px 14px",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: MAROON,
              }}
            />
            <span
              style={{
                fontSize: "12px",
                color: MAROON,
                fontFamily: "system-ui",
                fontWeight: 600,
              }}
            >
              University of Chicago
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "white",
              border: `1px solid rgba(78,42,132,0.15)`,
              borderRadius: "100px",
              padding: "5px 14px",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: PURPLE,
              }}
            />
            <span
              style={{
                fontSize: "12px",
                color: PURPLE,
                fontFamily: "system-ui",
                fontWeight: 600,
              }}
            >
              Northwestern University
            </span>
          </div>
        </div>

        <div style={{ position: "relative", zIndex: 1, maxWidth: "860px" }}>
          {/* Eyebrow */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(78,42,132,0.06)",
              border: "1px solid rgba(78,42,132,0.15)",
              borderRadius: "100px",
              padding: "6px 16px",
              marginBottom: "32px",
            }}
          >
            <div
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${MAROON}, ${PURPLE})`,
              }}
            />
            <span
              style={{
                fontSize: "13px",
                color: PURPLE,
                fontFamily: "system-ui",
                fontWeight: 500,
                letterSpacing: "0.03em",
              }}
            >
              AI governance for universities
            </span>
          </div>

          {/* Main headline */}
          <h1
            style={{
              fontSize: "clamp(52px, 9vw, 96px)",
              lineHeight: 1.0,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              marginBottom: "12px",
              color: "#1a1208",
            }}
          >
            AI that makes you
          </h1>
          <h1
            className="shimmer-text"
            style={{
              fontSize: "clamp(52px, 9vw, 96px)",
              lineHeight: 1.0,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              marginBottom: "32px",
            }}
          >
            think, not just answer.
          </h1>

          {/* Subheadline */}
          <p
            style={{
              fontSize: "20px",
              lineHeight: 1.75,
              color: "#5a4a3a",
              marginBottom: "24px",
              maxWidth: "620px",
              margin: "0 auto 24px",
              fontFamily: "system-ui",
              fontWeight: 400,
            }}
          >
            ThinkTrace won't do the work for you. It structures your thinking
            through six rigorous stages — so you genuinely understand, not just
            submit.
          </p>

          {/* Secondary line */}
          <p
            style={{
              fontSize: "15px",
              lineHeight: 1.6,
              marginBottom: "48px",
              maxWidth: "520px",
              margin: "0 auto 48px",
              fontFamily: "system-ui",
              fontWeight: 400,
            }}
          >
            <span style={{ color: MAROON, fontWeight: 600 }}>For students</span>
            <span style={{ color: "#8a7a6a" }}>
              {" "}
              who want to actually learn.{" "}
            </span>
            <span style={{ color: PURPLE, fontWeight: 600 }}>
              For instructors
            </span>
            <span style={{ color: "#8a7a6a" }}>
              {" "}
              who want to verify they did.
            </span>
          </p>

          {/* CTAs */}
          <div
            style={{
              display: "flex",
              gap: "16px",
              justifyContent: "center",
              flexWrap: "wrap",
              marginBottom: "80px",
            }}
          >
            <Link href="/signup" className="cta-primary">
              Start thinking →
            </Link>
            <a href="#how-it-works" className="cta-secondary">
              See how it works
            </a>
          </div>
        </div>

        {/* Animated Demo */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            maxWidth: "780px",
          }}
        >
          {/* Toggle */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              justifyContent: "center",
              marginBottom: "14px",
            }}
          >
            {[
              { label: "Student view", key: "student" },
              { label: "Instructor view", key: "instructor" },
            ].map((v) => (
              <button
                key={v.key}
                onClick={() => setDemoView(v.key as any)}
                style={{
                  padding: "7px 18px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "system-ui",
                  transition: "all 0.2s",
                  background:
                    demoView === v.key
                      ? `linear-gradient(135deg, ${MAROON}, ${PURPLE})`
                      : "white",
                  color: demoView === v.key ? "white" : "#5a4a3a",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                }}
              >
                {v.label}
              </button>
            ))}
          </div>

          {/* Window */}
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              border: "1px solid rgba(26,18,8,0.08)",
              boxShadow: "0 24px 64px rgba(78,42,132,0.1)",
              overflow: "hidden",
            }}
          >
            {/* Titlebar */}
            <div
              style={{
                background: "#f5f3f0",
                padding: "10px 14px",
                borderBottom: "1px solid rgba(26,18,8,0.06)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: "#ffbd44",
                }}
              />
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: "#00ca56",
                }}
              />
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: "#ff605c",
                }}
              />
              <span
                style={{
                  marginLeft: "8px",
                  fontSize: "12px",
                  color: "#8a7a6a",
                  fontFamily: "system-ui",
                }}
              >
                {demoView === "student"
                  ? "ThinkTrace — Reasoning Workspace"
                  : "ThinkTrace — Instructor Dashboard"}
              </span>
            </div>
            {demoView === "student" ? <StudentDemo /> : <InstructorDemo />}
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        style={{ padding: "120px 48px", background: "white" }}
      >
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "72px" }}>
            <p
              style={{
                fontSize: "13px",
                fontFamily: "system-ui",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: "16px",
                background: `linear-gradient(135deg, ${MAROON}, ${PURPLE})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Why ThinkTrace
            </p>
            <h2
              style={{
                fontSize: "clamp(32px, 5vw, 52px)",
                fontWeight: 700,
                letterSpacing: "-0.025em",
                lineHeight: 1.1,
                color: "#1a1208",
              }}
            >
              Built for learning,
              <br />
              not shortcuts.
            </h2>
            <p
              style={{
                fontSize: "18px",
                color: "#5a4a3a",
                fontFamily: "system-ui",
                marginTop: "16px",
                maxWidth: "560px",
                margin: "16px auto 0",
                lineHeight: 1.7,
              }}
            >
              ThinkTrace won't write your essay or solve your problem set. It
              will make sure you do — and that you actually understand what
              you're doing.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "2px",
              background: "rgba(26,18,8,0.06)",
              borderRadius: "16px",
              overflow: "hidden",
            }}
          >
            {[
              {
                icon: "⟳",
                title: "Six structured stages",
                body: "Every problem goes through Understand, Concept, Plan, Attempt, Critique, and Reflect. You cannot skip. You cannot rush. Each stage has a clear objective you must meet before advancing.",
                accent: MAROON,
              },
              {
                icon: "◎",
                title: "AI that questions, not answers",
                body: "ThinkTrace never gives you the solution. It asks five targeted Socratic questions per stage — pushing you to demonstrate genuine understanding before you move on.",
                accent: PURPLE,
              },
              {
                icon: "◈",
                title: "Self-governance modes",
                body: "Students set their own AI level — Deep Focus (no AI), Guided (Socratic only), or Open (collaborative). Your reasoning, your rules. Every interaction is still traced.",
                accent: MAROON,
              },
              {
                icon: "⊞",
                title: "Instructor governance",
                body: "Instructors set AI intervention levels per course. Full visibility into every student's reasoning trace — not just the final answer, but every step of their thinking.",
                accent: PURPLE,
              },
              {
                icon: "⊡",
                title: "PDF and image upload",
                body: "Upload any assignment — PDF, image, or text. ThinkTrace extracts every problem and sub-part automatically, creating individual structured workspaces for each.",
                accent: MAROON,
              },
              {
                icon: "⊟",
                title: "Complete reasoning traces",
                body: "Every keystroke is timestamped and recorded across all six stages. Instructors see exactly where students struggled, where they succeeded, and where they guessed.",
                accent: PURPLE,
              },
            ].map((f) => (
              <div
                key={f.title}
                className="feature-card"
                style={{ background: "white", padding: "40px 36px" }}
              >
                <div
                  style={{
                    fontSize: "24px",
                    marginBottom: "16px",
                    color: f.accent,
                  }}
                >
                  {f.icon}
                </div>
                <div
                  style={{
                    width: "32px",
                    height: "3px",
                    borderRadius: "2px",
                    background: `linear-gradient(90deg, ${MAROON}, ${PURPLE})`,
                    marginBottom: "16px",
                  }}
                />
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: 700,
                    letterSpacing: "-0.015em",
                    marginBottom: "12px",
                    color: "#1a1208",
                  }}
                >
                  {f.title}
                </h3>
                <p
                  style={{
                    fontSize: "15px",
                    lineHeight: 1.7,
                    color: "#6b5a4a",
                    fontFamily: "system-ui",
                    margin: 0,
                  }}
                >
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        style={{ padding: "120px 48px", background: "#faf9f7" }}
      >
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "72px" }}>
            <p
              style={{
                fontSize: "13px",
                fontFamily: "system-ui",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: "16px",
                background: `linear-gradient(135deg, ${MAROON}, ${PURPLE})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              How it works
            </p>
            <h2
              style={{
                fontSize: "clamp(32px, 5vw, 52px)",
                fontWeight: 700,
                letterSpacing: "-0.025em",
                lineHeight: 1.1,
                color: "#1a1208",
              }}
            >
              Your thinking, fully traced.
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {[
              {
                num: "01",
                title: "Upload or create a workspace",
                body: "Instructors upload assignments — PDF, image, or text — and ThinkTrace extracts every problem automatically. Students can also create personal workspaces for any content they want to work through on their own terms.",
                color: MAROON,
              },
              {
                num: "02",
                title: "Work through six structured stages",
                body: "Every problem is broken into six stages: Understand, Concept, Plan, Attempt, Critique, Reflect. Each has a clear objective. You must meet it before advancing. Copy-paste is disabled. Every keystroke is traced.",
                color: PURPLE,
              },
              {
                num: "03",
                title: "AI guides — it never does the work",
                body: "The Socratic tutor asks five targeted questions per stage. It will redirect you if you skip ahead. It will push back if your reasoning is shallow. It will never give you the answer.",
                color: MAROON,
              },
              {
                num: "04",
                title: "Everything is recorded",
                body: "Students see their full reasoning arc across every stage. Instructors see every student's complete trace — timestamped, stage by stage, problem by problem. No hiding, no guessing, no shortcuts.",
                color: PURPLE,
              },
            ].map((step, i) => (
              <div
                key={step.num}
                style={{
                  display: "flex",
                  gap: "40px",
                  padding: "48px 0",
                  borderBottom: i < 3 ? "1px solid rgba(26,18,8,0.08)" : "none",
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    fontSize: "13px",
                    fontFamily: "system-ui",
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    minWidth: "32px",
                    paddingTop: "4px",
                    color: step.color,
                  }}
                >
                  {step.num}
                </div>
                <div style={{ flex: 1 }}>
                  <h3
                    style={{
                      fontSize: "22px",
                      fontWeight: 700,
                      letterSpacing: "-0.02em",
                      marginBottom: "12px",
                      color: "#1a1208",
                    }}
                  >
                    {step.title}
                  </h3>
                  <p
                    style={{
                      fontSize: "16px",
                      lineHeight: 1.7,
                      color: "#6b5a4a",
                      fontFamily: "system-ui",
                      margin: 0,
                    }}
                  >
                    {step.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          padding: "120px 48px",
          background: `linear-gradient(135deg, ${MAROON} 0%, #5c1a5c 50%, ${PURPLE} 100%)`,
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `radial-gradient(circle at 30% 50%, rgba(255,255,255,0.05) 0%, transparent 60%), radial-gradient(circle at 70% 50%, rgba(255,255,255,0.03) 0%, transparent 60%)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.04,
            backgroundImage: `repeating-linear-gradient(0deg, white 0px, white 1px, transparent 1px, transparent 60px), repeating-linear-gradient(90deg, white 0px, white 1px, transparent 1px, transparent 60px)`,
          }}
        />
        <div
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: "640px",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "center",
              marginBottom: "40px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "rgba(255,255,255,0.12)",
                borderRadius: "100px",
                padding: "5px 14px",
              }}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.6)",
                }}
              />
              <span
                style={{
                  fontSize: "12px",
                  color: "rgba(255,255,255,0.8)",
                  fontFamily: "system-ui",
                  fontWeight: 600,
                }}
              >
                University of Chicago
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "rgba(255,255,255,0.12)",
                borderRadius: "100px",
                padding: "5px 14px",
              }}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.6)",
                }}
              />
              <span
                style={{
                  fontSize: "12px",
                  color: "rgba(255,255,255,0.8)",
                  fontFamily: "system-ui",
                  fontWeight: 600,
                }}
              >
                Northwestern University
              </span>
            </div>
          </div>
          <h2
            style={{
              fontSize: "clamp(36px, 6vw, 64px)",
              fontWeight: 700,
              letterSpacing: "-0.025em",
              lineHeight: 1.05,
              color: "white",
              marginBottom: "24px",
            }}
          >
            Stop submitting.
            <br />
            Start understanding.
          </h2>
          <p
            style={{
              fontSize: "18px",
              lineHeight: 1.7,
              color: "rgba(255,255,255,0.7)",
              marginBottom: "48px",
              fontFamily: "system-ui",
            }}
          >
            ThinkTrace is for students who want to actually learn — and
            instructors who want to know they did.
          </p>
          <div
            style={{
              display: "flex",
              gap: "16px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/signup"
              style={{
                background: "white",
                color: MAROON,
                padding: "16px 40px",
                borderRadius: "8px",
                fontSize: "16px",
                textDecoration: "none",
                fontFamily: "system-ui",
                fontWeight: 700,
                display: "inline-block",
                transition: "opacity 0.2s",
              }}
            >
              Start for free
            </Link>
            <Link
              href="/login"
              style={{
                background: "transparent",
                color: "rgba(255,255,255,0.8)",
                padding: "16px 40px",
                borderRadius: "8px",
                fontSize: "16px",
                textDecoration: "none",
                fontFamily: "system-ui",
                fontWeight: 500,
                border: "1px solid rgba(255,255,255,0.3)",
                display: "inline-block",
              }}
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: "40px 48px",
          background: "#0f0a05",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "24px",
              height: "24px",
              background: `linear-gradient(135deg, ${MAROON}, ${PURPLE})`,
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ color: "white", fontWeight: 700, fontSize: "12px" }}>
              T
            </span>
          </div>
          <span
            style={{
              color: "rgba(255,255,255,0.4)",
              fontSize: "14px",
              fontFamily: "system-ui",
            }}
          >
            ThinkTrace © 2026
          </span>
          <span
            style={{
              color: "rgba(255,255,255,0.2)",
              fontSize: "12px",
              fontFamily: "system-ui",
            }}
          >
            · Built at UChicago & Northwestern
          </span>
        </div>
        <div style={{ display: "flex", gap: "24px" }}>
          <Link
            href="/login"
            style={{
              color: "rgba(255,255,255,0.3)",
              fontSize: "13px",
              textDecoration: "none",
              fontFamily: "system-ui",
            }}
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            style={{
              color: "rgba(255,255,255,0.3)",
              fontSize: "13px",
              textDecoration: "none",
              fontFamily: "system-ui",
            }}
          >
            Sign up
          </Link>
        </div>
      </footer>
    </div>
  );
}
