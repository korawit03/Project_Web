import React from "react";
import { ClipboardList, Users } from "lucide-react";
import { COLORS } from "../lib/tokens.js";

const MENU = [
  { key: "form", label: "โครงงาน", icon: ClipboardList },
  { key: "customers", label: "ลูกค้า", icon: Users },
];

export default function MobileBottomNav({ activeView, onNavigate }) {
  return (
    <nav
      className="flex md:hidden fixed bottom-0 left-0 right-0 z-30 border-t"
      style={{
        background: COLORS.charcoal,
        borderColor: "rgba(255,255,255,0.08)",
        // เว้นพื้นที่กันขอบล่างสำหรับมือถือที่มี home indicator (iPhone)
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {MENU.map((menuItem) => {
        const isActive = activeView === menuItem.key;
        const Icon = menuItem.icon;
        return (
          <button
            key={menuItem.key}
            type="button"
            onClick={() => onNavigate(menuItem.key)}
            className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-medium"
            style={{ color: isActive ? COLORS.amber : "rgba(255,255,255,0.55)" }}
          >
            <Icon size={20} />
            {menuItem.label}
          </button>
        );
      })}
    </nav>
  );
}