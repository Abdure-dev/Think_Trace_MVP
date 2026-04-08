"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      style={{
        fontFamily: "'Georgia', 'Times New Roman', serif",
        background: "#faf9f7",
        minHeight: "100vh",
        color: "#1a1208",
      }}
    >
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
              background: "#800000",
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
              fontFamily: "system-ui, sans-serif",
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
              fontFamily: "system-ui, sans-serif",
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
              fontFamily: "system-ui, sans-serif",
            }}
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            style={{
              background: "#800000",
              color: "white",
              padding: "8px 20px",
              borderRadius: "6px",
              fontSize: "14px",
              textDecoration: "none",
              fontFamily: "system-ui, sans-serif",
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
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(128,0,0,0.04) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(128,0,0,0.03) 0%, transparent 50%)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
            opacity: 0.025,
            backgroundImage: `repeating-linear-gradient(0deg, #800000 0px, #800000 1px, transparent 1px, transparent 60px),
            repeating-linear-gradient(90deg, #800000 0px, #800000 1px, transparent 1px, transparent 60px)`,
          }}
        />

        <div style={{ position: "relative", zIndex: 1, maxWidth: "800px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(128,0,0,0.06)",
              border: "1px solid rgba(128,0,0,0.15)",
              borderRadius: "100px",
              padding: "6px 16px",
              marginBottom: "40px",
            }}
          >
            <div
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#800000",
              }}
            />
            <span
              style={{
                fontSize: "13px",
                color: "#800000",
                fontFamily: "system-ui, sans-serif",
                fontWeight: 500,
                letterSpacing: "0.03em",
              }}
            >
              AI governance for universities
            </span>
          </div>

          <h1
            style={{
              fontSize: "clamp(48px, 8vw, 88px)",
              lineHeight: 1.05,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              marginBottom: "28px",
              color: "#1a1208",
            }}
          >
            AI that teaches,
            <br />
            <span style={{ color: "#800000" }}>not just answers.</span>
          </h1>

          <p
            style={{
              fontSize: "20px",
              lineHeight: 1.7,
              color: "#5a4a3a",
              marginBottom: "48px",
              maxWidth: "560px",
              margin: "0 auto 48px",
              fontFamily: "system-ui, sans-serif",
              fontWeight: 400,
            }}
          >
            ThinkTrace governs AI usage in university courses — tracing every
            student's reasoning process, enforcing structured thinking, and
            giving instructors full visibility.
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
                background: "#800000",
                color: "white",
                padding: "14px 32px",
                borderRadius: "8px",
                fontSize: "16px",
                textDecoration: "none",
                fontFamily: "system-ui, sans-serif",
                fontWeight: 600,
                display: "inline-block",
              }}
            >
              Start for free
            </Link>
            <a
              href="#how-it-works"
              style={{
                background: "white",
                color: "#1a1208",
                padding: "14px 32px",
                borderRadius: "8px",
                fontSize: "16px",
                textDecoration: "none",
                fontFamily: "system-ui, sans-serif",
                fontWeight: 500,
                border: "1px solid rgba(26,18,8,0.15)",
                display: "inline-block",
              }}
            >
              See how it works
            </a>
          </div>
        </div>

        {/* Product mockup */}
        <div
          style={{
            marginTop: "80px",
            position: "relative",
            zIndex: 1,
            width: "100%",
            maxWidth: "720px",
            background: "white",
            borderRadius: "16px",
            border: "1px solid rgba(26,18,8,0.08)",
            boxShadow:
              "0 24px 64px rgba(128,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              background: "#f5f3f0",
              padding: "12px 16px",
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
                marginLeft: "12px",
                fontSize: "12px",
                color: "#8a7a6a",
                fontFamily: "system-ui, sans-serif",
              }}
            >
              ThinkTrace — Reasoning Workspace
            </span>
          </div>
          <div style={{ display: "flex", minHeight: "280px" }}>
            <div
              style={{
                width: "160px",
                background: "#1e2a4a",
                padding: "20px 16px",
                flexShrink: 0,
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
                    gap: "8px",
                    padding: "8px 10px",
                    borderRadius: "8px",
                    marginBottom: "4px",
                    background:
                      i === 0 ? "rgba(255,255,255,0.15)" : "transparent",
                  }}
                >
                  <div
                    style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      background: i === 0 ? "white" : "rgba(255,255,255,0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "10px",
                      fontFamily: "system-ui, sans-serif",
                      color: i === 0 ? "#1e2a4a" : "rgba(255,255,255,0.6)",
                      fontWeight: 600,
                    }}
                  >
                    {i + 1}
                  </div>
                  <span
                    style={{
                      fontSize: "12px",
                      color: i === 0 ? "white" : "rgba(255,255,255,0.45)",
                      fontFamily: "system-ui, sans-serif",
                    }}
                  >
                    {s}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ flex: 1, padding: "24px", textAlign: "left" }}>
              <div style={{ marginBottom: "16px" }}>
                <span
                  style={{
                    fontSize: "11px",
                    fontFamily: "system-ui, sans-serif",
                    color: "#800000",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Problem 1
                </span>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#1a1208",
                    marginTop: "4px",
                    lineHeight: 1.6,
                    fontFamily: "system-ui, sans-serif",
                  }}
                >
                  Solve the recurrence T(n) = 2T(n/2) + n and express your
                  answer using Big-O notation.
                </p>
              </div>
              <div
                style={{
                  background: "#faf9f7",
                  borderRadius: "8px",
                  padding: "12px",
                  marginBottom: "12px",
                  border: "1px solid rgba(26,18,8,0.06)",
                }}
              >
                <p
                  style={{
                    fontSize: "12px",
                    color: "#6b5a4a",
                    fontFamily: "system-ui, sans-serif",
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  "This problem is asking me to analyze how the algorithm's
                  runtime grows. The recurrence splits the input in half each
                  time..."
                </p>
              </div>
              <div
                style={{
                  background: "rgba(128,0,0,0.04)",
                  borderRadius: "8px",
                  padding: "12px",
                  border: "1px solid rgba(128,0,0,0.08)",
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#800000",
                    fontFamily: "system-ui, sans-serif",
                  }}
                >
                  ThinkTrace AI
                </span>
                <p
                  style={{
                    fontSize: "12px",
                    color: "#5a4a3a",
                    fontFamily: "system-ui, sans-serif",
                    lineHeight: 1.6,
                    margin: "4px 0 0",
                  }}
                >
                  Good start. What does each level of the recursion tree
                  contribute to the total work done?
                </p>
              </div>
            </div>
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
                color: "#800000",
                fontFamily: "system-ui, sans-serif",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: "16px",
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
              Built for the age of AI in education
            </h2>
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
                title: "Reasoning traces",
                body: "Every student response is timestamped and recorded — not just the final answer, but every step of their thinking from start to finish.",
              },
              {
                icon: "⊞",
                title: "Staged workspace",
                body: "Six structured stages — Understand, Concept, Plan, Attempt, Critique, Reflect — force students to engage deeply before moving on.",
              },
              {
                icon: "◈",
                title: "AI governance levels",
                body: "Instructors set AI intervention from Level 0 (no AI) to Level 4 (full collaboration). Every course, every assignment, fully controlled.",
              },
              {
                icon: "◎",
                title: "Socratic AI tutor",
                body: "ThinkTrace never gives the answer. It asks five targeted questions to confirm understanding before unlocking the next stage.",
              },
              {
                icon: "⊡",
                title: "PDF & image upload",
                body: "Upload any assignment — PDF, image, or typed text. Gemini extracts every problem and creates individual workspaces automatically.",
              },
              {
                icon: "⊟",
                title: "Self-governance",
                body: "Students create personal workspaces to think through their own work — Deep Focus, Guided, or Open mode. Their thinking, their rules.",
              },
            ].map((f) => (
              <div
                key={f.title}
                style={{ background: "white", padding: "40px 36px" }}
              >
                <div
                  style={{
                    fontSize: "24px",
                    marginBottom: "16px",
                    color: "#800000",
                  }}
                >
                  {f.icon}
                </div>
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
                    fontFamily: "system-ui, sans-serif",
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
                color: "#800000",
                fontFamily: "system-ui, sans-serif",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: "16px",
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
              From assignment to audit trail
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {[
              {
                num: "01",
                title: "Instructor uploads an assignment",
                body: "Paste text, upload a PDF, or drop an image. ThinkTrace extracts every problem automatically using Gemini.",
              },
              {
                num: "02",
                title: "Students enter the workspace",
                body: "Each problem opens a six-stage reasoning workspace. Copy-paste is disabled. Every keystroke is traced.",
              },
              {
                num: "03",
                title: "AI guides, never answers",
                body: "The Socratic tutor asks targeted questions. Students must demonstrate understanding before advancing.",
              },
              {
                num: "04",
                title: "Instructors see everything",
                body: "The dashboard shows each student's full reasoning trace — timestamped, stage by stage, problem by problem.",
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
                    fontFamily: "system-ui, sans-serif",
                    fontWeight: 700,
                    color: "#800000",
                    letterSpacing: "0.05em",
                    minWidth: "32px",
                    paddingTop: "4px",
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
                      fontFamily: "system-ui, sans-serif",
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
          background: "#800000",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `radial-gradient(circle at 30% 50%, rgba(255,255,255,0.04) 0%, transparent 60%),
            radial-gradient(circle at 70% 50%, rgba(255,255,255,0.03) 0%, transparent 60%)`,
          }}
        />
        <div
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: "600px",
            margin: "0 auto",
          }}
        >
          <h2
            style={{
              fontSize: "clamp(36px, 6vw, 60px)",
              fontWeight: 700,
              letterSpacing: "-0.025em",
              lineHeight: 1.1,
              color: "white",
              marginBottom: "24px",
            }}
          >
            Ready to govern AI in your classroom?
          </h2>
          <p
            style={{
              fontSize: "18px",
              lineHeight: 1.7,
              color: "rgba(255,255,255,0.7)",
              marginBottom: "48px",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            Join instructors using ThinkTrace to ensure students are actually
            learning — not just prompting.
          </p>
          <Link
            href="/signup"
            style={{
              background: "white",
              color: "#800000",
              padding: "16px 40px",
              borderRadius: "8px",
              fontSize: "16px",
              textDecoration: "none",
              fontFamily: "system-ui, sans-serif",
              fontWeight: 700,
              display: "inline-block",
            }}
          >
            Get started free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: "40px 48px",
          background: "#1a1208",
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
              background: "#800000",
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
              color: "rgba(255,255,255,0.5)",
              fontSize: "14px",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            ThinkTrace © 2026
          </span>
        </div>
        <div style={{ display: "flex", gap: "24px" }}>
          <Link
            href="/login"
            style={{
              color: "rgba(255,255,255,0.4)",
              fontSize: "13px",
              textDecoration: "none",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            style={{
              color: "rgba(255,255,255,0.4)",
              fontSize: "13px",
              textDecoration: "none",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            Sign up
          </Link>
        </div>
      </footer>
    </div>
  );
}
