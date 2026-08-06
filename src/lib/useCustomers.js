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

      const existing = customers.find((c) => c.name.trim().toLowerCase() === trimmedName.toLowerCase());
      if (existing) return existing;

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
    [customers]
  );

  return { customers, loading, loadCustomers, findOrCreateCustomer };
}