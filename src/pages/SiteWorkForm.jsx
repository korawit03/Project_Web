import React, { useState, useEffect } from "react";
import { COLORS } from "../lib/tokens.js";
import { FieldLabel, TextInput, ErrorText, LocationSelect } from "../components/ui.jsx";
import WorkItemCard from "../components/WorkItemCard.jsx";
import ProjectCard from "../components/ProjectCard.jsx";
import { validateForm, hasErrors } from "../lib/validation.js";
import SuccessBurst from "../components/SuccessBurst.jsx";
import { supabase } from "../lib/supabase.js";
import { saveAllWorkItems } from "../lib/jobItems.js";
import {
  Wrench,
  Plus,
  Layers,
  Save,
  AlertCircle,
  Phone,
  Users,
  X,
  Calendar,
  MapPin,
  Sparkles,
  RotateCcw,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { DEFAULT_STATUS } from "../lib/status.js";
import { saveFormDraft, getFormDraft, clearFormDraft, formatDraftTime } from "../lib/draftStorage.js";


let itemCounter = 1;
//newWorkItem(): สร้าง Object ชิ้นงานย่อยใหม่ โดยใช้ Date.now() ร่วมกับ itemCounter++ เพื่อสร้าง Unique ID ฝั่ง Frontend
function newWorkItem() {
  return {
    id: `item-${Date.now()}-${itemCounter++}`,
    mainWork: "",
    answers: {},
    itemName: "",
    positionNote: "",
    positionDetail: "",
    workDetail: "",
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
  projects,
  onUpdateProject,
  onDeleteProject,
}) {
  // selectedCustomerId เก็บค่า 3 แบบ: "" (ยังไม่เลือก), NEW_CUSTOMER_VALUE (ลูกค้าใหม่), หรือ customer_id จริง
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [projectName, setProjectName] = useState("");
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
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [locationError, setLocationError] = useState(false);
  const [draftAvailable, setDraftAvailable] = useState(null);
  const [lastAutoSavedTime, setLastAutoSavedTime] = useState(null);

  // ตรวจสอบแบบร่างที่บันทึกค้างไว้เมื่อโหลดหน้าเว็บ
  useEffect(() => {
    let active = true;
    getFormDraft().then((draft) => {
      if (active && draft) {
        setDraftAvailable(draft);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // กู้คืนข้อมูลจากแบบร่าง
  const handleRestoreDraft = () => {
    if (!draftAvailable) return;
    setSelectedCustomerId(draftAvailable.selectedCustomerId || "");
    setProjectName(draftAvailable.projectName || "");
    setProjectTitle(draftAvailable.projectTitle || "");
    setProjectDate(draftAvailable.projectDate || todayStr());
    setSelectedLocationId(draftAvailable.selectedLocationId || "");
    setShowCreateNew(draftAvailable.showCreateNew ?? true);
    if (draftAvailable.items && draftAvailable.items.length > 0) {
      setItems(draftAvailable.items);
    }
    setLastAutoSavedTime(draftAvailable.savedAt);
    setDraftAvailable(null);
  };

  // ลบทิ้งแบบร่าง
  const handleDiscardDraft = async () => {
    await clearFormDraft();
    setDraftAvailable(null);
    setLastAutoSavedTime(null);
  };

  // Auto-save อัตโนมัติ (หน่วงเวลา 1.2 วินาทีหลังจากพิมพ์)
  useEffect(() => {
    if (draftAvailable) return;

    const timer = setTimeout(async () => {
      const draftData = {
        selectedCustomerId,
        projectName,
        projectTitle,
        projectDate,
        selectedLocationId,
        showCreateNew,
        items,
      };
      const saved = await saveFormDraft(draftData);
      if (saved) {
        setLastAutoSavedTime(Date.now());
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [
    selectedCustomerId,
    projectName,
    projectTitle,
    projectDate,
    selectedLocationId,
    showCreateNew,
    items,
    draftAvailable,
  ]);

  const selectedCustomer = customers.find((c) => String(c.customer_id) === String(selectedCustomerId)) || null;
  const customerLocations = selectedCustomer?.locations || [];
  const selectedLocation =
    customerLocations.find((l) => String(l.location_id) === String(selectedLocationId)) || null;

  function todayStr() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }

  // พอเลือกลูกค้าจาก dropdown เปลี่ยน -> เติมชื่อ/เบอร์ให้อัตโนมัติ (กรณีลูกค้าเดิม) หรือเคลียร์ให้กรอกใหม่ (กรณีลูกค้าใหม่)
  const handleCustomerChange = (e) => {
    const value = e.target.value;
    setSelectedCustomerId(value);
    const c = customers.find((cust) => String(cust.customer_id) === String(value));
    setProjectName(c?.name || "");
    setShowCreateNew(false);
    setSelectedLocationId("");
    setLocationError(false);
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
    setShowCreateNew(false);
    setSelectedLocationId("");
    setLocationError(false);
  };
  //ตรวจความถูกต้อง → ยืนยัน → insert ลงตาราง projects 
  const handleSave = async () => {
    setSubmitted(true);
    setSaveError("");
    const nextErrors = validateForm(projectName, items, workCatalog); //ตรวจทุก WorkItemCard
    setErrors(nextErrors);
    const titleMissing = !projectTitle.trim();
    setProjectTitleError(titleMissing);
    const locationMissing = !selectedLocation;
    setLocationError(locationMissing);

    if (hasErrors(nextErrors) || titleMissing || locationMissing) {
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

      //บันทึกข้อมูลลงตาราง projects
      const { data: projectRow, error: projectError } = await supabase
        .from("projects")
        .insert({
          customer_id: customer.customer_id,
          project_name: projectTitle.trim(),
          location_id: selectedLocation.location_id,
          location: selectedLocation.name,
          latitude: selectedLocation.latitude ?? null,
          longitude: selectedLocation.longitude ?? null,
          created_date: new Date(`${projectDate}T${new Date().toTimeString().slice(0, 8)}`).toISOString(),
        })
        .select()
        .single();
        
      if (projectError) throw projectError;
      
      //บันทึกชิ้นงานและรูป → ล้างฟอร์ม
      await saveAllWorkItems(items, projectRow.project_id, workCatalog);

      await clearFormDraft();
      setLastAutoSavedTime(null);
      setDraftAvailable(null);

      onSaved();

      resetCustomerSelection();
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

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b pb-4" style={{ borderColor: COLORS.border }}>
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: COLORS.charcoal }}>
            <Wrench size={17} color={COLORS.amber} />
          </span>
          <div>
            <h1 className="text-lg font-bold" style={{ color: COLORS.charcoal }}>
              ฟอร์มจัดการข้อมูลหน้างานหลัก
            </h1>
            {lastAutoSavedTime && (
              <p className="flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                <CheckCircle2 size={11} className="text-emerald-600" />
                <span>บันทึกแบบร่างอัตโนมัติแล้ว ({formatDraftTime(lastAutoSavedTime)})</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {draftAvailable && (
        <div
          className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-4 shadow-xs"
          style={{ background: "#F0FDF4", borderColor: "#86EFAC" }}
        >
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <Sparkles size={16} />
            </span>
            <div>
              <h4 className="text-sm font-bold text-emerald-950">
                พบข้อมูลแบบร่างที่บันทึกค้างไว้
              </h4>
              <p className="text-xs text-emerald-800">
                บันทึกเมื่อ {formatDraftTime(draftAvailable.savedAt)}
                {draftAvailable.projectTitle ? ` · โครงงาน: "${draftAvailable.projectTitle}"` : ""}
                {draftAvailable.items?.length ? ` · ชิ้นงาน ${draftAvailable.items.length} รายการ` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleRestoreDraft}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
            >
              <RotateCcw size={13} />
              กู้คืนข้อมูล
            </button>
            <button
              type="button"
              onClick={handleDiscardDraft}
              className="flex items-center gap-1 rounded-lg border border-emerald-300 bg-white hover:bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-800 transition-colors cursor-pointer"
            >
              <Trash2 size={13} />
              ลบทิ้ง
            </button>
          </div>
        </div>
      )}

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
            
          </div>

          {customerProjects.length > 0 ? (
            <div className="divide-y" style={{ borderColor: COLORS.border }}>
              {customerProjects
                .slice()
                .sort((a, b) => new Date(b.updatedAt || b.savedAt) - new Date(a.updatedAt || a.savedAt))
                .map((p) => (
                  // ProjectCard: แสดงโครงงานของลูกค้าแต่ละรายการ พร้อมปุ่มแก้ไข/ลบ
                  <ProjectCard
                    key={p.id}
                    project={p}
                    onUpdate={(updated) => onUpdateProject(p.id, updated)}
                    onDelete={() => onDeleteProject(p.id)}
                    workCatalog={workCatalog}
                    categoryOrder={categoryOrder}
                    locations={customerLocations}
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
            <FieldLabel icon={MapPin} required>สถานที่หน้างาน</FieldLabel>
            {customerLocations.length === 0 ? (
              <p className="rounded-lg border p-3 text-sm" style={{ borderColor: COLORS.red, background: "#FDECEC", color: COLORS.red }}>
                ลูกค้ารายนี้ยังไม่มีสถานที่ กรุณาไปเพิ่มที่เมนู "ลูกค้า &gt; รายละเอียดลูกค้า" ก่อน
              </p>
            ) : (
              <>
                <LocationSelect
                  value={selectedLocationId}
                  onChange={(e) => { setSelectedLocationId(e.target.value); setLocationError(false); }}
                  locations={customerLocations}
                  error={locationError}
                />
                {locationError && <ErrorText>กรุณาเลือกสถานที่หน้างาน</ErrorText>}
              </>
            )}
          </div>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: COLORS.charcoal }}>
              <Layers size={15} style={{ color: COLORS.amber }} />
              ชิ้นงานที่ต้องการบันทึกข้อมูล
            </div>
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
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium text-white"
              style={{ background: COLORS.green }}
            >
              <Plus size={15} />
              เพิ่มชิ้นงานถัดไป
            </button>
          </div>

          <div className="mt-7 flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || customerLocations.length === 0}
              className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-sm transition-transform active:scale-95 hover:-translate-y-0.5 disabled:opacity-60"
              style={{ background: COLORS.charcoal }}
            >
              <Save size={16} style={{ color: COLORS.amber }} />
              {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}