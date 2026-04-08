"use client";

import { useState, useRef } from "react";
import { InlineMath, BlockMath } from "react-katex";

interface MathInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  disabled?: boolean;
  height?: string;
  accentColor?: string;
}

const SYMBOL_GROUPS = [
  {
    label: "Greek",
    symbols: [
      { display: "α", latex: "\\alpha" },
      { display: "β", latex: "\\beta" },
      { display: "γ", latex: "\\gamma" },
      { display: "δ", latex: "\\delta" },
      { display: "ε", latex: "\\epsilon" },
      { display: "θ", latex: "\\theta" },
      { display: "λ", latex: "\\lambda" },
      { display: "μ", latex: "\\mu" },
      { display: "π", latex: "\\pi" },
      { display: "σ", latex: "\\sigma" },
      { display: "τ", latex: "\\tau" },
      { display: "φ", latex: "\\phi" },
      { display: "ω", latex: "\\omega" },
      { display: "Ω", latex: "\\Omega" },
      { display: "Θ", latex: "\\Theta" },
      { display: "Σ", latex: "\\Sigma" },
    ],
  },
  {
    label: "Operators",
    symbols: [
      { display: "∑", latex: "\\sum_{i=1}^{n}" },
      { display: "∏", latex: "\\prod_{i=1}^{n}" },
      { display: "∫", latex: "\\int_{a}^{b}" },
      { display: "√", latex: "\\sqrt{}" },
      { display: "∛", latex: "\\sqrt[3]{}" },
      { display: "∞", latex: "\\infty" },
      { display: "±", latex: "\\pm" },
      { display: "×", latex: "\\times" },
      { display: "÷", latex: "\\div" },
      { display: "·", latex: "\\cdot" },
    ],
  },
  {
    label: "Relations",
    symbols: [
      { display: "≤", latex: "\\leq" },
      { display: "≥", latex: "\\geq" },
      { display: "≠", latex: "\\neq" },
      { display: "≈", latex: "\\approx" },
      { display: "∈", latex: "\\in" },
      { display: "∉", latex: "\\notin" },
      { display: "⊆", latex: "\\subseteq" },
      { display: "⊂", latex: "\\subset" },
      { display: "∩", latex: "\\cap" },
      { display: "∪", latex: "\\cup" },
      { display: "→", latex: "\\rightarrow" },
      { display: "⟹", latex: "\\Rightarrow" },
      { display: "⟺", latex: "\\Leftrightarrow" },
      { display: "∀", latex: "\\forall" },
      { display: "∃", latex: "\\exists" },
    ],
  },
  {
    label: "Structures",
    symbols: [
      { display: "a/b", latex: "\\frac{}{}" },
      { display: "xⁿ", latex: "^{}" },
      { display: "xₙ", latex: "_{}" },
      { display: "log", latex: "\\log" },
      { display: "ln", latex: "\\ln" },
      { display: "lim", latex: "\\lim_{}" },
      { display: "max", latex: "\\max" },
      { display: "min", latex: "\\min" },
      { display: "⌊x⌋", latex: "\\lfloor \\rfloor" },
      { display: "⌈x⌉", latex: "\\lceil \\rceil" },
    ],
  },
  {
    label: "Big-O",
    symbols: [
      { display: "O(n)", latex: "O()" },
      { display: "Ω(n)", latex: "\\Omega()" },
      { display: "Θ(n)", latex: "\\Theta()" },
      { display: "o(n)", latex: "o()" },
      { display: "ω(n)", latex: "\\omega()" },
      { display: "ℕ", latex: "\\mathbb{N}" },
      { display: "ℝ", latex: "\\mathbb{R}" },
      { display: "ℤ", latex: "\\mathbb{Z}" },
    ],
  },
];

