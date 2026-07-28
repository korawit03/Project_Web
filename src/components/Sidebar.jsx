import React from "react";
import { Wrench, ClipboardList } from "lucide-react";
import { COLORS } from "../lib/tokens.js";

export default function Sidebar() {
  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col" style={{ background: COLORS.charcoal }}>
      <div className="flex items-center gap-2 px-5 py-5 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <span className="flex h-8 w-8 items-center justify-center rounded-md" style={{ background: COLORS.amber }}>
          <Wrench size={16} color={COLORS.charcoal} />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-bold text-white">ระบบงานช่าง</p>
          <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>
            Site Work Manager
          </p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4">
        {/* ตอนนี้มีเมนูเดียวตามที่ตกลงไว้ - เพิ่มเมนูอื่นทีหลังได้โดยเพิ่ม <button> อีกอันในนี้ */}
        <button
          type="button"
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium"
          style={{ background: "rgba(232,149,28,0.15)", color: COLORS.amber }}
        >
          <ClipboardList size={16} />
          โครงงาน
        </button>
      </nav>

      <div className="px-5 py-4 text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
        v0.1 · UI เริ่มต้น
      </div>
    </aside>
  );
}
