"use client";

import { useState } from "react";
import { useAccount, useDisconnect, useChainId, useChains } from "wagmi";
import {
  ShieldCheck, Save, AlertTriangle, ToggleLeft, ToggleRight,
  Info, Copy, CheckCheck, Send, Loader2, Link2,
} from "lucide-react";
import { useTelegramLink } from "@/hooks/useTelegramLink";

function SectionCard({ title, description, children }: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[10px] border border-white/[0.06] bg-white/[0.015] overflow-hidden">
      <div className="px-5 py-4 border-b border-white/[0.05]">
        <h2 className="text-[13px] font-medium text-white">{title}</h2>
        {description && <p className="text-[11px] text-white/30 mt-0.5">{description}</p>}
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
        {hint && <p className="text-[11px] text-white/25 mt-0.5 max-w-[320px]">{hint}</p>}
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
      className="w-24 h-8 px-3 rounded-[6px] bg-white/[0.04] border border-white/[0.08] text-[12px] font-mono text-white/70 outline-none focus:border-white/20 focus:bg-white/[0.06] transition-colors text-right"
    />
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)} className="flex items-center gap-1.5 text-white/40 hover:text-white/70 transition-colors">
      {on
        ? <ToggleRight className="w-8 h-8 text-emerald-400" strokeWidth={1.5} />
        : <ToggleLeft  className="w-8 h-8 text-white/20"    strokeWidth={1.5} />
      }
    </button>
  );
}

