"use client";

import React, { useState } from "react";
import {
  Search,
  LayoutDashboard,
  Settings,
  LogOut,
  Hash,
  ChevronRight,
  ShieldCheck,
  Clock,
  X,
  Command,
} from "lucide-react";

export type NavItemData = {
  id: string;
  title: string;
  icon: React.ElementType;
  badge?: number | string;
  shortcut?: string;
  children?: NavItemData[];
};

export type NavGroupData = {
  heading?: string;
  items: NavItemData[];
};

const NAV_GROUPS: NavGroupData[] = [
  {
    items: [
      { id: "search", title: "Search", icon: Search, shortcut: "⌘K" },
      { id: "home", title: "Overview", icon: LayoutDashboard },
    ],
  },
  {
    heading: "Protection",
    items: [
      {
        id: "positions",
        title: "Positions",
        icon: ShieldCheck,
        children: [
          { id: "pos-active", title: "Active", icon: Hash },
          { id: "pos-monitoring", title: "Monitoring", icon: Hash },
        ],
      },
      { id: "history", title: "History", icon: Clock },
    ],
  },
];

const BOTTOM_ITEMS: NavItemData[] = [
  { id: "settings", title: "Settings", icon: Settings, shortcut: "⌘," },
  { id: "logout", title: "Disconnect", icon: LogOut },
];

function WalletChip({ address }: { address?: string }) {
  const short = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "Not connected";

  return (
    <div className="flex items-center gap-3 px-2 py-2 mb-3 select-none">
      <div className="w-8 h-8 rounded-[6px] bg-white/[0.06] border border-white/[0.08] flex items-center justify-center shrink-0">
        <ShieldCheck className="w-4 h-4 text-white/60" strokeWidth={1.5} />
      </div>
      <div className="flex flex-col overflow-hidden min-w-0">
        <span className="text-[13px] font-semibold leading-none mb-1 text-white tracking-[-0.01em]">
          Custos
        </span>
        <span className="text-[10px] text-white/30 leading-none font-mono truncate">
          {short}
        </span>
      </div>
    </div>
  );
}

