import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase.js";

// ===== ชื่อตาราง/คอลัมน์ =====
// ถ้าฐานข้อมูลจริงตั้งชื่อคีย์หลัก/คีย์นอกต่างจากนี้ ให้แก้ตรงนี้ที่เดียว
export const PK = { category: "category_id", type: "type_id", field: "field_id", option: "option_id" };
const TABLE = {
  category: "work_categories",
  type: "work_types",
  field: "work_type_fields",
  option: "work_type_field_options",
};
const FK_CATEGORY = "category_id"; // work_types -> work_categories
const FK_TYPE = "type_id"; // work_type_fields -> work_types
const FK_FIELD = "field_id"; // work_type_field_options -> work_type_fields

// error ที่ข้อความอ่านรู้เรื่อง แสดงให้ผู้ใช้เห็นได้เลย
export function userError(text) {
  const e = new Error(text);
  e.userMessage = text;
  return e;
}

const bySort = (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0);
export const nextOrder = (list) => list.reduce((m, x) => Math.max(m, x.sort_order ?? 0), 0) + 1;
const sameName = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();

async function one(query) {
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// update ที่เช็กด้วยว่ามีแถวถูกแก้จริง (กัน RLS บล็อกแบบเงียบ ๆ)
async function mutate(query) {
  const { data, error } = await query.select();
  if (error) throw error;
  if (!data || data.length === 0) {
    throw userError("บันทึกไม่สำเร็จ: ไม่มีข้อมูลถูกแก้ไข (ตรวจสอบสิทธิ์ RLS ของตารางนี้)");
  }
  return data;
}

// ===== โหลดทั้งหมด (รวมรายการที่ปิดใช้งานด้วย) =====
export async function loadAdminCatalog() {
  const { data, error } = await supabase
    .from(TABLE.category)
    .select("*, work_types(*, work_type_fields(*, work_type_field_options(*)))");
  if (error) throw error;

  return (data || [])
    .slice()
    .sort(bySort)
    .map((c) => ({
      ...c,
      types: (c.work_types || [])
        .slice()
        .sort(bySort)
        .map((t) => ({
          ...t,
          fields: (t.work_type_fields || [])
            .slice()
            .sort(bySort)
            .map((f) => ({ ...f, options: (f.work_type_field_options || []).slice().sort(bySort) })),
        })),
    }));
}

export function useCatalogAdmin() {
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const reload = useCallback(async () => {
    try {
      setCatalog(await loadAdminCatalog());
      setLoadError("");
    } catch (err) {
      console.error("Load admin catalog failed:", err);
      setLoadError("โหลดรายการชิ้นงานไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { catalog, loading, loadError, reload };
}

// ครอบทุกการกระทำ: กันกดซ้ำ, จับ error, โหลดข้อมูลใหม่หลังสำเร็จ
export function useAdminAction(afterChange) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { type: "ok" | "error", text }

  const run = useCallback(
    async (fn, okText) => {
      setBusy(true);
      setMsg(null);
      try {
        await fn();
        await afterChange();
        if (okText) setMsg({ type: "ok", text: okText });
        return true;
      } catch (err) {
        console.error("Catalog action failed:", err);
        setMsg({ type: "error", text: err.userMessage || "บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" });
        return false;
      } finally {
        setBusy(false);
      }
    },
    [afterChange]
  );

  return { busy, msg, setMsg, run };
}

// ===== ทั่วไป =====
export const setActive = (kind, id, active) => mutate(supabase.from(TABLE[kind]).update({ is_active: active }).eq(PK[kind], id));

export async function reorderRows(kind, orderedIds) {
  await Promise.all(
    orderedIds.map((id, i) => mutate(supabase.from(TABLE[kind]).update({ sort_order: i + 1 }).eq(PK[kind], id)))
  );
}

// สลับตำแหน่งในลิสต์ แล้วคืน id ที่เรียงใหม่ (หรือ null ถ้าขยับไม่ได้)
export function movedIds(list, kind, idx, dir) {
  const ids = list.map((x) => x[PK[kind]]);
  const j = idx + dir;
  if (j < 0 || j >= ids.length) return null;
  [ids[idx], ids[j]] = [ids[j], ids[idx]];
  return ids;
}

// ===== หมวดหมู่ (2.1) =====
export async function addCategory(catalog, name) {
  const clean = name.trim();
  if (!clean) throw userError("กรุณากรอกชื่อหมวดหมู่");
  if (catalog.some((c) => sameName(c.name, clean))) throw userError(`มีหมวดหมู่ชื่อ "${clean}" อยู่แล้ว`);
  await one(supabase.from(TABLE.category).insert({ name: clean, sort_order: nextOrder(catalog) }));
}

export async function renameCategory(catalog, id, name) {
  const clean = name.trim();
  if (!clean) throw userError("ชื่อหมวดหมู่ต้องไม่ว่าง");
  if (catalog.some((c) => String(c[PK.category]) !== String(id) && sameName(c.name, clean))) {
    throw userError(`มีหมวดหมู่ชื่อ "${clean}" อยู่แล้ว`);
  }
  await mutate(supabase.from(TABLE.category).update({ name: clean }).eq(PK.category, id));
}

// ===== ชิ้นงานย่อย (2.1) =====
async function copyFields(source, newTypeId) {
  const createdFieldIds = [];
  try {
    for (const f of source.fields.filter((x) => x.is_active !== false)) {
      const nf = await one(
        supabase
          .from(TABLE.field)
          .insert({
            [FK_TYPE]: newTypeId,
            field_key: f.field_key,
            label: f.label,
            depends_on: f.depends_on,
            sort_order: f.sort_order,
          })
          .select()
          .single()
      );
      createdFieldIds.push(nf[PK.field]);

      const opts = f.options
        .filter((o) => o.is_active !== false)
        .map((o) => ({ [FK_FIELD]: nf[PK.field], value: o.value, sort_order: o.sort_order }));
      if (opts.length > 0) {
        const { error } = await supabase.from(TABLE.option).insert(opts);
        if (error) throw error;
      }
    }
  } catch (err) {
    // ล้างของที่สร้างค้างไว้ ไม่ให้เหลือข้อมูลครึ่ง ๆ กลาง ๆ
    if (createdFieldIds.length > 0) {
      await supabase.from(TABLE.option).delete().in(FK_FIELD, createdFieldIds);
      await supabase.from(TABLE.field).delete().in(PK.field, createdFieldIds);
    }
    throw err;
  }
}

// copyFromType = ชิ้นงานย่อยต้นแบบ (object จาก catalog) หรือ null
export async function addType(catalog, categoryId, name, copyFromType) {
  const clean = name.trim();
  if (!clean) throw userError("กรุณากรอกชื่อชิ้นงานย่อย");
  const allTypes = catalog.flatMap((c) => c.types);
  // ระบบอ้างอิงชิ้นงานด้วยชื่อ จึงห้ามซ้ำกันข้ามทุกหมวด
  if (allTypes.some((t) => sameName(t.name, clean))) {
    throw userError(`มีชิ้นงานย่อยชื่อ "${clean}" อยู่แล้ว (ชื่อต้องไม่ซ้ำกันทุกหมวด)`);
  }
  const category = catalog.find((c) => String(c[PK.category]) === String(categoryId));
  if (!category) throw userError("ไม่พบหมวดหมู่ที่เลือก");

  const row = await one(
    supabase
      .from(TABLE.type)
      .insert({ [FK_CATEGORY]: categoryId, name: clean, sort_order: nextOrder(category.types) })
      .select()
      .single()
  );

  if (copyFromType) {
    try {
      await copyFields(copyFromType, row[PK.type]);
    } catch (err) {
      await supabase.from(TABLE.type).delete().eq(PK.type, row[PK.type]);
      throw err;
    }
  }
}

export async function renameType(catalog, id, name) {
  const clean = name.trim();
  if (!clean) throw userError("ชื่อชิ้นงานย่อยต้องไม่ว่าง");
  const allTypes = catalog.flatMap((c) => c.types);
  if (allTypes.some((t) => String(t[PK.type]) !== String(id) && sameName(t.name, clean))) {
    throw userError(`มีชิ้นงานย่อยชื่อ "${clean}" อยู่แล้ว`);
  }
  await mutate(supabase.from(TABLE.type).update({ name: clean }).eq(PK.type, id));
}

// ===== ช่องรายละเอียด (2.2) =====
export const FIELD_KEY_PATTERN = /^[A-Za-z][A-Za-z0-9_]*$/;

// parentKey จะกลายเป็นช่องแม่ของ childKey แล้ววนเป็นวงกลมหรือไม่
export function wouldCycle(fields, childKey, parentKey) {
  let cur = parentKey;
  const seen = new Set();
  while (cur && !seen.has(cur)) {
    if (cur === childKey) return true;
    seen.add(cur);
    cur = fields.find((f) => f.field_key === cur)?.depends_on || null;
  }
  return false;
}

// type = ชิ้นงานย่อย (object จาก catalog), input = { label, key, dependsOn, options: string[] }
export async function addField(type, input) {
  const label = input.label.trim();
  const key = input.key.trim();
  if (!label) throw userError("กรุณากรอกชื่อช่อง (เช่น สีอลูมิเนียม)");
  if (!FIELD_KEY_PATTERN.test(key)) {
    throw userError("รหัสช่องต้องเป็นตัวอักษรอังกฤษ/ตัวเลข/ขีดล่าง และขึ้นต้นด้วยตัวอักษร (เช่น glassColor)");
  }
  if (type.fields.some((f) => f.field_key === key)) throw userError(`รหัสช่อง "${key}" ถูกใช้แล้วในชิ้นงานนี้`);

  const options = [];
  input.options.forEach((raw) => {
    const v = raw.trim();
    if (v && !options.some((o) => sameName(o, v))) options.push(v);
  });
  if (options.length === 0) throw userError("ต้องมีตัวเลือกอย่างน้อย 1 ตัวเลือก (พิมพ์ 1 บรรทัดต่อ 1 ตัวเลือก)");

  const dependsOn = input.dependsOn || null;
  if (dependsOn && !type.fields.some((f) => f.field_key === dependsOn)) {
    throw userError("ช่องที่เลือกให้ขึ้นกับ ไม่มีอยู่ในชิ้นงานนี้");
  }

  const row = await one(
    supabase
      .from(TABLE.field)
      .insert({
        [FK_TYPE]: type[PK.type],
        field_key: key,
        label,
        depends_on: dependsOn,
        sort_order: nextOrder(type.fields),
      })
      .select()
      .single()
  );

  const { error } = await supabase
    .from(TABLE.option)
    .insert(options.map((value, i) => ({ [FK_FIELD]: row[PK.field], value, sort_order: i + 1 })));
  if (error) {
    await supabase.from(TABLE.field).delete().eq(PK.field, row[PK.field]);
    throw error;
  }
}

export async function renameField(id, label) {
  const clean = label.trim();
  if (!clean) throw userError("ชื่อช่องต้องไม่ว่าง");
  await mutate(supabase.from(TABLE.field).update({ label: clean }).eq(PK.field, id));
}

export async function setFieldDependsOn(type, field, dependsOn) {
  if (dependsOn && wouldCycle(type.fields, field.field_key, dependsOn)) {
    throw userError("เลือกไม่ได้ เพราะช่องจะขึ้นกับกันเองเป็นวงกลม");
  }
  await mutate(
    supabase.from(TABLE.field).update({ depends_on: dependsOn || null }).eq(PK.field, field[PK.field])
  );
}

export function assertCanDisableField(type, field) {
  const children = type.fields.filter((f) => f.is_active !== false && f.depends_on === field.field_key);
  if (children.length > 0) {
    throw userError(`ปิดไม่ได้ เพราะช่อง "${children.map((c) => c.label).join(", ")}" ยังขึ้นกับช่องนี้ ให้ปิดหรือย้ายช่องนั้นก่อน`);
  }
}

// ===== ตัวเลือก (2.3) =====
export async function addOption(field, value) {
  const clean = value.trim();
  if (!clean) throw userError("กรุณากรอกตัวเลือก");
  if (field.options.some((o) => sameName(o.value, clean))) throw userError(`มีตัวเลือก "${clean}" อยู่แล้ว`);
  await one(
    supabase.from(TABLE.option).insert({ [FK_FIELD]: field[PK.field], value: clean, sort_order: nextOrder(field.options) })
  );
}

export async function renameOption(field, id, value) {
  const clean = value.trim();
  if (!clean) throw userError("ตัวเลือกต้องไม่ว่าง");
  if (field.options.some((o) => String(o[PK.option]) !== String(id) && sameName(o.value, clean))) {
    throw userError(`มีตัวเลือก "${clean}" อยู่แล้ว`);
  }
  await mutate(supabase.from(TABLE.option).update({ value: clean }).eq(PK.option, id));
}

export function assertCanDisableOption(field, option) {
  const activeCount = field.options.filter((o) => o.is_active !== false).length;
  if (option.is_active !== false && field.is_active !== false && activeCount <= 1) {
    throw userError("ปิดไม่ได้ เพราะช่องนี้ต้องมีตัวเลือกที่เปิดใช้งานอย่างน้อย 1 ตัวเลือก");
  }
}