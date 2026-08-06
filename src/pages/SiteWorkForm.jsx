import React, { useState, useEffect } from "react";
import { Wrench, Plus, MapPin, Layers, Save, AlertCircle } from "lucide-react";
import { COLORS } from "../lib/tokens.js";
import { FieldLabel, TextInput, ErrorText } from "../components/ui.jsx";
import WorkItemCard from "../components/WorkItemCard.jsx";
import { validateForm, hasErrors, buildErrorMessages } from "../lib/validation.js";
import SuccessBurst from "../components/SuccessBurst.jsx";
import { supabase } from "../lib/supabase.js";

let itemCounter = 1;
function newWorkItem() {
  return {
    id: `item-${Date.now()}-${itemCounter++}`,
    mainWork: "",
    answers: {},
    positionNote: "",
    positionPhotos: [],
    workPhotos: [],
    note: "",
  };
}

export default function SiteWorkForm({ onSaved, workCatalog, categoryOrder, catalogLoading }) {
  const [projectName, setProjectName] = useState("");
  const [location, setLocation] = useState("");
  const [items, setItems] = useState([newWorkItem()]);
  const [savedMsg, setSavedMsg] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({ projectName: false, items: {} });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (submitted) {
      setErrors(validateForm(projectName, items, workCatalog));
    }
  }, [submitted, projectName, items, workCatalog]);

  const updateItem = (id, next) => setItems((prev) => prev.map((it) => (it.id === id ? next : it)));
  const removeItem = (id) => setItems((prev) => prev.filter((it) => it.id !== id));
  const addItem = () => setItems((prev) => [...prev, newWorkItem()]);

  const errorMessages = buildErrorMessages(errors, items, workCatalog);

  const handleSave = async () => {
    setSubmitted(true);
    setSaveError("");
    const nextErrors = validateForm(projectName, items, workCatalog);
    setErrors(nextErrors);

    if (hasErrors(nextErrors)) {
      setSavedMsg("");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const confirmed = window.confirm("ยืนยันบันทึกข้อมูลหน้างานนี้ใช่หรือไม่?");
    if (!confirmed) return;

    setSaving(true);

    setSaving(true);

    try {
      const { data: projectRow, error: projectError } = await supabase
        .from("projects")
        .insert({
          customer_name: projectName.trim(),
          location: location.trim(),
        })
        .select()
        .single();

      if (projectError) throw projectError;

      const workItemsPayload = items.map((item, idx) => ({
        project_id: projectRow.id,
        main_work: item.mainWork,
        answers: item.answers,
        position_note: item.positionNote,
        note: item.note,
        sort_order: idx,
      }));

      const { error: itemsError } = await supabase.from("work_items").insert(workItemsPayload);

      if (itemsError) throw itemsError;

      // TODO (step 4): อัปโหลด positionPhotos/workPhotos ขึ้น Supabase Storage

      onSaved();

      setProjectName("");
      setLocation("");
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

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel required>ชื่อโครงการ / ข้อมูลลูกค้า</FieldLabel>
          <TextInput
            placeholder=""
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            error={errors.projectName}
          />
          {errors.projectName && <ErrorText>กรุณากรอกชื่อโครงการ / ข้อมูลลูกค้า</ErrorText>}
        </div>
        <div>
          <FieldLabel icon={MapPin}>สถานที่ / พิกัดที่ตั้ง</FieldLabel>
          <TextInput placeholder="" value={location} onChange={(e) => setLocation(e.target.value)} />
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
    </div>
  );
}