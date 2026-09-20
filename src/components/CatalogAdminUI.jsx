import React, { useState } from "react";
import { ChevronUp, ChevronDown, Pencil, Power, Check, X, Plus, AlertCircle } from "lucide-react";
import { COLORS } from "../lib/tokens.js";
import { PK } from "../lib/catalogAdmin.js";

export function AdminHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="mb-6 flex items-center gap-2.5 border-b pb-4" style={{ borderColor: COLORS.border }}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: COLORS.charcoal }}>
        <Icon size={17} color={COLORS.amber} />
      </span>
      <div className="min-w-0">
        <h1 className="text-lg font-bold" style={{ color: COLORS.charcoal }}>
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

export function Card({ title, hint, children }) {
  return (
    <div className="mb-4 rounded-xl border p-5" style={{ borderColor: COLORS.border, background: COLORS.surface }}>
      {title && (
        <p className="text-sm font-semibold" style={{ color: COLORS.charcoal }}>
          {title}
        </p>
      )}
      {hint && (
        <p className="mb-3 mt-0.5 text-xs" style={{ color: COLORS.textMuted }}>
          {hint}
        </p>
      )}
      {!hint && title && <div className="mb-3" />}
      {children}
    </div>
  );
}

export function Notice({ msg }) {
  if (!msg) return null;
  const isError = msg.type === "error";
  return (
    <div
      className="mb-4 flex items-start gap-1.5 rounded-lg border p-3 text-sm font-medium"
      style={{
        borderColor: isError ? COLORS.red : COLORS.green,
        background: isError ? "#FDECEC" : "#EAF6EF",
        color: isError ? COLORS.red : COLORS.green,
      }}
    >
      {isError ? <AlertCircle size={16} className="mt-0.5 shrink-0" /> : <Check size={16} className="mt-0.5 shrink-0" />}
      <span>{msg.text}</span>
    </div>
  );
}

export function IconBtn({ onClick, disabled, title, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className="flex h-7 w-7 items-center justify-center rounded-md border disabled:opacity-35"
      style={{ borderColor: COLORS.border, color: COLORS.charcoalSoft, background: "white" }}
    >
      {children}
    </button>
  );
}

