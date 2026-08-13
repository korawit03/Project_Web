import React, { useRef, useState, useEffect } from "react";
import { Camera, Image, X } from "lucide-react";
import { COLORS } from "../lib/tokens.js";

export default function PhotoDropzone({ label, hint, photos, onAdd, onRemove, onReorder }) {
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const tileRefs = useRef({}); // id -> DOM node ของแต่ละรูป

  const [dragId, setDragId] = useState(null);
  const [dragX, setDragY] = useState(0); // ตำแหน่ง pointer ปัจจุบัน (สำหรับ ghost)
  const dragInfo = useRef(null); // { startX, startY, offsetX, offsetY }

  const handleFiles = (files) => {
    const list = Array.from(files).map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      url: URL.createObjectURL(file),
      name: file.name,
      file,
    }));
    onAdd(list);
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
      style={{ borderColor: COLORS.border, background: "#FCFBF8" }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
      }}
    >
      <div className="flex items-center gap-1.5 text-sm font-medium mb-1" style={{ color: COLORS.charcoal }}>
        <Camera size={14} style={{ color: COLORS.amber }} />
        {label}
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
            <button
              type="button"
              data-no-drag
              onClick={() => onRemove(p.id)}
              className="absolute top-0.5 right-0.5 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: "rgba(0,0,0,0.6)" }}
            >
              <X size={11} color="white" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium"
          style={{ borderColor: COLORS.border, color: COLORS.charcoalSoft, background: "white" }}
        >
          <Camera size={13} />
          ถ่ายภาพ
        </button>

        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium"
          style={{ borderColor: COLORS.border, color: COLORS.charcoalSoft, background: "white" }}
        >
          <Image size={13} />
          เลือกจากคลังภาพ {photos.length > 0 && `(${photos.length} รูป)`}
        </button>
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