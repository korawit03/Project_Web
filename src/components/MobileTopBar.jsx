import React from "react";
import { Wrench } from "lucide-react";
import { COLORS } from "../lib/tokens.js";

export default function MobileTopBar() {
  return (
    <header
      className="flex md:hidden items-center gap-2 px-4 py-3 sticky top-0 z-30 border-b"
      style={{ background: COLORS.charcoal, borderColor: "rgba(255,255,255,0.08)" }}
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-md shrink-0" style={{ background: COLORS.amber }}>
        <Wrench size={14} color={COLORS.charcoal} />
      </span>
      <div className="leading-tight">
        <p className="text-sm font-bold text-white">ระบบงานช่าง</p>
        <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.45)" }}>
          Site Work Manager
        </p>
      </div>
    </header>
  );
}