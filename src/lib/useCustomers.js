import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase.js";

// ดึงลูกค้าพร้อมสถานที่ทั้งหมด (ตาราง customer_locations)
const CUSTOMER_SELECT = "*, customer_locations(*)";

const sortByName = (list) => list.slice().sort((a, b) => a.name.localeCompare(b.name, "th"));

// แปลง customer_locations -> locations (เรียงตาม sort_order)
const normalize = (row) => ({
  ...row,
  locations: (row.customer_locations || []).slice().sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
});

// ซิงก์สถานที่ของลูกค้าให้ตรงกับรายการที่ส่งมา: แถวที่มี location_id = อัปเดต, ไม่มี = เพิ่มใหม่, ที่หายไป = ลบ
async function syncLocations(customerId, locations) {
  const { data: existing, error: existingError } = await supabase
    .from("customer_locations")
    .select("location_id")
    .eq("customer_id", customerId);
  if (existingError) throw existingError;

  const keepIds = new Set(locations.filter((l) => l.location_id != null).map((l) => String(l.location_id)));
  const removedIds = (existing || []).map((r) => r.location_id).filter((id) => !keepIds.has(String(id)));

  if (removedIds.length > 0) {
    const { error } = await supabase.from("customer_locations").delete().in("location_id", removedIds);
    if (error) throw error;
  }

  for (let i = 0; i < locations.length; i++) {
    const l = locations[i];
    const payload = {
      name: l.name.trim(),
      latitude: l.latitude ?? null,
      longitude: l.longitude ?? null,
      sort_order: i,
    };

    if (l.location_id != null) {
      const { error } = await supabase.from("customer_locations").update(payload).eq("location_id", l.location_id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("customer_locations").insert({ ...payload, customer_id: customerId });
      if (error) throw error;
    }
  }
}

async function fetchCustomer(customerId) {
  const { data, error } = await supabase
    .from("customers")
    .select(CUSTOMER_SELECT)
    .eq("customer_id", customerId)
    .single();
  if (error) throw error;
  return normalize(data);
}

export function useCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("customers").select(CUSTOMER_SELECT).order("name", { ascending: true });

    if (error) {
      console.error("Load customers failed:", error);
      setLoading(false);
      return;
    }

    setCustomers(data.map(normalize));
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  // หาลูกค้าเดิมจากชื่อ ถ้าไม่มีให้สร้างใหม่ (ใช้ตอนแก้โครงงาน)
  const findOrCreateCustomer = useCallback(async (name, phone = "") => {
    const trimmedName = name.trim();

    const { data: dbMatch, error: dbMatchError } = await supabase
      .from("customers")
      .select(CUSTOMER_SELECT)
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
          .eq("customer_id", dbMatch.customer_id)
          .select(CUSTOMER_SELECT)
          .single();
        if (!updateError && updated) {
          const row = normalize(updated);
          setCustomers((prev) => sortByName([...prev.filter((c) => c.customer_id !== row.customer_id), row]));
          return row;
        }
      }
      return normalize(dbMatch);
    }

    const { data, error } = await supabase
      .from("customers")
      .insert({ name: trimmedName, phone: phone.trim() || null })
      .select(CUSTOMER_SELECT)
      .single();

    if (error) {
      console.error("Create customer failed:", error);
      throw error;
    }

    const row = normalize(data);
    setCustomers((prev) => sortByName([...prev, row]));
    return row;
  }, []);

  // สร้างลูกค้าใหม่พร้อมสถานที่ (locations = [{ name, latitude, longitude }, ...])
  const createCustomer = useCallback(async ({ name, phone, locations = [] }) => {
    const { data, error } = await supabase
      .from("customers")
      .insert({ name: name.trim(), phone: phone?.trim() || null })
      .select()
      .single();

    if (error) {
      console.error("Create customer failed:", error);
      throw error;
    }

    try {
      await syncLocations(data.customer_id, locations);
    } catch (err) {
      console.error("Create customer locations failed:", err);
      // สร้างลูกค้าสำเร็จแล้วแต่สถานที่พลาด: ลบลูกค้าทิ้งเพื่อไม่ให้เหลือข้อมูลครึ่งๆ กลางๆ
      await supabase.from("customers").delete().eq("customer_id", data.customer_id);
      throw err;
    }

    const full = await fetchCustomer(data.customer_id);
    setCustomers((prev) => sortByName([...prev, full]));
    return full;
  }, []);

  // อัปเดตเบอร์โทรของลูกค้าตรงๆ (ใช้ในฟอร์มโครงงาน)
  const updateCustomerPhone = useCallback(async (customerId, phone) => {
    const { data, error } = await supabase
      .from("customers")
      .update({ phone: phone?.trim() || null })
      .eq("customer_id", customerId)
      .select(CUSTOMER_SELECT)
      .single();

    if (error) {
      console.error("Update customer phone failed:", error);
      throw error;
    }

    const row = normalize(data);
    setCustomers((prev) => prev.map((c) => (c.customer_id === customerId ? row : c)));
    return row;
  }, []);

  // แก้ไขข้อมูลลูกค้า + สถานที่ทั้งหมด (หน้า "รายละเอียดลูกค้า")
  const updateCustomer = useCallback(async (customerId, { name, phone, locations = [] }) => {
    const { error } = await supabase
      .from("customers")
      .update({ name: name.trim(), phone: phone?.trim() || null })
      .eq("customer_id", customerId);

    if (error) {
      console.error("Update customer failed:", error);
      throw error;
    }

    await syncLocations(customerId, locations);

    const full = await fetchCustomer(customerId);
    setCustomers((prev) => sortByName(prev.map((c) => (c.customer_id === customerId ? full : c))));
    return full;
  }, []);

  return {
    customers,
    loading,
    loadCustomers,
    findOrCreateCustomer,
    updateCustomerPhone,
    createCustomer,
    updateCustomer,
  };
}