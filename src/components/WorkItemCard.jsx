import React, { useState, useMemo } from "react";
import { Wrench, Layers2, MapPin, Tag, Trash2, Layers, AlertCircle } from "lucide-react";
import { COLORS } from "../lib/tokens.js";
import { FieldLabel, TextInput, Select, ErrorText, StatusSelect } from "./ui.jsx";
import PhotoDropzone from "./PhotoDropzone.jsx";
import { isNoneValue, isFieldVisible } from "../lib/validation.js";



export default function WorkItemCard({
  item,
  index,
  onChange,
  onRemove,
  removable,
  errors = {},
  workCatalog,
  categoryOrder,
}) {
  // จัดกลุ่มชื่อชิ้นงานย่อยตามหมวดหมู่ - คำนวณใหม่เฉพาะตอน catalog เปลี่ยน (เช่น โหลดเสร็จครั้งแรก)
  const workTypesByCategory = useMemo(() => {
    return categoryOrder.reduce((acc, category) => {
      acc[category] = Object.keys(workCatalog).filter((name) => workCatalog[name].category === category);
      return acc;
    }, {});
  }, [workCatalog, categoryOrder]);

  // หมวดหมู่ที่เลือกอยู่ - ตอนโหลดครั้งแรก (โหมดแก้ไข) ให้เดาจาก mainWork ที่มีอยู่แล้ว
  const [selectedCategory, setSelectedCategory] = useState(
    () => (item.mainWork && workCatalog[item.mainWork]?.category) || ""
  );

  const set = (patch) => onChange({ ...item, ...patch });

  const handleCategoryChange = (e) => {
    const category = e.target.value;
    setSelectedCategory(category);
    set({ mainWork: "", answers: {} });
  };

  const handleMainWorkChange = (e) => {
    set({ mainWork: e.target.value, answers: {} });
  };

  const setAnswer = (fieldKey, value) => {
    const next = { ...item.answers, [fieldKey]: value };
    // ถ้าเลือก "ไม่มี..." ให้ล้างค่าของช่องลูกทิ้ง (กันค่าเก่าค้างไปบันทึก)
    if (isNoneValue(value)) {
      catalogEntry?.fields.forEach((f) => {
        if (f.dependsOn === fieldKey) delete next[f.key];
      });
    }
    set({ answers: next });
  };



  const subTypeOptions = selectedCategory ? workTypesByCategory[selectedCategory] || [] : [];
  const catalogEntry = item.mainWork ? workCatalog[item.mainWork] : null;
  const answerErrorCount = errors.answers ? Object.keys(errors.answers).length : 0;
  const hasCardError = Boolean(errors.mainWork || errors.positionNote || answerErrorCount > 0);

  // แยก error: ถ้ายังไม่เลือกหมวดหมู่เลย ให้ error โชว์ที่ "หมวดหมู่งานหลัก"
  // ถ้าเลือกหมวดหมู่แล้วแต่ยังไม่เลือกชิ้นงานย่อย ให้ error โชว์ที่ "ชิ้นงานย่อย" เหมือนเดิม
  const categoryError = errors.mainWork && !selectedCategory;
  const subTypeError = errors.mainWork && Boolean(selectedCategory);
  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: hasCardError ? COLORS.red : COLORS.border, background: COLORS.surface }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: COLORS.border, background: "#FAF8F3" }}>
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold text-white" style={{ background: COLORS.charcoal }}>
            {index + 1}
          </span>
          <span className="text-sm font-semibold" style={{ color: COLORS.charcoal }}>
            ชิ้นงานย่อยรายการที่ {index + 1}
          </span>
          {hasCardError && (
            <span className="flex items-center gap-1 text-xs font-medium" style={{ color: COLORS.red }}>
              <AlertCircle size={12} />
              กรอกไม่ครบ
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <StatusSelect value={item.status} onChange={(e) => set({ status: e.target.value })} />
          {removable && (
            <button
              type="button"
              onClick={() => {
                const confirmed = window.confirm(
                  `ต้องการลบชิ้นงานย่อยรายการที่ ${index + 1} นี้ใช่ไหม? หากลบแล้วต้องกรอกข้อมูลใหม่ทั้งหมด`
                );
                if (confirmed) onRemove();
              }}
              className="flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-white"
              style={{ background: COLORS.red }}
            >
              <Trash2 size={12} />
              ลบข้อมูล
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <FieldLabel icon={Tag} tone="amber">ชื่อชิ้นงาน</FieldLabel>
          <TextInput
            placeholder="เช่น ประตูห้องนอนชั้น 2"
            value={item.itemName || ""}
            onChange={(e) => set({ itemName: e.target.value })}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel icon={Wrench} required tone="amber">
              หมวดหมู่งานหลัก
            </FieldLabel>
            <Select
              value={selectedCategory}
              onChange={handleCategoryChange}
              options={categoryOrder}
              placeholder="-- เลือกหมวดหมู่งาน --"
              error={categoryError}
            />
            {categoryError && <ErrorText>กรุณาเลือกหมวดหมู่งานหลัก</ErrorText>}
          </div>
          <div>
            <FieldLabel icon={Layers2} required tone="amber">
              ชิ้นงานย่อย
            </FieldLabel>
            <Select
              value={item.mainWork}
              onChange={handleMainWorkChange}
              options={subTypeOptions}
              placeholder={selectedCategory ? "-- เลือกชิ้นงานย่อย --" : "-- เลือกหมวดหมู่ก่อน --"}
              error={subTypeError}
            />
            {subTypeError && <ErrorText>กรุณาเลือกชิ้นงานย่อย</ErrorText>}
          </div>
        </div>

        {catalogEntry && (
          <div
            className="rounded-lg border p-4"
            style={{ borderColor: answerErrorCount > 0 ? COLORS.red : COLORS.border, background: "#FCFBF8" }}
          >
            <div className="flex items-center gap-1.5 text-sm font-medium mb-3" style={{ color: COLORS.charcoal }}>
              <Layers size={14} style={{ color: COLORS.amber }} />
              รายละเอียด/วัสดุของ "{item.mainWork}"
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {catalogEntry.fields
                .filter((field) => isFieldVisible(field, item.answers))
                .map((field) => (
                  <div key={field.key}>
                    <FieldLabel required tone="amber">{field.label}</FieldLabel>
                    <Select
                      value={item.answers?.[field.key] || ""}
                      onChange={(e) => setAnswer(field.key, e.target.value)}
                      options={field.options}
                      placeholder={`-- เลือก${field.label} --`}
                      error={errors.answers?.[field.key]}
                    />
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* รายละเอียดหน้างาน (เดิมคือ ระบุตำแหน่งติดตั้ง) */}
        <div className="rounded-lg border p-4 space-y-3" style={{ borderColor: errors.positionNote ? COLORS.red : COLORS.border }}>
          <FieldLabel icon={MapPin} required tone="amber">
            รายละเอียดหน้างาน
          </FieldLabel>
          <TextInput
            placeholder="ระบุตำแหน่งติดตั้ง เช่น ห้องนอนชั้น 2 ผนังด้านทิศเหนือ"
            value={item.positionNote}
            onChange={(e) => set({ positionNote: e.target.value })}
            error={errors.positionNote}
          />
          {errors.positionNote && <ErrorText>กรุณาระบุรายละเอียดหน้างาน</ErrorText>}
          <PhotoDropzone
            label="ถ่ายภาพหรือเลือกรูปผังชี้ตำแหน่ง (เลือกได้หลายรูป)"
            photos={item.positionPhotos}
            onAdd={(list) => set({ positionPhotos: [...list, ...item.positionPhotos] })}
            onRemove={(id) => set({ positionPhotos: item.positionPhotos.filter((p) => p.id !== id) })}
            onReorder={(next) => set({ positionPhotos: next })}
          />
        </div>

        {/* รายละเอียดชิ้นงาน (เดิมคือ รูปถ่ายหน้างาน / ขนาดชิ้นงาน) */}
        <div className="rounded-lg border p-4 space-y-3" style={{ borderColor: COLORS.border }}>
          <FieldLabel icon={Tag}>รายละเอียดชิ้นงาน</FieldLabel>
          <TextInput
            placeholder="เช่น ขนาด 80x200 ซม., สีขาวด้าน"
            value={item.note || ""}
            onChange={(e) => set({ note: e.target.value })}
          />
          <PhotoDropzone
            label="รูปประกอบรายละเอียดชิ้นงาน"
            hint="ถ่ายรูปหรือเลือกรูปจากคลังภาพ เพื่อแสดงรายละเอียดและขนาดของชิ้นงาน"
            photos={item.workPhotos}
            onAdd={(list) => set({ workPhotos: [...list, ...item.workPhotos] })}
            onRemove={(id) => set({ workPhotos: item.workPhotos.filter((p) => p.id !== id) })}
            onReorder={(next) => set({ workPhotos: next })}
          />
        </div>
      </div>
    </div>
  );
}