import React, { useState, useCallback } from "react";
import { Layers, Plus } from "lucide-react";
import { COLORS } from "../lib/tokens.js";
import {
  PK,
  useCatalogAdmin,
  useAdminAction,
  addCategory,
  renameCategory,
  addType,
  renameType,
  setActive,
  reorderRows,
  movedIds,
} from "../lib/catalogAdmin.js";
import { AdminHeader, Card, Notice, EditableList, AddInline, PlainSelect } from "../components/CatalogAdminUI.jsx";

const RENAME_WARNING =
  "ชิ้นงานที่บันทึกไว้แล้วจะยังใช้ชื่อเดิม และอาจไม่แสดงรายละเอียดเมื่อเปิดแก้ไข ต้องการเปลี่ยนชื่อใช่ไหม?";

// 2.1 ประเภทชิ้นงาน: หมวดหมู่งานหลัก (ประตู/หน้าต่าง) + ชิ้นงานย่อย (บานสวิง/บานเลื่อน)
export default function CatalogTypesPage({ onChanged }) {
  const { catalog, loading, loadError, reload } = useCatalogAdmin();
  const afterChange = useCallback(async () => {
    await reload();
    onChanged?.();
  }, [reload, onChanged]);
  const { busy, msg, run } = useAdminAction(afterChange);

  const [categoryId, setCategoryId] = useState(null);
  const [newType, setNewType] = useState("");
  const [copyFromId, setCopyFromId] = useState("");

  const category = catalog.find((c) => String(c[PK.category]) === String(categoryId)) || null;
  const allTypes = catalog.flatMap((c) => c.types.map((t) => ({ ...t, categoryName: c.name })));

  const categoryItems = catalog.map((c) => ({
    id: c[PK.category],
    label: c.name,
    active: c.is_active !== false,
    raw: c,
  }));
  const typeItems = (category?.types || []).map((t) => ({
    id: t[PK.type],
    label: t.name,
    active: t.is_active !== false,
    raw: t,
  }));

  const move = (list, kind, idx, dir) => {
    const ids = movedIds(list, kind, idx, dir);
    if (ids) run(() => reorderRows(kind, ids));
  };

  const handleAddType = async () => {
    const copyFrom = allTypes.find((t) => String(t[PK.type]) === String(copyFromId)) || null;
    const ok = await run(() => addType(catalog, category[PK.category], newType, copyFrom), "เพิ่มชิ้นงานย่อยเรียบร้อย");
    if (ok) {
      setNewType("");
      setCopyFromId("");
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8">
      <AdminHeader
        icon={Layers}
        title="ประเภทชิ้นงาน"
        subtitle="เพิ่มหมวดหมู่งานหลัก (เช่น ประตู, หน้าต่าง) และชิ้นงานย่อยในแต่ละหมวด"
      />

      <Notice msg={loadError ? { type: "error", text: loadError } : msg} />

      {loading ? (
        <p className="text-sm" style={{ color: COLORS.textMuted }}>
          กำลังโหลดข้อมูล...
        </p>
      ) : (
        <>
          <Card
            title="หมวดหมู่งานหลัก"
            hint="กดชื่อหมวดเพื่อดูและเพิ่มชิ้นงานย่อยข้างใต้ ใช้ 'ปิดใช้งาน' แทนการลบ เพื่อไม่ให้ข้อมูลงานเก่าเสีย"
          >
            <EditableList
              items={categoryItems}
              selectedId={categoryId}
              onSelect={setCategoryId}
              busy={busy}
              renameWarning={RENAME_WARNING}
              onRename={(id, name) => run(() => renameCategory(catalog, id, name), "เปลี่ยนชื่อเรียบร้อย")}
              onToggle={(it) => run(() => setActive("category", it.id, !it.active))}
              onMove={(idx, dir) => move(catalog, "category", idx, dir)}
              emptyText="ยังไม่มีหมวดหมู่ เพิ่มหมวดแรกได้ด้านล่าง"
            />
            <AddInline
              placeholder="ชื่อหมวดหมู่ใหม่ เช่น ประตู"
              buttonLabel="เพิ่มหมวดหมู่"
              busy={busy}
              onAdd={(name) => run(() => addCategory(catalog, name), "เพิ่มหมวดหมู่เรียบร้อย")}
            />
          </Card>

          {category && (
            <Card
              title={`ชิ้นงานย่อยในหมวด "${category.name}"`}
              hint="ชื่อชิ้นงานย่อยต้องไม่ซ้ำกันทุกหมวด ช่องรายละเอียดของชิ้นงานไปเพิ่มต่อที่เมนู 'รายละเอียดชิ้นงาน'"
            >
              <EditableList
                items={typeItems}
                busy={busy}
                renameWarning={RENAME_WARNING}
                onRename={(id, name) => run(() => renameType(catalog, id, name), "เปลี่ยนชื่อเรียบร้อย")}
                onToggle={(it) => run(() => setActive("type", it.id, !it.active))}
                onMove={(idx, dir) => move(category.types, "type", idx, dir)}
                emptyText="หมวดนี้ยังไม่มีชิ้นงานย่อย"
              />

              <div className="space-y-2 rounded-lg border p-3" style={{ borderColor: COLORS.border, background: "#FCFBF8" }}>
                <input
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  placeholder="ชื่อชิ้นงานย่อยใหม่ เช่น บานสวิง"
                  className="w-full rounded-lg border bg-white px-3.5 py-2.5 text-[15px] outline-none"
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
                  onClick={handleAddType}
                  disabled={busy || !newType.trim()}
                  className="flex items-center gap-1.5 rounded-lg px-3.5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                  style={{ background: COLORS.green }}
                >
                  <Plus size={15} />
                  เพิ่มชิ้นงานย่อย
                </button>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}