import React, { useState, useCallback } from "react";
import { Layers, Plus, ChevronDown, ChevronUp, Pencil, Power, Check, X } from "lucide-react";
import { COLORS } from "../lib/tokens.js";
import {
  PK,
  useCatalogAdmin,
  useAdminAction,
  addCategory,
  renameCategory,
  addType,
  renameType,
  addField,
  renameField,
  setFieldDependsOn,
  assertCanDisableField,
  wouldCycle,
  addOption,
  renameOption,
  assertCanDisableOption,
  setActive,
  reorderRows,
  movedIds,
} from "../lib/catalogAdmin.js";
import { AdminHeader, Card, Notice, AddInline, PlainSelect } from "../components/CatalogAdminUI.jsx";
import { FieldLabel, TextInput } from "../components/ui.jsx";

const RENAME_WARNING =
  "ชิ้นงานที่บันทึกไว้แล้วจะยังใช้ชื่อเดิม และอาจไม่แสดงรายละเอียดเมื่อเปิดแก้ไข ต้องการเปลี่ยนชื่อใช่ไหม?";
const RENAME_WARNING_OPTION =
  "ชิ้นงานที่บันทึกไว้แล้วจะยังเก็บค่าเดิมไว้ ไม่เปลี่ยนตาม ต้องการเปลี่ยนชื่อตัวเลือกใช่ไหม?";

// ===== แถวเดียวในต้นไม้ (ใช้ซ้ำทุกชั้น: หมวดหมู่ / ชิ้นงานย่อย / ช่องรายละเอียด / ตัวเลือก) =====
function TreeRow({
  label,
  active,
  extra,
  busy,
  indent = 0,
  hasChildren = false,
  expanded,
  onToggleExpand,
  onRename,
  renameWarning,
  onToggleActive,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  children,
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(label);

  const startEdit = () => {
    setDraft(label);
    setEditing(true);
  };

  const saveEdit = async () => {
    const v = draft.trim();
    if (v === label) {
      setEditing(false);
      return;
    }
    if (renameWarning && !window.confirm(renameWarning)) return;
    const ok = await onRename(v);
    if (ok !== false) setEditing(false);
  };

  return (
    <div style={{ marginLeft: indent }}>
      <div
        className="flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2"
        style={{ borderColor: COLORS.border, background: active ? "#FCFBF8" : "#F1EFE9" }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={onToggleExpand}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border"
            style={{ borderColor: COLORS.border, color: COLORS.charcoalSoft, background: "white" }}
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        ) : (
          <span className="w-7 shrink-0" />
        )}

        <div className="min-w-0 flex-1 basis-40">
          {editing ? (
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveEdit();
                if (e.key === "Escape") setEditing(false);
              }}
              className="w-full rounded-md border bg-white px-2.5 py-1.5 text-sm outline-none"
              style={{ borderColor: COLORS.amber }}
            />
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold" style={{ color: active ? COLORS.charcoal : COLORS.textMuted }}>
                {label}
              </span>
              {!active && (
                <span
                  className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                  style={{ background: "#EEECE6", color: COLORS.textMuted }}
                >
                  ปิดใช้งานอยู่
                </span>
              )}
            </div>
          )}
        </div>

        {extra}

        <div className="flex items-center gap-1">
          {editing ? (
            <>
              <IconBtnLocal title="บันทึกชื่อ" onClick={saveEdit} disabled={busy}>
                <Check size={14} />
              </IconBtnLocal>
              <IconBtnLocal title="ยกเลิก" onClick={() => setEditing(false)}>
                <X size={14} />
              </IconBtnLocal>
            </>
          ) : (
            <>
              <IconBtnLocal title="เลื่อนขึ้น" onClick={onMoveUp} disabled={busy || !canMoveUp}>
                <ChevronUp size={14} />
              </IconBtnLocal>
              <IconBtnLocal title="เลื่อนลง" onClick={onMoveDown} disabled={busy || !canMoveDown}>
                <ChevronDown size={14} />
              </IconBtnLocal>
              <IconBtnLocal title="แก้ชื่อ" onClick={startEdit} disabled={busy}>
                <Pencil size={13} />
              </IconBtnLocal>
              <button
                type="button"
                onClick={onToggleActive}
                disabled={busy}
                className="flex h-7 items-center gap-1 rounded-md border px-2 text-xs font-medium disabled:opacity-40"
                style={{ borderColor: COLORS.border, background: "white", color: active ? COLORS.red : COLORS.green }}
              >
                <Power size={12} />
                {active ? "ปิดใช้งาน" : "เปิดใช้งาน"}
              </button>
            </>
          )}
        </div>
      </div>

      {expanded && hasChildren && (
        <div className="mt-2 mb-1 space-y-2 border-l pl-3" style={{ borderColor: COLORS.border }}>
          {children}
        </div>
      )}
    </div>
  );
}

