import React, { useState, useMemo } from "react";
import { ListChecks, Search, Eye, ArrowLeft, MapPin, Users, Layers, ChevronDown, ChevronUp, Image as ImageIcon, History } from "lucide-react";
import { COLORS } from "../lib/tokens.js";
import { countByStatus, getStatusMeta } from "../lib/status.js";
import { StatusBadge, StatusSelect, StatusSegment } from "../components/ui.jsx";

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
      className="mb-4 flex items-center gap-1.5 text-sm font-medium cursor-pointer hover:underline"
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

export default function ProjectDetailPage({ projects, loading, onItemStatusChange, workCatalog = {} }) {
  const [search, setSearch] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [expandedItemId, setExpandedItemId] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

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

  // หาโครงงานที่เลือก + ลูกค้าเจ้าของโครงงานนั้น
  const selectedProject = projects.find((p) => p.id === selectedProjectId) || null;
  const selected = selectedProject
    ? {
      key: selectedProject.customerId || `unassigned-${selectedProject.customerName}`,
      name: selectedProject.customerName,
      projects: [selectedProject], // มีโครงงานเดียว
    }
    : null;

  const doneItems = selectedProject
    ? selectedProject.items
      .filter((it) => it.status === "done")
      .map((it) => ({ ...it, projectName: selectedProject.projectName }))
    : [];
  if (selected) {
    const allItems = selected.projects.flatMap((p) => p.items);
    const { done, total } = getOverallStatus(allItems);

    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-8">
        <BackButton onClick={() => setSelectedProjectId(null)}>กลับไปดูรายการโครงงาน</BackButton>

        <Header
          title={selectedProject.projectName || "(ไม่ระบุชื่อโครงงาน)"}
          subtitle={`ลูกค้า: ${selected.name}${total > 0 ? ` · เสร็จแล้ว ${done} จาก ${total} ชิ้นงาน` : ""}`}
        />
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-medium"
            style={{ color: COLORS.amberDark }}
          >
            <History size={13} />
            {showHistory ? "ซ่อนประวัติงานที่เสร็จแล้ว" : `ดูประวัติงานที่เสร็จแล้ว (${doneItems.length})`}
          </button>
        </div>

        {showHistory && (
          <div className="mb-6 rounded-xl border p-4 space-y-2" style={{ borderColor: COLORS.border, background: "#FCFBF8" }}>
            {doneItems.length === 0 ? (
              <p className="text-xs" style={{ color: COLORS.textMuted }}>ยังไม่มีชิ้นงานที่เสร็จแล้ว</p>
            ) : (
              doneItems.map((it) => (
                <div key={it.id} className="flex items-center justify-between gap-2 text-xs">
                  <span style={{ color: COLORS.charcoal }}>
                    {it.itemName || it.mainWork || "(ไม่ระบุชิ้นงาน)"}
                    <span style={{ color: COLORS.textMuted }}> · {it.projectName || "(ไม่ระบุชื่อโครงงาน)"}</span>
                  </span>
                  <StatusBadge status={it.status} />
                </div>
              ))
            )}
          </div>
        )}
        <div className="space-y-6">
          {selected.projects.map((p) => (
            <section key={p.id}>
              {(() => {
                const { done, total } = getOverallStatus(p.items);
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                return (
                  <div className="mb-2">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="flex min-w-0 items-center gap-1.5 text-sm font-bold" style={{ color: COLORS.charcoal }}>
                        <Layers size={14} className="shrink-0" style={{ color: COLORS.amber }} />
                        <span className="truncate">{p.projectName || "(ไม่ระบุชื่อโครงงาน)"}</span>
                      </h2>
                      {total > 0 && (
                        <span className="shrink-0 text-xs" style={{ color: COLORS.textMuted }}>
                          เสร็จ {done}/{total} ชิ้น
                        </span>
                      )}
                    </div>
                    {total > 0 && (
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full" style={{ background: "#EEECE6" }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: COLORS.green }} />
                      </div>
                    )}
                  </div>
                );
              })()}

              {p.items.length === 0 ? (
                <p className="rounded-xl border p-4 text-sm" style={{ borderColor: COLORS.border, background: COLORS.surface, color: COLORS.textMuted }}>
                  โครงงานนี้ยังไม่มีชิ้นงาน
                </p>
              ) : (
                <div className="space-y-3">
                  {p.items.map((item, idx) => {
                    const isOpen = expandedItemId === item.id;
                    const catalogEntry = workCatalog[item.mainWork];
                    const positionPhotos = item.positionPhotos || [];
                    const workPhotos = item.workPhotos || [];
                    const hasPhotos = positionPhotos.length > 0 || workPhotos.length > 0;
                    const hasAnswers = Object.keys(item.answers || {}).length > 0;

                    return (
                      <div
                        key={item.id}
                        className="rounded-xl border overflow-hidden"
                        style={{ borderColor: COLORS.border, background: COLORS.surface, borderLeft: `4px solid ${getStatusMeta(item.status).color}`, }}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                          <button
                            type="button"
                            onClick={() => setExpandedItemId(isOpen ? null : item.id)}
                            className="flex min-w-0 flex-1 items-center gap-3 text-left cursor-pointer"
                          >
                            <span
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white"
                              style={{ background: COLORS.charcoal }}
                            >
                              {idx + 1}
                            </span>
                            <div className="min-w-0 flex-1">
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
                                  <span className="truncate">ตำแหน่ง: {item.positionNote}</span>
                                </p>
                              )}
                            </div>

                            {/* แทนที่ chevron เดิมทั้งสองฝั่ง ด้วยบล็อกนี้ */}
                            <span className="flex shrink-0 items-center gap-1 text-xs" style={{ color: COLORS.textMuted }}>
                              <span className="hidden sm:inline">{isOpen ? "ซ่อน" : "ดูรายละเอียด"}</span>
                              {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </span>
                          </button>

                          <div className="w-full sm:w-auto">
                            {onItemStatusChange ? (
                              <StatusSegment
                                value={item.status}
                                onChange={(value) => onItemStatusChange(p.id, item.id, value)}
                              />
                            ) : (
                              <StatusBadge status={item.status} />
                            )}
                          </div>
                        </div>

                        {isOpen && (
                          <div className="space-y-3.5 border-t p-4" style={{ borderColor: COLORS.border, background: "#FCFBF8" }}>
                            {/* ข้อมูลคุณลักษณะ (Answers) */}
                            {hasAnswers && (
                              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
                                {Object.entries(item.answers).map(([key, value]) => {
                                  const field = catalogEntry?.fields?.find((f) => f.key === key);
                                  return (
                                    <span key={key} style={{ color: COLORS.charcoalSoft }}>
                                      <span className="font-medium" style={{ color: COLORS.textMuted }}>{field?.label || key}:</span> {String(value)}
                                    </span>
                                  );
                                })}
                              </div>
                            )}

                            {/* รายละเอียดชิ้นงาน */}
                            {item.note && (
                              <p className="text-xs italic" style={{ color: COLORS.textMuted }}>
                                รายละเอียดชิ้นงาน: {item.note}
                              </p>
                            )}

                            {/* รูปภาพตำแหน่งติดตั้ง */}
                            {positionPhotos.length > 0 && (
                              <div className="pt-1">
                                <p className="mb-1.5 text-xs font-semibold flex items-center gap-1" style={{ color: COLORS.charcoal }}>
                                  <ImageIcon size={12} style={{ color: COLORS.amber }} />
                                  รูปตำแหน่งติดตั้ง ({positionPhotos.length})
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {positionPhotos.map((ph) => (
                                    <a
                                      key={ph.id || ph.url}
                                      href={ph.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="block h-16 w-16 overflow-hidden rounded-lg border shadow-sm transition-transform hover:scale-105"
                                      style={{ borderColor: COLORS.border }}
                                    >
                                      <img src={ph.url} alt={ph.name || "รูปตำแหน่ง"} className="h-full w-full object-cover" />
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* รูปภาพงาน */}
                            {workPhotos.length > 0 && (
                              <div className="pt-1">
                                <p className="mb-1.5 text-xs font-semibold flex items-center gap-1" style={{ color: COLORS.charcoal }}>
                                  <ImageIcon size={12} style={{ color: COLORS.amber }} />
                                  รูปงาน ({workPhotos.length})
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {workPhotos.map((ph) => (
                                    <a
                                      key={ph.id || ph.url}
                                      href={ph.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="block h-16 w-16 overflow-hidden rounded-lg border shadow-sm transition-transform hover:scale-105"
                                      style={{ borderColor: COLORS.border }}
                                    >
                                      <img src={ph.url} alt={ph.name || "รูปงาน"} className="h-full w-full object-cover" />
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}

                            {!hasAnswers && !item.note && !hasPhotos && (
                              <p className="text-xs" style={{ color: COLORS.textMuted }}>
                                ไม่มีรายละเอียดเพิ่มเติม
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          ))}
        </div>
      </div>
    );
  }

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
          <div
            className="hidden items-center gap-4 border-b px-4 py-2.5 text-xs font-medium md:grid md:grid-cols-[1fr_1.2fr_9rem_2.5rem]"
            style={{ borderColor: COLORS.border, background: "#FAF8F3", color: COLORS.textMuted }}
          >
            <span>ลูกค้า</span>
            <span>โครงงาน</span>
            <span>สถานะ</span>
            <span />
          </div>

          {visibleGroups.map((g, gi) => (
            g.projects.map((p, pi) => (
              <div
                key={`${g.key}-${p.id}`}
                onClick={() => setSelectedProjectId(p.id)}
                className={`grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 px-4 py-3.5 md:grid-cols-[1fr_1.2fr_9rem_2.5rem] ${gi > 0 || pi > 0 ? "border-t" : ""}`}
                style={{ borderColor: COLORS.border }}
              >
                <div className="flex min-w-0 items-center gap-1.5">
                  <Users size={13} className="shrink-0" style={{ color: COLORS.amber }} />
                  <span className="truncate text-sm font-semibold" style={{ color: COLORS.charcoal }}>
                    {g.name}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedProjectId(p.id)}
                  aria-label={`ดูรายละเอียดงาน ${p.projectName || g.name}`}
                  className="flex h-8 w-8 items-center justify-center justify-self-end rounded-md border cursor-pointer hover:bg-gray-50 md:order-last"
                  style={{ borderColor: COLORS.border, color: COLORS.charcoalSoft, background: "white" }}
                >
                  <Eye size={15} />
                </button>

                <p className="col-span-2 truncate text-sm md:col-span-1" style={{ color: COLORS.charcoal }}>
                  {p.projectName || "(ไม่ระบุชื่อโครงงาน)"}
                </p>

                <div className="col-span-2 md:col-span-1">
                  <StatusCell items={p.items} />
                </div>
              </div>
            ))
          ))}
        </div>
      )}
    </div>
  );
}