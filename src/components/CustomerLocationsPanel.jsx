import React, { useState } from "react";
import { MapPin, ChevronRight, Pencil, Trash2, Save, X, Plus } from "lucide-react";
import { COLORS } from "../lib/tokens.js";
import { FieldLabel, TextInput, ErrorText } from "./ui.jsx";
import MapPinPicker from "./MapPinPicker.jsx";

// ฟอร์มแก้ไข/เพิ่มสถานที่ 1 แห่ง (ใช้ร่วมกันทั้งแก้ไขของเดิมและเพิ่มใหม่)
function LocationEditForm({ initialName = "", initialLatitude = null, initialLongitude = null, onSave, onCancel, saveLabel = "บันทึก" }) {
  const [name, setName] = useState(initialName);
  const [latitude, setLatitude] = useState(initialLatitude);
  const [longitude, setLongitude] = useState(initialLongitude);
  const [nameError, setNameError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!name.trim()) {
      setNameError(true);
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave({ name: name.trim(), latitude, longitude });
    } catch (err) {
      console.error("Save location failed:", err);
      setError("บันทึกสถานที่ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      setSaving(false);
      return;
    }
    setSaving(false);
  };

  return (
    <div className="rounded-lg border p-3 space-y-3" style={{ borderColor: nameError ? COLORS.red : COLORS.border, background: "#FCFBF8" }}>
      <div>
        <FieldLabel icon={MapPin} required tone="amber">
          ชื่อสถานที่
        </FieldLabel>
        <TextInput
          placeholder="เช่น บ้าน, ที่ทำงาน"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setNameError(false);
          }}
          error={nameError}
        />
        {nameError && <ErrorText>กรุณาระบุชื่อสถานที่</ErrorText>}
      </div>

      <div>
        <FieldLabel icon={MapPin}>ปักหมุดตำแหน่ง</FieldLabel>
        <MapPinPicker
          latitude={latitude}
          longitude={longitude}
          height={220}
          onChange={({ latitude: lat, longitude: lng }) => {
            setLatitude(lat);
            setLongitude(lng);
          }}
        />
      </div>

      {error && <ErrorText>{error}</ErrorText>}

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium disabled:opacity-60"
          style={{ borderColor: COLORS.border, color: COLORS.charcoalSoft, background: "white" }}
        >
          <X size={12} />
          ยกเลิก
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
          style={{ background: COLORS.charcoal }}
        >
          <Save size={12} style={{ color: COLORS.amber }} />
          {saving ? "กำลังบันทึก..." : saveLabel}
        </button>
      </div>
    </div>
  );
}

// แถวสถานที่ 1 แห่ง: โหมดดู (คลิกเพื่อดูแผนที่) + ปุ่มแก้ไข/ลบชิดขวา
function LocationRow({ location, onView, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const hasPin = location.latitude != null && location.longitude != null;

  const handleDelete = async () => {
    const confirmed = window.confirm(`ต้องการลบสถานที่ "${location.name}" ใช่ไหม?`);
    if (!confirmed) return;
    setDeleting(true);
    try {
      await onDelete();
    } catch (err) {
      console.error("Delete location failed:", err);
      alert("ลบสถานที่ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setDeleting(false);
    }
  };

  if (editing) {
    return (
      <LocationEditForm
        initialName={location.name}
        initialLatitude={location.latitude}
        initialLongitude={location.longitude}
        onCancel={() => setEditing(false)}
        onSave={async (patch) => {
          await onSave(patch);
          setEditing(false);
        }}
      />
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border p-3" style={{ borderColor: COLORS.border, background: "#FCFBF8" }}>
      <button type="button" onClick={onView} className="flex min-w-0 flex-1 items-center gap-2 text-left">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate" style={{ color: COLORS.charcoal }}>
            {location.name}
          </p>
          <p className="text-xs" style={{ color: hasPin ? COLORS.green : COLORS.textMuted }}>
            {hasPin ? "ปักหมุดแล้ว" : "ยังไม่ได้ปักหมุด"}
          </p>
        </div>
        <ChevronRight size={16} className="shrink-0" style={{ color: COLORS.textMuted }} />
      </button>

      {/* ปุ่มแก้ไข/ลบ อยู่ชิดขวา แยกทีละสถานที่ */}
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex h-7 w-7 items-center justify-center rounded-md border"
          style={{ borderColor: COLORS.border, color: COLORS.charcoalSoft, background: "white" }}
          title="แก้ไขสถานที่นี้"
        >
          <Pencil size={12} />
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="flex h-7 w-7 items-center justify-center rounded-md text-white disabled:opacity-60"
          style={{ background: COLORS.red }}
          title="ลบสถานที่นี้"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

// การ์ด "สถานที่ (N)" ทั้งหมด: รายการ + เพิ่มใหม่
export default function CustomerLocationsPanel({ locations, onView, onAdd, onUpdate, onDelete }) {
  const [addingNew, setAddingNew] = useState(false);

  return (
    <div className="mt-4 rounded-xl border p-5" style={{ borderColor: COLORS.border, background: COLORS.surface }}>
      <div className="mb-3 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: COLORS.charcoal }}>
          <MapPin size={14} style={{ color: COLORS.amber }} />
          สถานที่ ({locations.length})
        </p>
        {!addingNew && (
          <button
            type="button"
            onClick={() => setAddingNew(true)}
            className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-white"
            style={{ background: COLORS.green }}
          >
            <Plus size={13} />
            เพิ่มสถานที่
          </button>
        )}
      </div>

      {locations.length === 0 && !addingNew && (
        <p className="text-xs" style={{ color: COLORS.textMuted }}>
          ยังไม่มีสถานที่ กดปุ่ม "เพิ่มสถานที่" เพื่อเพิ่ม
        </p>
      )}

      <div className="space-y-2">
        {locations.map((l) => (
          <LocationRow
            key={l.location_id}
            location={l}
            onView={() => onView(l.location_id)}
            onSave={(patch) => onUpdate(l.location_id, patch)}
            onDelete={() => onDelete(l.location_id)}
          />
        ))}

        {addingNew && (
          <LocationEditForm
            saveLabel="เพิ่มสถานที่"
            onCancel={() => setAddingNew(false)}
            onSave={async (patch) => {
              await onAdd(patch);
              setAddingNew(false);
            }}
          />
        )}
      </div>
    </div>
  );
}