"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { ShieldCheck, Wallet, AlertCircle, Loader2 } from "lucide-react";

const WALLETS = [
  {
    id: "metaMask",
    name: "MetaMask",
    description: "Browser extension wallet",
    icon: (
      <svg viewBox="0 0 35 33" className="w-6 h-6" fill="none">
        <path d="M32.958 1L19.48 10.808l2.442-5.79L32.958 1z" fill="#E17726" stroke="#E17726" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2.042 1l13.36 9.895-2.323-5.877L2.042 1z" fill="#E27625" stroke="#E27625" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M28.229 23.533l-3.588 5.494 7.676 2.114 2.202-7.48-6.29-.128z" fill="#E27625" stroke="#E27625" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M.481 23.661l2.186 7.48 7.66-2.114-3.572-5.494-6.274.128z" fill="#E27625" stroke="#E27625" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9.961 14.564l-2.136 3.23 7.608.343-.256-8.193-5.216 4.62z" fill="#E27625" stroke="#E27625" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M25.039 14.564l-5.286-4.71-.175 8.283 7.593-.343-2.132-3.23z" fill="#E27625" stroke="#E27625" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10.327 29.027l4.573-2.209-3.95-3.086-.623 5.295z" fill="#E27625" stroke="#E27625" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M20.1 26.818l4.573 2.209-.639-5.295-3.934 3.086z" fill="#E27625" stroke="#E27625" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: "injected",
    name: "Browser Wallet",
    description: "Coinbase, Rabby, or any injected wallet",
    icon: <Wallet className="w-6 h-6 text-white/50" strokeWidth={1.5} />,
  },
  {
    id: "walletConnect",
    name: "WalletConnect",
    description: "Scan with any mobile wallet",
    icon: (
      <svg viewBox="0 0 300 185" className="w-6 h-6">
        <path d="M61.44 36.37c48.85-47.85 128.05-47.85 176.9 0l5.88 5.76a6.04 6.04 0 010 8.67l-20.1 19.69a3.18 3.18 0 01-4.43 0l-8.1-7.93c-34.07-33.38-89.33-33.38-123.4 0l-8.67 8.49a3.18 3.18 0 01-4.43 0L54.99 50.86a6.04 6.04 0 010-8.67l6.45-5.82zm218.36 40.67l17.89 17.52a6.04 6.04 0 010 8.67l-80.67 79.01a6.35 6.35 0 01-8.87 0L149.7 124.8a1.59 1.59 0 00-2.22 0l-58.4 57.44a6.35 6.35 0 01-8.87 0L.54 103.23a6.04 6.04 0 010-8.67l17.89-17.52a6.35 6.35 0 018.87 0l58.4 57.44c.61.6 1.6.6 2.22 0l58.4-57.44a6.35 6.35 0 018.87 0l58.4 57.44c.61.6 1.6.6 2.22 0l58.4-57.44a6.35 6.35 0 018.86 0z" fill="#3B99FC"/>
      </svg>
    ),
  },
];

export default function ConnectPage() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const { connect, connectors, isPending, error, variables } = useConnect();
  const { disconnect } = useDisconnect();

  // Redirect to dashboard once connected
  useEffect(() => {
    if (isConnected) router.replace("/dashboard");
  }, [isConnected, router]);

  const getConnectorByWalletId = (id: string) => {
    if (id === "metaMask") return connectors.find((c) => c.name === "MetaMask" || (c.id === "injected" && c.name?.toLowerCase().includes("metamask")));
    if (id === "walletConnect") return connectors.find((c) => c.id === "walletConnect");
    // generic injected
    return connectors.find((c) => c.id === "injected");
  };

  const handleConnect = (walletId: string) => {
    const connector = getConnectorByWalletId(walletId);
    if (!connector) return;
    connect({ connector });
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "#080808" }}
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(255,255,255,0.05) 0%, transparent 100%)",
        }}
      />

      <div className="relative z-10 w-full max-w-[400px]">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-12 h-12 rounded-[10px] border border-white/10 bg-white/5 flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6 text-white/80" strokeWidth={1.5} />
          </div>
          <h1 className="text-[20px] font-semibold text-white tracking-[-0.02em] mb-1">
            Connect to Custos
          </h1>
          <p className="text-[13px] text-white/35 text-center max-w-[280px]">
            Connect your wallet to monitor and protect your DeFi positions.
          </p>
        </div>

        {/* Wallet options */}
        <div className="flex flex-col gap-2">
          {WALLETS.map((wallet) => {
            const connector = getConnectorByWalletId(wallet.id);
            // variables.connector is CreateConnectorFn | Connector — use name comparison
            const pendingConnector = isPending
              ? connectors.find((c) => c === variables?.connector)
              : undefined;
            const isLoading = isPending && pendingConnector?.id === connector?.id;

            return (
              <button
                key={wallet.id}
                onClick={() => handleConnect(wallet.id)}
                disabled={isPending || !connector}
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-[10px] border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed text-left group"
              >
                <div className="w-10 h-10 rounded-[8px] bg-white/5 border border-white/[0.07] flex items-center justify-center shrink-0">
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 text-white/50 animate-spin" strokeWidth={1.5} />
                  ) : (
                    wallet.icon
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-white/80 group-hover:text-white transition-colors">
                    {wallet.name}
                  </p>
                  <p className="text-[11px] text-white/30 mt-0.5">
                    {wallet.description}
                  </p>
                </div>
                {!connector && (
                  <span className="text-[10px] font-mono text-white/20 shrink-0">
                    Not detected
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 flex items-start gap-2.5 px-4 py-3 rounded-[8px] bg-red-500/8 border border-red-500/15">
            <AlertCircle className="w-4 h-4 text-red-400/70 shrink-0 mt-0.5" strokeWidth={1.5} />
            <p className="text-[12px] text-red-400/70 leading-relaxed">
              {error.message?.includes("User rejected")
                ? "Connection rejected."
                : (error.message ?? "Failed to connect.")}
            </p>
          </div>
        )}

        {/* Footer */}
        <p className="mt-8 text-center text-[11px] text-white/20">
          By connecting you agree to our{" "}
          <span className="underline underline-offset-2 cursor-pointer hover:text-white/40 transition-colors">
            terms
          </span>
          . Custos never has custody of your funds.
        </p>
      </div>
    </div>
  );
}
