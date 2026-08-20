"use client";

import { useAccount, useBalance, useChainId, useChains } from "wagmi";
import { formatEther } from "viem";
import {
  AreaChart, Area, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import {
  ShieldCheck, AlertTriangle, Activity, TrendingDown,
  Zap, ArrowRight, CheckCircle, Clock,
} from "lucide-react";
import { POSITIONS, HISTORY, HF_TREND, PORTFOLIO_BREAKDOWN } from "@/lib/mock-data";

// ── helpers ───────────────────────────────────────────────────────────────
function hfBarPct(hf: number) {
  return Math.min(100, Math.max(0, ((hf - 1.0) / 1.0) * 100));
}

const HF_COLOR = { safe: "#34d399", warning: "#facc15", critical: "#f87171" };
const HF_BG    = {
  safe:     "bg-emerald-400/[0.06] border-emerald-400/20",
  warning:  "bg-yellow-400/[0.06] border-yellow-400/20",
  critical: "bg-red-400/[0.06] border-red-400/20",
};
const HF_TEXT  = { safe: "text-emerald-400", warning: "text-yellow-400", critical: "text-red-400" };
const HF_LABEL = { safe: "Safe", warning: "Monitor", critical: "At risk" };

// ── custom tooltip ────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[8px] border border-white/[0.08] px-3 py-2" style={{ background: "#111113" }}>
      <p className="text-[10px] font-mono text-white/30 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="text-[12px] font-mono" style={{ color: p.color }}>
          {p.name}: {p.value.toFixed(2)}
        </p>
      ))}
    </div>
  );
}

