import React, { useState, useMemo } from "react";
import { Wrench, Layers2, MapPin, Tag, Trash2, Layers, AlertCircle, Camera, CheckCircle2 } from "lucide-react";
import { FieldLabel, TextInput, Select, ErrorText } from "./ui.jsx";
import PhotoDropzone from "./PhotoDropzone.jsx";
import { isNoneValue, isFieldVisible } from "../lib/validation.js";
import { COLORS, SECTION } from "../lib/tokens.js";


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
            style={{
              borderColor: answerErrorCount > 0 ? COLORS.red : SECTION.detail.border,
              borderLeft: `4px solid ${answerErrorCount > 0 ? COLORS.red : SECTION.detail.accent}`,
              background: SECTION.detail.bg,
            }}
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
                      placeholder={field.options.length ? `-- เลือก${field.label} --` : "ยังไม่มีตัวเลือก (แจ้งผู้ดูแลระบบ)"}
                      error={errors.answers?.[field.key]}
                    />
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* รูปและรายละเอียดก่อนเริ่มงาน (Before) */}
        <div
          className="rounded-lg border p-4 space-y-3"
          style={{
            borderColor: errors.positionNote ? COLORS.red : SECTION.before.border,
            borderLeft: `4px solid ${errors.positionNote ? COLORS.red : SECTION.before.accent}`,
            background: SECTION.before.bg,
          }}
        >
          <div className="flex items-center justify-between">
            <FieldLabel icon={Camera} required iconColor={SECTION.before.accent}>
              ก่อนเริ่มงาน (Before) : ผังชี้ตำแหน่งและขนาดชิ้นงาน
            </FieldLabel>
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold"
              style={{ background: SECTION.before.badgeBg, color: SECTION.before.badgeText }}
            >
              <Camera size={11} />
              ก่อนทำ (Before)
            </span>
          </div>

          <PhotoDropzone
            tone={SECTION.before}
            label="รูปผังชี้ตำแหน่ง และ รูปขนาดชิ้นงานเดิม"
            hint="ถ่ายภาพหรือแนบรูปผังตำแหน่งติดตั้ง, สภาพหน้างานเดิม, และขนาดชิ้นงานก่อนทำ"
            photos={item.positionPhotos}
            onAdd={(list) => set({ positionPhotos: [...list, ...item.positionPhotos] })}
            onRemove={(id) => set({ positionPhotos: item.positionPhotos.filter((p) => p.id !== id) })}
            onReorder={(next) => set({ positionPhotos: next })}
          />
          <div>
            <FieldLabel icon={MapPin} required tone="amber">
              ระบุตำแหน่งติดตั้ง & ขนาดชิ้นงาน
            </FieldLabel>
            <TextInput
              placeholder="ระบุตำแหน่งและขนาด เช่น ห้องนอนชั้น 2 ผนังทิศเหนือ ขนาด 80x200 ซม."
              value={item.positionNote}
              onChange={(e) => set({ positionNote: e.target.value })}
              error={errors.positionNote}
            />
            {errors.positionNote && <ErrorText>กรุณาระบุตำแหน่งติดตั้งและขนาดชิ้นงาน</ErrorText>}
          </div>
          <textarea
            rows={2}
            placeholder="รายละเอียดผังตำแหน่ง / ขนาดชิ้นงานเพิ่มเติม (ถ้ามี)"
            value={item.positionDetail || ""}
            onChange={(e) => set({ positionDetail: e.target.value })}
            className="w-full rounded-lg border bg-white px-3.5 py-2.5 text-[15px] outline-none"
            style={{ borderColor: COLORS.border }}
          />
        </div>

        {/* รูปและผลงานหลังทำเสร็จ (After) */}
        <div
          className="rounded-lg border p-4 space-y-3"
          style={{
            borderColor: SECTION.after.border,
            borderLeft: `4px solid ${SECTION.after.accent}`,
            background: SECTION.after.bg,
          }}
        >
          <div className="flex items-center justify-between">
            <FieldLabel icon={CheckCircle2} iconColor={SECTION.after.accent}>
              หลังทำเสร็จ (After) : รูปผลงานและรายละเอียดหลังทำเสร็จ
            </FieldLabel>
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold"
              style={{ background: SECTION.after.badgeBg, color: SECTION.after.badgeText }}
            >
              <CheckCircle2 size={11} />
              หลังทำเสร็จ (After)
            </span>
          </div>

          <PhotoDropzone
            tone={SECTION.after}
            label="รูปผลงานหลังติดตั้งเสร็จสมบูรณ์"
            hint="ถ่ายภาพผลงานชิ้นงานจริงหลังทำเสร็จ เพื่อส่งมอบงานและเปรียบเทียบกับภาพก่อนทำ"
            photos={item.workPhotos}
            onAdd={(list) => set({ workPhotos: [...list, ...item.workPhotos] })}
            onRemove={(id) => set({ workPhotos: item.workPhotos.filter((p) => p.id !== id) })}
            onReorder={(next) => set({ workPhotos: next })}
          />
          <div>
            <FieldLabel icon={Tag} iconColor={SECTION.after.accent}>
              รายละเอียดผลงานหลังทำเสร็จ
            </FieldLabel>
            <TextInput
              placeholder="เช่น ติดตั้งเรียบร้อย, เก็บงานซิลิโคนขาวเนียน, ตรวจสอบการใช้งานปกติ"
              value={item.note || ""}
              onChange={(e) => set({ note: e.target.value })}
            />
          </div>
          <textarea
            rows={2}
            placeholder="รายละเอียดการส่งมอบงานเพิ่มเติม (ถ้ามี)"
            value={item.workDetail || ""}
            onChange={(e) => set({ workDetail: e.target.value })}
            className="w-full rounded-lg border bg-white px-3.5 py-2.5 text-[15px] outline-none"
            style={{ borderColor: COLORS.border }}
          />
        </div>
      </div>
    </div>
  );
}