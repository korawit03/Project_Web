import React, { useState } from "react";
import { ChevronUp } from "lucide-react";
import { COLORS } from "../lib/tokens.js";
import { MENU, isGroupActive } from "../lib/menu.js";

export default function MobileBottomNav({ activeView, onNavigate }) {
  const [openGroup, setOpenGroup] = useState(null);

  const handleNavigate = (key) => {
    setOpenGroup(null);
    onNavigate(key);
  };

  return (
    <>
      {/* พื้นหลังโปร่งใสสำหรับกดปิดเมนูย่อย */}
      {openGroup && <div className="md:hidden fixed inset-0 z-20" onClick={() => setOpenGroup(null)} />}

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
          const Icon = menuItem.icon;

          if (menuItem.children) {
            const groupActive = isGroupActive(menuItem, activeView);
            const expanded = openGroup === menuItem.key;
            return (
              <div key={menuItem.key} className="relative flex flex-1">
                {expanded && (
                  <div
                    className="absolute bottom-full left-2 mb-2 w-52 overflow-hidden rounded-xl border shadow-lg"
                    style={{ background: COLORS.charcoalSoft, borderColor: "rgba(255,255,255,0.1)" }}
                  >
                    {menuItem.children.map((child) => {
                      const ChildIcon = child.icon;
                      const isActive = activeView === child.key;
                      return (
                        <button
                          key={child.key}
                          type="button"
                          onClick={() => handleNavigate(child.key)}
                          className="flex w-full items-center gap-2.5 px-4 py-3 text-sm font-medium"
                          style={{
                            color: isActive ? COLORS.amber : "rgba(255,255,255,0.8)",
                            background: isActive ? "rgba(232,149,28,0.15)" : "transparent",
                          }}
                        >
                          <ChildIcon size={16} />
                          {child.label}
                        </button>
                      );
                    })}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setOpenGroup(expanded ? null : menuItem.key)}
                  className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-medium"
                  style={{ color: groupActive || expanded ? COLORS.amber : "rgba(255,255,255,0.55)" }}
                >
                  <Icon size={20} />
                  <span className="flex items-center gap-0.5">
                    {menuItem.label}
                    <ChevronUp
                      size={10}
                      className="transition-transform"
                      style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
                    />
                  </span>
                </button>
              </div>
            );
          }

          const isActive = activeView === menuItem.key;
          return (
            <button
              key={menuItem.key}
              type="button"
              onClick={() => handleNavigate(menuItem.key)}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-medium"
              style={{ color: isActive ? COLORS.amber : "rgba(255,255,255,0.55)" }}
            >
              <Icon size={20} />
              {menuItem.label}
            </button>
          );
        })}
      </nav>
    </>
  );
}