// ── stat card ─────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon }: {
  label: string; value: string; sub?: string; icon: React.ElementType;
}) {
  return (
    <div className="rounded-[10px] border border-white/[0.06] bg-white/[0.015] p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-white/25 tracking-[0.1em] uppercase">{label}</span>
        <div className="w-6 h-6 rounded-[5px] bg-white/[0.04] flex items-center justify-center">
          <Icon className="w-3 h-3 text-white/30" strokeWidth={1.5} />
        </div>
      </div>
      <div>
        <span className="text-[22px] font-semibold text-white tracking-[-0.02em] leading-none">{value}</span>
        {sub && <p className="text-[11px] text-white/25 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ── position mini-card ────────────────────────────────────────────────────
function PositionMini({ pos }: { pos: (typeof POSITIONS)[0] }) {
  const pct = hfBarPct(pos.hf);
  const tPct = hfBarPct(pos.triggerAt);
  const s = pos.status;
  return (
    <div className={`rounded-[10px] border p-4 ${HF_BG[s]}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[13px] font-medium text-white">{pos.protocol}</span>
            <span className="font-mono text-[9px] text-white/25 px-1.5 py-0.5 rounded-[3px] bg-white/[0.04]">{pos.chain}</span>
          </div>
          <p className="text-[11px] text-white/30">{pos.collateral} · {pos.debt}</p>
        </div>
        <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-[4px] border ${HF_BG[s]} ${HF_TEXT[s]}`}>
          {HF_LABEL[s]}
        </span>
      </div>
      <div className="flex items-baseline gap-1.5 mb-2">
        <span className={`text-[28px] font-semibold leading-none tracking-[-0.03em] tabular-nums ${HF_TEXT[s]}`}>
          {pos.hf.toFixed(2)}
        </span>
        <span className="text-[10px] text-white/20 font-mono">HF</span>
      </div>
      <div className="relative h-0.5 rounded-full bg-white/[0.06] overflow-hidden">
        <div className={`absolute left-0 top-0 h-full rounded-full ${
          s === "safe" ? "bg-emerald-400" : s === "warning" ? "bg-yellow-400" : "bg-red-400"
        }`} style={{ width: `${pct}%` }} />
        <div className="absolute top-0 h-full w-px bg-yellow-400/50" style={{ left: `${tPct}%` }} />
      </div>
    </div>
  );
}

// ── page ──────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { address } = useAccount();
  const chainId = useChainId();
  const chains = useChains();
  const chain = chains.find((c) => c.id === chainId);
  const { data: balance } = useBalance({ address });

  const atRisk = POSITIONS.filter((p) => p.status !== "safe").length;
  const totalCollateral = POSITIONS.reduce((s, p) => s + p.collateralUsd, 0);
  const totalDebt = POSITIONS.reduce((s, p) => s + p.debtUsd, 0);
  const recentActions = HISTORY.filter((h) => h.action !== "NOOP").slice(0, 3);

  return (
    <div className="w-full p-5 md:p-7 space-y-6">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-[18px] font-semibold text-white tracking-[-0.02em]">Overview</h1>
        <p className="text-[12px] text-white/30 mt-0.5">
          {POSITIONS.length} positions monitored · {chain?.name ?? "—"}
        </p>
      </div>

      {/* ── Alert ──────────────────────────────────────────────────── */}
      {atRisk > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-[8px] bg-yellow-400/[0.06] border border-yellow-400/20">
          <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 shrink-0" strokeWidth={1.5} />
          <p className="text-[12px] text-yellow-400/80 flex-1">
            {atRisk} position{atRisk > 1 ? "s" : ""} near trigger threshold — Custos is monitoring.
          </p>
          <button className="flex items-center gap-1 text-[11px] text-yellow-400/50 hover:text-yellow-400 transition-colors">
            View <ArrowRight className="w-3 h-3" strokeWidth={2} />
          </button>
        </div>
      )}

      {/* ── Stats ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard label="Total collateral" value={`$${totalCollateral.toLocaleString()}`} sub="Across all positions" icon={ShieldCheck} />
        <StatCard label="Total debt"       value={`$${totalDebt.toLocaleString()}`}       sub="Active borrows"       icon={TrendingDown} />
        <StatCard label="Protected"        value={String(POSITIONS.length)}                sub="Active positions"     icon={Activity} />
        <StatCard
          label="Wallet balance"
          value={balance ? `${parseFloat(formatEther(balance.value)).toFixed(4)} ${balance.symbol}` : "—"}
          sub={chain?.name}
          icon={Zap}
        />
      </div>

      {/* ── Main grid ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-5">

        {/* Left column */}
        <div className="space-y-5">

          {/* HF Trend chart */}
          <div className="rounded-[10px] border border-white/[0.06] bg-white/[0.015] p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[13px] font-medium text-white/80">Health Factor — 24h</h2>
                <p className="text-[11px] text-white/25 mt-0.5">Dashed line = trigger threshold (1.30)</p>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-mono text-white/30">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-px bg-emerald-400 inline-block" /> Aave V3
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-px bg-yellow-400 inline-block" /> Morpho
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={HF_TREND} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                <XAxis
                  dataKey="t"
                  tick={{ fontSize: 9, fill: "rgba(255,255,255,0.2)", fontFamily: "var(--font-jetbrains-mono)" }}
                  axisLine={false}
                  tickLine={false}
                  interval={2}
                />
                <YAxis
                  domain={[1.0, 2.2]}
                  tick={{ fontSize: 9, fill: "rgba(255,255,255,0.2)", fontFamily: "var(--font-jetbrains-mono)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <ReferenceLine y={1.3} stroke="rgba(250,204,21,0.3)" strokeDasharray="4 3" />
                <ReferenceLine y={1.0} stroke="rgba(248,113,113,0.25)" strokeDasharray="4 3" />
                <Line type="monotone" dataKey="aave"   stroke="#34d399" strokeWidth={1.5} dot={false} name="Aave V3" />
                <Line type="monotone" dataKey="morpho" stroke="#facc15" strokeWidth={1.5} dot={false} name="Morpho" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Positions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[13px] font-medium text-white/70">Active positions</h2>
              <button className="text-[11px] text-white/20 hover:text-white/50 transition-colors font-mono">
                + Add position
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {POSITIONS.map((p) => <PositionMini key={p.id} pos={p} />)}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">

          {/* Portfolio donut */}
          <div className="rounded-[10px] border border-white/[0.06] bg-white/[0.015] p-5">
            <h2 className="text-[13px] font-medium text-white/70 mb-4">Portfolio breakdown</h2>
            <div className="flex items-center justify-center">
              <PieChart width={130} height={130}>
                <Pie
                  data={PORTFOLIO_BREAKDOWN}
                  cx={60} cy={60}
                  innerRadius={40} outerRadius={60}
                  paddingAngle={2}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {PORTFOLIO_BREAKDOWN.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </div>
            <div className="space-y-2 mt-3">
              {PORTFOLIO_BREAKDOWN.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-[11px] text-white/40">{item.name}</span>
                  </div>
                  <span className="text-[11px] font-mono text-white/50">${item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent executions */}
          <div className="rounded-[10px] border border-white/[0.06] bg-white/[0.015] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
              <h2 className="text-[13px] font-medium text-white/70">Recent executions</h2>
              <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400/50">
                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse inline-block" />
                Live
              </span>
            </div>
            {recentActions.map((item, i) => (
              <div key={item.id} className={`flex items-start gap-3 px-4 py-3 ${i < recentActions.length - 1 ? "border-b border-white/[0.04]" : ""}`}>
                <div className="w-5 h-5 rounded-[4px] bg-white/[0.04] flex items-center justify-center shrink-0 mt-0.5">
                  {item.status === "success"
                    ? <CheckCircle className="w-3 h-3 text-emerald-400" strokeWidth={1.5} />
                    : <Clock className="w-3 h-3 text-white/20" strokeWidth={1.5} />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-white/60">{item.action.replace("_", " ").toLowerCase().replace(/^\w/, c => c.toUpperCase())}</p>
                  <p className="text-[10px] text-white/20 font-mono mt-0.5">{item.amount} {item.asset} · {item.source}</p>
                </div>
                <span className="font-mono text-[9px] text-white/15 shrink-0 mt-0.5">
                  HF {item.hfBefore}→{item.hfAfter}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