function IconBtnLocal({ onClick, disabled, title, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className="flex h-7 w-7 items-center justify-center rounded-md border disabled:opacity-35"
      style={{ borderColor: COLORS.border, color: COLORS.charcoalSoft, background: "white" }}
    >
      {children}
    </button>
  );
}

// ===== ชั้นที่ 4: ตัวเลือก (ใบสุดท้าย ไม่มีลูก) =====
function OptionNode({ option, field, idx, total, busy, run, onMove }) {
  const active = option.is_active !== false;
  const toggleActive = () =>
    run(async () => {
      if (active) assertCanDisableOption(field, option);
      await setActive("option", option[PK.option], !active);
    });

  return (
    <TreeRow
      label={option.value}
      active={active}
      busy={busy}
      onRename={(value) => run(() => renameOption(field, option[PK.option], value), "เปลี่ยนตัวเลือกเรียบร้อย")}
      renameWarning={RENAME_WARNING_OPTION}
      onToggleActive={toggleActive}
      onMoveUp={() => onMove(-1)}
      onMoveDown={() => onMove(1)}
      canMoveUp={idx > 0}
      canMoveDown={idx < total - 1}
    />
  );
}

// ===== ชั้นที่ 3: ช่องรายละเอียด (กางลงมาเป็นตัวเลือก) =====
function FieldNode({ field, type, idx, total, busy, run, onMove }) {
  const [expanded, setExpanded] = useState(false);
  const active = field.is_active !== false;

  const candidates = type.fields.filter(
    (o) => o.field_key !== field.field_key && !wouldCycle(type.fields, field.field_key, o.field_key)
  );

  const dependsSelect = (
    <div className="flex flex-wrap items-center gap-2">
      <code className="rounded px-1.5 py-0.5 text-[11px]" style={{ background: "#EEECE6", color: COLORS.charcoalSoft }}>
        {field.field_key}
      </code>
      <select
        value={field.depends_on || ""}
        disabled={busy}
        onChange={(e) => run(() => setFieldDependsOn(type, field, e.target.value), "บันทึกเงื่อนไขเรียบร้อย")}
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
        {field.depends_on && !type.fields.some((o) => o.field_key === field.depends_on) && (
          <option value={field.depends_on}>{field.depends_on} (ไม่พบช่องนี้)</option>
        )}
      </select>
    </div>
  );

  const toggleActive = () =>
    run(async () => {
      if (active) assertCanDisableField(type, field);
      await setActive("field", field[PK.field], !active);
    });

  return (
    <TreeRow
      label={field.label}
      active={active}
      extra={dependsSelect}
      busy={busy}
      hasChildren
      expanded={expanded}
      onToggleExpand={() => setExpanded((v) => !v)}
      onRename={(name) => run(() => renameField(field[PK.field], name), "เปลี่ยนชื่อเรียบร้อย")}
      onToggleActive={toggleActive}
      onMoveUp={() => onMove(-1)}
      onMoveDown={() => onMove(1)}
      canMoveUp={idx > 0}
      canMoveDown={idx < total - 1}
    >
      {field.options.length === 0 && (
        <p className="text-xs" style={{ color: COLORS.textMuted }}>
          ช่องนี้ยังไม่มีตัวเลือก
        </p>
      )}
      <div className="space-y-2">
        {field.options.map((option, oIdx) => (
          <OptionNode
            key={option[PK.option]}
            option={option}
            field={field}
            idx={oIdx}
            total={field.options.length}
            busy={busy}
            run={run}
            onMove={(dir) => {
              const ids = movedIds(field.options, "option", oIdx, dir);
              if (ids) run(() => reorderRows("option", ids));
            }}
          />
        ))}
      </div>
      <AddInline
        placeholder="ตัวเลือกใหม่ เช่น ใส"
        buttonLabel="เพิ่มตัวเลือก"
        busy={busy}
        onAdd={(value) => run(() => addOption(field, value), "เพิ่มตัวเลือกเรียบร้อย")}
      />
    </TreeRow>
  );
}

