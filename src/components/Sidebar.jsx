import React from "react";
import { Wrench, ClipboardList, Users, UserPlus  } from "lucide-react";
import { COLORS } from "../lib/tokens.js";

const MENU = [
  { key: "customer-new", label: "เพิ่มลูกค้า", icon: UserPlus },
  { key: "form", label: "โครงงาน", icon: ClipboardList },
  { key: "customers", label: "ลูกค้า", icon: Users },
];

export default function Sidebar({ activeView, onNavigate }) {
  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col" style={{ background: COLORS.charcoal }}>
      <div className="flex items-center gap-2 px-5 py-5 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <span className="group flex h-8 w-8 items-center justify-center rounded-md" style={{ background: COLORS.amber }}>
  <Wrench size={16} color={COLORS.charcoal} className="transition-transform duration-300 group-hover:rotate-25" />
</span>
        <div className="leading-tight">
          <p className="text-sm font-bold text-white">ระบบงานช่าง</p>
          <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>
            Site Work Manager
          </p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {MENU.map((menuItem) => {
          const isActive = activeView === menuItem.key;
          const Icon = menuItem.icon;
          return (
            <button
              key={menuItem.key}
              type="button"
              onClick={() => onNavigate(menuItem.key)}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium cursor-pointer transition-colors"
              style={{
                background: isActive ? "rgba(232,149,28,0.15)" : "transparent",
                color: isActive ? COLORS.amber : "rgba(255,255,255,0.65)",
              }}
            >
              <Icon size={16} />
              {menuItem.label}
            </button>
          );
        })}
      </nav>

      <div className="px-5 py-4 text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
        v0.1 · UI เริ่มต้น
      </div>
    </aside>
  );
}