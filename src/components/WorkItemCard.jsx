import React, { useState, useMemo } from "react";
import { Wrench, Layers2, MapPin, Tag, Trash2, Layers, AlertCircle } from "lucide-react";
import { COLORS } from "../lib/tokens.js";
import { FieldLabel, TextInput, Select, ErrorText } from "./ui.jsx";
import PhotoDropzone from "./PhotoDropzone.jsx";

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
    set({ answers: { ...item.answers, [fieldKey]: value } });
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

      <div className="p-4 space-y-4">
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
              {catalogEntry.fields.map((field) => (
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

        <PhotoDropzone
          label="รูปถ่ายหน้างาน / ขนาดชิ้นงาน"
          hint="กดปุ่มด้านล่างเพื่อเลือกรูปภาพจากคลัง หรือเปิดกล้องมือถือถ่ายเพื่อรายงานหน้างาน"
          photos={item.workPhotos}
          onAdd={(list) => set({ workPhotos: [...list, ...item.workPhotos] })}
          onRemove={(id) => set({ workPhotos: item.workPhotos.filter((p) => p.id !== id) })}
          onReorder={(next) => set({ workPhotos: next })}
        />

        <div className="rounded-lg border p-4 space-y-3" style={{ borderColor: errors.positionNote ? COLORS.red : COLORS.border }}>
          <FieldLabel icon={MapPin} required tone="amber">
            ระบุตำแหน่งติดตั้ง (พิมพ์ข้อความ + เลือก/ถ่ายรูปแผนผังได้หลายรูป)
          </FieldLabel>
          <TextInput
            placeholder=""
            value={item.positionNote}
            onChange={(e) => set({ positionNote: e.target.value })}
            error={errors.positionNote}
          />
          {errors.positionNote && <ErrorText>กรุณาระบุตำแหน่งติดตั้ง</ErrorText>}
          <PhotoDropzone
            label="ถ่ายภาพหรือเลือกรูปผังชี้ตำแหน่ง (เลือกได้หลายรูป)"
            photos={item.positionPhotos}
            onAdd={(list) => set({ positionPhotos: [...list, ...item.positionPhotos] })}
            onRemove={(id) => set({ positionPhotos: item.positionPhotos.filter((p) => p.id !== id) })}
            onReorder={(next) => set({ positionPhotos: next })}
          />
        </div>

        <div>
          <FieldLabel icon={Tag}>หมายเหตุเพิ่มเติม</FieldLabel>
          <TextInput placeholder="" value={item.note} onChange={(e) => set({ note: e.target.value })} />
        </div>
      </div>
    </div>
  );
}