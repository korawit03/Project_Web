import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase.js";

export function useCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("customers").select("*").order("name", { ascending: true });

    if (error) {
      console.error("Load customers failed:", error);
      setLoading(false);
      return;
    }

    setCustomers(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  // หาลูกค้าเดิมจากชื่อ (เทียบแบบตัดช่องว่าง + ไม่สนตัวพิมพ์เล็ก/ใหญ่)
  // ถ้ายังไม่เคยมีชื่อนี้ในระบบ จะสร้างลูกค้าใหม่ให้อัตโนมัติ
  const findOrCreateCustomer = useCallback(
    async (name, phone = "") => {
      const trimmedName = name.trim();

      // เช็คกับ DB จริงเสมอ (ไม่เชื่อ local state เฉยๆ) กันปัญหา id เก่าที่ถูกลบไปแล้วแต่ cache ยังค้างอยู่
      const { data: dbMatch, error: dbMatchError } = await supabase
        .from("customers")
        .select("*")
        .ilike("name", trimmedName)
        .maybeSingle();

      if (dbMatchError) {
        console.error("Check existing customer failed:", dbMatchError);
        throw dbMatchError;
      }

      if (dbMatch) {
  // ถ้าเบอร์โทรที่กรอกใหม่ต่างจากเดิม ให้อัปเดต
  if (phone.trim() && phone.trim() !== dbMatch.phone) {
    const { data: updated, error: updateError } = await supabase
      .from("customers")
      .update({ phone: phone.trim() })
      .eq("id", dbMatch.id)
      .select()
      .single();
    if (!updateError && updated) {
      setCustomers((prev) => {
        const withoutDup = prev.filter((c) => c.id !== updated.id);
        return [...withoutDup, updated].sort((a, b) => a.name.localeCompare(b.name, "th"));
      });
      return updated;
    }
  }
  // ...โค้ดเดิม
}

      const { data, error } = await supabase
        .from("customers")
        .insert({ name: trimmedName, phone: phone.trim() || null })
        .select()
        .single();

      if (error) {
        console.error("Create customer failed:", error);
        throw error;
      }

      setCustomers((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name, "th")));
      return data;
    },
    []
  );

  return { customers, loading, loadCustomers, findOrCreateCustomer };
}