export default function SettingsPage() {
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const chains = useChains();
  const chain = chains.find((c) => c.id === chainId);

  // Protection thresholds
  const [triggerHF, setTriggerHF]  = useState(1.30);
  const [targetHF,  setTargetHF]   = useState(1.60);
  const [bufferPct, setBufferPct]  = useState(10);

  // Execution preferences
  const [flashLoan,    setFlashLoan]    = useState(true);
  const [useReserve,   setUseReserve]   = useState(false);
  const [deleverage,   setDeleverage]   = useState(false);
  const [slippageBps,  setSlippageBps]  = useState(50);

  // Notifications
  const [alertsOn, setAlertsOn] = useState(true);
  const [webhookUrl, setWebhookUrl] = useState("");

  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [linkCodeCopied, setLinkCodeCopied] = useState(false);

  const { linkCode, status: linkStatus, error: linkError, generateCode, reset: resetLink } = useTelegramLink();

  const handleSave = () => {
    // TODO: persist to backend / smart contract
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleCopy = () => {
    if (address) navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const short = address ? `${address.slice(0, 10)}...${address.slice(-6)}` : "—";

  return (
    <div className="w-full p-5 md:p-7 space-y-6 max-w-[760px]">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-semibold text-white tracking-[-0.02em]">Settings</h1>
          <p className="text-[12px] text-white/30 mt-0.5">Configure protection thresholds and execution policy</p>
        </div>
        <button
          onClick={handleSave}
          className="inline-flex items-center gap-1.5 h-8 px-4 rounded-[6px] bg-white text-[#080808] text-[12px] font-semibold tracking-[-0.01em] hover:bg-white/90 transition-colors"
        >
          {saved
            ? <><CheckCheck className="w-3.5 h-3.5" strokeWidth={2} />Saved</>
            : <><Save className="w-3.5 h-3.5" strokeWidth={2} />Save changes</>
          }
        </button>
      </div>

      {/* Wallet */}
      <SectionCard title="Wallet" description="Currently connected wallet and network.">
        <FieldRow label="Address" hint="Your connected wallet. Used to read positions and sign module approval.">
          <div className="flex items-center gap-2 h-8 px-3 rounded-[6px] bg-white/[0.03] border border-white/[0.06]">
            <ShieldCheck className="w-3.5 h-3.5 text-white/25 shrink-0" strokeWidth={1.5} />
            <span className="font-mono text-[11px] text-white/45">{short}</span>
            <button onClick={handleCopy} className="text-white/20 hover:text-white/50 transition-colors ml-1">
              {copied
                ? <CheckCheck className="w-3 h-3 text-emerald-400" strokeWidth={1.5} />
                : <Copy className="w-3 h-3" strokeWidth={1.5} />
              }
            </button>
          </div>
        </FieldRow>
        <FieldRow label="Network" hint="Chain where your positions are active.">
          <div className="flex items-center gap-2 h-8 px-3 rounded-[6px] bg-white/[0.03] border border-white/[0.06]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[11px] text-white/45">{chain?.name ?? "—"}</span>
          </div>
        </FieldRow>
        <FieldRow label="Disconnect" hint="Remove wallet connection and return to landing page.">
          <button
            onClick={() => disconnect()}
            className="h-8 px-3.5 rounded-[6px] border border-red-400/20 bg-red-400/[0.05] text-red-400/70 text-[12px] hover:bg-red-400/10 hover:border-red-400/30 hover:text-red-400 transition-colors"
          >
            Disconnect
          </button>
        </FieldRow>
      </SectionCard>

      {/* Protection thresholds */}
      <SectionCard
        title="Protection thresholds"
        description="Custos acts when HF drops below the trigger value and restores it to the target."
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
          hint="Extra collateral added above target HF to absorb oracle deviation. Default: 10%."
        >
          <NumberInput value={bufferPct} onChange={setBufferPct} min={0} max={50} step={1} />
        </FieldRow>

        {triggerHF >= targetHF && (
          <div className="mt-3 flex items-start gap-2.5 px-3 py-2.5 rounded-[7px] bg-red-400/[0.07] border border-red-400/20">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" strokeWidth={1.5} />
            <p className="text-[11px] text-red-400/80">Target HF must be greater than trigger HF.</p>
          </div>
        )}
      </SectionCard>

      {/* Execution policy */}
      <SectionCard
        title="Execution policy"
        description="Choose which funding sources and strategies Custos can use."
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
          hint="Maximum allowed swap slippage. 50 bps = 0.5%. Higher values increase success rate but worsen execution."
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
            className="w-56 h-8 px-3 rounded-[6px] bg-white/[0.04] border border-white/[0.08] text-[11px] font-mono text-white/60 placeholder:text-white/15 outline-none focus:border-white/20 transition-colors"
          />
        </FieldRow>
      </SectionCard>

      {/* Telegram linking */}
      <SectionCard
        title="Telegram notifications"
        description="Link your Telegram account to receive real-time liquidation risk alerts."
      >
        {!linkCode ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-[12px] text-white/40">
              Generate a one-time code and send it to the Custos Telegram bot to link your account.
            </p>
            <button
              onClick={generateCode}
              disabled={linkStatus === "loading"}
              className="inline-flex items-center gap-1.5 h-8 px-4 rounded-[6px] bg-white/[0.06] border border-white/[0.08] text-white/60 text-[12px] hover:bg-white/[0.10] hover:text-white/80 transition-colors disabled:opacity-40"
            >
              {linkStatus === "loading" ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.5} />Generating...</>
              ) : (
                <><Link2 className="w-3.5 h-3.5" strokeWidth={1.5} />Generate link code</>
              )}
            </button>
            {linkError && (
              <div className="flex items-start gap-2 px-3 py-2 rounded-[6px] bg-red-500/8 border border-red-500/15">
                <AlertTriangle className="w-3 h-3 text-red-400/70 shrink-0 mt-0.5" strokeWidth={1.5} />
                <p className="text-[11px] text-red-400/70">{linkError}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-start gap-4">
            <div className="flex items-center gap-3 w-full">
              <div className="flex-1 flex items-center gap-2 h-10 px-3.5 rounded-[7px] bg-white/[0.04] border border-white/[0.08]">
                <span className="font-mono text-[14px] text-white/70 tracking-[0.2em] select-all">{linkCode}</span>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`https://t.me/CustosBot?start=${linkCode}`);
                  setLinkCodeCopied(true);
                  setTimeout(() => setLinkCodeCopied(false), 2000);
                }}
                className="flex items-center gap-1.5 h-10 px-3.5 rounded-[7px] bg-white/[0.06] border border-white/[0.08] text-white/50 text-[12px] hover:bg-white/[0.10] hover:text-white/70 transition-colors shrink-0"
              >
                {linkCodeCopied ? (
                  <><CheckCheck className="w-3.5 h-3.5 text-emerald-400" strokeWidth={2} />Copied</>
                ) : (
                  <><Copy className="w-3.5 h-3.5" strokeWidth={1.5} />Copy link</>
                )}
              </button>
            </div>
            <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-[7px] bg-emerald-400/[0.06] border border-emerald-400/15">
              <Send className="w-3.5 h-3.5 text-emerald-400/60 shrink-0 mt-0.5" strokeWidth={1.5} />
              <div>
                <p className="text-[11px] text-emerald-400/70 leading-relaxed">
                  Send this link to{" "}
                  <a
                    href={`https://t.me/CustosBot?start=${linkCode}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 hover:text-emerald-400"
                  >
                    @CustosBot
                  </a>{" "}
                  on Telegram to complete linking. Code expires in 10 minutes.
                </p>
              </div>
            </div>
            <button
              onClick={resetLink}
              className="text-[11px] text-white/20 hover:text-white/40 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </SectionCard>

      {/* Risk notice */}
      <div className="flex items-start gap-3 px-4 py-3.5 rounded-[9px] bg-white/[0.02] border border-white/[0.05]">
        <Info className="w-3.5 h-3.5 text-white/20 shrink-0 mt-0.5" strokeWidth={1.5} />
        <p className="text-[11px] text-white/25 leading-relaxed">
          Custos is risk automation, not a liquidation guarantee. Flash crashes, oracle lag, and gas failures
          may still result in liquidation. Maintain a conservative Health Factor buffer independent of Custos.
        </p>
      </div>
    </div>
  );
}