export default function MathInput({
  value,
  onChange,
  placeholder = "Write here...",
  disabled = false,
  height = "h-40",
  accentColor = "#667eea",
}: MathInputProps) {
  const [mathMode, setMathMode] = useState(false);
  const [activeGroup, setActiveGroup] = useState("Greek");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function insertAtCursor(latex: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = value.slice(0, start);
    const after = value.slice(end);

    // Wrap in $ if in math mode and not already inside $
    const insertion = mathMode ? latex : `$${latex}$`;
    const newValue = before + insertion + after;
    onChange(newValue);

    // Move cursor to inside the inserted latex
    setTimeout(() => {
      const cursorPos = start + insertion.length;
      textarea.setSelectionRange(cursorPos, cursorPos);
      textarea.focus();
    }, 0);
  }

  function renderPreview(text: string) {
    if (!text.trim()) return null;
    const parts = text.split(/(\$\$[\s\S]+?\$\$|\$[^$]+?\$)/);
    return parts.map((part, i) => {
      if (part.startsWith("$$")) {
        try {
          return <BlockMath key={i} math={part.slice(2, -2)} />;
        } catch {
          return (
            <span key={i} className="text-red-400 text-xs">
              {part}
            </span>
          );
        }
      }
      if (part.startsWith("$")) {
        try {
          return <InlineMath key={i} math={part.slice(1, -1)} />;
        } catch {
          return (
            <span key={i} className="text-red-400 text-xs">
              {part}
            </span>
          );
        }
      }
      return <span key={i}>{part}</span>;
    });
  }

  const activeSymbols =
    SYMBOL_GROUPS.find((g) => g.label === activeGroup)?.symbols || [];

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      {/* Toolbar header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          {/* Mode toggle */}
          <button
            type="button"
            onClick={() => setMathMode(!mathMode)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
            style={{
              background: mathMode ? accentColor : "white",
              color: mathMode ? "white" : "#374151",
              border: `1px solid ${mathMode ? accentColor : "#d1d5db"}`,
            }}
          >
            <span>∑</span>
            <span>Math mode {mathMode ? "ON" : "OFF"}</span>
          </button>

          {/* Symbol group tabs */}
          {SYMBOL_GROUPS.map((group) => (
            <button
              key={group.label}
              type="button"
              onClick={() => setActiveGroup(group.label)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition"
              style={{
                background:
                  activeGroup === group.label
                    ? `${accentColor}15`
                    : "transparent",
                color: activeGroup === group.label ? accentColor : "#6b7280",
              }}
            >
              {group.label}
            </button>
          ))}
        </div>

        {mathMode && (
          <span className="text-xs text-gray-400">
            Wrap math in <code className="bg-gray-100 px-1 rounded">$...$</code>
          </span>
        )}
      </div>

      {/* Symbol buttons */}
      <div className="flex flex-wrap gap-1 px-3 py-2 bg-gray-50 border-b border-gray-200">
        {activeSymbols.map((sym) => (
          <button
            key={sym.latex}
            type="button"
            onClick={() => insertAtCursor(sym.latex)}
            disabled={disabled}
            title={sym.latex}
            className="px-2.5 py-1.5 rounded-lg text-sm bg-white border border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition font-mono disabled:opacity-50"
          >
            {sym.display}
          </button>
        ))}
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPaste={(e) => e.preventDefault()}
        onCopy={(e) => e.preventDefault()}
        onContextMenu={(e) => e.preventDefault()}
        placeholder={
          mathMode
            ? "Type here — use $...$ for inline math, $$...$$ for block math"
            : placeholder
        }
        disabled={disabled}
        className={`w-full ${height} p-4 focus:outline-none resize-none text-gray-700 font-mono text-sm`}
        style={{
          fontFamily: mathMode ? "'Courier New', monospace" : "inherit",
        }}
      />

      {/* Live preview */}
      {mathMode && value.trim() && (
        <div className="px-4 py-3 border-t border-gray-100 bg-white">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-2">
            Preview
          </p>
          <div className="text-gray-700 leading-relaxed text-sm">
            {renderPreview(value)}
          </div>
        </div>
      )}
    </div>
  );
}
