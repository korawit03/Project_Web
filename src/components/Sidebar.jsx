import React, { useState } from "react";
import { Wrench, ChevronDown } from "lucide-react";
import { COLORS } from "../lib/tokens.js";
import { MENU, isGroupActive } from "../lib/menu.js";

export default function Sidebar({ activeView, onNavigate }) {
  // เก็บว่ากลุ่มเมนูไหนกางอยู่ (เริ่มต้นกางกลุ่มที่กำลังใช้งานอยู่)
  const [openGroups, setOpenGroups] = useState(() => {
    const init = {};
    MENU.forEach((m) => {
      if (m.children && isGroupActive(m, activeView)) init[m.key] = true;
    });
    return init;
  });

  const toggleGroup = (key) => setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));

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
          const Icon = menuItem.icon;

          // ===== เมนูที่มีเมนูย่อย =====
          if (menuItem.children) {
            const groupActive = isGroupActive(menuItem, activeView);
            const expanded = Boolean(openGroups[menuItem.key]);
            return (
              <div key={menuItem.key}>
                <button
                  type="button"
                  onClick={() => toggleGroup(menuItem.key)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium cursor-pointer transition-colors"
                  style={{
                    background: groupActive && !expanded ? "rgba(232,149,28,0.15)" : "transparent",
                    color: groupActive ? COLORS.amber : "rgba(255,255,255,0.65)",
                  }}
                >
                  <Icon size={16} />
                  <span className="flex-1 text-left">{menuItem.label}</span>
                  <ChevronDown
                    size={14}
                    className="transition-transform duration-200"
                    style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
                  />
                </button>

                {expanded && (
                  <div className="mt-1 ml-4 space-y-1 border-l pl-2" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                    {menuItem.children.map((child) => {
                      const isActive = activeView === child.key;
                      const ChildIcon = child.icon;
                      return (
                        <button
                          key={child.key}
                          type="button"
                          onClick={() => onNavigate(child.key)}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium cursor-pointer transition-colors"
                          style={{
                            background: isActive ? "rgba(232,149,28,0.15)" : "transparent",
                            color: isActive ? COLORS.amber : "rgba(255,255,255,0.6)",
                          }}
                        >
                          <ChildIcon size={14} />
                          {child.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          // ===== เมนูปกติ =====
          const isActive = activeView === menuItem.key;
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