// ฟอร์มเพิ่มช่องรายละเอียดใหม่ (อยู่ใต้ชิ้นงานย่อยแต่ละอัน)
function AddFieldForm({ type, busy, run }) {
  const [label, setLabel] = useState("");
  const [key, setKey] = useState("");
  const [dependsOn, setDependsOn] = useState("");
  const [optionsText, setOptionsText] = useState("");

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
    <div className="space-y-3 rounded-lg border p-3" style={{ borderColor: COLORS.border, background: "#FCFBF8" }}>
      <div className="grid gap-2 sm:grid-cols-2">
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
          rows={3}
          value={optionsText}
          onChange={(e) => setOptionsText(e.target.value)}
          placeholder={"ใส\nชา\nเขียว"}
          className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none"
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
        className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        style={{ background: COLORS.green }}
      >
        <Plus size={14} />
        เพิ่มช่องรายละเอียด
      </button>
    </div>
  );
}

// ===== ชั้นที่ 2: ชิ้นงานย่อย (กางลงมาเป็นช่องรายละเอียด) =====
function TypeNode({ type, catalog, idx, total, busy, run, onMove }) {
  const [expanded, setExpanded] = useState(false);
  const active = type.is_active !== false;

  return (
    <TreeRow
      label={type.name}
      active={active}
      busy={busy}
      hasChildren
      expanded={expanded}
      onToggleExpand={() => setExpanded((v) => !v)}
      onRename={(name) => run(() => renameType(catalog, type[PK.type], name), "เปลี่ยนชื่อเรียบร้อย")}
      renameWarning={RENAME_WARNING}
      onToggleActive={() => run(() => setActive("type", type[PK.type], !active))}
      onMoveUp={() => onMove(-1)}
      onMoveDown={() => onMove(1)}
      canMoveUp={idx > 0}
      canMoveDown={idx < total - 1}
    >
      {type.fields.length === 0 && (
        <p className="text-xs" style={{ color: COLORS.textMuted }}>
          ชิ้นงานนี้ยังไม่มีช่องรายละเอียด
        </p>
      )}
      <div className="space-y-2">
        {type.fields.map((field, fIdx) => (
          <FieldNode
            key={field[PK.field]}
            field={field}
            type={type}
            idx={fIdx}
            total={type.fields.length}
            busy={busy}
            run={run}
            onMove={(dir) => {
              const ids = movedIds(type.fields, "field", fIdx, dir);
              if (ids) run(() => reorderRows("field", ids));
            }}
          />
        ))}
      </div>
      <AddFieldForm type={type} busy={busy} run={run} />
    </TreeRow>
  );
}

// ฟอร์มเพิ่มชิ้นงานย่อยใหม่ (อยู่ใต้หมวดหมู่แต่ละอัน คัดลอกช่องรายละเอียดจากชิ้นงานอื่นได้)
function AddTypeForm({ category, catalog, allTypes, busy, run }) {
  const [name, setName] = useState("");
  const [copyFromId, setCopyFromId] = useState("");

  const handleAdd = async () => {
    const copyFrom = allTypes.find((t) => String(t[PK.type]) === String(copyFromId)) || null;
    const ok = await run(() => addType(catalog, category[PK.category], name, copyFrom), "เพิ่มชิ้นงานย่อยเรียบร้อย");
    if (ok) {
      setName("");
      setCopyFromId("");
    }
  };

  return (
    <div className="space-y-2 rounded-lg border p-3" style={{ borderColor: COLORS.border, background: "#FCFBF8" }}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="ชื่อชิ้นงานย่อยใหม่ เช่น บานสวิง"
        className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none"
        style={{ borderColor: COLORS.border }}
      />
      <PlainSelect
        value={copyFromId}
        onChange={(e) => setCopyFromId(e.target.value)}
        placeholder="-- ไม่คัดลอกช่องรายละเอียด (เริ่มจากว่าง) --"
      >
        {allTypes.map((t) => (
          <option key={t[PK.type]} value={t[PK.type]}>
            คัดลอกช่องรายละเอียดจาก: {t.categoryName} › {t.name}
          </option>
        ))}
      </PlainSelect>
      <button
        type="button"
        onClick={handleAdd}
        disabled={busy || !name.trim()}
        className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        style={{ background: COLORS.green }}
      >
        <Plus size={14} />
        เพิ่มชิ้นงานย่อย
      </button>
    </div>
  );
}

