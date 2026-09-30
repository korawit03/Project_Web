import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

// หน้าต่างดูรูปเต็มจอ ซ้อนทับหน้าเดิม (ไม่เปิดแท็บใหม่)
// index = null คือปิดอยู่
export default function PhotoLightbox({ photos, index, onClose, onChange }) {
  const touchX = useRef(null);
  const total = photos.length;
  const open = index != null && index >= 0 && index < total;

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (total > 1 && e.key === "ArrowLeft") onChange((index - 1 + total) % total);
      if (total > 1 && e.key === "ArrowRight") onChange((index + 1) % total);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden"; // กันหน้าข้างหลังเลื่อน
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, index, total, onClose, onChange]);

  if (!open) return null;

  const photo = photos[index];
  const go = (dir) => onChange((index + dir + total) % total);

  const navBtn = "absolute top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full text-white";

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.88)", zIndex: 9999 }}
      onClick={onClose}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current == null || total < 2) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 50) go(dx > 0 ? -1 : 1); // ปัดขวา = รูปก่อนหน้า
        touchX.current = null;
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="ปิด"
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-white"
        style={{ background: "rgba(255,255,255,0.15)" }}
      >
        <X size={20} />
      </button>

      {total > 1 && (
        <>
          <button
            type="button"
            aria-label="รูปก่อนหน้า"
            onClick={(e) => { e.stopPropagation(); go(-1); }}
            className={`${navBtn} left-3`}
            style={{ background: "rgba(255,255,255,0.15)" }}
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            aria-label="รูปถัดไป"
            onClick={(e) => { e.stopPropagation(); go(1); }}
            className={`${navBtn} right-3`}
            style={{ background: "rgba(255,255,255,0.15)" }}
          >
            <ChevronRight size={22} />
          </button>
        </>
      )}

      <img
        src={photo.url}
        alt={photo.name || ""}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[88vh] max-w-full rounded-lg object-contain"
      />

      {total > 1 && (
        <span
          className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs text-white"
          style={{ background: "rgba(255,255,255,0.15)" }}
        >
          {index + 1} / {total}
        </span>
      )}
    </div>,
    document.body
  );
}