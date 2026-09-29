import React, { useState, useCallback } from "react";
import { Layers, Plus, ChevronRight, ArrowUp, ArrowDown, Pencil, Power, Check, X } from "lucide-react";
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
  setFieldCondition,
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

const LEVEL_STYLE = {
  category: { accent: COLORS.amber, text: "text-[15px] font-bold" },
  type: { accent: COLORS.green, text: "text-sm font-semibold" },
  field: { accent: COLORS.amberDark, text: "text-sm font-medium" },
  option: { accent: COLORS.textMuted, text: "text-xs font-medium" },
};

// ===== แถวเดียวในต้นไม้ (ใช้ซ้ำทุกชั้น) =====
function TreeRow({
  level,
  label,
  badge, // ข้อความเล็กๆ ต่อท้ายชื่อ เช่น "2 ชิ้นงานย่อย"
  active,
  extra,
  busy,
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
  const { accent, text } = LEVEL_STYLE[level] || LEVEL_STYLE.field;

  // กดได้ทั้งแถบ เมื่อมีของข้างในให้กาง และไม่ได้อยู่ในโหมดแก้ชื่อ
  const clickable = hasChildren && !editing;
  const stop = (e) => e.stopPropagation(); // กันไม่ให้ปุ่ม/dropdown ในแถวไปสั่งกาง-ย่อ

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
    <div>
      <div
        role={clickable ? "button" : undefined}
        tabIndex={clickable ? 0 : undefined}
        aria-expanded={clickable ? Boolean(expanded) : undefined}
        onClick={clickable ? onToggleExpand : undefined}
        onKeyDown={
          clickable
            ? (e) => {
              if (e.target !== e.currentTarget) return;
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onToggleExpand();
              }
            }
            : undefined
        }
        className={`flex flex-wrap items-center gap-2 rounded-lg border py-2 pl-2.5 pr-3 transition-shadow ${clickable ? "cursor-pointer select-none hover:shadow-sm" : ""
          }`}
        style={{
          borderColor: COLORS.border,
          borderLeft: `3px solid ${active ? accent : COLORS.border}`,
          background: active ? "#FCFBF8" : "#F1EFE9",
        }}
      >
        {hasChildren ? (
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border"
            style={{ borderColor: COLORS.border, color: COLORS.charcoalSoft, background: "white" }}
          >
            <ChevronRight
              size={16}
              style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s" }}
            />
          </span>
        ) : (
          <span className="w-7 shrink-0" />
        )}

        <div className="min-w-0 flex-1 basis-40">
          {editing ? (
            <input
              autoFocus
              value={draft}
              onClick={stop}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveEdit();
                if (e.key === "Escape") setEditing(false);
              }}
              className="w-full rounded-md border bg-white px-2.5 py-1.5 text-sm outline-none"
              style={{ borderColor: COLORS.amber }}
            />
          ) : (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className={text} style={{ color: active ? COLORS.charcoal : COLORS.textMuted }}>
                {label}
              </span>
              {badge && (
                <span className="text-[11px] font-normal" style={{ color: COLORS.textMuted }}>
                  {badge}
                </span>
              )}
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

        {extra && <div onClick={stop}>{extra}</div>}

        <div className="flex items-center gap-1" onClick={stop}>
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
              <IconBtnLocal title="ย้ายขึ้น" onClick={onMoveUp} disabled={busy || !canMoveUp}>
                <ArrowUp size={14} />
              </IconBtnLocal>
              <IconBtnLocal title="ย้ายลง" onClick={onMoveDown} disabled={busy || !canMoveDown}>
                <ArrowDown size={14} />
              </IconBtnLocal>
              <IconBtnLocal title="แก้ชื่อ" onClick={startEdit} disabled={busy}>
                <Pencil size={13} />
              </IconBtnLocal>
              {/* เดิมเป็นไอคอน Power เฉยๆ ทำให้งงว่าคืออะไร -> ใส่ข้อความกำกับ (จอเล็กเหลือแค่ไอคอน) */}
              <button
                type="button"
                onClick={onToggleActive}
                disabled={busy}
                title={active ? "ปิดใช้งาน (ซ่อนจากฟอร์มของช่าง)" : "เปิดใช้งานอีกครั้ง"}
                className="flex h-7 items-center gap-1 rounded-md border px-2 text-xs font-medium disabled:opacity-40"
                style={{ borderColor: COLORS.border, background: "white", color: active ? COLORS.red : COLORS.green }}
              >
                <Power size={12} />
                <span className="hidden sm:inline">{active ? "ปิดใช้งาน" : "เปิดใช้งาน"}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {expanded && hasChildren && (
        <div className="mt-2 mb-1 ml-4 space-y-2 border-l pl-3" style={{ borderColor: COLORS.border }}>
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

// ===== ชั้นที่ 4: ตัวเลือก (กางลงมาเจอช่องรายละเอียดที่ผูกกับตัวเลือกนี้โดยเฉพาะ) =====
function OptionNode({ option, field, type, idx, total, busy, run, onMove, childFields = [], expanded, onToggleExpand }) {
  const [openChildFieldId, setOpenChildFieldId] = useState(null);
  const active = option.is_active !== false;
  const toggleActive = () =>
    run(async () => {
      if (active) assertCanDisableOption(field, option);
      await setActive("option", option[PK.option], !active);
    });

  return (
    <TreeRow
      level="option"
      label={option.value}
      badge={childFields.length > 0 ? `มี ${childFields.length} ช่องเพิ่มเติม` : undefined}
      active={active}
      busy={busy}
      hasChildren={childFields.length > 0}
      expanded={expanded}
      onToggleExpand={onToggleExpand}
      onRename={(value) => run(() => renameOption(field, option[PK.option], value), "เปลี่ยนตัวเลือกเรียบร้อย")}
      renameWarning={RENAME_WARNING_OPTION}
      onToggleActive={toggleActive}
      onMoveUp={() => onMove(-1)}
      onMoveDown={() => onMove(1)}
      canMoveUp={idx > 0}
      canMoveDown={idx < total - 1}
    >
      {childFields.length === 0 && (
        <p className="text-xs" style={{ color: COLORS.textMuted }}>
          ยังไม่มีช่องรายละเอียดที่ผูกกับตัวเลือกนี้
        </p>
      )}
      <div className="space-y-2">
        {childFields.map((cf, cfIdx) => (
          <FieldNode
            key={cf[PK.field]}
            field={cf}
            type={type}
            idx={cfIdx}
            total={childFields.length}
            busy={busy}
            run={run}
            expanded={openChildFieldId === cf[PK.field]}
            onToggleExpand={() => setOpenChildFieldId(openChildFieldId === cf[PK.field] ? null : cf[PK.field])}
            onMove={(dir) => {
              const ids = movedIds(childFields, "field", cfIdx, dir);
              if (ids) run(() => reorderRows("field", ids));
            }}
          />
        ))}
      </div>
    </TreeRow>
  );
}

// ===== ชั้นที่ 3: ช่องรายละเอียด (กางลงมาเป็นตัวเลือก) =====
// dependsSelect มี 2 dropdown: (1) ขึ้นกับช่องไหน (2) เฉพาะตอบว่าอะไร (เว้นว่าง = ทุกคำตอบที่ไม่ใช่ "ไม่มี...")
function FieldNode({ field, type, idx, total, busy, run, onMove, expanded, onToggleExpand }) {
  const [openOptionId, setOpenOptionId] = useState(null);
  const active = field.is_active !== false;

  // ช่องรายละเอียดที่ผูกกับ "ตัวเลือกใดตัวเลือกหนึ่ง" ของช่องนี้โดยเฉพาะ (มีทั้ง depends_on และ depends_on_value ตรงกัน)
  const childFieldsOf = (optionValue) =>
    type.fields.filter((f) => f.depends_on === field.field_key && f.depends_on_value === optionValue);

  const candidates = type.fields.filter(
    (o) => o.field_key !== field.field_key && !wouldCycle(type.fields, field.field_key, o.field_key)
  );
  const parentField = field.depends_on ? type.fields.find((o) => o.field_key === field.depends_on) : null;

  const dependsSelect = (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={field.depends_on || ""}
        disabled={busy}
        onChange={(e) => run(() => setFieldCondition(type, f, e.target.value, null), "บันทึกเงื่อนไขเรียบร้อย")} className="max-w-44 rounded-md border bg-white px-2 py-1 text-xs outline-none"
        style={{ borderColor: COLORS.border, color: COLORS.charcoalSoft }}
        title="แสดงช่องนี้เมื่อเลือกช่องอื่นแล้ว"
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

      {parentField && (
        <select
          value={field.depends_on_value || ""}
          disabled={busy}
          onChange={(e) =>
            run(() => setFieldCondition(type, field, field.depends_on, e.target.value || null), "บันทึกเงื่อนไขเรียบร้อย")
          }
          className="max-w-44 rounded-md border bg-white px-2 py-1 text-xs outline-none"
          style={{ borderColor: COLORS.border, color: COLORS.charcoalSoft }}
          title={`เจาะจงว่า "${parentField.label}" ต้องตอบอะไรถึงจะโชว์ช่องนี้`}
        >
          <option value="">ทุกคำตอบ (ไม่ใช่ "ไม่มี...")</option>
          {parentField.options
            .filter((o) => o.is_active !== false)
            .map((o) => (
              <option key={o[PK.option]} value={o.value}>
                เฉพาะตอบ: {o.value}
              </option>
            ))}
        </select>
      )}
    </div>
  );

  const toggleActive = () =>
    run(async () => {
      if (active) assertCanDisableField(type, field);
      await setActive("field", field[PK.field], !active);
    });

  return (
    <TreeRow
      level="field"
      label={field.label}
      badge={`${field.options.length} ตัวเลือก`}
      active={active}
      extra={dependsSelect}
      busy={busy}
      hasChildren
      expanded={expanded}
      onToggleExpand={onToggleExpand}
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
            type={type}
            idx={oIdx}
            total={field.options.length}
            busy={busy}
            run={run}
            childFields={childFieldsOf(option.value)}
            expanded={openOptionId === option[PK.option]}
            onToggleExpand={() => setOpenOptionId(openOptionId === option[PK.option] ? null : option[PK.option])}
            onMove={(dir) => {
              const ids = movedIds(field.options, "option", oIdx, dir);
              if (ids) run(() => reorderRows("option", ids));
            }}
          />
        ))}
      </div>
      <AddInline
        placeholder="ตัวเลือกใหม่"
        buttonLabel="เพิ่มตัวเลือก"
        busy={busy}
        onAdd={(value) => run(() => addOption(field, value), "เพิ่มตัวเลือกเรียบร้อย")}
      />
    </TreeRow>
  );
}

