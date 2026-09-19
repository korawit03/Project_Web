import React, { useState } from "react";
import { Users, ChevronRight, ArrowLeft, MapPin, Phone } from "lucide-react";
import { COLORS } from "../lib/tokens.js";
import { STATUS_OPTIONS, countByStatus } from "../lib/status.js";
import { StatusBadge } from "../components/ui.jsx";
import ProjectCard from "../components/ProjectCard.jsx";

// แถวชิปสรุปจำนวนชิ้นงานแยกตามสถานะ (โชว์เฉพาะสถานะที่มีจำนวน > 0)
function StatusChips({ counts }) {
  const hasAny = STATUS_OPTIONS.some((s) => counts[s.value] > 0);
  if (!hasAny) {
    return (
      <span className="text-xs" style={{ color: COLORS.textMuted }}>
        ยังไม่มีชิ้นงาน
      </span>
    );
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {STATUS_OPTIONS.map((s) =>
        counts[s.value] > 0 ? (
          <span
            key={s.value}
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
            style={{ color: s.color, background: s.bg }}
          >
            {counts[s.value]} {s.label}
          </span>
        ) : null
      )}
    </div>
  );
}

function BackButton({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-4 flex items-center gap-1.5 text-sm font-medium"
      style={{ color: COLORS.amberDark }}
    >
      <ArrowLeft size={14} />
      {children}
    </button>
  );
}

