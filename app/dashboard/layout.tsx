"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDisconnect, useAccount } from "wagmi";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { SidebarNav, SearchModal } from "@/components/ui/dashboard-sidebar";
import { PanelLeftClose, PanelLeftOpen, ShieldCheck, Loader2 } from "lucide-react";

// Map sidebar nav IDs → page components rendered inline.
// No router push needed — avoids full-page reloads inside the shell.
import dynamic from "next/dynamic";

const PAGES: Record<string, React.ComponentType> = {
  home:         dynamic(() => import("./page"),                { ssr: false }),
  positions:    dynamic(() => import("./positions/page"),      { ssr: false }),
  "pos-active":    dynamic(() => import("./positions/page"),   { ssr: false }),
  "pos-monitoring": dynamic(() => import("./positions/page"),  { ssr: false }),
  history:      dynamic(() => import("./history/page"),        { ssr: false }),
  settings:     dynamic(() => import("./settings/page"),       { ssr: false }),
};

const PAGE_TITLE: Record<string, string> = {
  home:            "Overview",
  positions:       "Positions",
  "pos-active":    "Positions",
  "pos-monitoring":"Positions",
  history:         "History",
  settings:        "Settings",
};

export default function DashboardLayout({
  children: _children,
}: {
  children: React.ReactNode;
}) {
  const { isConnected, address } = useAuthGuard();
  const { disconnect } = useDisconnect();
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeId, setActiveId]       = useState("home");
  const [searchOpen, setSearchOpen]   = useState(false);

  const handleDisconnect = () => {
    disconnect();
    router.replace("/connect");
  };

  const handleSelect = (id: string) => {
    if (id === "search") { setSearchOpen(true); return; }
    setActiveId(id);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#080808" }}>
        <Loader2 className="w-5 h-5 text-white/20 animate-spin" strokeWidth={1.5} />
      </div>
    );
  }

  const short = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";
  const ActivePage = PAGES[activeId] ?? PAGES["home"];

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#080808" }}>

      {/* Sidebar */}
      <div className={`h-full shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${sidebarOpen ? "w-[220px]" : "w-0"}`}>
        <SidebarNav
          className="w-[220px]"
          activeId={activeId}
          onSelect={handleSelect}
          address={address}
          onDisconnect={handleDisconnect}
        />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar */}
        <header
          className="h-11 shrink-0 flex items-center justify-between px-4 border-b border-white/[0.05]"
          style={{ background: "#0a0a0c" }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="p-1.5 rounded-[5px] text-white/25 hover:text-white/60 hover:bg-white/[0.04] transition-colors"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen
                ? <PanelLeftClose className="w-[15px] h-[15px]" strokeWidth={1.5} />
                : <PanelLeftOpen  className="w-[15px] h-[15px]" strokeWidth={1.5} />
              }
            </button>
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-white/25">
              <ShieldCheck className="w-3 h-3" strokeWidth={1.5} />
              <span>custos</span>
              <span className="text-white/15">/</span>
              <span className="text-white/50 capitalize">{PAGE_TITLE[activeId] ?? activeId}</span>
            </div>
          </div>

          {/* Wallet chip */}
          <div className="flex items-center gap-2 h-6 px-2.5 rounded-[5px] border border-white/[0.06] bg-white/[0.02]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[10px] text-white/40">{short}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <ActivePage />
        </main>
      </div>

      {/* Search modal */}
      {searchOpen && (
        <SearchModal
          onClose={() => setSearchOpen(false)}
          onSelect={(id) => { setActiveId(id); setSearchOpen(false); }}
        />
      )}
    </div>
  );
}
