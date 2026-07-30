import React from "react";
import { COLORS } from "../lib/tokens.js";

export function FieldLabel({ icon: Icon, required, children, tone = "charcoal" }) {
  return (
    <label className="flex items-center gap-1.5 text-sm font-medium mb-1.5" style={{ color: COLORS.charcoal }}>
      {Icon && <Icon size={14} style={{ color: tone === "amber" ? COLORS.amber : COLORS.textMuted }} />}
      {children}
      {required && <span style={{ color: COLORS.red }}>*</span>}
    </label>
  );
}

// ข้อความแจ้งเตือนสีแดงใต้ฟิลด์ที่กรอกไม่ครบ
export function ErrorText({ children }) {
  return (
    <p className="mt-1 text-xs font-medium" style={{ color: COLORS.red }}>
      {children}
    </p>
  );
}

export function TextInput({ error, ...props }) {
  return (
    <input
      {...props}
      className="w-full rounded-lg border bg-white px-3.5 py-2.5 text-[15px] outline-none transition-shadow"
      style={{ borderColor: error ? COLORS.red : COLORS.border }}
      onFocus={(e) => (e.target.style.boxShadow = `0 0 0 2px ${(error ? COLORS.red : COLORS.amber)}33`)}
      onBlur={(e) => (e.target.style.boxShadow = "none")}
    />
  );
}

// dropdown แบบมีหมวดหมู่ (optgroup) เช่น ประตู / หน้าต่าง / หลังคา / กั้นห้อง
export function GroupedSelect({ value, onChange, groups, placeholder, error }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        className="w-full appearance-none rounded-lg border bg-white px-3.5 py-2.5 text-[15px] outline-none pr-9"
        style={{ borderColor: error ? COLORS.red : COLORS.border, color: value ? COLORS.charcoal : COLORS.textMuted }}
      >
        <option value="">{placeholder}</option>
        {groups.map((group) => (
          <optgroup key={group.label} label={group.label}>
            {group.options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" width="12" height="8" viewBox="0 0 12 8" fill="none">
        <path d="M1 1L6 6L11 1" stroke={COLORS.textMuted} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export function Select({ value, onChange, options, placeholder, error }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        className="w-full appearance-none rounded-lg border bg-white px-3.5 py-2.5 text-[15px] outline-none pr-9"
        style={{ borderColor: error ? COLORS.red : COLORS.border, color: value ? COLORS.charcoal : COLORS.textMuted }}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" width="12" height="8" viewBox="0 0 12 8" fill="none">
        <path d="M1 1L6 6L11 1" stroke={COLORS.textMuted} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}