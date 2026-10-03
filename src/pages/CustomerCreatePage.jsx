import React, { useState } from "react";
import { UserPlus, Phone, MapPin, Save, AlertCircle } from "lucide-react";
import { COLORS } from "../lib/tokens.js";
import { FieldLabel, TextInput, NameInput, ErrorText } from "../components/ui.jsx";
import { isValidName, isValidPhone, formatPhone, cleanName } from "../lib/nameValidation.js";
import SuccessBurst from "../components/SuccessBurst.jsx";
import LocationListEditor, { newLocationRow, validateLocationRows } from "../components/LocationListEditor.jsx";

export default function CustomerCreatePage({ createCustomer }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [touched, setTouched] = useState({});
  const [locationRows, setLocationRows] = useState(() => [newLocationRow()]);
  const [locationErrors, setLocationErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [savedMsg, setSavedMsg] = useState("");

  const touch = (k) => setTouched((t) => ({ ...t, [k]: true }));
  const fnOk = isValidName(firstName);
  const lnOk = isValidName(lastName);
  const phOk = isValidPhone(phone);
  const formValid = fnOk && lnOk && phOk && validateLocationRows(locationRows).valid;

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setPhone("");
    setTouched({});
    setLocationRows([newLocationRow()]);
    setLocationErrors({});
  };

  const handleSave = async () => {
    setSaveError("");
    const { cleaned, errorKeys } = validateLocationRows(locationRows);
    setLocationErrors(errorKeys);
    if (!formValid) {
      setTouched({ firstName: true, lastName: true, phone: true });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSaving(true);
    try {
      await createCustomer({
        firstName: cleanName(firstName),
        lastName: cleanName(lastName),
        phone,
        locations: cleaned,
      });
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
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel required>ชื่อ</FieldLabel>
            <NameInput
              value={firstName}
              onChange={setFirstName}
              onBlur={() => touch("firstName")}
              error={touched.firstName && !fnOk}
              valid={fnOk}
            />
            {touched.firstName && !fnOk && <ErrorText>กรุณากรอกชื่อ</ErrorText>}
          </div>
          <div>
            <FieldLabel required>นามสกุล</FieldLabel>
            <NameInput
              value={lastName}
              onChange={setLastName}
              onBlur={() => touch("lastName")}
              error={touched.lastName && !lnOk}
              valid={lnOk}
            />
            {touched.lastName && !lnOk && <ErrorText>กรุณากรอกนามสกุล</ErrorText>}
          </div>
        </div>

        <div>
          <FieldLabel icon={Phone} required>เบอร์โทร</FieldLabel>
          <TextInput
            type="tel"
            inputMode="numeric"
            maxLength={12}
            placeholder="0XX-XXX-XXXX"
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            onBlur={() => touch("phone")}
            error={touched.phone && !phOk}
            valid={phOk}
          />
          {touched.phone && !phOk && <ErrorText>กรุณากรอกเบอร์โทร 10 หลัก ขึ้นต้นด้วย 0</ErrorText>}
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
          disabled={saving || !formValid}
          className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-sm transition-transform active:scale-95 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          style={{ background: saving || !formValid ? "#B9BCC2" : COLORS.charcoal }}
        >
          <Save size={16} style={{ color: COLORS.amber }} />
          {saving ? "กำลังบันทึก..." : "บันทึกลูกค้าใหม่"}
        </button>
      </div>
    </div>
  );
}