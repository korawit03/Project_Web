import React, { useState, useMemo } from "react";
import {
  Contact,
  Search,
  ChevronRight,
  ArrowLeft,
  Phone,
  MapPin,
  Pencil,
  Save,
  X,
  AlertCircle,
} from "lucide-react";
import { COLORS } from "../lib/tokens.js";
import { FieldLabel, TextInput, ErrorText } from "../components/ui.jsx";
import MapPinPicker from "../components/MapPinPicker.jsx";
import SuccessBurst from "../components/SuccessBurst.jsx";
import LocationListEditor, { toLocationRows, validateLocationRows } from "../components/LocationListEditor.jsx";

function BackButton({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-4 flex items-center gap-1.5 text-sm font-medium"
      style={{ color: COLORS.amberDark }}
    >
      <ArrowLeft size={14} />
      {children}
    </button>
  );
}

function Header({ title }) {
  return (
    <div className="mb-6 flex items-center gap-2.5 border-b pb-4" style={{ borderColor: COLORS.border }}>
      <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: COLORS.charcoal }}>
        <Contact size={17} color={COLORS.amber} />
      </span>
      <h1 className="text-lg font-bold truncate" style={{ color: COLORS.charcoal }}>
        {title}
      </h1>
    </div>
  );
}

// หน้า "รายละเอียดลูกค้า" 3 ชั้น:
//   ชั้น 1 รายชื่อลูกค้า (ชื่อ + เบอร์)
//   ชั้น 2 ข้อมูลลูกค้า + รายชื่อสถานที่ (แก้ไขได้ที่ชั้นนี้)
//   ชั้น 3 รายละเอียดสถานที่ 1 แห่ง (แผนที่)
export default function CustomerDetailPage({ customers, loading, updateCustomer, onCustomerUpdated }) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [selectedLocationId, setSelectedLocationId] = useState(null);
  const [editing, setEditing] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [locationRows, setLocationRows] = useState([]);
  const [errors, setErrors] = useState({ name: false, phone: false });
  const [locationErrors, setLocationErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [savedMsg, setSavedMsg] = useState("");

  const selected = customers.find((c) => c.customer_id === selectedId) || null;
  const selectedLocation =
    selected?.locations?.find((l) => String(l.location_id) === String(selectedLocationId)) || null;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => [c.name, c.phone].some((v) => (v || "").toLowerCase().includes(q)));
  }, [customers, search]);

  const openCustomer = (id) => {
    setSelectedId(id);
    setSelectedLocationId(null);
    setEditing(false);
    setSaveError("");
    setSavedMsg("");
  };

  const startEdit = () => {
    setName(selected.name || "");
    setPhone(selected.phone || "");
    setLocationRows(toLocationRows(selected.locations));
    setErrors({ name: false, phone: false });
    setLocationErrors({});
    setSaveError("");
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setSaveError("");
    setErrors({ name: false, phone: false });
    setLocationErrors({});
  };

  const handleSave = async () => {
    const next = { name: !name.trim(), phone: !phone.trim() };
    const { cleaned, errorKeys, valid } = validateLocationRows(locationRows);
    setErrors(next);
    setLocationErrors(errorKeys);
    if (next.name || next.phone || !valid) return;

    setSaving(true);
    setSaveError("");
    try {
      await updateCustomer(selected.customer_id, { name, phone, locations: cleaned });
      // โหลดโครงงานใหม่ เพื่อให้ชื่อ/เบอร์ลูกค้าในหน้าอื่นอัปเดตตาม
      onCustomerUpdated?.();
      setEditing(false);
      setSavedMsg("บันทึกข้อมูลลูกค้าเรียบร้อย");
      setTimeout(() => setSavedMsg(""), 4000);
    } catch (err) {
      console.error("Update customer failed:", err);
      setSaveError("บันทึกข้อมูลลูกค้าไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSaving(false);
    }
  };

  // ===== ชั้น 3: รายละเอียดสถานที่ 1 แห่ง =====
  if (selected && selectedLocation && !editing) {
    const hasPin = selectedLocation.latitude != null && selectedLocation.longitude != null;
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-8">
        <BackButton onClick={() => setSelectedLocationId(null)}>กลับไปดูข้อมูลของ {selected.name}</BackButton>

        <Header title={selectedLocation.name} />

        <div className="space-y-4 rounded-xl border p-5" style={{ borderColor: COLORS.border, background: COLORS.surface }}>
          <div>
            <p className="flex items-center gap-1 text-xs mb-0.5" style={{ color: COLORS.textMuted }}>
              <MapPin size={11} /> ชื่อสถานที่
            </p>
            <p className="text-sm font-medium" style={{ color: COLORS.charcoal }}>{selectedLocation.name}</p>
          </div>

          {hasPin ? (
            <MapPinPicker
              key={selectedLocation.location_id}
              readOnly
              latitude={selectedLocation.latitude}
              longitude={selectedLocation.longitude}
              height={280}
            />
          ) : (
            <p className="text-xs" style={{ color: COLORS.textMuted }}>ยังไม่ได้ปักหมุดตำแหน่ง</p>
          )}
        </div>
      </div>
    );
  }

  // ===== ชั้น 2: ข้อมูลลูกค้า (ดู / แก้ไข) =====
  if (selected) {
    const locations = selected.locations || [];

    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-8">
        <BackButton onClick={() => setSelectedId(null)}>กลับไปดูรายชื่อลูกค้า</BackButton>

        <Header title={selected.name} />

        <SuccessBurst message={savedMsg} trigger={savedMsg ? Date.now() : null} />

        {saveError && (
          <div className="mb-6 rounded-lg border p-4" style={{ borderColor: COLORS.red, background: "#FDECEC" }}>
            <p className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: COLORS.red }}>
              <AlertCircle size={16} />
              {saveError}
            </p>
          </div>
        )}

        {!editing ? (
          <>
            <div className="space-y-4 rounded-xl border p-5" style={{ borderColor: COLORS.border, background: COLORS.surface }}>
              <div>
                <p className="text-xs mb-0.5" style={{ color: COLORS.textMuted }}>ชื่อ-นามสกุล</p>
                <p className="text-sm font-medium" style={{ color: COLORS.charcoal }}>{selected.name}</p>
              </div>
              <div>
                <p className="flex items-center gap-1 text-xs mb-0.5" style={{ color: COLORS.textMuted }}>
                  <Phone size={11} /> เบอร์โทร
                </p>
                <p className="text-sm font-medium" style={{ color: COLORS.charcoal }}>
                  {selected.phone ? (
                    <a href={`tel:${selected.phone}`} style={{ color: COLORS.amberDark }}>{selected.phone}</a>
                  ) : (
                    <span style={{ color: COLORS.textMuted }}>-</span>
                  )}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border p-5" style={{ borderColor: COLORS.border, background: COLORS.surface }}>
              <p className="flex items-center gap-1.5 text-sm font-semibold mb-3" style={{ color: COLORS.charcoal }}>
                <MapPin size={14} style={{ color: COLORS.amber }} />
                สถานที่ ({locations.length})
              </p>

              {locations.length === 0 ? (
                <p className="text-xs" style={{ color: COLORS.textMuted }}>ยังไม่มีสถานที่ กด "แก้ไขข้อมูลลูกค้า" เพื่อเพิ่ม</p>
              ) : (
                <div className="space-y-2">
                  {locations.map((l) => {
                    const hasPin = l.latitude != null && l.longitude != null;
                    return (
                      <button
                        key={l.location_id}
                        type="button"
                        onClick={() => setSelectedLocationId(l.location_id)}
                        className="w-full flex items-center justify-between gap-3 rounded-lg border p-3 text-left transition-shadow hover:shadow-sm"
                        style={{ borderColor: COLORS.border, background: "#FCFBF8" }}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: COLORS.charcoal }}>{l.name}</p>
                          <p className="text-xs" style={{ color: hasPin ? COLORS.green : COLORS.textMuted }}>
                            {hasPin ? "ปักหมุดแล้ว" : "ยังไม่ได้ปักหมุด"}
                          </p>
                        </div>
                        <ChevronRight size={16} className="shrink-0" style={{ color: COLORS.textMuted }} />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={startEdit}
                className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-sm transition-transform active:scale-95 hover:-translate-y-0.5"
                style={{ background: COLORS.charcoal }}
              >
                <Pencil size={15} style={{ color: COLORS.amber }} />
                แก้ไขข้อมูลลูกค้า
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-4 rounded-xl border p-5" style={{ borderColor: COLORS.border, background: COLORS.surface }}>
              <div>
                <FieldLabel required>ชื่อ-นามสกุล</FieldLabel>
                <TextInput value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
                {errors.name && <ErrorText>กรุณากรอกชื่อ-นามสกุลลูกค้า</ErrorText>}
              </div>

              <div>
                <FieldLabel icon={Phone} required>เบอร์โทร</FieldLabel>
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

            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={cancelEdit}
                disabled={saving}
                className="flex items-center gap-1.5 rounded-xl px-5 py-3 text-sm font-medium disabled:opacity-60"
                style={{ border: `1px solid ${COLORS.border}`, color: COLORS.charcoalSoft, background: "white" }}
              >
                <X size={14} />
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-sm transition-transform active:scale-95 disabled:opacity-60"
                style={{ background: COLORS.charcoal }}
              >
                <Save size={16} style={{ color: COLORS.amber }} />
                {saving ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // ===== ชั้น 1: รายชื่อลูกค้า (ชื่อ + เบอร์โทร) =====
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-8">
      <Header title="รายละเอียดลูกค้า" />

      <SuccessBurst message={savedMsg} trigger={savedMsg ? Date.now() : null} />

      <div className="relative mb-4">
        <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: COLORS.textMuted }} />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาชื่อลูกค้า / เบอร์โทร"
          className="w-full rounded-lg border bg-white py-2.5 pl-10 pr-3.5 text-[15px] outline-none"
          style={{ borderColor: COLORS.border }}
        />
      </div>

      {loading && customers.length === 0 ? (
        <div className="rounded-xl border p-10 text-center" style={{ borderColor: COLORS.border, background: COLORS.surface }}>
          <p className="text-sm" style={{ color: COLORS.textMuted }}>กำลังโหลดข้อมูล...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border p-10 text-center" style={{ borderColor: COLORS.border, background: COLORS.surface }}>
          <Contact size={40} className="mx-auto mb-3" style={{ color: COLORS.amber }} />
          <p className="text-sm" style={{ color: COLORS.textMuted }}>
            {customers.length === 0 ? 'ยังไม่มีลูกค้าในระบบ ไปที่เมนู "ลูกค้า > เพิ่มลูกค้า" ได้เลย' : "ไม่พบลูกค้าที่ค้นหา"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs" style={{ color: COLORS.textMuted }}>ทั้งหมด {filtered.length} ราย</p>
          {filtered.map((c) => (
            <button
              key={c.customer_id}
              type="button"
              onClick={() => openCustomer(c.customer_id)}
              className="w-full text-left rounded-xl border p-4 transition-shadow hover:shadow-sm"
              style={{ borderColor: COLORS.border, background: COLORS.surface }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: COLORS.charcoal }}>{c.name}</p>
                  {c.phone && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs" style={{ color: COLORS.textMuted }}>
                      <Phone size={11} />
                      {c.phone}
                    </p>
                  )}
                </div>
                <ChevronRight size={16} className="shrink-0" style={{ color: COLORS.textMuted }} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}