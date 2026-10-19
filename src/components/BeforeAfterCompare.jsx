import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Split,
  Columns2,
  Camera,
  CheckCircle2,
  ZoomIn,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Tag,
  Info,
} from "lucide-react";
import { COLORS, SECTION } from "../lib/tokens.js";
import PhotoLightbox from "./PhotoLightbox.jsx";

/**
 * คอมโพเนนต์เปรียบเทียบรูปถ่าย "ก่อนทำ (Before)" vs "หลังทำ (After)"
 * - รองรับ 2 มุมมอง:
 *   1. "slider" = สไลเดอร์รูดดูความต่างแบบโต้ตอบ (Interactive Image Split Slider)
 *   2. "sideBySide" = วางเทียบข้างกัน ซ้าย-ขวา ชัดเจน
 * - รองรับ Touch & Pointer drag บนมือถือและคอมพิวเตอร์
 * - รองรับ Lightbox ซูมดูรูปความละเอียดสูง
 */
export default function BeforeAfterCompare({
  beforePhotos = [],
  afterPhotos = [],
  beforeTitle = "ก่อนเริ่มงาน (Before) : ผังตำแหน่ง & ขนาดชิ้นงาน",
  afterTitle = "หลังทำเสร็จ (After) : ผลงานติดตั้งเสร็จสมบูรณ์",
  beforeNote = "",
  beforeDetail = "",
  afterNote = "",
  afterDetail = "",
  initialView = "sideBySide", // "slider" หรือ "sideBySide"
}) {
  const hasBefore = beforePhotos && beforePhotos.length > 0;
  const hasAfter = afterPhotos && afterPhotos.length > 0;
  const canCompare = hasBefore && hasAfter;

  const [viewMode, setViewMode] = useState(() => (canCompare ? initialView : "sideBySide"));
  const [sliderPos, setSliderPos] = useState(50); // 0 - 100%
  const [selectedBeforeIdx, setSelectedBeforeIdx] = useState(0);
  const [selectedAfterIdx, setSelectedAfterIdx] = useState(0);
  const [lightbox, setLightbox] = useState({ photos: [], index: null });
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef(null);

  // ปรับ index ให้ไม่เกินจำนวนรูป
  const activeBeforePhoto = beforePhotos[Math.min(selectedBeforeIdx, Math.max(0, beforePhotos.length - 1))];
  const activeAfterPhoto = afterPhotos[Math.min(selectedAfterIdx, Math.max(0, afterPhotos.length - 1))];

  // คำนวณตำแหน่งเปอร์เซ็นต์ของ pointer ใน slider
  const updateSliderPosition = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percent);
  }, []);

  const handlePointerDown = (e) => {
    setIsDragging(true);
    updateSliderPosition(e.clientX);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    updateSliderPosition(e.clientX);
  };

  const handlePointerUp = (e) => {
    setIsDragging(false);
  };

  // รวมรูปทั้งหมดสำหรับ Lightbox
  const openBeforeLightbox = (idx) => {
    setLightbox({ photos: beforePhotos, index: idx });
  };

  const openAfterLightbox = (idx) => {
    setLightbox({ photos: afterPhotos, index: idx });
  };

  // ถ้าไม่มีรูปทั้งคู่เลย และไม่มีข้อความ
  if (!hasBefore && !hasAfter && !beforeNote && !beforeDetail && !afterNote && !afterDetail) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* ส่วนควบคุมมุมมอง (ถ้ามีรูปทั้งสองฝั่ง) */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-xs font-bold" style={{ color: COLORS.charcoal }}>
            <Split size={14} style={{ color: COLORS.amber }} />
            เปรียบเทียบรูปภาพหน้างาน
          </span>

          <div className="flex items-center gap-1.5">
            {hasBefore && (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                style={{ background: SECTION.before.badgeBg, color: SECTION.before.badgeText }}
              >
                <Camera size={10} />
                ก่อนทำ {beforePhotos.length} รูป
              </span>
            )}
            {hasAfter && (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                style={{ background: SECTION.after.badgeBg, color: SECTION.after.badgeText }}
              >
                <CheckCircle2 size={10} />
                หลังทำ {afterPhotos.length} รูป
              </span>
            )}
          </div>
        </div>

        {canCompare && (
          <div
            className="inline-flex rounded-lg border p-0.5"
            style={{ borderColor: COLORS.border, background: "#F4F2EC" }}
          >
            <button
              type="button"
              onClick={() => setViewMode("slider")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                viewMode === "slider"
                  ? "bg-white shadow-xs text-charcoal font-semibold"
                  : "text-gray-600 hover:text-black"
              }`}
            >
              <SlidersHorizontal size={12} style={{ color: viewMode === "slider" ? COLORS.amber : undefined }} />
              สไลเดอร์รูดเปรียบเทียบ
            </button>
            <button
              type="button"
              onClick={() => setViewMode("sideBySide")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                viewMode === "sideBySide"
                  ? "bg-white shadow-xs text-charcoal font-semibold"
                  : "text-gray-600 hover:text-black"
              }`}
            >
              <Columns2 size={12} style={{ color: viewMode === "sideBySide" ? COLORS.green : undefined }} />
              เทียบเคียงคู่กัน
            </button>
          </div>
        )}
      </div>

      {/* 1. มุมมองแบบ SLIDER เปรียบเทียบรูดซ้าย-ขวา */}
      {canCompare && viewMode === "slider" && (
        <div className="rounded-xl border bg-white p-3 space-y-3" style={{ borderColor: COLORS.border }}>
          {/* แถบแจ้งเตือน / คำแนะนำการใช้งาน */}
          <div className="flex items-center justify-between text-xs" style={{ color: COLORS.textMuted }}>
            <span className="flex items-center gap-1">
              <Info size={12} />
              ลากหรือแตะแถบเลื่อนตรงกลาง ↔ เพื่อดูความเปลี่ยนแปลง ก่อน-หลังทำ
            </span>
            <span className="font-mono text-[11px]">ตำแหน่ง: {Math.round(sliderPos)}%</span>
          </div>

          {/* กล่อง Interactive Slider */}
          <div
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="relative h-64 sm:h-80 md:h-96 w-full select-none overflow-hidden rounded-xl border bg-gray-900 cursor-ew-resize shadow-inner touch-none"
            style={{ borderColor: COLORS.border }}
          >
            {/* รูปหลังทำ (After) - อยู่ชั้นล่าง เต็มกรอบ */}
            {activeAfterPhoto && (
              <img
                src={activeAfterPhoto.url}
                alt={afterTitle}
                className="absolute inset-0 h-full w-full object-contain pointer-events-none"
                draggable={false}
              />
            )}

            {/* รูปก่อนทำ (Before) - อยู่ชั้นบน ตัดขอบตาม sliderPos% */}
            {activeBeforePhoto && (
              <div
                className="absolute inset-0 overflow-hidden pointer-events-none"
                style={{ width: `${sliderPos}%` }}
              >
                <img
                  src={activeBeforePhoto.url}
                  alt={beforeTitle}
                  className="absolute inset-0 h-full w-full object-contain pointer-events-none max-w-none"
                  style={{
                    width: containerRef.current ? `${containerRef.current.clientWidth}px` : "100%",
                  }}
                  draggable={false}
                />
              </div>
            )}

            {/* ป้ายกำกับบนรูป: ก่อนทำ (ฝั่งซ้าย) */}
            <div className="absolute top-3 left-3 pointer-events-none">
              <span
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold shadow-md"
                style={{ background: "rgba(217, 119, 6, 0.92)", color: "white" }}
              >
                <Camera size={12} />
                ก่อนทำ (Before)
              </span>
            </div>

            {/* ป้ายกำกับบนรูป: หลังทำ (ฝั่งขวา) */}
            <div className="absolute top-3 right-3 pointer-events-none">
              <span
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold shadow-md"
                style={{ background: "rgba(22, 163, 74, 0.92)", color: "white" }}
              >
                <CheckCircle2 size={12} />
                หลังทำ (After)
              </span>
            </div>

            {/* เส้นแบ่งแนวตั้ง (Divider Line) + ปุ่มจับ (Handle) */}
            <div
              className="absolute top-0 bottom-0 pointer-events-none"
              style={{
                left: `${sliderPos}%`,
                transform: "translateX(-50%)",
                width: "2px",
                background: "white",
                boxShadow: "0 0 10px rgba(0,0,0,0.5), 0 0 2px rgba(0,0,0,0.8)",
              }}
            >
              {/* ปุ่มจับลากตรงกลาง */}
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-lg border-2"
                style={{ borderColor: COLORS.amber }}
              >
                <div className="flex items-center text-charcoal">
                  <ChevronLeft size={14} className="-mr-1 text-gray-700" />
                  <ChevronRight size={14} className="-ml-1 text-gray-700" />
                </div>
              </div>
            </div>

            {/* ปุ่มเปิดดูรูปเต็มจอ */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                // ถ้าสไลด์มาเกิน 50% ให้เปิดรูปหลังทำ ไม่งั้นเปิดรูปก่อนทำ
                if (sliderPos > 50) {
                  openBeforeLightbox(selectedBeforeIdx);
                } else {
                  openAfterLightbox(selectedAfterIdx);
                }
              }}
              className="absolute bottom-3 right-3 flex items-center gap-1 rounded-md bg-black/60 hover:bg-black/80 px-2.5 py-1 text-xs font-medium text-white transition-colors cursor-pointer"
            >
              <ZoomIn size={13} />
              ซูมภาพเต็มจอ
            </button>
          </div>

          {/* ตัวเลือกรูปกรณีมีรูปหลายใบในฝั่งใดฝั่งหนึ่ง */}
          {(beforePhotos.length > 1 || afterPhotos.length > 1) && (
            <div className="grid gap-3 sm:grid-cols-2 pt-1 border-t" style={{ borderColor: COLORS.border }}>
              {/* เลือกรูปก่อนทำ */}
              <div>
                <span className="block text-[11px] font-semibold mb-1" style={{ color: SECTION.before.accent }}>
                  เลือกรูปก่อนทำที่จะเปรียบเทียบ ({beforePhotos.length} รูป):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {beforePhotos.map((p, idx) => (
                    <button
                      key={p.id || idx}
                      type="button"
                      onClick={() => setSelectedBeforeIdx(idx)}
                      className={`h-11 w-11 overflow-hidden rounded-md border-2 transition-all cursor-pointer ${
                        selectedBeforeIdx === idx ? "ring-2 scale-105" : "opacity-70 hover:opacity-100"
                      }`}
                      style={{
                        borderColor: selectedBeforeIdx === idx ? SECTION.before.accent : COLORS.border,
                        outlineColor: SECTION.before.accent,
                      }}
                    >
                      <img src={p.url} alt={`Before ${idx + 1}`} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* เลือกรูปหลังทำ */}
              <div>
                <span className="block text-[11px] font-semibold mb-1" style={{ color: SECTION.after.accent }}>
                  เลือกรูปหลังทำที่จะเปรียบเทียบ ({afterPhotos.length} รูป):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {afterPhotos.map((p, idx) => (
                    <button
                      key={p.id || idx}
                      type="button"
                      onClick={() => setSelectedAfterIdx(idx)}
                      className={`h-11 w-11 overflow-hidden rounded-md border-2 transition-all cursor-pointer ${
                        selectedAfterIdx === idx ? "ring-2 scale-105" : "opacity-70 hover:opacity-100"
                      }`}
                      style={{
                        borderColor: selectedAfterIdx === idx ? SECTION.after.accent : COLORS.border,
                        outlineColor: SECTION.after.accent,
                      }}
                    >
                      <img src={p.url} alt={`After ${idx + 1}`} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* รายละเอียดข้อความกำกับของทั้งสองฝั่ง */}
          <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t" style={{ borderColor: COLORS.border }}>
            <div className="rounded-lg p-2.5 text-xs space-y-1" style={{ background: SECTION.before.bg }}>
              <span className="font-bold flex items-center gap-1" style={{ color: SECTION.before.accent }}>
                <MapPin size={11} />
                ผังชี้ตำแหน่ง & ขนาดชิ้นงาน:
              </span>
              <p className="font-medium" style={{ color: COLORS.charcoal }}>
                {beforeNote || "(ไม่ระบุผังตำแหน่งหรือขนาด)"}
              </p>
              {beforeDetail && (
                <p className="text-gray-600 whitespace-pre-line">{beforeDetail}</p>
              )}
            </div>

            <div className="rounded-lg p-2.5 text-xs space-y-1" style={{ background: SECTION.after.bg }}>
              <span className="font-bold flex items-center gap-1" style={{ color: SECTION.after.accent }}>
                <Tag size={11} />
                ผลงานหลังทำเสร็จ:
              </span>
              <p className="font-medium" style={{ color: COLORS.charcoal }}>
                {afterNote || "(ไม่ระบุรายละเอียดหลังทำ)"}
              </p>
              {afterDetail && (
                <p className="text-gray-600 whitespace-pre-line">{afterDetail}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. มุมมองแบบ SIDE-BY-SIDE วางเทียบ 2 ฝั่งคู่กัน (หรือถ้ามีรูปฝั่งเดียว) */}
      {(viewMode === "sideBySide" || !canCompare) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {/* ฝั่งซ้าย: รูปก่อนเริ่มงาน (Before) */}
          <div
            className="rounded-xl border p-3.5 space-y-3"
            style={{
              borderColor: SECTION.before.border,
              background: SECTION.before.bg,
              borderLeft: `4px solid ${SECTION.before.accent}`,
            }}
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: SECTION.before.accent }}>
                <Camera size={14} />
                {beforeTitle}
              </span>
              {hasBefore && (
                <span
                  className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  style={{ background: SECTION.before.badgeBg, color: SECTION.before.badgeText }}
                >
                  {beforePhotos.length} รูป
                </span>
              )}
            </div>

            {hasBefore ? (
              <div className="flex flex-wrap gap-2">
                {beforePhotos.map((p, idx) => (
                  <button
                    key={p.id || idx}
                    type="button"
                    onClick={() => openBeforeLightbox(idx)}
                    className="group relative h-18 w-18 sm:h-20 sm:w-20 cursor-zoom-in overflow-hidden rounded-lg border bg-white shadow-2xs transition-transform hover:scale-105"
                    style={{ borderColor: SECTION.before.border }}
                  >
                    <img src={p.url} alt={`Before ${idx + 1}`} className="h-full w-full object-cover" />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity text-white">
                      <ZoomIn size={16} />
                    </span>
                    <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1 text-[9px] font-mono text-white">
                      #{idx + 1}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-3 text-center text-xs text-amber-700/70 bg-white/60">
                ยังไม่มีรูปถ่ายก่อนเริ่มงาน
              </div>
            )}

            {/* ข้อความตำแหน่งและรายละเอียดก่อนทำ */}
            {(beforeNote || beforeDetail) && (
              <div className="rounded-lg bg-white/80 p-2.5 text-xs space-y-1 border" style={{ borderColor: SECTION.before.border }}>
                {beforeNote && (
                  <p className="font-medium" style={{ color: COLORS.charcoal }}>
                    <span className="text-gray-500 font-normal">ตำแหน่ง & ขนาด: </span>
                    {beforeNote}
                  </p>
                )}
                {beforeDetail && (
                  <p className="text-gray-600 whitespace-pre-line">
                    <span className="text-gray-500 font-normal">เพิ่มเติม: </span>
                    {beforeDetail}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ฝั่งขวา: ผลงานหลังทำเสร็จ (After) */}
          <div
            className="rounded-xl border p-3.5 space-y-3"
            style={{
              borderColor: SECTION.after.border,
              background: SECTION.after.bg,
              borderLeft: `4px solid ${SECTION.after.accent}`,
            }}
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: SECTION.after.accent }}>
                <CheckCircle2 size={14} />
                {afterTitle}
              </span>
              {hasAfter && (
                <span
                  className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  style={{ background: SECTION.after.badgeBg, color: SECTION.after.badgeText }}
                >
                  {afterPhotos.length} รูป
                </span>
              )}
            </div>

            {hasAfter ? (
              <div className="flex flex-wrap gap-2">
                {afterPhotos.map((p, idx) => (
                  <button
                    key={p.id || idx}
                    type="button"
                    onClick={() => openAfterLightbox(idx)}
                    className="group relative h-18 w-18 sm:h-20 sm:w-20 cursor-zoom-in overflow-hidden rounded-lg border bg-white shadow-2xs transition-transform hover:scale-105"
                    style={{ borderColor: SECTION.after.border }}
                  >
                    <img src={p.url} alt={`After ${idx + 1}`} className="h-full w-full object-cover" />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity text-white">
                      <ZoomIn size={16} />
                    </span>
                    <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1 text-[9px] font-mono text-white">
                      #{idx + 1}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-3 text-center text-xs text-emerald-700/70 bg-white/60">
                รอรูปผลงานหลังติดตั้งเสร็จสมบูรณ์
              </div>
            )}

            {/* ข้อความผลงานหลังทำ */}
            {(afterNote || afterDetail) && (
              <div className="rounded-lg bg-white/80 p-2.5 text-xs space-y-1 border" style={{ borderColor: SECTION.after.border }}>
                {afterNote && (
                  <p className="font-medium" style={{ color: COLORS.charcoal }}>
                    <span className="text-gray-500 font-normal">ผลงานหลังทำ: </span>
                    {afterNote}
                  </p>
                )}
                {afterDetail && (
                  <p className="text-gray-600 whitespace-pre-line">
                    <span className="text-gray-500 font-normal">เพิ่มเติม: </span>
                    {afterDetail}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Photo Lightbox */}
      <PhotoLightbox
        photos={lightbox.photos}
        index={lightbox.index}
        onClose={() => setLightbox({ photos: [], index: null })}
        onChange={(idx) => setLightbox((prev) => ({ ...prev, index: idx }))}
      />
    </div>
  );
}
