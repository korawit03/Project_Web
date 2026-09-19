import React, { useState } from "react";
import { UserPlus, Phone, MapPin, Save, AlertCircle } from "lucide-react";
import { COLORS } from "../lib/tokens.js";
import { FieldLabel, TextInput, ErrorText } from "../components/ui.jsx";
import SuccessBurst from "../components/SuccessBurst.jsx";
import LocationListEditor, { newLocationRow, validateLocationRows } from "../components/LocationListEditor.jsx";

export default function CustomerCreatePage({ createCustomer }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [locationRows, setLocationRows] = useState(() => [newLocationRow()]);
  const [errors, setErrors] = useState({ name: false, phone: false });
  const [locationErrors, setLocationErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [savedMsg, setSavedMsg] = useState("");

  const resetForm = () => {
    setName("");
    setPhone("");
    setLocationRows([newLocationRow()]);
    setErrors({ name: false, phone: false });
    setLocationErrors({});
  };

  const handleSave = async () => {
    setSaveError("");
    const next = { name: !name.trim(), phone: !phone.trim() };
    const { cleaned, errorKeys, valid } = validateLocationRows(locationRows);
    setErrors(next);
    setLocationErrors(errorKeys);

    if (next.name || next.phone || !valid) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSaving(true);
    try {
      await createCustomer({ name, phone, locations: cleaned });

      resetForm();
      setSavedMsg("บันทึกข้อมูลลูกค้าใหม่เรียบร้อย");
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => setSavedMsg(""), 4000);
    } catch (err) {
      console.error("Create customer failed:", err);
      setSaveError("บันทึกข้อมูลลูกค้าไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-8">
      <div className="mb-6 flex items-center gap-2.5 border-b pb-4" style={{ borderColor: COLORS.border }}>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: COLORS.charcoal }}>
          <UserPlus size={17} color={COLORS.amber} />
        </span>
        <h1 className="text-lg font-bold" style={{ color: COLORS.charcoal }}>
          เพิ่มข้อมูลลูกค้าใหม่
        </h1>
      </div>

      <SuccessBurst message={savedMsg} trigger={savedMsg ? Date.now() : null} />

      {saveError && (
        <div className="mb-6 rounded-lg border p-4" style={{ borderColor: COLORS.red, background: "#FDECEC" }}>
          <p className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: COLORS.red }}>
            <AlertCircle size={16} />
            {saveError}
          </p>
        </div>
      )}

      <div className="space-y-4 rounded-xl border p-5" style={{ borderColor: COLORS.border, background: COLORS.surface }}>
        <div>
          <FieldLabel required>ชื่อ-นามสกุล</FieldLabel>
          <TextInput value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
          {errors.name && <ErrorText>กรุณากรอกชื่อ-นามสกุลลูกค้า</ErrorText>}
        </div>

        <div>
          <FieldLabel icon={Phone} required>
            เบอร์โทร
          </FieldLabel>
          <TextInput type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} error={errors.phone} />
          {errors.phone && <ErrorText>กรุณากรอกเบอร์โทรลูกค้า</ErrorText>}
        </div>
      </div>

      <div className="mt-4 rounded-xl border p-5" style={{ borderColor: COLORS.border, background: COLORS.surface }}>
        <p className="flex items-center gap-1.5 text-sm font-semibold mb-3" style={{ color: COLORS.charcoal }}>
          <MapPin size={14} style={{ color: COLORS.amber }} />
          สถานที่
        </p>
        <LocationListEditor rows={locationRows} onChange={setLocationRows} errorKeys={locationErrors} />
      </div>

      <div className="mt-6 flex justify-center">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-sm transition-transform active:scale-95 hover:-translate-y-0.5 disabled:opacity-60"
          style={{ background: COLORS.charcoal }}
        >
          <Save size={16} style={{ color: COLORS.amber }} />
          {saving ? "กำลังบันทึก..." : "บันทึกลูกค้าใหม่"}
        </button>
      </div>
    </div>
  );
}