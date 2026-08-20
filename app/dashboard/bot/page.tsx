"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import {
  Bot, Check, Copy, ExternalLink, Bell, AlertTriangle,
  ShieldCheck, Zap, CheckCircle, ToggleLeft, ToggleRight,
  RefreshCw, Unlink, MessageSquare,
} from "lucide-react";

/* ── Types ──────────────────────────────────────────────────────────────── */
type ConnectionStatus = "disconnected" | "pending" | "connected";

type NotificationPref = {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  enabled: boolean;
  color: string;
};

/* ── Step indicator ─────────────────────────────────────────────────────── */
function Step({ n, title, done, active }: {
  n: number; title: string; done: boolean; active: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 transition-colors"
        style={{
          background: done
            ? "rgba(52,211,153,0.15)"
            : active
            ? "rgba(45,212,191,0.1)"
            : "rgba(255,255,255,0.04)",
          border: done
            ? "1px solid rgba(52,211,153,0.3)"
            : active
            ? "1px solid rgba(45,212,191,0.35)"
            : "1px solid rgba(255,255,255,0.08)",
          color: done ? "#34d399" : active ? "#2dd4bf" : "rgba(255,255,255,0.2)",
        }}
      >
        {done ? <Check style={{ width: 13, height: 13 }} strokeWidth={2.5} /> : n}
      </div>
      <span
        className="text-[13px] font-medium"
        style={{ color: done || active ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.25)" }}
      >
        {title}
      </span>
    </div>
  );
}

/* ── Notification toggle row ─────────────────────────────────────────────── */
function NotifRow({
  pref, onChange,
}: {
  pref: NotificationPref;
  onChange: (id: string, v: boolean) => void;
}) {
  return (
    <div
      className="flex items-start justify-between gap-4 py-4 border-b last:border-0"
      style={{ borderColor: "rgba(255,255,255,0.05)" }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: `${pref.color}14`, border: `1px solid ${pref.color}30` }}
        >
          <pref.icon style={{ width: 15, height: 15, color: pref.color }} strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-[13px] font-medium text-white/80">{pref.label}</p>
          <p className="text-[11.5px] text-white/30 mt-0.5 max-w-[420px]">{pref.description}</p>
        </div>
      </div>
      <button
        onClick={() => onChange(pref.id, !pref.enabled)}
        className="shrink-0 mt-0.5 transition-colors"
        aria-label={pref.enabled ? "Disable" : "Enable"}
        aria-pressed={pref.enabled}
      >
        {pref.enabled
          ? <ToggleRight style={{ width: 32, height: 32, color: "#2dd4bf" }} strokeWidth={1.5} />
          : <ToggleLeft  style={{ width: 32, height: 32 }} className="text-white/20" strokeWidth={1.5} />
        }
      </button>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */
export default function BotPage() {
  const { address } = useAccount();
  const [status, setStatus]   = useState<ConnectionStatus>("disconnected");
  const [copied, setCopied]   = useState(false);
  const [loading, setLoading] = useState(false);

  const token    = address ? `cst_${address.slice(2, 10).toLowerCase()}` : "cst_connect_wallet";
  const deepLink = `https://t.me/CustosGuardBot?start=${token}`;

  const [prefs, setPrefs] = useState<NotificationPref[]>([
    {
      id: "hf_warning", label: "Health Factor warning",
      description: "Notify when any position HF drops below 1.50 — early warning before trigger fires.",
      icon: AlertTriangle, enabled: true, color: "#facc15",
    },
    {
      id: "trigger_fired", label: "Trigger fired",
      description: "Instant alert when Custos detects HF ≤ trigger threshold and queues remediation.",
      icon: Zap, enabled: true, color: "#f87171",
    },
    {
      id: "execution_success", label: "Execution successful",
      description: "Confirm repay or collateral top-up completed with before/after HF.",
      icon: CheckCircle, enabled: true, color: "#34d399",
    },
    {
      id: "execution_failed", label: "Execution failed",
      description: "Alert if a transaction reverts (slippage, gas, flash loan failure). Requires manual review.",
      icon: AlertTriangle, enabled: true, color: "#f87171",
    },
    {
      id: "daily_digest", label: "Daily digest",
      description: "Morning summary of all position HFs, last 24h actions, and gas spent.",
      icon: Bell, enabled: false, color: "#94a3b8",
    },
    {
      id: "position_safe", label: "Position restored",
      description: "Notify when HF returns above target after Custos intervention.",
      icon: ShieldCheck, enabled: true, color: "#34d399",
    },
  ]);

  const handlePrefChange = (id: string, v: boolean) =>
    setPrefs((prev) => prev.map((p) => (p.id === id ? { ...p, enabled: v } : p)));

  const handleCopy = () => {
    navigator.clipboard.writeText(deepLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConnect = () => {
    setLoading(true);
    window.open(deepLink, "_blank");
    setTimeout(() => { setStatus("connected"); setLoading(false); }, 3000);
  };

  const handleDisconnect = () => setStatus("disconnected");
  const isConnected = status === "connected";
  const enabledCount = prefs.filter((p) => p.enabled).length;

  return (
    <div className="w-full p-5 md:p-7 space-y-5">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-[18px] font-semibold text-white tracking-[-0.02em]">Telegram Bot</h1>
        <p className="text-[12px] text-white/30 mt-0.5">
          Connect @CustosGuardBot for real-time alerts and AI-powered position queries.
        </p>
      </div>

      {/* ── Main grid ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">

        {/* Left column */}
        <div className="space-y-5">

          {/* ── Connection card ──────────────────────────────────────── */}
          <div
            className="rounded-[10px] overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.015)",
              border: isConnected
                ? "1px solid rgba(52,211,153,0.2)"
                : "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {/* Status header */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-[8px] flex items-center justify-center"
                  style={{
                    background: isConnected ? "rgba(52,211,153,0.1)" : "rgba(255,255,255,0.05)",
                    border: isConnected ? "1px solid rgba(52,211,153,0.25)" : "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <Bot
                    style={{ width: 16, height: 16, color: isConnected ? "#34d399" : "rgba(255,255,255,0.3)" }}
                    strokeWidth={1.5}
                  />
                </div>
                <div>
                  <p className="text-[13px] font-medium text-white/80">@CustosGuardBot</p>
                  <p className="text-[11px] text-white/30">
                    {isConnected ? "Connected · notifications active" : "Not connected"}
                  </p>
                </div>
              </div>

              {isConnected && (
                <button
                  onClick={handleDisconnect}
                  className="flex items-center gap-1.5 h-7 px-3 rounded-[6px] text-[11.5px] transition-colors"
                  style={{
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.35)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(248,113,113,0.3)";
                    e.currentTarget.style.color = "#f87171";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                    e.currentTarget.style.color = "rgba(255,255,255,0.35)";
                  }}
                >
                  <Unlink style={{ width: 12, height: 12 }} strokeWidth={1.5} />
                  Disconnect
                </button>
              )}
            </div>

            <div className="p-5">
              {isConnected ? (
                <div className="flex flex-col gap-4">
                  <div
                    className="flex items-center gap-2.5 p-3 rounded-[8px]"
                    style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.2)" }}
                  >
                    <CheckCircle style={{ width: 15, height: 15, color: "#34d399" }} className="shrink-0" strokeWidth={1.5} />
                    <p className="text-[12.5px]" style={{ color: "rgba(52,211,153,0.8)" }}>
                      Telegram connected. Notifications will be sent to your chat.
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Alerts sent",  value: "14" },
                      { label: "Executions",   value: "3"  },
                      { label: "Last message", value: "2h ago" },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className="rounded-[8px] px-3 py-2.5"
                        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                      >
                        <p className="text-[10px] font-mono text-white/25 uppercase tracking-[0.1em] mb-1">{s.label}</p>
                        <p className="text-[18px] font-semibold text-white tracking-[-0.02em]">{s.value}</p>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => window.open("https://t.me/CustosGuardBot", "_blank")}
                    className="inline-flex items-center gap-2 h-9 px-4 rounded-[7px] text-[12.5px] transition-colors w-fit"
                    style={{ border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.8)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.4)"; e.currentTarget.style.background = ""; }}
                  >
                    <ExternalLink style={{ width: 13, height: 13 }} strokeWidth={1.5} />
                    Open in Telegram
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  {/* Steps */}
                  <div className="flex flex-col gap-3">
                    <Step n={1} title="Open @CustosGuardBot in Telegram" done={false} active={true} />
                    <Step n={2} title="Send your unique link or start command" done={false} active={false} />
                    <Step n={3} title="Bot confirms your wallet address" done={false} active={false} />
                  </div>

                  {/* Deep link */}
                  <div
                    className="flex items-center gap-2 p-3 rounded-[8px]"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    <span className="flex-1 font-mono text-[11px] text-white/35 truncate">{deepLink}</span>
                    <button
                      onClick={handleCopy}
                      className="shrink-0 p-1.5 rounded-[5px] transition-colors"
                      style={{ color: "rgba(255,255,255,0.25)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.7)"; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.25)"; e.currentTarget.style.background = ""; }}
                    >
                      {copied
                        ? <Check style={{ width: 13, height: 13, color: "#34d399" }} strokeWidth={2} />
                        : <Copy  style={{ width: 13, height: 13 }} strokeWidth={1.5} />
                      }
                    </button>
                  </div>

                  {/* CTAs */}
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={handleConnect}
                      disabled={loading || !address}
                      className="inline-flex items-center gap-2 h-9 px-5 rounded-[8px] text-[13px] font-semibold transition-opacity disabled:opacity-40"
                      style={{
                        background: "linear-gradient(135deg, #2dd4bf 0%, #0d9488 100%)",
                        color: "#042f2e",
                      }}
                    >
                      {loading && <RefreshCw style={{ width: 13, height: 13 }} className="animate-spin" strokeWidth={2} />}
                      {loading ? "Waiting for confirmation…" : "Open Telegram"}
                    </button>
                    <a
                      href="https://t.me/CustosGuardBot"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 h-9 px-4 rounded-[8px] text-[12.5px] transition-colors"
                      style={{ border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.7)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.35)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
                    >
                      <ExternalLink style={{ width: 13, height: 13 }} strokeWidth={1.5} />
                      View bot
                    </a>
                  </div>

                  {!address && (
                    <p className="text-[11px] text-white/20">Connect your wallet first to generate a unique link.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Notification preferences ──────────────────────────────── */}
          <div
            className="rounded-[10px] overflow-hidden"
            style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div
              className="px-5 py-3.5"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
            >
              <h2 className="text-[12.5px] font-semibold text-white/80">Notification preferences</h2>
              <p className="text-[11px] text-white/25 mt-0.5">
                Choose which events trigger a Telegram message.
              </p>
            </div>
            <div className="px-5">
              {prefs.map((pref) => (
                <NotifRow key={pref.id} pref={pref} onChange={handlePrefChange} />
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">

          {/* Bot summary card */}
          <div
            className="rounded-[10px] p-5"
            style={{
              background: "rgba(255,255,255,0.015)",
              border: "1px solid rgba(45,212,191,0.12)",
            }}
          >
            <div className="flex items-center gap-2.5 mb-4">
              <div
                className="w-8 h-8 rounded-[8px] flex items-center justify-center"
                style={{ background: "rgba(45,212,191,0.1)", border: "1px solid rgba(45,212,191,0.2)" }}
              >
                <MessageSquare style={{ width: 14, height: 14, color: "#2dd4bf" }} strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-[12px] font-semibold text-white/70">@CustosGuardBot</p>
                <p className="text-[10px] text-white/25 font-mono">t.me/CustosGuardBot</p>
              </div>
            </div>

            <div
              className="space-y-2 p-3 rounded-[8px] mb-4"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
            >
              <p className="text-[10px] font-mono text-white/25 uppercase tracking-[0.1em]">Status</p>
              <div className="flex items-center gap-2">
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ backgroundColor: isConnected ? "#34d399" : "rgba(255,255,255,0.15)" }}
                />
                <span
                  className="text-[12px] font-medium"
                  style={{ color: isConnected ? "#34d399" : "rgba(255,255,255,0.25)" }}
                >
                  {isConnected ? "Connected" : "Not connected"}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-[10px] font-mono text-white/25 uppercase tracking-[0.1em] mb-2">
                Active alerts ({enabledCount}/{prefs.length})
              </p>
              {prefs.map((p) => (
                <div key={p.id} className="flex items-center gap-2">
                  <span
                    className="w-1 h-1 rounded-full shrink-0"
                    style={{ backgroundColor: p.enabled ? p.color : "rgba(255,255,255,0.1)" }}
                  />
                  <span
                    className="text-[11px] truncate"
                    style={{ color: p.enabled ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.15)" }}
                  >
                    {p.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bot commands */}
          <div
            className="rounded-[10px] overflow-hidden"
            style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div
              className="px-4 py-3.5"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
            >
              <h2 className="text-[12.5px] font-semibold text-white/70">Bot commands</h2>
            </div>
            <div className="p-3 flex flex-col gap-1.5">
              {[
                { cmd: "/status",    desc: "All position HFs right now" },
                { cmd: "/positions", desc: "Active collateral and debt" },
                { cmd: "/history",   desc: "Last 5 executions with HF delta" },
                { cmd: "/pause",     desc: "Pause automated protection" },
                { cmd: "/resume",    desc: "Resume automated protection" },
                { cmd: "Ask freely", desc: "Plain-language AI answers" },
              ].map((c) => (
                <div
                  key={c.cmd}
                  className="flex items-start gap-2.5 p-2.5 rounded-[7px]"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
                >
                  <code
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded-[4px] shrink-0 whitespace-nowrap"
                    style={{ color: "#2dd4bf", background: "rgba(45,212,191,0.08)", border: "1px solid rgba(45,212,191,0.15)" }}
                  >
                    {c.cmd}
                  </code>
                  <p className="text-[11px] text-white/30 leading-relaxed">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
