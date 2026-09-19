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
  // ใช้ตอนกรอกฟอร์มสร้างชิ้นงาน (SiteWorkForm) เท่านั้น
  const findOrCreateCustomer = useCallback(
    async (name, phone = "") => {
      const trimmedName = name.trim();

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
        return dbMatch;
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

  // สร้างลูกค้าใหม่แบบตรงๆ (ไม่เช็คชื่อซ้ำ) — ใช้ตอนกรอกฟอร์ม "เพิ่มลูกค้าใหม่" โดยเฉพาะ
  // รับ location/latitude/longitude เพิ่ม เพราะหน้านี้ให้ปักหมุด GPS ของลูกค้าได้ตรงๆ
  const createCustomer = useCallback(async ({ name, phone, location, latitude, longitude }) => {
    const { data, error } = await supabase
      .from("customers")
      .insert({
        name: name.trim(),
        phone: phone?.trim() || null,
        location: location?.trim() || null,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error("Create customer failed:", error);
      throw error;
    }

    setCustomers((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name, "th")));
    return data;
  }, []);
  // อัปเดตเบอร์โทรของลูกค้าตรงๆ ใช้ตอนแก้เบอร์โทรจากฟอร์มสร้าง/ดูโครงงาน
  const updateCustomerPhone = useCallback(async (customerId, phone) => {
    const { data, error } = await supabase
      .from("customers")
      .update({ phone: phone?.trim() || null })
      .eq("customer_id", customerId)
      .select()
      .single();

    if (error) {
      console.error("Update customer phone failed:", error);
      throw error;
    }

    setCustomers((prev) => prev.map((c) => (c.customer_id === customerId ? data : c)));
    return data;
  }, []);
  return { customers, loading, loadCustomers, findOrCreateCustomer,updateCustomerPhone, createCustomer };
}