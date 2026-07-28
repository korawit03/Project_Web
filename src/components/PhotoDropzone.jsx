import React, { useRef } from "react";
import { Camera, X } from "lucide-react";
import { COLORS } from "../lib/tokens.js";

export default function PhotoDropzone({ label, hint, photos, onAdd, onRemove }) {
  const inputRef = useRef(null);

  const handleFiles = (files) => {
    const list = Array.from(files).map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      url: URL.createObjectURL(file),
      name: file.name,
      file, // เก็บไฟล์จริงไว้ด้วย เผื่อขั้นตอนถัดไปจะอัปโหลดขึ้น Firebase Storage
    }));
    onAdd(list);
  };

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
          <div key={p.id} className="relative h-16 w-16 overflow-hidden rounded-md border group" style={{ borderColor: COLORS.border }}>
            <img src={p.url} alt={p.name} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onRemove(p.id)}
              className="absolute top-0.5 right-0.5 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: "rgba(0,0,0,0.6)" }}
            >
              <X size={11} color="white" />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="rounded-md border px-3 py-1.5 text-xs font-medium"
        style={{ borderColor: COLORS.border, color: COLORS.charcoalSoft, background: "white" }}
      >
        เลือกไฟล์ {photos.length > 0 && `(${photos.length} รูป)`}
      </button>
      <input
        ref={inputRef}
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
    </div>
  );
}
