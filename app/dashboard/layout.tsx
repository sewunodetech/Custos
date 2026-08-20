"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDisconnect, useAccount } from "wagmi";
import { useTheme } from "next-themes";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { SidebarNav, SearchModal } from "@/components/ui/dashboard-sidebar";
import { PanelLeft, Sun, Moon, Search, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

/* ── Page registry ──────────────────────────────────────────────────────── */
const PAGES: Record<string, React.ComponentType> = {
  home:             dynamic(() => import("./page"),              { ssr: false }),
  positions:        dynamic(() => import("./positions/page"),    { ssr: false }),
  "pos-active":     dynamic(() => import("./positions/page"),    { ssr: false }),
  "pos-monitoring": dynamic(() => import("./positions/page"),    { ssr: false }),
  history:          dynamic(() => import("./history/page"),      { ssr: false }),
  chat:             dynamic(() => import("./chat/page"),         { ssr: false }),
  bot:              dynamic(() => import("./bot/page"),          { ssr: false }),
  settings:         dynamic(() => import("./settings/page"),     { ssr: false }),
};

const PAGE_TITLE: Record<string, string> = {
  home:             "Overview",
  positions:        "Positions",
  "pos-active":     "Positions",
  "pos-monitoring": "Positions",
  history:          "History",
  chat:             "AI Assistant",
  bot:              "Telegram Bot",
  settings:         "Settings",
};

/* ── Theme toggle ────────────────────────────────────────────────────────── */
function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-8 h-8" />;

  const isDark = resolvedTheme === "dark";
  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="w-8 h-8 flex items-center justify-center rounded-[6px] transition-colors"
      style={{ color: "var(--text-secondary)" }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "var(--item-hover)";
        (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "";
        (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
      }}
      aria-label="Toggle theme"
    >
      {isDark
        ? <Sun  style={{ width: 15, height: 15 }} strokeWidth={1.5} />
        : <Moon style={{ width: 15, height: 15 }} strokeWidth={1.5} />
      }
    </button>
  );
}

/* ── Layout ─────────────────────────────────────────────────────────────── */
export default function DashboardLayout({ children: _c }: { children: React.ReactNode }) {
  const { isConnected, address } = useAuthGuard();
  const { disconnect } = useDisconnect();
  const router = useRouter();

  const [collapsed,   setCollapsed]   = useState(false);
  const [activeId,    setActiveId]    = useState("home");
  const [searchOpen,  setSearchOpen]  = useState(false);

  /* ⌘K shortcut */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleDisconnect = () => { disconnect(); router.replace("/connect"); };
  const handleSelect     = (id: string) => {
    if (id === "search") { setSearchOpen(true); return; }
    setActiveId(id);
  };

  if (!isConnected) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg)" }}
      >
        <Loader2
          className="animate-spin"
          style={{ width: 20, height: 20, color: "var(--text-tertiary)" }}
          strokeWidth={1.5}
        />
      </div>
    );
  }

  const short      = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "";
  const pageTitle  = PAGE_TITLE[activeId] ?? activeId;
  const ActivePage = PAGES[activeId] ?? PAGES["home"];

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "var(--bg)" }}
    >
      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <div
        className="h-full shrink-0 overflow-hidden"
        style={{
          width: collapsed ? 52 : 232,
          transition: "width 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <SidebarNav
          activeId={activeId}
          onSelect={handleSelect}
          address={address}
          onDisconnect={handleDisconnect}
          collapsed={collapsed}
        />
      </div>

      {/* ── Main ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar */}
        <header
          className="shrink-0 flex items-center justify-between h-[52px] px-4"
          style={{
            background: "var(--topbar-bg)",
            borderBottom: "1px solid var(--topbar-border)",
          }}
        >
          {/* Left side */}
          <div className="flex items-center gap-2">
            {/* Sidebar toggle */}
            <button
              onClick={() => setCollapsed((v) => !v)}
              className="w-8 h-8 flex items-center justify-center rounded-[6px] transition-colors"
              style={{ color: "var(--text-secondary)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "var(--item-hover)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
              }}
              aria-label="Toggle sidebar"
            >
              <PanelLeft style={{ width: 15, height: 15 }} strokeWidth={1.5} />
            </button>

            {/* Divider */}
            <div
              className="w-px h-4 mx-1"
              style={{ background: "var(--border)" }}
            />

            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5">
              <span
                className="text-[12px] font-medium"
                style={{ color: "var(--text-tertiary)" }}
              >
                Custos
              </span>
              <span style={{ color: "var(--border-strong)" }} className="text-[12px]">/</span>
              <span
                className="text-[12px] font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                {pageTitle}
              </span>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-1.5">
            {/* Search button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden md:flex items-center gap-2 h-8 px-3 rounded-[6px] text-[12px] transition-colors"
              style={{
                color: "var(--text-tertiary)",
                background: "var(--bg-subtle)",
                border: "1px solid var(--border)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-strong)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--text-tertiary)";
              }}
            >
              <Search style={{ width: 12, height: 12 }} strokeWidth={1.5} />
              <span className="font-mono">Search</span>
              <span
                className="text-[10px] font-mono px-1.5 py-0.5 rounded-[4px]"
                style={{
                  background: "var(--bg-overlay)",
                  border: "1px solid var(--border-strong)",
                  color: "var(--text-tertiary)",
                }}
              >
                ⌘K
              </span>
            </button>

            {/* <ThemeToggle /> */}

            {/* Wallet chip */}
            {/* <div
              className="flex items-center gap-2 h-8 px-3 rounded-[6px] text-[11.5px] font-mono"
              style={{
                background: "var(--bg-subtle)",
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
                style={{ backgroundColor: "var(--safe)" }}
              />
              {short}
            </div> */}
          </div>
        </header>

        {/* Page content */}
        <main
          className="flex-1 overflow-y-auto scrollbar-hide"
          style={{ background: "var(--bg)" }}
        >
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
