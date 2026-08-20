"use client";

import { useEffect, useRef, useState } from "react";
import { useAccount } from "wagmi";
import {
  Send, ShieldCheck, Bot, User, Sparkles,
  AlertTriangle, RefreshCw,
} from "lucide-react";
import { POSITIONS, HISTORY } from "@/lib/mock-data";

/* ── Types ──────────────────────────────────────────────────────────────── */
type Role = "user" | "assistant" | "system";

interface Message {
  id: string;
  role: Role;
  content: string;
  ts: Date;
  thinking?: boolean;
}

/* ── Mock AI responses keyed on keywords ────────────────────────────────── */
function getMockReply(input: string): string {
  const q = input.toLowerCase();

  if (q.includes("riskiest") || q.includes("most risk") || q.includes("worst")) {
    return `Your riskiest position right now is **Morpho Blue on Ethereum** — Health Factor **1.35**, which is only 0.05 above your trigger threshold of 1.30.\n\nCustos is actively monitoring this position. If ETH drops ~4% from current price, HF will reach the trigger and Custos will fire an automatic repay via flash loan.\n\nRecommendation: consider adding collateral or reducing your 6,200 USDC debt by ~500 USDC to create more buffer.`;
  }

  if (q.includes("health factor") || q.includes("hf") || q.includes("status")) {
    return POSITIONS.map((p) =>
      `**${p.protocol} (${p.chain})**\nHF: ${p.hf} — ${p.status.toUpperCase()}\nCollateral: ${p.collateral} ($${p.collateralUsd.toLocaleString()}) · Debt: ${p.debt}`
    ).join("\n\n");
  }

  if (q.includes("history") || q.includes("last action") || q.includes("execution")) {
    const last = HISTORY.filter((h) => h.action !== "NOOP").slice(0, 3);
    return (
      "Here are the last 3 Custos executions:\n\n" +
      last
        .map((h) => `• **${h.protocol}** — ${h.action} ${h.amount} ${h.asset} via ${h.source}\n  HF ${h.hfBefore} → ${h.hfAfter} · ${h.timestamp}`)
        .join("\n\n")
    );
  }

  if (q.includes("flash loan") || q.includes("flash")) {
    return "Custos uses flash loans as a **zero-reserve fallback**. When your HF hits the trigger and you have no idle reserve, Custos borrows exactly what's needed atomically, repays your debt, and returns the loan — all in one transaction.\n\nThe fee is approximately 0.05% of the borrowed amount. This means you don't need to keep idle capital just for protection.";
  }

  if (q.includes("safe") || q.includes("non-custodial") || q.includes("custody")) {
    return "Custos is fully **non-custodial**. Your funds never move to Custos.\n\nThe Guardian Module can only call `repay()`, `supply()`, or allowlisted swap routes — it cannot transfer funds to arbitrary addresses. Even if the entire Custos backend were compromised, the worst an attacker could do is pay your debt for you.";
  }

  if (q.includes("collateral") || q.includes("debt") || q.includes("portfolio")) {
    const totalC = POSITIONS.reduce((s, p) => s + p.collateralUsd, 0);
    const totalD = POSITIONS.reduce((s, p) => s + p.debtUsd, 0);
    return `Your total portfolio across ${POSITIONS.length} positions:\n\n**Collateral:** $${totalC.toLocaleString()}\n**Debt:** $${totalD.toLocaleString()}\n**Net equity:** $${(totalC - totalD).toLocaleString()}\n\nYou are borrowing ${((totalD / totalC) * 100).toFixed(1)}% of your collateral value.`;
  }

  if (q.includes("trigger") || q.includes("threshold")) {
    return `Your current trigger threshold is **1.30**. Custos will fire when any position's HF drops to or below this value.\n\nAfter execution, Custos targets a recovery HF of **1.60** — this is your target buffer.\n\nYou can adjust both values in **Settings → Protection thresholds**.`;
  }

  if (q.includes("help") || q.includes("what can you") || q.includes("commands")) {
    return "Here's what you can ask me:\n\n• **Position status** — current HF, collateral, and debt\n• **Risk analysis** — which position is most at risk\n• **Execution history** — past Custos interventions\n• **Protocol questions** — how flash loans, the Guardian Module, and oracles work\n• **Configuration help** — how to set thresholds, execution policy\n\nI can also explain any Custos concept in plain language.";
  }

  return `I don't have a specific answer for that yet, but here's what I know:\n\nCustos is currently monitoring **${POSITIONS.length} positions** across Aave V3 and Morpho Blue. Your most at-risk position has an HF of **${Math.min(...POSITIONS.map((p) => p.hf)).toFixed(2)}**.\n\nTry asking about your health factor, execution history, or how specific features like flash loans work.`;
}

