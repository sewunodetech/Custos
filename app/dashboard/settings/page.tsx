"use client";

import { useState } from "react";
import { useAccount, useDisconnect, useChainId, useChains } from "wagmi";
import {
  ShieldCheck, Save, AlertTriangle, ToggleLeft, ToggleRight,
  Info, Copy, CheckCheck, Zap, TrendingDown, Activity,
  Shield, CheckCircle,
} from "lucide-react";

/* ── Primitives ──────────────────────────────────────────────────────────── */
function SectionCard({ title, description, children }: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[10px] border border-white/[0.06] bg-white/[0.015] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-white/[0.05]">
        <h2 className="text-[12.5px] font-semibold text-white/80 tracking-[-0.01em]">{title}</h2>
        {description && <p className="text-[11px] text-white/25 mt-0.5">{description}</p>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function FieldRow({ label, hint, children }: {
  label: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-6 py-3.5 border-b border-white/[0.04] last:border-0">
      <div className="min-w-0">
        <p className="text-[12.5px] text-white/70">{label}</p>
        {hint && <p className="text-[11px] text-white/25 mt-0.5 max-w-[340px] leading-relaxed">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function NumberInput({ value, onChange, min, max, step = 0.01 }: {
  value: number; onChange: (v: number) => void; min: number; max: number; step?: number;
}) {
  return (
    <input
      type="number"
      value={value}
      step={step}
      min={min}
      max={max}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-24 h-8 px-3 rounded-[6px] text-[12px] font-mono text-white/70 outline-none text-right transition-colors"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
      onFocus={(e) => {
        e.currentTarget.style.border = "1px solid rgba(45,212,191,0.4)";
        e.currentTarget.style.background = "rgba(45,212,191,0.04)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)";
        e.currentTarget.style.background = "rgba(255,255,255,0.04)";
      }}
    />
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="flex items-center transition-colors"
      aria-pressed={on}
    >
      {on
        ? <ToggleRight style={{ width: 32, height: 32, color: "#2dd4bf" }} strokeWidth={1.5} />
        : <ToggleLeft  style={{ width: 32, height: 32 }} className="text-white/20" strokeWidth={1.5} />
      }
    </button>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */
export default function SettingsPage() {
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const chains = useChains();
  const chain = chains.find((c) => c.id === chainId);

  /* Protection thresholds */
  const [triggerHF,  setTriggerHF]  = useState(1.30);
  const [targetHF,   setTargetHF]   = useState(1.60);
  const [bufferPct,  setBufferPct]  = useState(10);

  /* Execution policy */
  const [flashLoan,   setFlashLoan]   = useState(true);
  const [useReserve,  setUseReserve]  = useState(false);
  const [deleverage,  setDeleverage]  = useState(false);
  const [slippageBps, setSlippageBps] = useState(50);

  /* Notifications */
  const [alertsOn,   setAlertsOn]   = useState(true);
  const [webhookUrl, setWebhookUrl] = useState("");

  const [saved,  setSaved]  = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleCopy = () => {
    if (address) navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const short = address ? `${address.slice(0, 10)}...${address.slice(-6)}` : "—";
  const isInvalid = triggerHF >= targetHF;

  /* Derived HF bar (for preview) */
  const triggerPct = Math.min(100, Math.max(0, (triggerHF - 1.0) / 1.0 * 100));
  const targetPct  = Math.min(100, Math.max(0, (targetHF  - 1.0) / 1.0 * 100));

  return (
    <div className="w-full p-5 md:p-7">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[18px] font-semibold text-white tracking-[-0.02em]">Settings</h1>
          <p className="text-[12px] text-white/30 mt-0.5">Protection thresholds, execution policy, and account</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isInvalid}
          className="inline-flex items-center gap-1.5 h-8 px-4 rounded-[6px] text-[12px] font-semibold tracking-[-0.01em] transition-all disabled:opacity-40"
          style={{
            background: saved
              ? "rgba(52,211,153,0.15)"
              : "linear-gradient(135deg, #2dd4bf 0%, #0d9488 100%)",
            color: saved ? "#34d399" : "#042f2e",
            border: saved ? "1px solid rgba(52,211,153,0.3)" : "none",
          }}
        >
          {saved
            ? <><CheckCheck className="w-3.5 h-3.5" strokeWidth={2} />Saved</>
            : <><Save className="w-3.5 h-3.5" strokeWidth={2} />Save changes</>
          }
        </button>
      </div>

      {/* ── Main 2-col grid ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-5">

        {/* ── Left column: forms ────────────────────────────────────── */}
        <div className="space-y-5">

          {/* Wallet */}
          <SectionCard title="Wallet" description="Connected wallet and active network.">
            <FieldRow label="Address" hint="Used to read positions and sign Guardian Module approval.">
              <div
                className="flex items-center gap-2 h-8 px-3 rounded-[6px]"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <ShieldCheck style={{ width: 13, height: 13, color: "#2dd4bf" }} strokeWidth={1.5} />
                <span className="font-mono text-[11px] text-white/45">{short}</span>
                <button onClick={handleCopy} className="text-white/20 hover:text-white/50 transition-colors ml-1">
                  {copied
                    ? <CheckCheck className="w-3 h-3" style={{ color: "#34d399" }} strokeWidth={1.5} />
                    : <Copy className="w-3 h-3" strokeWidth={1.5} />
                  }
                </button>
              </div>
            </FieldRow>
            <FieldRow label="Network" hint="Chain where your positions are active.">
              <div
                className="flex items-center gap-2 h-8 px-3 rounded-[6px]"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: "#34d399" }} />
                <span className="font-mono text-[11px] text-white/45">{chain?.name ?? "—"}</span>
              </div>
            </FieldRow>
            <FieldRow label="Disconnect" hint="Remove wallet connection and return to landing page.">
              <button
                onClick={() => disconnect()}
                className="h-8 px-3.5 rounded-[6px] text-[12px] transition-colors"
                style={{
                  border: "1px solid rgba(248,113,113,0.2)",
                  background: "rgba(248,113,113,0.05)",
                  color: "rgba(248,113,113,0.7)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(248,113,113,0.1)";
                  e.currentTarget.style.color = "#f87171";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(248,113,113,0.05)";
                  e.currentTarget.style.color = "rgba(248,113,113,0.7)";
                }}
              >
                Disconnect wallet
              </button>
            </FieldRow>
          </SectionCard>

          {/* Protection thresholds */}
          <SectionCard
            title="Protection thresholds"
            description="Custos acts when HF drops below trigger and restores it to target."
          >
            <FieldRow
              label="Trigger HF"
              hint="Custos fires when Health Factor falls below this value. Recommended: 1.25–1.35."
            >
              <NumberInput value={triggerHF} onChange={setTriggerHF} min={1.05} max={1.5} />
            </FieldRow>
            <FieldRow
              label="Target HF"
              hint="After intervention, Custos restores HF to at least this value. Must be > trigger."
            >
              <NumberInput value={targetHF} onChange={setTargetHF} min={1.1} max={2.5} />
            </FieldRow>
            <FieldRow
              label="Conservative buffer %"
              hint="Extra collateral buffer above target to absorb oracle deviation. Default: 10%."
            >
              <NumberInput value={bufferPct} onChange={setBufferPct} min={0} max={50} step={1} />
            </FieldRow>

            {isInvalid && (
              <div
                className="mt-3 flex items-start gap-2.5 px-3 py-2.5 rounded-[7px]"
                style={{ background: "rgba(248,113,113,0.07)", border: "1px solid rgba(248,113,113,0.2)" }}
              >
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: "#f87171" }} strokeWidth={1.5} />
                <p className="text-[11px]" style={{ color: "rgba(248,113,113,0.8)" }}>
                  Target HF must be greater than trigger HF.
                </p>
              </div>
            )}
          </SectionCard>

          {/* Execution policy */}
          <SectionCard
            title="Execution policy"
            description="Which funding sources and strategies Custos can use during remediation."
          >
            <FieldRow
              label="Flash loan fallback"
              hint="Use flash loans when no reserve is available. Requires selling collateral. Fee ~0.05%."
            >
              <Toggle on={flashLoan} onChange={setFlashLoan} />
            </FieldRow>
            <FieldRow
              label="Use hot reserve"
              hint="Use idle reserve funds held in a separate venue for instant repay. Requires pre-funded reserve."
            >
              <Toggle on={useReserve} onChange={setUseReserve} />
            </FieldRow>
            <FieldRow
              label="Allow deleverage"
              hint="Sell collateral directly to repay debt. Realizes a loss. Last resort only."
            >
              <Toggle on={deleverage} onChange={setDeleverage} />
            </FieldRow>
            <FieldRow
              label="Max slippage (bps)"
              hint="Maximum allowed swap slippage. 50 bps = 0.5%. Higher = better success rate, worse execution."
            >
              <NumberInput value={slippageBps} onChange={setSlippageBps} min={10} max={500} step={10} />
            </FieldRow>
          </SectionCard>

          {/* Notifications */}
          <SectionCard title="Notifications" description="Optional webhook for execution alerts.">
            <FieldRow label="Enable alerts" hint="Receive notifications when Custos intervenes or HF enters warning zone.">
              <Toggle on={alertsOn} onChange={setAlertsOn} />
            </FieldRow>
            <FieldRow label="Webhook URL" hint="POST request sent on every execution event. Leave blank to disable.">
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://hooks.example.com/..."
                className="w-56 h-8 px-3 rounded-[6px] text-[11px] font-mono text-white/60 placeholder:text-white/15 outline-none transition-colors"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.border = "1px solid rgba(45,212,191,0.4)";
                  e.currentTarget.style.background = "rgba(45,212,191,0.04)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                }}
/>
            </FieldRow>
          </SectionCard>

        </div>

        {/* ── Right column: summary + risk ──────────────────────────── */}
        <div className="space-y-4">

          {/* Threshold preview card */}
          <div
            className="rounded-[10px] p-5"
            style={{
              background: "rgba(255,255,255,0.015)",
              border: "1px solid rgba(45,212,191,0.12)",
            }}
          >
            <p className="text-[10px] font-mono text-white/30 tracking-[0.12em] uppercase mb-4">
              Threshold preview
            </p>

            {/* HF bar */}
            <div className="relative h-2 rounded-full mb-3" style={{ background: "rgba(255,255,255,0.06)" }}>
              {/* safe zone fill */}
              <div
                className="absolute left-0 top-0 h-full rounded-full"
                style={{
                  width: `${targetPct}%`,
                  background: "linear-gradient(90deg, rgba(248,113,113,0.4) 0%, rgba(251,191,36,0.5) 30%, rgba(45,212,191,0.5) 100%)",
                }}
              />
              {/* Trigger marker */}
              <div
                className="absolute top-[-3px] bottom-[-3px] w-0.5 rounded-full"
                style={{ left: `${triggerPct}%`, backgroundColor: "#fbbf24" }}
              />
              {/* Target marker */}
              <div
                className="absolute top-[-3px] bottom-[-3px] w-0.5 rounded-full"
                style={{ left: `${targetPct}%`, backgroundColor: "#2dd4bf" }}
              />
            </div>

            <div className="flex justify-between text-[9px] font-mono text-white/25 mb-5">
              <span>1.00</span>
              <span>2.00+</span>
            </div>

            {/* Threshold values */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: "#fbbf24" }} />
                  <span className="text-[11px] text-white/40">Trigger</span>
                </div>
                <span className="font-mono text-[12px] text-white/60">{triggerHF.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: "#2dd4bf" }} />
                  <span className="text-[11px] text-white/40">Target</span>
                </div>
                <span className="font-mono text-[12px] text-white/60">{targetHF.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-white/20 shrink-0" />
                  <span className="text-[11px] text-white/40">Buffer</span>
                </div>
                <span className="font-mono text-[12px] text-white/60">{bufferPct}%</span>
              </div>
            </div>
          </div>

          {/* Execution strategy summary */}
          <div
            className="rounded-[10px] p-5"
            style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <p className="text-[10px] font-mono text-white/30 tracking-[0.12em] uppercase mb-4">
              Active strategies
            </p>
            <div className="space-y-2">
              {[
                { label: "Flash loan", on: flashLoan,  icon: Zap,         color: "#fbbf24" },
                { label: "Hot reserve", on: useReserve, icon: Shield,      color: "#2dd4bf" },
                { label: "Deleverage",  on: deleverage, icon: TrendingDown, color: "#f87171" },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <s.icon
                      style={{ width: 12, height: 12, color: s.on ? s.color : "rgba(255,255,255,0.15)" }}
                      strokeWidth={1.5}
                    />
                    <span className="text-[11.5px]" style={{ color: s.on ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)" }}>
                      {s.label}
                    </span>
                  </div>
                  <span
                    className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded-[3px]"
                    style={{
                      color: s.on ? s.color : "rgba(255,255,255,0.2)",
                      background: s.on ? `${s.color}18` : "rgba(255,255,255,0.04)",
                    }}
                  >
                    {s.on ? "ON" : "OFF"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Slippage indicator */}
          <div
            className="rounded-[10px] p-4"
            style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono text-white/30 tracking-[0.12em] uppercase">Max slippage</span>
              <span
                className="font-mono text-[12px] font-semibold"
                style={{
                  color: slippageBps > 200 ? "#f87171" : slippageBps > 100 ? "#fbbf24" : "#2dd4bf",
                }}
              >
                {slippageBps} bps
              </span>
            </div>
            <div className="relative h-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div
                className="absolute left-0 top-0 h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, (slippageBps / 500) * 100)}%`,
                  backgroundColor: slippageBps > 200 ? "#f87171" : slippageBps > 100 ? "#fbbf24" : "#2dd4bf",
                }}
              />
            </div>
            <p className="text-[10px] text-white/20 mt-1.5">
              {slippageBps <= 100 ? "Conservative" : slippageBps <= 200 ? "Moderate" : "Aggressive"}
            </p>
          </div>

          {/* Risk notice */}
          <div
            className="flex items-start gap-3 px-4 py-3.5 rounded-[9px]"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
          >
            <Info className="w-3.5 h-3.5 text-white/20 shrink-0 mt-0.5" strokeWidth={1.5} />
            <p className="text-[11px] text-white/25 leading-relaxed">
              Risk automation — not a liquidation guarantee. Flash crashes, oracle lag, and gas failures may still result in liquidation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
