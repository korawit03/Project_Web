import React, { useState, useMemo } from "react";
import { ListChecks, Search, Eye, ArrowLeft, MapPin, Users, Layers } from "lucide-react";
import { COLORS } from "../lib/tokens.js";
import { countByStatus } from "../lib/status.js";
import { StatusBadge, StatusSelect } from "../components/ui.jsx";

// สถานะรวมจากชิ้นงานทั้งหมด
//   ไม่มีชิ้นงาน -> null | เสร็จทุกชิ้น -> done | ยังไม่เริ่มสักชิ้น -> pending | นอกนั้น -> in_progress
function getOverallStatus(items) {
  const list = items || [];
  if (list.length === 0) return { status: null, done: 0, total: 0 };
  const counts = countByStatus(list);
  let status = "in_progress";
  if (counts.done === list.length) status = "done";
  else if (counts.pending === list.length) status = "pending";
  return { status, done: counts.done, total: list.length };
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

function Header({ title, subtitle }) {
  return (
    <div className="mb-6 flex items-center gap-2.5 border-b pb-4" style={{ borderColor: COLORS.border }}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: COLORS.charcoal }}>
        <ListChecks size={17} color={COLORS.amber} />
      </span>
      <div className="min-w-0">
        <h1 className="truncate text-lg font-bold" style={{ color: COLORS.charcoal }}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs" style={{ color: COLORS.textMuted }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

function StatusCell({ items }) {
  const { status, done, total } = getOverallStatus(items);
  if (!status) {
    return (
      <span className="text-xs" style={{ color: COLORS.textMuted }}>
        ยังไม่มีชิ้นงาน
      </span>
    );
  }
  return (
    <div className="flex flex-col items-start gap-1">
      <StatusBadge status={status} />
      <span className="text-[11px]" style={{ color: COLORS.textMuted }}>
        เสร็จ {done}/{total} ชิ้น
      </span>
    </div>
  );
}

// หน้า "รายละเอียดงาน" 2 ชั้น:
//   ชั้น 1 ตาราง 1 แถวต่อลูกค้า: ลูกค้า | โครงงาน | สถานะ | ปุ่มดู
//   ชั้น 2 กดดูแล้วแสดงโครงงานทั้งหมดของลูกค้าคนนั้น พร้อมชิ้นงาน 1, 2, 3 และสถานะ
export default function ProjectDetailPage({ projects, loading, onItemStatusChange }) {
  const [search, setSearch] = useState("");
  const [selectedKey, setSelectedKey] = useState(null);

  // รวมโครงงานของลูกค้าคนเดียวกันเป็นแถวเดียว
  const groups = useMemo(() => {
    const map = new Map();
    projects.forEach((p) => {
      const key = p.customerId || `unassigned-${p.customerName}`;
      if (!map.has(key)) map.set(key, { key, name: p.customerName, projects: [] });
      map.get(key).projects.push(p);
    });
    return Array.from(map.values());
  }, [projects]);

  const visibleGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter(
      (g) =>
        (g.name || "").toLowerCase().includes(q) ||
        g.projects.some((p) => (p.projectName || "").toLowerCase().includes(q))
    );
  }, [groups, search]);

  const selected = groups.find((g) => g.key === selectedKey) || null;

  // ===== ชั้น 2: โครงงานและชิ้นงานทั้งหมดของลูกค้าที่เลือก =====
  if (selected) {
    const allItems = selected.projects.flatMap((p) => p.items);
    const { done, total } = getOverallStatus(allItems);
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-8">
        <BackButton onClick={() => setSelectedKey(null)}>กลับไปดูรายชื่อลูกค้า</BackButton>

        <Header
          title={selected.name}
          subtitle={total > 0 ? `${selected.projects.length} โครงงาน · เสร็จแล้ว ${done} จาก ${total} ชิ้นงาน` : undefined}
        />

        <div className="space-y-6">
          {selected.projects.map((p) => (
            <section key={p.id}>
              <h2 className="mb-2 flex items-center gap-1.5 text-sm font-bold" style={{ color: COLORS.charcoal }}>
                <Layers size={14} style={{ color: COLORS.amber }} />
                <span className="truncate">
                  {selected.name} - {p.projectName || "(ไม่ระบุชื่อโครงงาน)"}
                </span>
              </h2>

              {p.items.length === 0 ? (
                <p className="rounded-xl border p-4 text-sm" style={{ borderColor: COLORS.border, background: COLORS.surface, color: COLORS.textMuted }}>
                  โครงงานนี้ยังไม่มีชิ้นงาน
                </p>
              ) : (
                <div className="space-y-2.5">
                  {p.items.map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-xl border p-4"
                      style={{ borderColor: COLORS.border, background: COLORS.surface }}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white"
                          style={{ background: COLORS.charcoal }}
                        >
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold" style={{ color: COLORS.charcoal }}>
                            {item.itemName || item.mainWork || "(ยังไม่ระบุชิ้นงาน)"}
                          </p>
                          {item.itemName && item.mainWork && (
                            <p className="truncate text-xs" style={{ color: COLORS.textMuted }}>
                              {item.mainWork}
                            </p>
                          )}
                          {item.positionNote && (
                            <p className="mt-0.5 flex items-center gap-1 text-xs" style={{ color: COLORS.textMuted }}>
                              <MapPin size={11} className="shrink-0" />
                              <span className="truncate">{item.positionNote}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {onItemStatusChange ? (
                        <StatusSelect
                          value={item.status}
                          onChange={(e) => onItemStatusChange(p.id, item.id, e.target.value)}
                        />
                      ) : (
                        <StatusBadge status={item.status} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      </div>
    );
  }

  // ===== ชั้น 1: ตารางลูกค้า (1 แถวต่อคน) =====
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-8">
      <Header title="รายละเอียดงาน" />

      <div className="relative mb-4">
        <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: COLORS.textMuted }} />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาชื่อลูกค้า / ชื่อโครงงาน"
          className="w-full rounded-lg border bg-white py-2.5 pl-10 pr-3.5 text-[15px] outline-none"
          style={{ borderColor: COLORS.border }}
        />
      </div>

      {loading && projects.length === 0 ? (
        <div className="rounded-xl border p-10 text-center" style={{ borderColor: COLORS.border, background: COLORS.surface }}>
          <p className="text-sm" style={{ color: COLORS.textMuted }}>กำลังโหลดข้อมูล...</p>
        </div>
      ) : visibleGroups.length === 0 ? (
        <div className="rounded-xl border p-10 text-center" style={{ borderColor: COLORS.border, background: COLORS.surface }}>
          <ListChecks size={40} className="mx-auto mb-3" style={{ color: COLORS.amber }} />
          <p className="text-sm" style={{ color: COLORS.textMuted }}>
            {projects.length === 0 ? 'ยังไม่มีโครงงาน ไปที่เมนู "โครงงาน > เพิ่ม" ได้เลย' : "ไม่พบข้อมูลที่ค้นหา"}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border" style={{ borderColor: COLORS.border, background: COLORS.surface }}>
          {/* หัวตาราง (เฉพาะจอกว้าง) */}
          <div
            className="hidden items-center gap-4 border-b px-4 py-2.5 text-xs font-medium md:grid md:grid-cols-[1fr_1.2fr_9rem_2.5rem]"
            style={{ borderColor: COLORS.border, background: "#FAF8F3", color: COLORS.textMuted }}
          >
            <span>ลูกค้า</span>
            <span>โครงงาน</span>
            <span>สถานะ</span>
            <span />
          </div>

          {visibleGroups.map((g, gi) => {
            const allItems = g.projects.flatMap((p) => p.items);
            const projectLabel =
              g.projects.length === 1
                ? g.projects[0].projectName || "(ไม่ระบุชื่อโครงงาน)"
                : `${g.projects.length} โครงงาน`;
            return (
              <div
                key={g.key}
                className={`grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 px-4 py-3.5 md:grid-cols-[1fr_1.2fr_9rem_2.5rem] ${gi > 0 ? "border-t" : ""}`}
                style={{ borderColor: COLORS.border }}
              >
                <div className="flex min-w-0 items-center gap-1.5">
                  <Users size={13} className="shrink-0" style={{ color: COLORS.amber }} />
                  <span className="truncate text-sm font-semibold" style={{ color: COLORS.charcoal }}>
                    {g.name}
                  </span>
                </div>

                {/* มือถือ: ปุ่มดูอยู่ฝั่งขวาแถวแรก / จอกว้าง: ไปอยู่คอลัมน์ท้ายสุด */}
                <button
                  type="button"
                  onClick={() => setSelectedKey(g.key)}
                  aria-label={`ดูรายละเอียดงานของ ${g.name}`}
                  className="flex h-8 w-8 items-center justify-center justify-self-end rounded-md border md:order-last"
                  style={{ borderColor: COLORS.border, color: COLORS.charcoalSoft, background: "white" }}
                >
                  <Eye size={15} />
                </button>

                <p className="col-span-2 truncate text-sm md:col-span-1" style={{ color: COLORS.charcoal }}>
                  {projectLabel}
                </p>

                <div className="col-span-2 md:col-span-1">
                  <StatusCell items={allItems} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}