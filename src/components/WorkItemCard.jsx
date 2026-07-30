import React from "react";
import { Wrench, MapPin, Tag, Trash2, Layers, AlertCircle } from "lucide-react";
import { COLORS } from "../lib/tokens.js";
import { WORK_CATALOG, CATEGORY_ORDER } from "../lib/options.js";
import { FieldLabel, TextInput, Select, GroupedSelect, ErrorText } from "./ui.jsx";
import PhotoDropzone from "./PhotoDropzone.jsx";

const MAIN_WORK_GROUPS = CATEGORY_ORDER.map((category) => ({
  label: category,
  options: Object.keys(WORK_CATALOG).filter((name) => WORK_CATALOG[name].category === category),
}));

export default function WorkItemCard({ item, index, onChange, onRemove, removable, errors = {} }) {
  const set = (patch) => onChange({ ...item, ...patch });

  const handleMainWorkChange = (e) => {
    set({ mainWork: e.target.value, answers: {} });
  };

  const setAnswer = (fieldKey, value) => {
    set({ answers: { ...item.answers, [fieldKey]: value } });
  };

  const catalogEntry = item.mainWork ? WORK_CATALOG[item.mainWork] : null;
  const answerErrorCount = errors.answers ? Object.keys(errors.answers).length : 0;
  const hasCardError = Boolean(errors.mainWork || errors.positionNote || answerErrorCount > 0);

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
            onClick={onRemove}
            className="flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-white"
            style={{ background: COLORS.red }}
          >
            <Trash2 size={12} />
            ลบข้อมูล
          </button>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* 1) เลือกชิ้นงานหลักก่อน */}
        <div>
          <FieldLabel icon={Wrench} required tone="amber">
            เลือกชิ้นงานหลัก
          </FieldLabel>
          <GroupedSelect
            value={item.mainWork}
            onChange={handleMainWorkChange}
            groups={MAIN_WORK_GROUPS}
            placeholder="-- เลือกชิ้นงานช่าง --"
            error={errors.mainWork}
          />
          {errors.mainWork && <ErrorText>กรุณาเลือกชิ้นงานหลัก</ErrorText>}
        </div>

        {/* 2) รายละเอียด/วัสดุ - ทุกช่องบังคับกรอก มีกรอบแดงถ้ายังไม่เลือก */}
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

        {/* 3) ตำแหน่งติดตั้ง */}
        <div className="rounded-lg border p-4 space-y-3" style={{ borderColor: errors.positionNote ? COLORS.red : COLORS.border }}>
          <FieldLabel icon={MapPin} required tone="amber">
            ระบุตำแหน่งติดตั้ง (พิมพ์ข้อความ + เลือก/ถ่ายรูปแผนผังได้หลายรูป)
          </FieldLabel>
          <TextInput
            placeholder="เช่น ผนังห้องนอนฝั่งทิศได้"
            value={item.positionNote}
            onChange={(e) => set({ positionNote: e.target.value })}
            error={errors.positionNote}
          />
          {errors.positionNote && <ErrorText>กรุณาระบุตำแหน่งติดตั้ง</ErrorText>}
          <PhotoDropzone
            label="ถ่ายภาพหรือเลือกรูปผังชี้ตำแหน่ง (เลือกได้หลายรูป)"
            photos={item.positionPhotos}
            onAdd={(list) => set({ positionPhotos: [...item.positionPhotos, ...list] })}
            onRemove={(id) => set({ positionPhotos: item.positionPhotos.filter((p) => p.id !== id) })}
          />
        </div>

        <PhotoDropzone
          label="รูปถ่ายหน้างาน / ผลงานจริง (แนบไฟล์หรือเปิดกล้องถ่ายภาพได้หลายรูป)"
          hint="กดปุ่มด้านล่างเพื่อเลือกรูปภาพจากคลัง หรือเปิดกล้องมือถือถ่ายเพื่อรายงานหน้างาน"
          photos={item.workPhotos}
          onAdd={(list) => set({ workPhotos: [...item.workPhotos, ...list] })}
          onRemove={(id) => set({ workPhotos: item.workPhotos.filter((p) => p.id !== id) })}
        />

        {/* หมายเหตุเพิ่มเติม - ไม่บังคับ ไม่มีกรอบแดง */}
        <div>
          <FieldLabel icon={Tag}>หมายเหตุเพิ่มเติม</FieldLabel>
          <TextInput placeholder="กรอกข้อความระบุรายละเอียดพิเศษชิ้นงานย่อย (ถ้ามี)" value={item.note} onChange={(e) => set({ note: e.target.value })} />
        </div>
      </div>
    </div>
  );
}