/* ── Message bubble ─────────────────────────────────────────────────────── */
function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";

  /* Simple markdown: **bold**, newlines */
  const formatted = msg.content
    .split("\n")
    .map((line, i) => {
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <p key={i} className={i > 0 ? "mt-1.5" : ""}>
          {parts.map((part, j) =>
            j % 2 === 1 ? <strong key={j} className="font-semibold text-[var(--fg)]">{part}</strong> : part
          )}
        </p>
      );
    });

  return (
    <div className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${
          isUser
            ? "bg-[var(--fg)]/[0.07] border-[var(--border)]"
            : "bg-[var(--bg-overlay)] border-[var(--border-strong)]"
        }`}
      >
        {isUser
          ? <User  style={{ width: 13, height: 13 }} className="text-[var(--fg-muted)]"  strokeWidth={1.5} />
          : <Bot   style={{ width: 13, height: 13 }} className="text-[var(--fg-muted)]"  strokeWidth={1.5} />
        }
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[78%] rounded-[10px] px-4 py-3 text-[13px] leading-[1.65] ${
          isUser
            ? "bg-[var(--fg)]/[0.07] text-[var(--fg)] rounded-tr-[3px]"
            : "bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--fg-muted)] rounded-tl-[3px]"
        }`}
      >
        {msg.thinking ? (
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--fg-faint)] animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--fg-faint)] animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--fg-faint)] animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        ) : (
          <div>{formatted}</div>
        )}
        {!msg.thinking && (
          <p className="text-[10px] text-[var(--fg-faint)] mt-1.5 font-mono">
            {msg.ts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </div>
    </div>
  );
}

/* ── Suggestion chips ───────────────────────────────────────────────────── */
const SUGGESTIONS = [
  "What's my riskiest position?",
  "Show my current health factors",
  "Explain how flash loans work",
  "What happened in the last execution?",
  "How is Custos non-custodial?",
  "What's my total debt and collateral?",
];

/* ── Page ────────────────────────────────────────────────────────────────── */
export default function ChatPage() {
  const { address } = useAccount();
  const [messages, setMessages] = useState<Message[]>([
    {
      id:   "welcome",
      role: "assistant",
      ts:   new Date(),
      content:
        "Hi! I'm the Custos AI assistant. I have full visibility into your positions, execution history, and configuration.\n\nAsk me anything about your DeFi positions, how Custos protects them, or what happened in past executions.",
    },
  ]);
  const [input, setInput]       = useState("");
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (text: string) => {
    if (!text.trim() || thinking) return;

    const userMsg: Message = {
      id:      crypto.randomUUID(),
      role:    "user",
      content: text.trim(),
      ts:      new Date(),
    };

    const thinkingMsg: Message = {
      id:       crypto.randomUUID(),
      role:     "assistant",
      content:  "",
      ts:       new Date(),
      thinking: true,
    };

    setMessages((prev) => [...prev, userMsg, thinkingMsg]);
    setInput("");
    setThinking(true);

    /* Simulate AI latency */
    const delay = 800 + Math.random() * 700;
    setTimeout(() => {
      const reply = getMockReply(text);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === thinkingMsg.id
            ? { ...m, content: reply, thinking: false, ts: new Date() }
            : m
        )
      );
      setThinking(false);
    }, delay);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--bg)" }}>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div
        className="shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-[var(--border)]"
        style={{ background: "var(--bg-subtle)" }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[8px] bg-[var(--fg)]/[0.06] border border-[var(--border)] flex items-center justify-center">
            <Sparkles style={{ width: 15, height: 15 }} className="text-[var(--fg-muted)]" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[var(--fg)] tracking-[-0.01em]">AI Assistant</p>
            <p className="text-[11px] text-[var(--fg-faint)]">Powered by Custos context · your positions + history</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--fg-faint)]">
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: "var(--safe)" }}
            />
            Context loaded
          </span>
        </div>
      </div>

      {/* ── Context pills ────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center gap-2 px-5 py-2.5 border-b border-[var(--border)] overflow-x-auto scrollbar-hide">
        <span className="text-[10px] font-mono text-[var(--fg-faint)] shrink-0 uppercase tracking-[0.1em]">Context:</span>
        {POSITIONS.map((p) => (
          <span
            key={p.id}
            className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full border border-[var(--border)] text-[10.5px] font-mono text-[var(--fg-faint)] whitespace-nowrap shrink-0"
            style={{ background: "var(--bg-elevated)" }}
          >
            <ShieldCheck style={{ width: 10, height: 10 }} strokeWidth={2} />
            {p.protocol} HF {p.hf}
          </span>
        ))}
        <span
          className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full border border-[var(--border)] text-[10.5px] font-mono text-[var(--fg-faint)] whitespace-nowrap shrink-0"
          style={{ background: "var(--bg-elevated)" }}
        >
          {HISTORY.length} history entries
        </span>
      </div>

      {/* ── Messages ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-5 py-5 flex flex-col gap-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* ── Suggestions (only when no user message yet) ───────────────── */}
      {messages.length === 1 && (
        <div className="shrink-0 px-5 pb-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              className="h-7 px-3 rounded-full border border-[var(--border)] text-[11.5px] text-[var(--fg-muted)] hover:bg-[var(--fg)]/[0.04] hover:border-[var(--border-strong)] hover:text-[var(--fg)] transition-colors"
              style={{ background: "var(--bg-elevated)" }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* ── Risk disclaimer ──────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center gap-2 px-5 py-2 border-t border-[var(--border)]">
        <AlertTriangle style={{ width: 11, height: 11 }} className="text-[var(--fg-faint)] shrink-0" strokeWidth={1.5} />
        <p className="text-[10.5px] text-[var(--fg-faint)]">
          AI responses are informational only. Always verify on-chain before making decisions.
        </p>
      </div>

      {/* ── Input ────────────────────────────────────────────────────── */}
      <div className="shrink-0 px-5 pb-5 pt-2" style={{ background: "var(--bg)" }}>
        <form
          onSubmit={handleSubmit}
          className="flex items-end gap-2 rounded-[10px] border border-[var(--border-strong)] px-4 py-3 focus-within:border-[var(--fg)]/20 transition-colors"
          style={{ background: "var(--bg-elevated)" }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input);
              }
            }}
            placeholder="Ask about your positions, executions, or how Custos works…"
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none text-[13px] text-[var(--fg)] placeholder:text-[var(--fg-placeholder)] leading-relaxed max-h-32 overflow-y-auto scrollbar-hide"
            style={{ minHeight: 22 }}
          />
          <button
            type="submit"
            disabled={!input.trim() || thinking}
            className="shrink-0 w-8 h-8 rounded-[7px] flex items-center justify-center bg-[var(--accent)] text-[var(--accent-fg)] hover:opacity-85 transition-opacity disabled:opacity-30"
          >
            {thinking
              ? <RefreshCw style={{ width: 14, height: 14 }} className="animate-spin" strokeWidth={2} />
              : <Send      style={{ width: 14, height: 14 }} strokeWidth={2} />
            }
          </button>
        </form>
        <p className="text-[10px] text-[var(--fg-faint)] mt-2 text-center font-mono">
          Enter to send · Shift+Enter for newline
        </p>
      </div>
    </div>
  );
}
