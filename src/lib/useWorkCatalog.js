import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase.js";

// ประกอบข้อมูล nested จาก Supabase ให้เป็น shape เดียวกับ WORK_CATALOG/CATEGORY_ORDER เดิม
function buildCatalog(rows) {
  const categoryOrder = [];
  const workCatalog = {};

  rows
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .forEach((cat) => {
      categoryOrder.push(cat.name);

      (cat.work_types || [])
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order)
        .forEach((wt) => {
          workCatalog[wt.name] = {
            category: cat.name,
            fields: (wt.work_type_fields || [])
              .slice()
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((f) => ({
                key: f.field_key,
                label: f.label,
                dependsOn: f.depends_on || null,
                options: (f.work_type_field_options || [])
                  .slice()
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((o) => o.value),
              })),
          };
        });
    });

  return { workCatalog, categoryOrder };
}

export function useWorkCatalog() {
  const [workCatalog, setWorkCatalog] = useState({});
  const [categoryOrder, setCategoryOrder] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    // โหลดเฉพาะรายการที่เปิดใช้งาน (is_active) ทุกชั้น
    const { data, error } = await supabase
      .from("work_categories")
      .select(`
        name, sort_order,
        work_types (
          name, sort_order, is_active,
          work_type_fields (
            field_key, label, depends_on, sort_order, is_active,
            work_type_field_options ( value, sort_order, is_active )
          )
        )
      `)
      .eq("is_active", true)
      .eq("work_types.is_active", true)
      .eq("work_types.work_type_fields.is_active", true)
      .eq("work_types.work_type_fields.work_type_field_options.is_active", true);

    if (error) {
      console.error("Load work catalog failed:", error);
      setLoading(false);
      return;
    }

    const { workCatalog: wc, categoryOrder: co } = buildCatalog(data);
    setWorkCatalog(wc);
    setCategoryOrder(co);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  return { workCatalog, categoryOrder, loading, reload: loadCatalog };
}