import React from "react";
import { Users } from "lucide-react";
import { COLORS } from "../lib/tokens.js";
import ProjectCard from "../components/ProjectCard.jsx";

export default function CustomerListPage({ projects, loading, onUpdateProject, onDeleteProject, workCatalog, categoryOrder }) {
  const grouped = projects.reduce((acc, p) => {
    const key = p.customerId || `unassigned-${p.customerName}`;
    if (!acc[key]) acc[key] = { name: p.customerName, projects: [] };
    acc[key].projects.push(p);
    return acc;
  }, {});

  const groupKeys = Object.keys(grouped).sort((a, b) => {
    const latestA = Math.max(...grouped[a].projects.map((p) => new Date(p.updatedAt || p.savedAt).getTime()));
    const latestB = Math.max(...grouped[b].projects.map((p) => new Date(p.updatedAt || p.savedAt).getTime()));
    return latestB - latestA;
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-8">
      <div className="mb-6 flex items-center gap-2.5 border-b pb-4" style={{ borderColor: COLORS.border }}>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: COLORS.charcoal }}>
          <Users size={17} color={COLORS.amber} />
        </span>
        <h1 className="text-lg font-bold" style={{ color: COLORS.charcoal }}>
          รายการลูกค้าที่บันทึกไว้
        </h1>
      </div>

      {loading && projects.length === 0 ? (
        <div className="rounded-xl border p-10 text-center" style={{ borderColor: COLORS.border, background: COLORS.surface }}>
          <p className="text-sm" style={{ color: COLORS.textMuted }}>
            กำลังโหลดข้อมูล...
          </p>
        </div>
      ) : groupKeys.length === 0 ? (
        <div className="rounded-xl border p-10 text-center" style={{ borderColor: COLORS.border, background: COLORS.surface }}>
          <Users
            size={40}
            className="mx-auto mb-3"
            style={{ color: COLORS.amber, animation: "gentle-bounce 2.2s ease-in-out infinite" }}
          />
          <p className="text-sm" style={{ color: COLORS.textMuted }}>
            ยังไม่มีข้อมูลลูกค้าที่บันทึกไว้ ลองไปกรอกฟอร์ม "โครงงาน" แล้วกดบันทึกดูก่อนได้เลย
          </p>
          <style>{`
            @keyframes gentle-bounce {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-6px); }
            }
          `}</style>
        </div>
      ) : (
        <div className="space-y-6">
          {groupKeys.map((key) => {
            const group = grouped[key];
            return (
              <div key={key} className="rounded-xl border overflow-hidden" style={{ borderColor: COLORS.border, background: COLORS.surface }}>
                <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: COLORS.border, background: "#FAF8F3" }}>
                  <Users size={15} style={{ color: COLORS.amber }} />
                  <span className="text-sm font-semibold" style={{ color: COLORS.charcoal }}>
                    {group.name}
                  </span>
                  <span className="ml-auto text-xs" style={{ color: COLORS.textMuted }}>
                    {group.projects.length} รายการบันทึก
                  </span>
                </div>

                <div className="divide-y" style={{ borderColor: COLORS.border }}>
                  {group.projects
                    .slice()
                    .sort((a, b) => new Date(b.updatedAt || b.savedAt) - new Date(a.updatedAt || a.savedAt))
                    .map((p) => (
                      <ProjectCard
                        key={p.id}
                        project={p}
                        onUpdate={(updated) => onUpdateProject(p.id, updated)}
                        onDelete={() => onDeleteProject(p.id)}
                        workCatalog={workCatalog}
                        categoryOrder={categoryOrder}
                      />
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}