function NavItem({
  item,
  activeId,
  onSelect,
  level = 0,
}: {
  item: NavItemData;
  activeId: string;
  onSelect: (id: string) => void;
  level?: number;
}) {
  const isActive = activeId === item.id || item.children?.some((c) => c.id === activeId);
  const hasChildren = !!item.children;
  const [isOpen, setIsOpen] = useState(isActive);

  const handleClick = () => {
    if (hasChildren) setIsOpen((v) => !v);
    else onSelect(item.id);
  };

  return (
    <div className="flex flex-col w-full">
      <div
        className={`group flex items-center justify-between rounded-[6px] cursor-pointer transition-all duration-150 select-none
          ${isActive && !hasChildren
            ? "bg-white/[0.08] text-white"
            : "text-white/40 hover:bg-white/[0.04] hover:text-white/75"
          }`}
        style={{
          paddingTop: 6,
          paddingBottom: 6,
          paddingLeft: level * 12 + 10,
          paddingRight: 10,
        }}
        onClick={handleClick}
      >
        <div className="flex items-center gap-2.5">
          <item.icon
            className={`w-[14px] h-[14px] shrink-0 transition-colors ${
              isActive && !hasChildren ? "text-white" : "text-white/30 group-hover:text-white/55"
            }`}
            strokeWidth={1.5}
          />
          <span className="text-[12.5px] tracking-[-0.005em] truncate">{item.title}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {item.shortcut && (
            <kbd className="hidden group-hover:inline-flex items-center h-4 px-1 text-[9px] font-mono text-white/25 bg-white/[0.04] border border-white/[0.08] rounded-[3px]">
              {item.shortcut}
            </kbd>
          )}
          {item.badge !== undefined && (
            <span className="flex items-center justify-center min-w-[16px] h-[16px] px-1 text-[9px] font-medium rounded-full bg-white/[0.08] text-white/50">
              {item.badge}
            </span>
          )}
          {hasChildren && (
            <ChevronRight
              className={`w-3 h-3 text-white/15 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
              strokeWidth={2}
            />
          )}
        </div>
      </div>

      {hasChildren && (
        <div
          className={`grid transition-[grid-template-rows,opacity] duration-200 ease-in-out ${
            isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden min-h-0 relative flex flex-col gap-0.5 mt-0.5">
            <div
              className="absolute top-0 bottom-0 w-px bg-white/[0.05]"
              style={{ left: level * 12 + 17 }}
            />
            {item.children!.map((child) => (
              <NavItem key={child.id} item={child} activeId={activeId} onSelect={onSelect} level={level + 1} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function SidebarNav({
  className = "",
  activeId,
  onSelect,
  address,
  onDisconnect,
}: {
  className?: string;
  activeId?: string;
  onSelect?: (id: string) => void;
  address?: string;
  onDisconnect?: () => void;
}) {
  const [internalId, setInternalId] = useState("home");
  const currentId = activeId !== undefined ? activeId : internalId;

  const handleSelect = (id: string) => {
    if (id === "logout") { onDisconnect?.(); return; }
    onSelect ? onSelect(id) : setInternalId(id);
  };

  return (
    <div
      className={`flex flex-col w-[220px] h-full border-r border-white/[0.05] p-3 ${className}`}
      style={{ background: "#0a0a0c" }}
    >
      <WalletChip address={address} />

      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex flex-col gap-3">
        {NAV_GROUPS.map((group, idx) => (
          <div key={idx} className="flex flex-col gap-0.5">
            {group.heading && (
              <span className="px-2.5 pt-1 pb-1 text-[10px] font-medium tracking-[0.12em] text-white/20 uppercase">
                {group.heading}
              </span>
            )}
            {group.items.map((item) => (
              <NavItem key={item.id} item={item} activeId={currentId} onSelect={handleSelect} />
            ))}
          </div>
        ))}
      </div>

      <div className="mt-auto pt-3 border-t border-white/[0.05] flex flex-col gap-0.5">
        {BOTTOM_ITEMS.map((item) => (
          <NavItem key={item.id} item={item} activeId={currentId} onSelect={handleSelect} />
        ))}
      </div>
    </div>
  );
}

// ── Flat items for search ─────────────────────────────────────────────────
const flattenItems = (items: NavItemData[]): NavItemData[] =>
  items.reduce((acc, item) => {
    acc.push(item);
    if (item.children) acc.push(...flattenItems(item.children));
    return acc;
  }, [] as NavItemData[]);

const allItems = [...NAV_GROUPS.flatMap((g) => g.items), ...BOTTOM_ITEMS];
export const flatNavItems = flattenItems(allItems);

// ── Search modal ──────────────────────────────────────────────────────────
export function SearchModal({ onClose, onSelect }: { onClose: () => void; onSelect: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const results = query
    ? flatNavItems.filter((i) => i.title.toLowerCase().includes(query.toLowerCase()))
    : [];

  return (
    <div className="absolute inset-0 z-50 flex items-start justify-center pt-[14vh] bg-black/70 backdrop-blur-sm px-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-[12px] border border-white/[0.08] shadow-2xl overflow-hidden" style={{ background: "#111113" }}>
        <div className="flex items-center px-4 border-b border-white/[0.06]">
          <Search className="w-4 h-4 text-white/25 mr-3 shrink-0" strokeWidth={1.5} />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent py-3.5 outline-none text-[13px] text-white placeholder:text-white/20"
            placeholder="Search pages..."
          />
          <button onClick={onClose} className="ml-2 p-1 text-white/25 hover:text-white/60 transition-colors">
            <X className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
        </div>
        <div className="p-1.5 min-h-[70px]">
          {results.length > 0 ? (
            results.map((item) => (
              <button
                key={item.id}
                onClick={() => { onSelect(item.id); onClose(); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-[6px] text-left hover:bg-white/[0.04] transition-colors"
              >
                <item.icon className="w-3.5 h-3.5 text-white/25 shrink-0" strokeWidth={1.5} />
                <span className="text-[12.5px] text-white/60">{item.title}</span>
              </button>
            ))
          ) : (
            <div className="py-5 flex flex-col items-center justify-center">
              <Command className="w-4 h-4 text-white/15 mb-1.5" strokeWidth={1.5} />
              <p className="text-[11px] text-white/20">{query ? "No results" : "Type to search..."}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SidebarNav;