function generateFieldKey() {
  return `f${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
// ปุ่มเส้นประ กดแล้วค่อยกางฟอร์มเพิ่ม (children เป็นฟังก์ชันรับ close)
function CollapsibleAdd({ label, children }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed px-3 py-2 text-sm font-medium"
        style={{ borderColor: COLORS.green, color: COLORS.green, background: "white" }}
      >
        <Plus size={14} />
        {label}
      </button>
    );
  }
  return (
    <div>
      {children(() => setOpen(false))}
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="mt-2 text-xs font-medium"
        style={{ color: COLORS.textMuted }}
      >
        ยกเลิก
      </button>
    </div>
  );
}
// ฟอร์มเพิ่มช่องรายละเอียดใหม่: มี dropdown "แสดงช่องนี้เมื่อ" + dropdown ย่อย "เฉพาะตอบว่าอะไร"
function AddFieldForm({ type, busy, run, onDone }) {
  const [label, setLabel] = useState("");
  const [dependsOn, setDependsOn] = useState("");
  const [dependsOnValue, setDependsOnValue] = useState("");
  const [optionsText, setOptionsText] = useState("");

  const parentField = dependsOn ? type.fields.find((f) => f.field_key === dependsOn) : null;

  const handleAdd = async () => {
    const ok = await run(
      () =>
        addField(type, {
          label,
          key: generateFieldKey(),
          dependsOn,
          dependsOnValue,
          options: optionsText.split("\n"),
        }),
      "เพิ่มช่องรายละเอียดเรียบร้อย"
    );
    if (ok) {
      setLabel("");
      setDependsOn("");
      setDependsOnValue("");
      setOptionsText("");
      onDone?.();
    }
  };

  return (
    <div className="space-y-3 rounded-lg border p-3" style={{ borderColor: COLORS.border, background: "#FCFBF8" }}>
      <div>
        <FieldLabel required>ชื่อช่อง</FieldLabel>
        <TextInput placeholder="เช่น สีกระจก" value={label} onChange={(e) => setLabel(e.target.value)} />
      </div>

      {type.fields.filter((f) => f.is_active !== false).length > 0 && (
        <div>
          <FieldLabel>แสดงช่องนี้เมื่อ</FieldLabel>
          <PlainSelect
            value={dependsOn}
            onChange={(e) => {
              setDependsOn(e.target.value);
              setDependsOnValue("");
            }}
            placeholder="แสดงเสมอ (ไม่ผูกเงื่อนไข)"
          >
            {type.fields
              .filter((f) => f.is_active !== false)
              .map((f) => (
                <option key={f.field_key} value={f.field_key}>
                  เลือก "{f.label}" แล้ว
                </option>
              ))}
          </PlainSelect>

          {parentField && (
            <div className="mt-2">
              <PlainSelect
                value={dependsOnValue}
                onChange={(e) => setDependsOnValue(e.target.value)}
                placeholder={`ทุกคำตอบของ "${parentField.label}" (ไม่ใช่ "ไม่มี...")`}
              >
                {parentField.options
                  .filter((o) => o.is_active !== false)
                  .map((o) => (
                    <option key={o[PK.option]} value={o.value}>
                      เฉพาะตอบ: {o.value}
                    </option>
                  ))}
              </PlainSelect>
              <p className="mt-1 text-xs" style={{ color: COLORS.textMuted }}>
                ไม่เลือก = โชว์ทุกครั้งที่ "{parentField.label}" มีคำตอบ (ยกเว้นตอบ "ไม่มี...") <br />
                เลือกคำตอบใดคำตอบหนึ่ง = โชว์เฉพาะตอนตอบแบบนั้นเท่านั้น เช่น เลือก "ใส" ช่องนี้จะโผล่เฉพาะตอนตอบ "ใส"
              </p>
            </div>
          )}
        </div>
      )}

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

// ===== ชั้นที่ 2: ชิ้นงานย่อย =====
function TypeNode({ type, catalog, idx, total, busy, run, onMove, expanded, onToggleExpand }) {
  const [openFieldId, setOpenFieldId] = useState(null);
  const active = type.is_active !== false;
  // ช่องที่ถูกผูกกับตัวเลือกใดตัวเลือกหนึ่งแบบเจาะจง (มี depends_on_value) จะไปโชว์ซ้อนใต้ตัวเลือกนั้นแทน ไม่โชว์แบนๆ ตรงนี้
  const topFields = type.fields.filter((f) => !(f.depends_on && f.depends_on_value));

  return (
    <TreeRow
      level="type"
      label={type.name}
      badge={`${topFields.length} ช่องรายละเอียด`}
      active={active}
      busy={busy}
      hasChildren
      expanded={expanded}
      onToggleExpand={onToggleExpand}
      onRename={(name) => run(() => renameType(catalog, type[PK.type], name), "เปลี่ยนชื่อเรียบร้อย")}
      renameWarning={RENAME_WARNING}
      onToggleActive={() => run(() => setActive("type", type[PK.type], !active))}
      onMoveUp={() => onMove(-1)}
      onMoveDown={() => onMove(1)}
      canMoveUp={idx > 0}
      canMoveDown={idx < total - 1}
    >
      {topFields.length === 0 && (
        <p className="text-xs" style={{ color: COLORS.textMuted }}>
          ชิ้นงานนี้ยังไม่มีช่องรายละเอียด
        </p>
      )}
      <div className="space-y-2">
        {topFields.map((field, fIdx) => (
          <FieldNode
            key={field[PK.field]}
            field={field}
            type={type}
            idx={fIdx}
            total={topFields.length}
            busy={busy}
            run={run}
            expanded={openFieldId === field[PK.field]}
            onToggleExpand={() => setOpenFieldId(openFieldId === field[PK.field] ? null : field[PK.field])}
            onMove={(dir) => {
              const ids = movedIds(topFields, "field", fIdx, dir);
              if (ids) run(() => reorderRows("field", ids));
            }}
          />
        ))}
      </div>
      <AddFieldForm type={type} busy={busy} run={run} />
    </TreeRow>
  );
}

function AddTypeForm({ category, catalog, allTypes, busy, run, onDone }) {
  const [name, setName] = useState("");
  const [copyFromId, setCopyFromId] = useState("");

  const handleAdd = async () => {
    const copyFrom = allTypes.find((t) => String(t[PK.type]) === String(copyFromId)) || null;
    const ok = await run(() => addType(catalog, category[PK.category], name, copyFrom), "เพิ่มชิ้นงานย่อยเรียบร้อย");
    if (ok) {
      setName("");
      setCopyFromId("");
      onDone?.();
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

// ===== ชั้นที่ 1: หมวดหมู่งานหลัก =====
function CategoryNode({ category, catalog, allTypes, idx, total, busy, run, onMove, expanded, onToggleExpand }) {
  const [openTypeId, setOpenTypeId] = useState(null);
  const active = category.is_active !== false;

  return (
    <TreeRow
      level="category"
      label={category.name}
      badge={`${category.types.length} ชิ้นงานย่อย`}
      active={active}
      busy={busy}
      hasChildren
      expanded={expanded}
      onToggleExpand={onToggleExpand}
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
            expanded={openTypeId === type[PK.type]}
            onToggleExpand={() => setOpenTypeId(openTypeId === type[PK.type] ? null : type[PK.type])}
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

export default function CatalogTypesPage({ onChanged }) {
  const { catalog, loading, loadError, reload } = useCatalogAdmin();
  const afterChange = useCallback(async () => {
    await reload();
    onChanged?.();
  }, [reload, onChanged]);
  const { busy, msg, run } = useAdminAction(afterChange);

  const [openCategoryId, setOpenCategoryId] = useState(null);

  const allTypes = catalog.flatMap((c) => c.types.map((t) => ({ ...t, categoryName: c.name })));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8">
      <AdminHeader
        icon={Layers}
        title="ตั้งค่างาน"
        subtitle="กดลูกศร ▶ เพื่อกางดู หมวดหมู่ → ชิ้นงานย่อย → ช่องรายละเอียด → ตัวเลือก"
      />

      <Notice msg={loadError ? { type: "error", text: loadError } : msg} />

      {loading ? (
        <p className="text-sm" style={{ color: COLORS.textMuted }}>
          กำลังโหลดข้อมูล...
        </p>
      ) : (
        <Card title="หมวดหมู่งานหลัก" hint="ใช้ 'ปิดใช้งาน' แทนการลบ เพื่อไม่ให้ข้อมูลงานเก่าเสีย">
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
                expanded={openCategoryId === category[PK.category]}
                onToggleExpand={() =>
                  setOpenCategoryId(openCategoryId === category[PK.category] ? null : category[PK.category])
                }
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