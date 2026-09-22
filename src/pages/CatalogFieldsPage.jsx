import React, { useState, useCallback } from "react";
import { SlidersHorizontal, Plus } from "lucide-react";
import { COLORS } from "../lib/tokens.js";
import {
  PK,
  useCatalogAdmin,
  useAdminAction,
  addField,
  renameField,
  setFieldDependsOn,
  assertCanDisableField,
  wouldCycle,
  setActive,
  reorderRows,
  movedIds,
} from "../lib/catalogAdmin.js";
import { FieldLabel, TextInput } from "../components/ui.jsx";
import { AdminHeader, Card, Notice, EditableList, CascadePicker, PlainSelect } from "../components/CatalogAdminUI.jsx";

// 2.2 รายละเอียดชิ้นงาน: ช่องที่ช่างต้องเลือก เช่น สีอลูมิเนียม, มีกระจกไหม, สีกระจก
export default function CatalogFieldsPage({ onChanged }) {
  const { catalog, loading, loadError, reload } = useCatalogAdmin();
  const afterChange = useCallback(async () => {
    await reload();
    onChanged?.();
  }, [reload, onChanged]);
  const { busy, msg, run } = useAdminAction(afterChange);

  const [sel, setSel] = useState({ categoryId: "", typeId: "", fieldId: "" });
  const [label, setLabel] = useState("");
  const [key, setKey] = useState("");
  const [dependsOn, setDependsOn] = useState("");
  const [optionsText, setOptionsText] = useState("");

  const category = catalog.find((c) => String(c[PK.category]) === String(sel.categoryId)) || null;
  const type = category?.types.find((t) => String(t[PK.type]) === String(sel.typeId)) || null;

  const items = (type?.fields || []).map((f) => ({
    id: f[PK.field],
    label: f.label,
    active: f.is_active !== false,
    raw: f,
  }));

  const toggle = (it) =>
    run(async () => {
      if (it.active) assertCanDisableField(type, it.raw);
      await setActive("field", it.id, !it.active);
    });

  const move = (idx, dir) => {
    const ids = movedIds(type.fields, "field", idx, dir);
    if (ids) run(() => reorderRows("field", ids));
  };

  // ช่อง "ขึ้นกับช่องไหน" ของแต่ละแถว: เลือกได้เฉพาะช่องอื่นในชิ้นงานเดียวกันที่ไม่ทำให้วนเป็นวงกลม
  const renderExtra = (it) => {
    const f = it.raw;
    const candidates = type.fields.filter(
      (o) => o.field_key !== f.field_key && !wouldCycle(type.fields, f.field_key, o.field_key)
    );
    return (
      <div className="flex flex-wrap items-center gap-2">
        <code className="rounded px-1.5 py-0.5 text-[11px]" style={{ background: "#EEECE6", color: COLORS.charcoalSoft }}>
          {f.field_key}
        </code>
        <select
          value={f.depends_on || ""}
          disabled={busy}
          onChange={(e) => run(() => setFieldDependsOn(type, f, e.target.value), "บันทึกเงื่อนไขเรียบร้อย")}
          className="max-w-44 rounded-md border bg-white px-2 py-1 text-xs outline-none"
          style={{ borderColor: COLORS.border, color: COLORS.charcoalSoft }}
          title="แสดงช่องนี้เมื่อเลือกช่องอื่นแล้ว (และไม่ใช่ 'ไม่มี...')"
        >
          <option value="">แสดงเสมอ</option>
          {candidates.map((o) => (
            <option key={o.field_key} value={o.field_key}>
              ขึ้นกับ: {o.label}
            </option>
          ))}
          {/* กรณีค่าเดิมชี้ไปที่คีย์ที่ไม่มีอยู่จริง ให้เห็นและแก้ได้ */}
          {f.depends_on && !type.fields.some((o) => o.field_key === f.depends_on) && (
            <option value={f.depends_on}>{f.depends_on} (ไม่พบช่องนี้)</option>
          )}
        </select>
      </div>
    );
  };

  const handleAdd = async () => {
    const ok = await run(
      () => addField(type, { label, key, dependsOn, options: optionsText.split("\n") }),
      "เพิ่มช่องรายละเอียดเรียบร้อย"
    );
    if (ok) {
      setLabel("");
      setKey("");
      setDependsOn("");
      setOptionsText("");
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8">
      <AdminHeader
        icon={SlidersHorizontal}
        title="รายละเอียดชิ้นงาน"
        subtitle="กำหนดช่องที่ช่างต้องเลือกของแต่ละชิ้นงานย่อย เช่น สีอลูมิเนียม, มีกระจกไหม"
      />

      <Notice msg={loadError ? { type: "error", text: loadError } : msg} />

      {loading ? (
        <p className="text-sm" style={{ color: COLORS.textMuted }}>
          กำลังโหลดข้อมูล...
        </p>
      ) : (
        <>
          <CascadePicker catalog={catalog} level="type" sel={sel} onSel={setSel} />

          {type && (
            <>
              <Card
                title={`ช่องรายละเอียดของ "${type.name}"`}
                hint="รหัสช่อง (ตัวอักษรเล็กในกรอบ) แก้ไม่ได้หลังสร้าง เพราะงานที่บันทึกแล้วอ้างอิงด้วยรหัสนี้ ส่วนชื่อช่องแก้ได้"
              >
                <EditableList
                  items={items}
                  busy={busy}
                  renderExtra={renderExtra}
                  onRename={(id, name) => run(() => renameField(id, name), "เปลี่ยนชื่อเรียบร้อย")}
                  onToggle={toggle}
                  onMove={move}
                  emptyText="ชิ้นงานนี้ยังไม่มีช่องรายละเอียด เพิ่มได้ด้านล่าง"
                />
              </Card>

              <Card
                title="เพิ่มช่องรายละเอียดใหม่"
                hint="ช่องที่เพิ่มต้องมีตัวเลือกอย่างน้อย 1 ตัวเลือก (แก้ตัวเลือกเพิ่มทีหลังได้ที่เมนู 'ตัวเลือก')"
              >
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <FieldLabel required>ชื่อช่อง</FieldLabel>
                      <TextInput placeholder="เช่น สีกระจก" value={label} onChange={(e) => setLabel(e.target.value)} />
                    </div>
                    <div>
                      <FieldLabel required>รหัสช่อง (อังกฤษ)</FieldLabel>
                      <TextInput placeholder="เช่น glassColor" value={key} onChange={(e) => setKey(e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <FieldLabel>แสดงช่องนี้เมื่อ</FieldLabel>
                    <PlainSelect value={dependsOn} onChange={(e) => setDependsOn(e.target.value)} placeholder="แสดงเสมอ">
                      {type.fields
                        .filter((f) => f.is_active !== false)
                        .map((f) => (
                          <option key={f.field_key} value={f.field_key}>
                            เลือก "{f.label}" แล้ว (และไม่ใช่ "ไม่มี...")
                          </option>
                        ))}
                    </PlainSelect>
                  </div>

                  <div>
                    <FieldLabel required>ตัวเลือก (1 บรรทัดต่อ 1 ตัวเลือก)</FieldLabel>
                    <textarea
                      rows={4}
                      value={optionsText}
                      onChange={(e) => setOptionsText(e.target.value)}
                      placeholder={"ใส\nชา\nเขียว"}
                      className="w-full rounded-lg border bg-white px-3.5 py-2.5 text-[15px] outline-none"
                      style={{ borderColor: COLORS.border }}
                    />
                    <p className="mt-1 text-xs" style={{ color: COLORS.textMuted }}>
                      ตัวเลือกที่ขึ้นต้นด้วยคำว่า "ไม่มี" (เช่น ไม่มีกระจก) จะซ่อนช่องที่ขึ้นกับช่องนี้โดยอัตโนมัติ
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAdd}
                    disabled={busy}
                    className="flex items-center gap-1.5 rounded-lg px-3.5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                    style={{ background: COLORS.green }}
                  >
                    <Plus size={15} />
                    เพิ่มช่องรายละเอียด
                  </button>
                </div>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}