// ===== ชั้นที่ 1: หมวดหมู่งานหลัก (กางลงมาเป็นชิ้นงานย่อย) =====
function CategoryNode({ category, catalog, allTypes, idx, total, busy, run, onMove }) {
  const [expanded, setExpanded] = useState(false);
  const active = category.is_active !== false;

  return (
    <TreeRow
      label={category.name}
      active={active}
      busy={busy}
      hasChildren
      expanded={expanded}
      onToggleExpand={() => setExpanded((v) => !v)}
      onRename={(name) => run(() => renameCategory(catalog, category[PK.category], name), "เปลี่ยนชื่อเรียบร้อย")}
      renameWarning={RENAME_WARNING}
      onToggleActive={() => run(() => setActive("category", category[PK.category], !active))}
      onMoveUp={() => onMove(-1)}
      onMoveDown={() => onMove(1)}
      canMoveUp={idx > 0}
      canMoveDown={idx < total - 1}
    >
      {category.types.length === 0 && (
        <p className="text-xs" style={{ color: COLORS.textMuted }}>
          หมวดนี้ยังไม่มีชิ้นงานย่อย
        </p>
      )}
      <div className="space-y-2">
        {category.types.map((type, tIdx) => (
          <TypeNode
            key={type[PK.type]}
            type={type}
            catalog={catalog}
            idx={tIdx}
            total={category.types.length}
            busy={busy}
            run={run}
            onMove={(dir) => {
              const ids = movedIds(category.types, "type", tIdx, dir);
              if (ids) run(() => reorderRows("type", ids));
            }}
          />
        ))}
      </div>
      <AddTypeForm category={category} catalog={catalog} allTypes={allTypes} busy={busy} run={run} />
    </TreeRow>
  );
}

// ===== หน้าเดียวรวมทุกชั้น =====
export default function CatalogTypesPage({ onChanged }) {
  const { catalog, loading, loadError, reload } = useCatalogAdmin();
  const afterChange = useCallback(async () => {
    await reload();
    onChanged?.();
  }, [reload, onChanged]);
  const { busy, msg, run } = useAdminAction(afterChange);

  const allTypes = catalog.flatMap((c) => c.types.map((t) => ({ ...t, categoryName: c.name })));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8">
      <AdminHeader
        icon={Layers}
        title="ตั้งค่างาน"
        subtitle="กดลูกศรเพื่อกางดู หมวดหมู่ → ชิ้นงานย่อย → ช่องรายละเอียด → ตัวเลือก ได้ในหน้าเดียว"
      />

      <Notice msg={loadError ? { type: "error", text: loadError } : msg} />

      {loading ? (
        <p className="text-sm" style={{ color: COLORS.textMuted }}>
          กำลังโหลดข้อมูล...
        </p>
      ) : (
        <Card
          title="หมวดหมู่งานหลัก"
          hint="ใช้ 'ปิดใช้งาน' แทนการลบ เพื่อไม่ให้ข้อมูลงานเก่าเสีย"
        >
          {catalog.length === 0 && (
            <p className="mb-3 text-xs" style={{ color: COLORS.textMuted }}>
              ยังไม่มีหมวดหมู่ เพิ่มหมวดแรกได้ด้านล่าง
            </p>
          )}
          <div className="mb-3 space-y-2">
            {catalog.map((category, idx) => (
              <CategoryNode
                key={category[PK.category]}
                category={category}
                catalog={catalog}
                allTypes={allTypes}
                idx={idx}
                total={catalog.length}
                busy={busy}
                run={run}
                onMove={(dir) => {
                  const ids = movedIds(catalog, "category", idx, dir);
                  if (ids) run(() => reorderRows("category", ids));
                }}
              />
            ))}
          </div>
          <AddInline
            placeholder="ชื่อหมวดหมู่ใหม่ เช่น ประตู"
            buttonLabel="เพิ่มหมวดหมู่"
            busy={busy}
            onAdd={(name) => run(() => addCategory(catalog, name), "เพิ่มหมวดหมู่เรียบร้อย")}
          />
        </Card>
      )}
    </div>
  );
}