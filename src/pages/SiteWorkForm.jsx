import React, { useState, useEffect } from "react";
import { COLORS } from "../lib/tokens.js";
import { FieldLabel, TextInput, ErrorText } from "../components/ui.jsx";
import WorkItemCard from "../components/WorkItemCard.jsx";
import LocationPicker from "../components/LocationPicker.jsx";
import ProjectCard from "../components/ProjectCard.jsx";
import { validateForm, hasErrors } from "../lib/validation.js";
import SuccessBurst from "../components/SuccessBurst.jsx";
import { supabase } from "../lib/supabase.js";
import { saveAllWorkItems } from "../lib/jobItems.js";
import { Wrench, Plus, MapPin, Layers, Save, AlertCircle, Phone, Users, X, Calendar } from "lucide-react";
import { DEFAULT_STATUS } from "../lib/status.js";


let itemCounter = 1;
function newWorkItem() {
  return {
    id: `item-${Date.now()}-${itemCounter++}`,
    mainWork: "",
    answers: {},
    itemName: "",
    positionNote: "",
    positionPhotos: [],
    workPhotos: [],
    note: "",
    status: DEFAULT_STATUS,
  };
}

// dropdown เลือกลูกค้า: ตัวเลือกแรกคือ "+ เพิ่มลูกค้าใหม่" ตามด้วยรายชื่อลูกค้าทั้งหมด (เรียง ก-ฮ จาก useCustomers)
function CustomerSelect({ value, onChange, customers, error }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        className="w-full appearance-none rounded-lg border bg-white px-3.5 py-2.5 text-[15px] outline-none pr-9"
        style={{ borderColor: error ? COLORS.red : COLORS.border, color: value ? COLORS.charcoal : COLORS.textMuted }}
      >
        <option value="">-- เลือกลูกค้า --</option>

        {customers.map((c) => (
          <option key={c.customer_id} value={c.customer_id}>
            {c.name}
          </option>
        ))}
      </select>
      <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" width="12" height="8" viewBox="0 0 12 8" fill="none">
        <path d="M1 1L6 6L11 1" stroke={COLORS.textMuted} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export default function SiteWorkForm({
  onSaved,
  workCatalog,
  categoryOrder,
  catalogLoading,
  customers,
  findOrCreateCustomer,
  updateCustomerPhone,
  projects,
  onUpdateProject,
  onDeleteProject,
}) {
  // selectedCustomerId เก็บค่า 3 แบบ: "" (ยังไม่เลือก), NEW_CUSTOMER_VALUE (ลูกค้าใหม่), หรือ customer_id จริง
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [projectName, setProjectName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [items, setItems] = useState([newWorkItem()]);
  const [savedMsg, setSavedMsg] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({ projectName: false, items: {} });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [projectDate, setProjectDate] = useState(todayStr());
  const [projectTitle, setProjectTitle] = useState("");
  const [projectTitleError, setProjectTitleError] = useState(false);


  // state + handler สำหรับปุ่ม "บันทึกเบอร์" — ต้องอยู่ระดับบนสุดของ component เท่านั้น (Rules of Hooks)
  const [savingPhone, setSavingPhone] = useState(false);
  const [phoneSavedMsg, setPhoneSavedMsg] = useState("");

  const selectedCustomer = customers.find((c) => String(c.customer_id) === String(selectedCustomerId)) || null;

  const handleSavePhone = async () => {
    if (!selectedCustomer) return;
    setSaveError("");
    setSavingPhone(true);
    try {
      await updateCustomerPhone(selectedCustomer.customer_id, phone);
      setPhoneSavedMsg("บันทึกเบอร์โทรเรียบร้อย");
      setTimeout(() => setPhoneSavedMsg(""), 2500);
    } catch (err) {
      console.error("Update customer phone failed:", err);
      setSaveError("บันทึกเบอร์โทรไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSavingPhone(false);
    }
  };
  const todayStr = () => {
    const d = new Date();
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  };

  // พอเลือกลูกค้าจาก dropdown เปลี่ยน -> เติมชื่อ/เบอร์ให้อัตโนมัติ (กรณีลูกค้าเดิม) หรือเคลียร์ให้กรอกใหม่ (กรณีลูกค้าใหม่)
  const handleCustomerChange = (e) => {
    const value = e.target.value;
    setSelectedCustomerId(value);
    setPhoneSavedMsg("");

    if (value === "") {
      setProjectName("");
      setPhone("");
      setShowCreateNew(false);
    } else {
      const c = customers.find((cust) => String(cust.customer_id) === String(value));
      setProjectName(c?.name || "");
      setPhone(c?.phone || "");
      setShowCreateNew(false);
    }
  };

  const customerProjects = selectedCustomer
    ? projects.filter((p) => p.customerId === selectedCustomer.customer_id)
    : [];

  // ลูกค้าเดิมแต่ยังไม่มีโครงงานเลย -> เปิดฟอร์มสร้างใหม่ให้อัตโนมัติ
  useEffect(() => {
    if (selectedCustomer && customerProjects.length === 0) {
      setShowCreateNew(true);
    } else if (selectedCustomer) {
      setShowCreateNew(false);
    }
  }, [selectedCustomer, customerProjects.length]);

  useEffect(() => {
    if (submitted) {
      setErrors(validateForm(projectName, items, workCatalog));
    }
  }, [submitted, projectName, items, workCatalog]);

  const updateItem = (id, next) => setItems((prev) => prev.map((it) => (it.id === id ? next : it)));
  const removeItem = (id) => setItems((prev) => prev.filter((it) => it.id !== id));
  const addItem = () => setItems((prev) => [...prev, newWorkItem()]);

  const resetCustomerSelection = () => {
    setSelectedCustomerId("");
    setProjectName("");
    setPhone("");
    setShowCreateNew(false);
    setPhoneSavedMsg("");
  };

  const handleSave = async () => {
    setSubmitted(true);
    setSaveError("");
    const nextErrors = validateForm(projectName, items, workCatalog);
    setErrors(nextErrors);
    const titleMissing = !projectTitle.trim();
    setProjectTitleError(titleMissing);

    if (hasErrors(nextErrors) || titleMissing) {
      setSavedMsg("");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const confirmed = window.confirm("ยืนยันบันทึกข้อมูลหน้างานนี้ใช่หรือไม่?");
    if (!confirmed) return;

    setSaving(true);

    try {
      if (!selectedCustomer) {
        setSaveError("กรุณาเลือกลูกค้าก่อนบันทึก");
        window.scrollTo({ top: 0, behavior: "smooth" });
        setSaving(false);
        return;
      }
      const customer = selectedCustomer;

      const { data: projectRow, error: projectError } = await supabase
        .from("projects")
        .insert({
          customer_id: customer.customer_id,
          project_name: projectTitle.trim(),
          created_date: new Date(`${projectDate}T${new Date().toTimeString().slice(0, 8)}`).toISOString(),
          location: location.trim(),
          latitude,
          longitude,
        })
        .select()
        .single();

      if (projectError) throw projectError;

      await saveAllWorkItems(items, projectRow.project_id, workCatalog);

      onSaved();

      resetCustomerSelection();
      setLocation("");
      setLatitude(null);
      setLongitude(null);
      setProjectTitle("");
      setProjectDate(todayStr());
      setProjectTitleError(false);
      setItems([newWorkItem()]);
      setSubmitted(false);
      setErrors({ projectName: false, items: {} });
      setSavedMsg("บันทึกข้อมูลเรียบร้อย ดูรายการที่บันทึกได้ที่เมนู \"ลูกค้า\"");
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => setSavedMsg(""), 4000);
    } catch (err) {
      console.error("Save project failed:", err);
      setSaveError("บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  };

  // แสดงฟอร์มสร้างชิ้นงานเมื่อ: ยังไม่ได้เลือกลูกค้าเลย, เลือก "ลูกค้าใหม่", หรือกด "สร้างโครงงานใหม่" ให้ลูกค้าเดิม
  const showCreateForm = Boolean(selectedCustomer) && showCreateNew;
  const phoneUnchanged = phone.trim() === (selectedCustomer?.phone || "").trim();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-8">
      <div className="mb-6 flex items-center justify-between gap-3 border-b pb-4" style={{ borderColor: COLORS.border }}>
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: COLORS.charcoal }}>
            <Wrench size={17} color={COLORS.amber} />
          </span>
          <h1 className="text-lg font-bold" style={{ color: COLORS.charcoal }}>
            ฟอร์มจัดการข้อมูลหน้างานหลัก
          </h1>
        </div>
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

      {catalogLoading && (
        <div className="mb-6 rounded-lg border p-3 text-sm" style={{ borderColor: COLORS.border, color: COLORS.textMuted }}>
          กำลังโหลดรายการชิ้นงาน...
        </div>
      )}

      <div className="mb-4">
        <FieldLabel icon={Users} required>
          เลือกลูกค้า
        </FieldLabel>
        <CustomerSelect
          value={selectedCustomerId}
          onChange={handleCustomerChange}
          customers={customers}
          error={errors.projectName && selectedCustomerId === ""}
        />
        {errors.projectName && selectedCustomerId === "" && (
          <ErrorText>กรุณาเลือกลูกค้าก่อน (หากยังไม่มีในระบบ ไปที่เมนู "เพิ่มลูกค้า" ก่อน)</ErrorText>
        )}
      </div>

      {selectedCustomer && (
        <div className="mb-6 rounded-xl border overflow-hidden" style={{ borderColor: COLORS.border, background: COLORS.surface }}>
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: COLORS.border, background: "#FAF8F3" }}>
            <span className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: COLORS.charcoal }}>
              <Users size={14} style={{ color: COLORS.amber }} />
              {selectedCustomer.name}
              {selectedCustomer.phone && (
                <span className="flex items-center gap-1 text-xs font-normal" style={{ color: COLORS.textMuted }}>
                  <Phone size={11} />
                  {selectedCustomer.phone}
                </span>
              )}
              <span className="text-xs font-normal" style={{ color: COLORS.textMuted }}>
                · {customerProjects.length} โครงงาน
              </span>
            </span>
            <button
              type="button"
              onClick={resetCustomerSelection}
              className="flex items-center gap-1 text-xs font-medium"
              style={{ color: COLORS.textMuted }}
            >
              <X size={12} />
              เปลี่ยนลูกค้า
            </button>
          </div>

          <div className="p-4 border-b" style={{ borderColor: COLORS.border }}>
            <FieldLabel icon={Phone}>แก้ไขเบอร์โทรสำหรับโครงงานนี้ (ถ้าจำเป็น)</FieldLabel>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <TextInput type="tel" placeholder="" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <button
                type="button"
                onClick={handleSavePhone}
                disabled={savingPhone || !phone.trim() || phoneUnchanged}
                className="shrink-0 flex items-center gap-1.5 rounded-lg px-3.5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                style={{ background: COLORS.green }}
              >
                <Save size={14} />
                {savingPhone ? "กำลังบันทึก..." : "บันทึกเบอร์"}
              </button>
            </div>
            {phoneSavedMsg && (
              <p className="mt-1.5 text-xs font-medium" style={{ color: COLORS.green }}>
                {phoneSavedMsg}
              </p>
            )}
          </div>

          {customerProjects.length > 0 ? (
            <div className="divide-y" style={{ borderColor: COLORS.border }}>
              {customerProjects
                .slice()
                .sort((a, b) => new Date(b.updatedAt || b.savedAt) - new Date(a.updatedAt || a.savedAt))
                .map((p) => (
                  <ProjectCard
                    key={p.id}
                    project={p}
                    onUpdate={(updated) => onUpdateProject(p.id, updated)}
                    onDelete={() => onDeleteProject(p.id)}
                    workCatalog={workCatalog}
                    categoryOrder={categoryOrder}
                  />
                ))}
            </div>
          ) : (
            <div className="p-4 text-sm" style={{ color: COLORS.textMuted }}>
              ลูกค้ารายนี้ยังไม่มีโครงงานที่บันทึกไว้
            </div>
          )}

          <div className="flex items-center gap-2 border-t p-4" style={{ borderColor: COLORS.border }}>
            {!showCreateNew ? (
              <button
                type="button"
                onClick={() => setShowCreateNew(true)}
                className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium text-white"
                style={{ background: COLORS.green }}
              >
                <Plus size={15} />
                สร้างโครงงานใหม่ให้ลูกค้ารายนี้
              </button>
            ) : (
              customerProjects.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowCreateNew(false)}
                  className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium"
                  style={{ border: `1px solid ${COLORS.border}`, color: COLORS.charcoalSoft, background: "white" }}
                >
                  <X size={14} />
                  ยกเลิก กลับไปดูโครงงานเดิม
                </button>
              )
            )}
          </div>
        </div>
      )}

      {showCreateForm && (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel icon={Calendar} required>วันที่เพิ่มโครงงาน</FieldLabel>
              <TextInput type="date" value={projectDate} onChange={(e) => setProjectDate(e.target.value)} />
            </div>
            <div>
              <FieldLabel icon={Layers} required>ชื่อโครงงาน</FieldLabel>
              <TextInput
                value={projectTitle}
                onChange={(e) => { setProjectTitle(e.target.value); setProjectTitleError(false); }}
                error={projectTitleError}
              />
              {projectTitleError && <ErrorText>กรุณากรอกชื่อโครงงาน</ErrorText>}
            </div>
          </div>
          <div className="mb-6">
            <FieldLabel icon={MapPin}>สถานที่ / พิกัดที่ตั้ง</FieldLabel>
            <TextInput placeholder="" value={location} onChange={(e) => setLocation(e.target.value)} />
            <div className="mt-2">
              <LocationPicker
                latitude={latitude}
                longitude={longitude}
                onChange={({ latitude: lat, longitude: lng }) => {
                  setLatitude(lat);
                  setLongitude(lng);
                }}
              />
            </div>
          </div>

          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: COLORS.charcoal }}>
              <Layers size={15} style={{ color: COLORS.amber }} />
              ชิ้นงานที่ต้องการบันทึกข้อมูล
            </div>
            <button type="button" onClick={addItem} className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium text-white" style={{ background: COLORS.green }}>
              <Plus size={15} />
              เพิ่มชิ้นงานถัดไป
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item, idx) => (
              <WorkItemCard
                key={item.id}
                item={item}
                index={idx}
                onChange={(next) => updateItem(item.id, next)}
                onRemove={() => removeItem(item.id)}
                removable={items.length > 1}
                errors={errors.items[item.id] || {}}
                workCatalog={workCatalog}
                categoryOrder={categoryOrder}
              />
            ))}
          </div>

          <div className="mt-7 flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-sm transition-transform active:scale-95 hover:-translate-y-0.5 disabled:opacity-60"
              style={{ background: COLORS.charcoal }}
            >
              <Save size={16} style={{ color: COLORS.amber }} />
              {saving ? "กำลังบันทึก..." : "บันทึกข้อมูลและอัปเดตลงระบบหลัก"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}