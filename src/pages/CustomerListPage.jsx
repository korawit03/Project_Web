import React, { useState } from "react";
import { Users, MapPin, Layers, Clock, ClipboardList, Pencil, X, Save, AlertCircle, Plus, Trash2, History } from "lucide-react";
import { COLORS } from "../lib/tokens.js";
import { FieldLabel, TextInput, ErrorText } from "../components/ui.jsx";
import WorkItemCard from "../components/WorkItemCard.jsx";
import { validateForm, hasErrors, buildErrorMessages } from "../lib/validation.js";

let editItemCounter = 1;
function newWorkItem() {
  return {
    id: `edit-item-${Date.now()}-${editItemCounter++}`,
    mainWork: "",
    answers: {},
    positionNote: "",
    positionPhotos: [],
    workPhotos: [],
    note: "",
  };
}

// การ์ดรายการโครงการ 1 รายการ - สลับได้ระหว่าง "โหมดแสดงผล" กับ "โหมดแก้ไข"
function ProjectCard({ project, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [customerName, setCustomerName] = useState(project.customerName);
  const [location, setLocation] = useState(project.location);
  const [items, setItems] = useState(project.items);
  const [errors, setErrors] = useState({ projectName: false, items: {} });
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    setCustomerName(project.customerName);
    setLocation(project.location);
    setItems(project.items);
    setErrors({ projectName: false, items: {} });
    setEditing(true);
  };

  const cancelEdit = () => setEditing(false);

  const updateItem = (id, next) => setItems((prev) => prev.map((it) => (it.id === id ? next : it)));
  const removeItem = (id) => setItems((prev) => prev.filter((it) => it.id !== id));
  const addItem = () => setItems((prev) => [...prev, newWorkItem()]);

  const errorMessages = buildErrorMessages(errors, items);

  const handleSaveEdit = async () => {
    const nextErrors = validateForm(customerName, items);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    setSaving(true);
    const success = await onUpdate({
      ...project,
      customerName: customerName.trim(),
      location: location.trim(),
      items,
    });
    setSaving(false);

    // ปิดโหมดแก้ไขเฉพาะตอนบันทึกสำเร็จ ถ้าล้มเหลวให้ค้างในโหมดแก้ไขไว้ (error alert เด้งจาก App.jsx แล้ว)
    if (success) setEditing(false);
  };

  const handleDelete = () => {
    const confirmed = window.confirm(`ต้องการลบรายการบันทึกนี้ของ "${project.customerName}" ใช่ไหม? การลบไม่สามารถย้อนกลับได้`);
    if (confirmed) onDelete();
  };

  // มีการแก้ไขเกิดขึ้นจริงหรือยัง (เวลาต่างจากตอนสร้างครั้งแรก)
  const wasEdited = project.updatedAt && project.updatedAt !== project.savedAt;

  // ---------- โหมดแสดงผลปกติ ----------
  if (!editing) {
    return (
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs" style={{ color: COLORS.textMuted }}>
            {project.location && (
              <span className="flex items-center gap-1">
                <MapPin size={12} />
                {project.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock size={12} />
              บันทึกเมื่อ {new Date(project.savedAt).toLocaleString("th-TH")}
            </span>
            {wasEdited && (
              <span className="flex items-center gap-1" style={{ color: COLORS.amberDark }}>
                <History size={12} />
                อัปเดตล่าสุด {new Date(project.updatedAt).toLocaleString("th-TH")}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Layers size={12} />
              {project.items.length} ชิ้นงาน
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={startEdit}
              className="flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium"
              style={{ border: `1px solid ${COLORS.border}`, color: COLORS.charcoalSoft, background: "white" }}
            >
              <Pencil size={12} />
              แก้ไข
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-white"
              style={{ background: COLORS.red }}
            >
              <Trash2 size={12} />
              ลบ
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {project.items.map((it, idx) => (
            <span
              key={it.id}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium"
              style={{ background: "rgba(232,149,28,0.12)", color: COLORS.amberDark }}
            >
              <ClipboardList size={11} />
              {it.mainWork || `ชิ้นงานที่ ${idx + 1} (ยังไม่ระบุ)`}
            </span>
          ))}
        </div>
      </div>
    );
  }

  // ---------- โหมดแก้ไข: แก้ได้ครบทุกอย่างเหมือนฟอร์มกรอกข้อมูลหลัก ----------
  return (
    <div className="p-4 space-y-4" style={{ background: "#FCFBF8" }}>
      {errorMessages.length > 0 && (
        <div className="rounded-lg border p-3" style={{ borderColor: COLORS.red, background: "#FDECEC" }}>
          <p className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold" style={{ color: COLORS.red }}>
            <AlertCircle size={14} />
            กรุณากรอกข้อมูลให้ครบก่อนบันทึก ({errorMessages.length} จุด)
          </p>
          <ul className="ml-1 space-y-1 text-xs" style={{ color: COLORS.red }}>
            {errorMessages.map((msg, i) => (
              <li key={i}>• {msg}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel required>ชื่อโครงการ / ข้อมูลลูกค้า</FieldLabel>
          <TextInput value={customerName} onChange={(e) => setCustomerName(e.target.value)} error={errors.projectName} />
          {errors.projectName && <ErrorText>กรุณากรอกชื่อโครงการ / ข้อมูลลูกค้า</ErrorText>}
        </div>
        <div>
          <FieldLabel icon={MapPin}>สถานที่ / พิกัดที่ตั้ง</FieldLabel>
          <TextInput value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: COLORS.charcoal }}>
          <Layers size={15} style={{ color: COLORS.amber }} />
          ชิ้นงาน
        </div>
        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white"
          style={{ background: COLORS.green }}
        >
          <Plus size={13} />
          เพิ่มชิ้นงาน
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
          />
        ))}
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={handleSaveEdit}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          style={{ background: COLORS.charcoal }}
        >
          <Save size={14} style={{ color: COLORS.amber }} />
          {saving ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
        </button>
        <button
          type="button"
          onClick={cancelEdit}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60"
          style={{ border: `1px solid ${COLORS.border}`, color: COLORS.charcoalSoft, background: "white" }}
        >
          <X size={14} />
          ยกเลิก
        </button>
      </div>
    </div>
  );
}

export default function CustomerListPage({ projects, loading, onUpdateProject, onDeleteProject }) {
  const grouped = projects.reduce((acc, p) => {
    const key = p.customerName || "(ไม่ระบุชื่อ)";
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  const customerNames = Object.keys(grouped).sort((a, b) => {
    const latestA = Math.max(...grouped[a].map((p) => new Date(p.updatedAt || p.savedAt).getTime()));
    const latestB = Math.max(...grouped[b].map((p) => new Date(p.updatedAt || p.savedAt).getTime()));
    return latestB - latestA;
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-8">
      <div className="mb-6 flex items-center gap-2.5 border-b pb-4" style={{ borderColor: COLORS.border }}>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: COLORS.charcoal }}>
          <Users size={17} color={COLORS.amber} />
        </span>
        <h1 className="text-lg font-bold" style={{ color: COLORS.charcoal }}>
          รายการลูกค้าที่บันทึกไว้
        </h1>
      </div>

      {loading && projects.length === 0 ? (
        <div className="rounded-xl border p-10 text-center" style={{ borderColor: COLORS.border, background: COLORS.surface }}>
          <p className="text-sm" style={{ color: COLORS.textMuted }}>
            กำลังโหลดข้อมูล...
          </p>
        </div>
      ) : customerNames.length === 0 ? (
        <div className="rounded-xl border p-10 text-center" style={{ borderColor: COLORS.border, background: COLORS.surface }}>
          <Users
            size={40}
            className="mx-auto mb-3"
            style={{ color: COLORS.amber, animation: "gentle-bounce 2.2s ease-in-out infinite" }}
          />
          <p className="text-sm" style={{ color: COLORS.textMuted }}>
            ยังไม่มีข้อมูลลูกค้าที่บันทึกไว้ ลองไปกรอกฟอร์ม "โครงงาน" แล้วกดบันทึกดูก่อนได้เลย
          </p>
          <style>{`
            @keyframes gentle-bounce {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-6px); }
            }
          `}</style>
        </div>
      ) : (
        <div className="space-y-6">
          {customerNames.map((name) => (
            <div key={name} className="rounded-xl border overflow-hidden" style={{ borderColor: COLORS.border, background: COLORS.surface }}>
              <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: COLORS.border, background: "#FAF8F3" }}>
                <Users size={15} style={{ color: COLORS.amber }} />
                <span className="text-sm font-semibold" style={{ color: COLORS.charcoal }}>
                  {name}
                </span>
                <span className="ml-auto text-xs" style={{ color: COLORS.textMuted }}>
                  {grouped[name].length} รายการบันทึก
                </span>
              </div>

              <div className="divide-y" style={{ borderColor: COLORS.border }}>
                {grouped[name]
                  .slice()
                  .sort((a, b) => new Date(b.updatedAt || b.savedAt) - new Date(a.updatedAt || a.savedAt))
                  .map((p) => (
                    <ProjectCard
                      key={p.id}
                      project={p}
                      onUpdate={(updated) => onUpdateProject(p.id, updated)}
                      onDelete={() => onDeleteProject(p.id)}
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}