export function PlainSelect({ value, onChange, placeholder, disabled, children }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full appearance-none rounded-lg border bg-white px-3.5 py-2.5 pr-9 text-[15px] outline-none disabled:opacity-60"
        style={{ borderColor: COLORS.border, color: value ? COLORS.charcoal : COLORS.textMuted }}
      >
        <option value="">{placeholder}</option>
        {children}
      </select>
      <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" width="12" height="8" viewBox="0 0 12 8" fill="none">
        <path d="M1 1L6 6L11 1" stroke={COLORS.textMuted} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

const labelOf = (x) => `${x.name ?? x.label}${x.is_active === false ? " (ปิดอยู่)" : ""}`;

// เลือกหมวดหมู่ -> ชิ้นงานย่อย -> (ช่อง) ทีละชั้น  level: "type" | "field"
export function CascadePicker({ catalog, level, sel, onSel }) {
  const category = catalog.find((c) => String(c[PK.category]) === String(sel.categoryId)) || null;
  const type = category?.types.find((t) => String(t[PK.type]) === String(sel.typeId)) || null;

  return (
    <div className={`mb-4 grid gap-3 ${level === "field" ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
      <PlainSelect
        value={sel.categoryId ?? ""}
        onChange={(e) => onSel({ categoryId: e.target.value, typeId: "", fieldId: "" })}
        placeholder="-- เลือกหมวดหมู่ --"
      >
        {catalog.map((c) => (
          <option key={c[PK.category]} value={c[PK.category]}>
            {labelOf(c)}
          </option>
        ))}
      </PlainSelect>

      <PlainSelect
        value={sel.typeId ?? ""}
        onChange={(e) => onSel({ ...sel, typeId: e.target.value, fieldId: "" })}
        placeholder={category ? "-- เลือกชิ้นงานย่อย --" : "-- เลือกหมวดหมู่ก่อน --"}
        disabled={!category}
      >
        {(category?.types || []).map((t) => (
          <option key={t[PK.type]} value={t[PK.type]}>
            {labelOf(t)}
          </option>
        ))}
      </PlainSelect>

      {level === "field" && (
        <PlainSelect
          value={sel.fieldId ?? ""}
          onChange={(e) => onSel({ ...sel, fieldId: e.target.value })}
          placeholder={type ? "-- เลือกช่องรายละเอียด --" : "-- เลือกชิ้นงานย่อยก่อน --"}
          disabled={!type}
        >
          {(type?.fields || []).map((f) => (
            <option key={f[PK.field]} value={f[PK.field]}>
              {labelOf(f)}
            </option>
          ))}
        </PlainSelect>
      )}
    </div>
  );
}

// รายการที่แก้ชื่อ / เรียงลำดับ / ปิด-เปิดใช้งานได้ (ไม่มีปุ่มลบจริง เพื่อไม่ให้ข้อมูลเก่าเสีย)
// items: [{ id, label, active, raw }]
export function EditableList({
  items,
  selectedId,
  onSelect,
  onRename,
  onToggle,
  onMove,
  busy,
  renderExtra,
  renameWarning,
  emptyText = "ยังไม่มีรายการ",
}) {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState("");

  const startEdit = (it) => {
    setEditingId(it.id);
    setDraft(it.label);
  };

  const saveEdit = async (it) => {
    const v = draft.trim();
    if (v === it.label) {
      setEditingId(null);
      return;
    }
    if (renameWarning && !window.confirm(renameWarning)) return;
    const ok = await onRename(it.id, v);
    if (ok !== false) setEditingId(null);
  };

  if (items.length === 0) {
    return (
      <p className="mb-3 text-xs" style={{ color: COLORS.textMuted }}>
        {emptyText}
      </p>
    );
  }

  return (
    <div className="mb-3 space-y-2">
      {items.map((it, idx) => {
        const selected = selectedId != null && String(selectedId) === String(it.id);
        return (
          <div
            key={it.id}
            className="flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2"
            style={{
              borderColor: selected ? COLORS.amber : COLORS.border,
              background: it.active ? "#FCFBF8" : "#F1EFE9",
            }}
          >
            <div className="min-w-0 flex-1 basis-40">
              {editingId === it.id ? (
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit(it);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  className="w-full rounded-md border bg-white px-2.5 py-1.5 text-sm outline-none"
                  style={{ borderColor: COLORS.amber }}
                />
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  {onSelect ? (
                    <button
                      type="button"
                      onClick={() => onSelect(it.id)}
                      className="text-left text-sm font-semibold"
                      style={{ color: it.active ? COLORS.charcoal : COLORS.textMuted }}
                    >
                      {it.label}
                    </button>
                  ) : (
                    <span className="text-sm font-semibold" style={{ color: it.active ? COLORS.charcoal : COLORS.textMuted }}>
                      {it.label}
                    </span>
                  )}
                  {!it.active && (
                    <span className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ background: "#EEECE6", color: COLORS.textMuted }}>
                      ปิดใช้งานอยู่
                    </span>
                  )}
                </div>
              )}
            </div>

            {renderExtra?.(it)}

            <div className="flex items-center gap-1">
              {editingId === it.id ? (
                <>
                  <IconBtn title="บันทึกชื่อ" onClick={() => saveEdit(it)} disabled={busy}>
                    <Check size={14} />
                  </IconBtn>
                  <IconBtn title="ยกเลิก" onClick={() => setEditingId(null)}>
                    <X size={14} />
                  </IconBtn>
                </>
              ) : (
                <>
                  {onMove && (
                    <>
                      <IconBtn title="เลื่อนขึ้น" onClick={() => onMove(idx, -1)} disabled={busy || idx === 0}>
                        <ChevronUp size={14} />
                      </IconBtn>
                      <IconBtn title="เลื่อนลง" onClick={() => onMove(idx, 1)} disabled={busy || idx === items.length - 1}>
                        <ChevronDown size={14} />
                      </IconBtn>
                    </>
                  )}
                  <IconBtn title="แก้ชื่อ" onClick={() => startEdit(it)} disabled={busy}>
                    <Pencil size={13} />
                  </IconBtn>
                  <button
                    type="button"
                    onClick={() => onToggle(it)}
                    disabled={busy}
                    className="flex h-7 items-center gap-1 rounded-md border px-2 text-xs font-medium disabled:opacity-40"
                    style={{
                      borderColor: COLORS.border,
                      background: "white",
                      color: it.active ? COLORS.red : COLORS.green,
                    }}
                  >
                    <Power size={12} />
                    {it.active ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ช่องพิมพ์ + ปุ่มเพิ่ม (onAdd คืน false = ไม่สำเร็จ ไม่เคลียร์ช่อง)
export function AddInline({ placeholder, buttonLabel = "เพิ่ม", onAdd, busy }) {
  const [value, setValue] = useState("");

  const submit = async () => {
    const ok = await onAdd(value);
    if (ok !== false) setValue("");
  };

  return (
    <div className="flex items-center gap-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
        placeholder={placeholder}
        className="min-w-0 flex-1 rounded-lg border bg-white px-3.5 py-2.5 text-[15px] outline-none"
        style={{ borderColor: COLORS.border }}
      />
      <button
        type="button"
        onClick={submit}
        disabled={busy || !value.trim()}
        className="flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        style={{ background: COLORS.green }}
      >
        <Plus size={15} />
        {buttonLabel}
      </button>
    </div>
  );
}