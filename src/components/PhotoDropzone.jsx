import React, { useRef, useState, useEffect } from "react";
import { Camera, Image, X, Loader2 } from "lucide-react";
import { COLORS } from "../lib/tokens.js";
import { compressImage, formatBytes } from "../lib/imageCompression.js";

export default function PhotoDropzone({ label, hint, photos, onAdd, onRemove, onReorder, tone }) {
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const tileRefs = useRef({}); // id -> DOM node ของแต่ละรูป

  const [dragId, setDragId] = useState(null);
  const [dragX, setDragY] = useState(0); // ตำแหน่ง pointer ปัจจุบัน (สำหรับ ghost)
  const dragInfo = useRef(null); // { startX, startY, offsetX, offsetY }
  const [compressing, setCompressing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handleFiles = async (files) => {
    const fileArray = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (fileArray.length === 0) return;

    setCompressing(true);
    setProgress({ current: 0, total: fileArray.length });

    try {
      const list = [];
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        setProgress({ current: i + 1, total: fileArray.length });
        const compressed = await compressImage(file);
        list.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${i}`,
          url: URL.createObjectURL(compressed),
          name: compressed.name,
          file: compressed,
          originalSize: compressed.originalSize || file.size,
          compressedSize: compressed.compressedSize || compressed.size,
          savingsPercent: compressed.savingsPercent,
        });
      }
      onAdd(list);
    } catch (err) {
      console.error("Error processing photos:", err);
    } finally {
      setCompressing(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  const findIndexAtPoint = (x, y) => {
    let closestId = null;
    let closestDist = Infinity;
    photos.forEach((p) => {
      const el = tileRefs.current[p.id];
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        closestId = p.id;
        closestDist = 0;
      } else if (closestDist !== 0) {
        const d = Math.hypot(x - cx, y - cy);
        if (d < closestDist) {
          closestDist = d;
          closestId = p.id;
        }
      }
    });
    return closestId;
  };

  const handlePointerDown = (e, id) => {
    // ป้องกันลากตอนกดปุ่มลบ
    if (e.target.closest("[data-no-drag]")) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    dragInfo.current = { pointerId: e.pointerId };
    setDragId(id);
  };

  useEffect(() => {
    if (!dragId || !onReorder) return;

    const handleMove = (e) => {
      const hoverId = findIndexAtPoint(e.clientX, e.clientY);
      if (!hoverId || hoverId === dragId) return;

      const fromIdx = photos.findIndex((p) => p.id === dragId);
      const toIdx = photos.findIndex((p) => p.id === hoverId);
      if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return;

      const next = photos.slice();
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      onReorder(next);
    };

    const handleUp = () => {
      setDragId(null);
      dragInfo.current = null;
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
    };
  }, [dragId, photos, onReorder]);

  return (
    <div
      className="rounded-lg border border-dashed p-4"
      style={{
        borderColor: tone?.accent || COLORS.border,
        background: tone ? "rgba(255,255,255,0.75)" : "#FCFBF8",
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
      }}
    >
      <div className="flex items-center gap-1.5 text-sm font-medium mb-1" style={{ color: COLORS.charcoal }}>
        <Camera size={14} style={{ color: tone?.accent || COLORS.amber }} />        {label}
      </div>
      {hint && (
        <p className="text-xs mb-3" style={{ color: COLORS.textMuted }}>
          {hint}
        </p>
      )}

      <div className="flex flex-wrap gap-2 mb-3">
        {photos.map((p) => (
          <div
            key={p.id}
            ref={(el) => (tileRefs.current[p.id] = el)}
            onPointerDown={(e) => handlePointerDown(e, p.id)}
            className="relative h-16 w-16 overflow-hidden rounded-md border group touch-none select-none"
            style={{
              borderColor: COLORS.border,
              cursor: onReorder ? "grab" : "default",
              opacity: dragId === p.id ? 0.4 : 1,
              transform: dragId === p.id ? "scale(1.06)" : "scale(1)",
              transition: dragId === p.id ? "none" : "transform 0.15s, opacity 0.15s",
              zIndex: dragId === p.id ? 10 : 1,
            }}
          >
            <img src={p.url} alt={p.name} className="h-full w-full object-cover pointer-events-none" draggable={false} />
            {p.compressedSize && (
              <span className="absolute bottom-0.5 left-0.5 rounded bg-black/60 px-1 py-0.2 text-[8px] font-mono text-white pointer-events-none">
                {formatBytes(p.compressedSize)}
              </span>
            )}
            <button
              type="button"
              data-no-drag
              onClick={() => {
                if (p.url?.startsWith("blob:")) {
                  try {
                    URL.revokeObjectURL(p.url);
                  } catch {}
                }
                onRemove(p.id);
              }}
              className="absolute top-0.5 right-0.5 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              style={{ background: "rgba(0,0,0,0.6)" }}
            >
              <X size={11} color="white" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={compressing}
          onClick={() => cameraInputRef.current?.click()}
          className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium cursor-pointer hover:bg-gray-50 transition-colors disabled:opacity-50"
          style={{ borderColor: COLORS.border, color: COLORS.charcoalSoft, background: "white" }}
        >
          <Camera size={13} />
          ถ่ายภาพ
        </button>

        <button
          type="button"
          disabled={compressing}
          onClick={() => galleryInputRef.current?.click()}
          className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium cursor-pointer hover:bg-gray-50 transition-colors disabled:opacity-50"
          style={{ borderColor: COLORS.border, color: COLORS.charcoalSoft, background: "white" }}
        >
          <Image size={13} />
          เลือกจากคลังภาพ {photos.length > 0 && `(${photos.length} รูป)`}
        </button>

        {compressing && (
          <div className="flex items-center gap-1.5 rounded-md bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs text-emerald-800">
            <Loader2 size={12} className="animate-spin text-emerald-600" />
            <span>กำลังบีบอัดภาพ ({progress.current}/{progress.total})...</span>
          </div>
        )}
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}