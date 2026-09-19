import React from "react";
import { MapPin, Plus, Trash2 } from "lucide-react";
import { COLORS } from "../lib/tokens.js";
import { FieldLabel, TextInput, ErrorText } from "./ui.jsx";
import MapPinPicker from "./MapPinPicker.jsx";

let rowCounter = 1;

// แถวสถานที่ใหม่ (ยังไม่มี location_id)
export function newLocationRow() {
  return { key: `loc-new-${Date.now()}-${rowCounter++}`, location_id: null, name: "", latitude: null, longitude: null };
}

// แปลงสถานที่จากฐานข้อมูล -> แถวในฟอร์ม
export function toLocationRows(locations) {
  return (locations || []).map((l) => ({
    key: `loc-${l.location_id}`,
    location_id: l.location_id,
    name: l.name || "",
    latitude: l.latitude ?? null,
    longitude: l.longitude ?? null,
  }));
}

// ตัดแถวที่ว่างเปล่าทิ้ง (ไม่มีชื่อและไม่ได้ปักหมุด) และหาแถวที่ปักหมุดแล้วแต่ยังไม่ใส่ชื่อ
export function validateLocationRows(rows) {
  const cleaned = rows.filter((r) => r.name.trim() || r.latitude != null);
  const errorKeys = {};
  cleaned.forEach((r) => {
    if (!r.name.trim()) errorKeys[r.key] = true;
  });
  return { cleaned, errorKeys, valid: Object.keys(errorKeys).length === 0 };
}

export default function LocationListEditor({ rows, onChange, errorKeys = {} }) {
  const updateRow = (key, patch) => onChange(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const removeRow = (key) => onChange(rows.filter((r) => r.key !== key));

  return (
    <div className="space-y-3">
      {rows.length === 0 && (
        <p className="text-xs" style={{ color: COLORS.textMuted }}>
          ยังไม่มีสถานที่ กดปุ่มด้านล่างเพื่อเพิ่ม
        </p>
      )}

      {rows.map((row, idx) => (
        <div
          key={row.key}
          className="rounded-lg border p-4 space-y-3"
          style={{ borderColor: errorKeys[row.key] ? COLORS.red : COLORS.border, background: "#FCFBF8" }}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold" style={{ color: COLORS.charcoal }}>
              สถานที่ที่ {idx + 1}
            </span>
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`ต้องการลบสถานที่ที่ ${idx + 1} ใช่ไหม?`)) removeRow(row.key);
              }}
              className="flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-white"
              style={{ background: COLORS.red }}
            >
              <Trash2 size={12} />
              ลบ
            </button>
          </div>

          <div>
            <FieldLabel icon={MapPin} required tone="amber">
              ชื่อสถานที่ (เช่น บ้าน, ที่ทำงาน)
            </FieldLabel>
            <TextInput
              placeholder="เช่น บ้าน, ที่ทำงาน"
              value={row.name}
              onChange={(e) => updateRow(row.key, { name: e.target.value })}
              error={errorKeys[row.key]}
            />
            {errorKeys[row.key] && <ErrorText>กรุณาระบุชื่อสถานที่</ErrorText>}
          </div>

          <div>
            <FieldLabel icon={MapPin}>ปักหมุดตำแหน่ง</FieldLabel>
            <MapPinPicker
              latitude={row.latitude}
              longitude={row.longitude}
              height={240}
              onChange={({ latitude, longitude }) => updateRow(row.key, { latitude, longitude })}
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => onChange([...rows, newLocationRow()])}
        className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium text-white"
        style={{ background: COLORS.green }}
      >
        <Plus size={15} />
        เพิ่มสถานที่
      </button>
    </div>
  );
}