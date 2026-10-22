import React, { useState, useMemo } from "react";
import {
  ListChecks,
  Search,
  Eye,
  ArrowLeft,
  MapPin,
  Users,
  Layers,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  History,
  Tag,
  Navigation,
  ExternalLink,
  Phone,
  Copy,
  Check,
  Camera,
  CheckCircle2,
  Printer,
  FileText,
} from "lucide-react";
import { COLORS } from "../lib/tokens.js";
import { countByStatus, getStatusMeta } from "../lib/status.js";
import { StatusBadge, StatusSelect, StatusSegment } from "../components/ui.jsx";
import PhotoLightbox from "../components/PhotoLightbox.jsx";
import BeforeAfterCompare from "../components/BeforeAfterCompare.jsx";
import ProjectReportModal from "../components/ProjectReportModal.jsx";
import { formatPhone } from "../lib/nameValidation.js";
import MapPinPicker from "../components/MapPinPicker.jsx";

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

// แถวรูปเล็กๆ (กดเปิดรูปเต็มในแท็บใหม่)
function PhotoRow({ photos, altFallback }) {
  const [openIndex, setOpenIndex] = useState(null);
  if (!photos || photos.length === 0) return null;
  return (
    <>
      <div className="flex flex-wrap gap-2">
        {photos.map((ph, i) => (
          <button
            key={ph.id || ph.url}
            type="button"
            onClick={() => setOpenIndex(i)}
            className="block h-16 w-16 cursor-zoom-in overflow-hidden rounded-lg border shadow-sm transition-transform hover:scale-105"
            style={{ borderColor: COLORS.border }}
          >
            <img src={ph.url} alt={ph.name || altFallback} className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
      <PhotoLightbox
        photos={photos}
        index={openIndex}
        onClose={() => setOpenIndex(null)}
        onChange={setOpenIndex}
      />
    </>
  );
}
// กล่องหนึ่งส่วน: หัวข้อ + รูป (บน) + ข้อความ (ล่าง) ถ้าไม่มีข้อมูลเลยจะไม่แสดงกล่อง
const EXTRA_LABEL = "รายละเอียดเพิ่มเติม";

function DetailSection({ icon: Icon, title, photos, mainText, mainItalic = false, extraText }) {
  const hasContent = (photos && photos.length > 0) || mainText || extraText;
  if (!hasContent) return null;

  return (
    <div className="rounded-lg border bg-white p-3 space-y-2.5" style={{ borderColor: COLORS.border }}>
      <p className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: COLORS.charcoal }}>
        <Icon size={12} style={{ color: COLORS.amber }} />
        {title}
        {photos?.length > 0 && (
          <span className="font-normal" style={{ color: COLORS.textMuted }}>
            · {photos.length} รูป
          </span>
        )}
      </p>

      <PhotoRow photos={photos} altFallback={title} />

      {mainText && (
        <p
          className={`text-sm font-medium ${mainItalic ? "italic" : ""}`}
          style={{ color: COLORS.charcoal }}
        >
          {mainText}
        </p>
      )}

      {extraText && (
        <p className="text-xs whitespace-pre-line" style={{ color: COLORS.charcoalSoft }}>
          <span className="font-medium" style={{ color: COLORS.textMuted }}>{EXTRA_LABEL}:</span>{" "}
          {extraText}
        </p>
      )}
    </div>
  );
}
function ProjectLocationCard({ project }) {
  const [copied, setCopied] = useState(false);
  const [showMiniMap, setShowMiniMap] = useState(false);

  const lat =
    project.latitude != null && project.latitude !== "" ? Number(project.latitude) : null;
  const lng =
    project.longitude != null && project.longitude !== "" ? Number(project.longitude) : null;
  const hasCoords =
    lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0);

  const locationQuery = [project.location, project.locationAddress]
    .filter(Boolean)
    .map((s) => String(s).trim())
    .filter(Boolean)
    .join(" ");

  // โหมดนำทาง (Turn-by-turn directions)
  const navUrl = hasCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    : locationQuery
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationQuery)}`
    : null;

  // โหมดเปิดดูหมุด (Pin Search)
  const pinUrl = hasCoords ? `https://www.google.com/maps?q=${lat},${lng}` : null;

  const handleCopyCoords = () => {
    if (!hasCoords) return;
    navigator.clipboard?.writeText(`${lat}, ${lng}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="mb-6 rounded-xl border p-4 sm:p-5 shadow-xs"
      style={{ borderColor: COLORS.border, background: COLORS.surface }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* รายละเอียดสถานที่ */}
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
              style={{ background: "#FCEFDB", color: COLORS.amberDark }}
            >
              <MapPin size={16} />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.amberDark }}>
              สถานที่หน้างาน & แผนที่นำทาง
            </span>
            {hasCoords ? (
              <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-200">
                มีพิกัด GPS
              </span>
            ) : (
              <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 border border-amber-200">
                ยังไม่มีพิกัด GPS
              </span>
            )}
          </div>

          <div>
            <h3 className="text-base font-bold" style={{ color: COLORS.charcoal }}>
              {project.location || (project.locationAddress ? "หน้างาน" : "(ยังไม่ระบุชื่อสถานที่หน้างาน)")}
            </h3>
            {project.locationAddress && (
              <p className="mt-0.5 text-xs leading-relaxed" style={{ color: COLORS.charcoalSoft }}>
                {project.locationAddress}
              </p>
            )}
          </div>

          {/* พิกัด GPS & ปุ่มคัดลอก */}
          {hasCoords ? (
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs" style={{ color: COLORS.textMuted }}>
              <span className="font-mono text-[11px] rounded bg-gray-100 px-2 py-0.5 border" style={{ borderColor: COLORS.border }}>
                พิกัด: {lat.toFixed(6)}, {lng.toFixed(6)}
              </span>
              <button
                type="button"
                onClick={handleCopyCoords}
                className="flex items-center gap-1 text-[11px] font-medium hover:underline cursor-pointer"
                style={{ color: copied ? COLORS.green : COLORS.charcoalSoft }}
              >
                {copied ? (
                  <>
                    <Check size={12} className="text-emerald-600" />
                    <span className="text-emerald-600 font-semibold">คัดลอกพิกัดแล้ว!</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>คัดลอกพิกัด</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <p className="text-xs italic pt-0.5" style={{ color: COLORS.textMuted }}>
              * ยังไม่ได้ระบุพิกัด GPS ที่แน่นอน (ระบบจะช่วยเปิดค้นหาจากชื่อสถานที่หรือที่อยู่ใน Google Maps)
            </p>
          )}

          {/* ข้อมูลการติดต่อลูกค้า */}
          {project.customerPhone && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <a
                href={`tel:${project.customerPhone}`}
                className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-gray-50 transition-colors"
                style={{ borderColor: COLORS.border, color: COLORS.charcoal }}
              >
                <Phone size={13} className="text-emerald-600" />
                <span>โทรหาลูกค้า: {formatPhone(project.customerPhone)}</span>
              </a>
            </div>
          )}
        </div>

        {/* ปุ่มนำทางและการกระทำ */}
        <div className="flex flex-col gap-2 shrink-0 sm:w-60">
          {navUrl ? (
            <a
              href={navUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-sm transition-all hover:opacity-95 hover:shadow-md cursor-pointer"
              style={{
                background: hasCoords
                  ? "linear-gradient(135deg, #059669 0%, #10B981 100%)"
                  : "linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)",
              }}
            >
              <Navigation size={18} className="fill-white" />
              <span>{hasCoords ? "เปิดนำทาง (Google Maps)" : "ค้นหาใน Google Maps"}</span>
            </a>
          ) : (
            <div
              className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed px-3 py-2.5 text-xs"
              style={{ borderColor: COLORS.border, color: COLORS.textMuted }}
            >
              <MapPin size={13} />
              <span>ไม่มีข้อมูลสถานที่</span>
            </div>
          )}

          <div className="flex w-full gap-2">
            {pinUrl && (
              <a
                href={pinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border bg-white px-2.5 py-1.5 text-xs font-medium hover:bg-gray-50 transition-colors"
                style={{ borderColor: COLORS.border, color: COLORS.charcoalSoft }}
              >
                <ExternalLink size={12} />
                <span>เปิดดูหมุด</span>
              </a>
            )}

            {hasCoords && (
              <button
                type="button"
                onClick={() => setShowMiniMap((v) => !v)}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border bg-white px-2.5 py-1.5 text-xs font-medium hover:bg-gray-50 transition-colors cursor-pointer"
                style={{ borderColor: COLORS.border, color: COLORS.charcoalSoft }}
              >
                <MapIcon size={12} />
                <span>{showMiniMap ? "ซ่อนแผนที่" : "ดูแผนที่ย่อ"}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* แผนที่ย่อในหน้าเว็บ (Toggle ได้) */}
      {showMiniMap && hasCoords && (
        <div className="mt-4 pt-4 border-t" style={{ borderColor: COLORS.border }}>
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold" style={{ color: COLORS.charcoal }}>
              ตำแหน่งหมุดหน้างานบนแผนที่
            </span>
            <span className="text-[11px]" style={{ color: COLORS.textMuted }}>
              กดปุ่ม "เปิดนำทาง" ด้านบนเพื่อเริ่ม GPS Turn-by-turn บน Google Maps
            </span>
          </div>
          <MapPinPicker latitude={lat} longitude={lng} readOnly={true} height={220} />
        </div>
      )}
    </div>
  );
}

export default function ProjectDetailPage({ projects, loading, onItemStatusChange, workCatalog = {} }) {
  const [search, setSearch] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [expandedItemId, setExpandedItemId] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

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
    const totalBeforePhotos = allItems.reduce((acc, it) => acc + (it.positionPhotos?.length || 0), 0);
    const totalAfterPhotos = allItems.reduce((acc, it) => acc + (it.workPhotos?.length || 0), 0);

    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <BackButton onClick={() => setSelectedProjectId(null)}>กลับไปดูรายการโครงงาน</BackButton>

          {/* ปุ่มส่งออกรายงาน / พิมพ์ใบส่งมอบงาน PDF */}
          <button
            type="button"
            onClick={() => setShowReportModal(true)}
            className="flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:opacity-90 active:scale-95 transition-all cursor-pointer"
            style={{ background: COLORS.charcoal }}
          >
            <Printer size={14} style={{ color: COLORS.amber }} />
            พิมพ์รายงาน / ใบส่งมอบงาน (PDF)
          </button>
        </div>

        <Header
          title={selectedProject.projectName || "(ไม่ระบุชื่อโครงงาน)"}
          subtitle={`ลูกค้า: ${selected.name}${total > 0 ? ` · เสร็จแล้ว ${done} จาก ${total} ชิ้นงาน` : ""}`}
        />

        {/* สรุปรูปถ่ายก่อน-หลังทำของโครงงาน */}
        {(totalBeforePhotos > 0 || totalAfterPhotos > 0) && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold" style={{ color: COLORS.charcoalSoft }}>
              รูปถ่ายทั้งหมดในโครงงาน:
            </span>
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
              style={{ background: "#FEF3C7", color: "#B45309" }}
            >
              <Camera size={11} />
              ก่อนทำ (Before): {totalBeforePhotos} รูป
            </span>
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
              style={{ background: "#DCFCE7", color: "#15803D" }}
            >
              <CheckCircle2 size={11} />
              หลังทำเสร็จ (After): {totalAfterPhotos} รูป
            </span>
          </div>
        )}

        <ProjectLocationCard project={selectedProject} />
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
                              //กดเปลี่ยนสถานะชิ้นงาน
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
                          <div className="space-y-3 border-t p-4" style={{ borderColor: COLORS.border, background: "#FCFBF8" }}>
                            {/* ข้อมูลคุณลักษณะ (Answers) - เหมือนเดิม */}
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

                            {/* เปรียบเทียบรูปก่อนทำ vs หลังทำ */}
                            <BeforeAfterCompare
                              beforePhotos={positionPhotos}
                              afterPhotos={workPhotos}
                              beforeTitle="ก่อนเริ่มงาน (Before)"
                              afterTitle="ผลงานหลังทำเสร็จ (After)"
                              beforeNote={item.positionNote}
                              beforeDetail={item.positionDetail}
                              afterNote={item.note}
                              afterDetail={item.workDetail}
                            />

                            {!hasAnswers && !item.positionNote && !item.positionDetail && !item.note && !item.workDetail && !hasPhotos && (
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

        {/* Modal ดูตัวอย่างและสั่งพิมพ์รายงานสรุปงาน / ใบส่งมอบงาน PDF */}
        {showReportModal && (
          <ProjectReportModal
            project={selectedProject}
            workCatalog={workCatalog}
            onClose={() => setShowReportModal(false)}
          />
        )}
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
            className="hidden items-center gap-4 border-b px-4 py-2.5 text-xs font-medium md:grid md:grid-cols-[1fr_1.3fr_9rem_5rem]"
            style={{ borderColor: COLORS.border, background: "#FAF8F3", color: COLORS.textMuted }}
          >
            <span>ลูกค้า</span>
            <span>โครงงาน & สถานที่</span>
            <span>สถานะ</span>
            <span className="text-right">จัดการ</span>
          </div>

          {visibleGroups.map((g, gi) => (
            g.projects.map((p, pi) => {
              const lat = p.latitude != null && p.latitude !== "" ? Number(p.latitude) : null;
              const lng = p.longitude != null && p.longitude !== "" ? Number(p.longitude) : null;
              const hasCoords =
                lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0);

              const locationQuery = [p.location, p.locationAddress]
                .filter(Boolean)
                .map((s) => String(s).trim())
                .filter(Boolean)
                .join(" ");

              const navUrl = hasCoords
                ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
                : locationQuery
                ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationQuery)}`
                : null;

              return (
                <div
                  key={`${g.key}-${p.id}`}
                  onClick={() => setSelectedProjectId(p.id)}
                  className={`grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 px-4 py-3.5 md:grid-cols-[1fr_1.3fr_9rem_5rem] cursor-pointer hover:bg-gray-50/70 transition-colors ${
                    gi > 0 || pi > 0 ? "border-t" : ""
                  }`}
                  style={{ borderColor: COLORS.border }}
                >
                  <div className="flex min-w-0 items-center gap-1.5">
                    <Users size={13} className="shrink-0" style={{ color: COLORS.amber }} />
                    <span className="truncate text-sm font-semibold" style={{ color: COLORS.charcoal }}>
                      {g.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 justify-self-end md:order-last">
                    {navUrl && (
                      <a
                        href={navUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`นำทาง Google Maps ไปยัง ${p.projectName || g.name}`}
                        title="เปิดนำทาง Google Maps"
                        className="flex h-8 w-8 items-center justify-center rounded-md border text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 transition-colors cursor-pointer"
                        style={{ borderColor: COLORS.border, background: "white" }}
                      >
                        <Navigation size={14} className="fill-emerald-600" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedProjectId(p.id)}
                      aria-label={`ดูรายละเอียดงาน ${p.projectName || g.name}`}
                      title="ดูรายละเอียดงาน"
                      className="flex h-8 w-8 items-center justify-center rounded-md border cursor-pointer hover:bg-gray-50 transition-colors"
                      style={{ borderColor: COLORS.border, color: COLORS.charcoalSoft, background: "white" }}
                    >
                      <Eye size={15} />
                    </button>
                  </div>

                  <div className="col-span-2 md:col-span-1 min-w-0">
                    <p className="truncate text-sm font-semibold" style={{ color: COLORS.charcoal }}>
                      {p.projectName || "(ไม่ระบุชื่อโครงงาน)"}
                    </p>
                    {(p.location || p.locationAddress) && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs truncate" style={{ color: COLORS.textMuted }}>
                        <MapPin size={11} className="shrink-0 text-amber-600" />
                        <span className="truncate">{p.location || p.locationAddress}</span>
                      </p>
                    )}
                  </div>

                  <div className="col-span-2 md:col-span-1">
                    <StatusCell items={p.items} />
                  </div>
                </div>
              );
            })
          ))}
        </div>
      )}
    </div>
  );
}