export default function CustomerListPage({
  projects,
  loading,
  onUpdateProject,
  onDeleteProject,
  onItemStatusChange,
  workCatalog,
  categoryOrder,
}) {
  const [selectedCustomerKey, setSelectedCustomerKey] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  const grouped = projects.reduce((acc, p) => {
    const key = p.customerId || `unassigned-${p.customerName}`;
    if (!acc[key]) acc[key] = { key, name: p.customerName, phone: p.customerPhone, projects: [] };
    acc[key].projects.push(p);
    return acc;
  }, {});

  const groupKeys = Object.keys(grouped).sort((a, b) => {
    const latestA = Math.max(...grouped[a].projects.map((p) => new Date(p.updatedAt || p.savedAt).getTime()));
    const latestB = Math.max(...grouped[b].projects.map((p) => new Date(p.updatedAt || p.savedAt).getTime()));
    return latestB - latestA;
  });

  const selectedGroup = selectedCustomerKey ? grouped[selectedCustomerKey] : null;
  const selectedProject = selectedGroup?.projects.find((p) => p.id === selectedProjectId) || null;

  const Header = ({ title }) => (
    <div className="mb-6 flex items-center gap-2.5 border-b pb-4" style={{ borderColor: COLORS.border }}>
      <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: COLORS.charcoal }}>
        <Users size={17} color={COLORS.amber} />
      </span>
      <h1 className="text-lg font-bold" style={{ color: COLORS.charcoal }}>
        {title}
      </h1>
    </div>
  );

  if (loading && projects.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-8">
        <Header title="สถานะงานลูกค้า" />
        <div className="rounded-xl border p-10 text-center" style={{ borderColor: COLORS.border, background: COLORS.surface }}>
          <p className="text-sm" style={{ color: COLORS.textMuted }}>กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (groupKeys.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-8">
        <Header title="สถานะงานลูกค้า" />
        <div className="rounded-xl border p-10 text-center" style={{ borderColor: COLORS.border, background: COLORS.surface }}>
          <Users size={40} className="mx-auto mb-3" style={{ color: COLORS.amber }} />
          <p className="text-sm" style={{ color: COLORS.textMuted }}>
            ยังไม่มีข้อมูลลูกค้าที่บันทึกไว้ ลองไปกรอกฟอร์ม "โครงงาน" แล้วกดบันทึกดูก่อนได้เลย
          </p>
        </div>
      </div>
    );
  }

  // ===== ชั้นที่ 3: รายชิ้นงาน + สถานะ ของโปรเจคที่เลือก =====
  if (selectedGroup && selectedProject) {
    const counts = countByStatus(selectedProject.items);
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-8">
        <BackButton onClick={() => setSelectedProjectId(null)}>
          กลับไปดูโปรเจคของ {selectedGroup.name}
        </BackButton>

        <Header title={selectedProject.location || "โปรเจค (ไม่ระบุสถานที่)"} />

        <div className="mb-4">
          <StatusChips counts={counts} />
        </div>

        {selectedProject.items.length === 0 ? (
          <p className="text-sm" style={{ color: COLORS.textMuted }}>โปรเจคนี้ยังไม่มีชิ้นงาน</p>
        ) : (
          <div className="space-y-3 mb-8">
            {selectedProject.items.map((item, idx) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-xl border p-4"
                style={{ borderColor: COLORS.border, background: COLORS.surface }}
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: COLORS.charcoal }}>
                    {idx + 1}. {item.mainWork || "(ยังไม่ระบุชิ้นงาน)"}
                  </p>
                  {item.positionNote && (
                    <p className="flex items-center gap-1 text-xs mt-0.5" style={{ color: COLORS.textMuted }}>
                      <MapPin size={11} />
                      {item.positionNote}
                    </p>
                  )}
                </div>
                <StatusBadge status={item.status} />
              </div>
            ))}
          </div>
        )}

        <div className="rounded-xl border overflow-hidden" style={{ borderColor: COLORS.border }}>
          <ProjectCard
            project={selectedProject}
            onUpdate={(updated) => onUpdateProject(selectedProject.id, updated)}
            onDelete={() => {
              onDeleteProject(selectedProject.id);
              setSelectedProjectId(null);
            }}
            workCatalog={workCatalog}
            categoryOrder={categoryOrder}
          />
        </div>
      </div>
    );
  }

  // ===== ชั้นที่ 2: โปรเจคทั้งหมดของลูกค้าที่เลือก =====
  if (selectedGroup) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-8">
        <BackButton onClick={() => setSelectedCustomerKey(null)}>กลับไปดูรายชื่อลูกค้า</BackButton>

        <div className="mb-6 flex items-center gap-2.5 border-b pb-4" style={{ borderColor: COLORS.border }}>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: COLORS.charcoal }}>
            <Users size={17} color={COLORS.amber} />
          </span>
          <div>
            <h1 className="text-lg font-bold" style={{ color: COLORS.charcoal }}>{selectedGroup.name}</h1>
            {selectedGroup.phone && (
              <p className="flex items-center gap-1 text-xs" style={{ color: COLORS.textMuted }}>
                <Phone size={11} /> {selectedGroup.phone}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {selectedGroup.projects
            .slice()
            .sort((a, b) => new Date(b.updatedAt || b.savedAt) - new Date(a.updatedAt || a.savedAt))
            .map((p) => {
              const counts = countByStatus(p.items);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedProjectId(p.id)}
                  className="w-full text-left rounded-xl border p-4 transition-shadow hover:shadow-sm"
                  style={{ borderColor: COLORS.border, background: COLORS.surface }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: COLORS.charcoal }}>
                        {p.location || "ไม่ระบุสถานที่"}
                      </p>
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>{p.items.length} ชิ้นงาน</p>
                    </div>
                    <ChevronRight size={16} style={{ color: COLORS.textMuted }} />
                  </div>
                  <div className="mt-2.5">
                    <StatusChips counts={counts} />
                  </div>
                </button>
              );
            })}
        </div>
      </div>
    );
  }

  // ===== ชั้นที่ 1: รายชื่อลูกค้าทั้งหมด =====
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-8">
      <Header title="สถานะงานลูกค้า" />

      <div className="space-y-3">
        {groupKeys.map((key) => {
          const group = grouped[key];
          const allItems = group.projects.flatMap((p) => p.items);
          const counts = countByStatus(allItems);
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedCustomerKey(key)}
              className="w-full text-left rounded-xl border p-4 transition-shadow hover:shadow-sm"
              style={{ borderColor: COLORS.border, background: COLORS.surface }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Users size={15} style={{ color: COLORS.amber }} />
                  <span className="text-sm font-semibold truncate" style={{ color: COLORS.charcoal }}>
                    {group.name}
                  </span>
                  <span className="text-xs shrink-0" style={{ color: COLORS.textMuted }}>
                    · {group.projects.length} โครงงาน
                  </span>
                </div>
                <ChevronRight size={16} style={{ color: COLORS.textMuted }} />
              </div>
              <div className="mt-2.5">
                <StatusChips counts={counts} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}