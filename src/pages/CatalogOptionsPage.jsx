import React, { useState, useCallback } from "react";
import { List } from "lucide-react";
import { COLORS } from "../lib/tokens.js";
import {
  PK,
  useCatalogAdmin,
  useAdminAction,
  addOption,
  renameOption,
  assertCanDisableOption,
  setActive,
  reorderRows,
  movedIds,
} from "../lib/catalogAdmin.js";
import { AdminHeader, Card, Notice, EditableList, CascadePicker, AddInline } from "../components/CatalogAdminUI.jsx";

const RENAME_WARNING =
  "ชิ้นงานที่บันทึกไว้แล้วจะยังเก็บค่าเดิมไว้ ไม่เปลี่ยนตาม ต้องการเปลี่ยนชื่อตัวเลือกใช่ไหม?";

// 2.3 ตัวเลือกของช่องรายละเอียด เช่น สีกระจก -> ใส / ชา / เขียว
export default function CatalogOptionsPage({ onChanged }) {
  const { catalog, loading, loadError, reload } = useCatalogAdmin();
  const afterChange = useCallback(async () => {
    await reload();
    onChanged?.();
  }, [reload, onChanged]);
  const { busy, msg, run } = useAdminAction(afterChange);

  const [sel, setSel] = useState({ categoryId: "", typeId: "", fieldId: "" });

  const category = catalog.find((c) => String(c[PK.category]) === String(sel.categoryId)) || null;
  const type = category?.types.find((t) => String(t[PK.type]) === String(sel.typeId)) || null;
  const field = type?.fields.find((f) => String(f[PK.field]) === String(sel.fieldId)) || null;

  const items = (field?.options || []).map((o) => ({
    id: o[PK.option],
    label: o.value,
    active: o.is_active !== false,
    raw: o,
  }));

  const toggle = (it) =>
    run(async () => {
      if (it.active) assertCanDisableOption(field, it.raw);
      await setActive("option", it.id, !it.active);
    });

  const move = (idx, dir) => {
    const ids = movedIds(field.options, "option", idx, dir);
    if (ids) run(() => reorderRows("option", ids));
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8">
      <AdminHeader
        icon={List}
        title="ตัวเลือก"
        subtitle="เพิ่ม/แก้ตัวเลือกในแต่ละช่องรายละเอียด เช่น สีกระจก → ใส, ชา, เขียว"
      />

      <Notice msg={loadError ? { type: "error", text: loadError } : msg} />

      {loading ? (
        <p className="text-sm" style={{ color: COLORS.textMuted }}>
          กำลังโหลดข้อมูล...
        </p>
      ) : (
        <>
          <CascadePicker catalog={catalog} level="field" sel={sel} onSel={setSel} />

          {field && (
            <Card
              title={`ตัวเลือกของ "${field.label}" (${type.name})`}
              hint={'ตัวเลือกที่ขึ้นต้นด้วยคำว่า "ไม่มี" จะซ่อนช่องอื่นที่ขึ้นกับช่องนี้ ช่องต้องมีตัวเลือกที่เปิดใช้งานอย่างน้อย 1 ตัวเลือก'}
            >
              <EditableList
                items={items}
                busy={busy}
                renameWarning={RENAME_WARNING}
                onRename={(id, value) => run(() => renameOption(field, id, value), "เปลี่ยนตัวเลือกเรียบร้อย")}
                onToggle={toggle}
                onMove={move}
                emptyText="ช่องนี้ยังไม่มีตัวเลือก เพิ่มได้ด้านล่าง"
              />
              <AddInline
                placeholder="ตัวเลือกใหม่ เช่น ใส"
                buttonLabel="เพิ่มตัวเลือก"
                busy={busy}
                onAdd={(value) => run(() => addOption(field, value), "เพิ่มตัวเลือกเรียบร้อย")}
              />
            </Card>
          )}
        </>
      )}
    </div>
  );
}