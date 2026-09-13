import { supabase } from "./supabase.js";
import { uploadPhotos } from "./storage.js";

// บันทึกชิ้นงานย่อย 1 รายการ: upload รูป + insert job_items + insert site_photos
// ใช้ร่วมกันทั้งตอนสร้างโปรเจกต์ใหม่ (SiteWorkForm) และตอนแก้ไขโปรเจกต์เดิม (App/CustomerListPage)
// คืนค่า job_items row ที่บันทึกสำเร็จ
export async function saveWorkItem(item, sortOrder, projectId, workCatalog) {
  const category = workCatalog[item.mainWork]?.category || "";

  const positionPhotosUploaded = await uploadPhotos(item.positionPhotos, "position");
  const workPhotosUploaded = await uploadPhotos(item.workPhotos, "work");

  const { data: jobItemRow, error: jobItemError } = await supabase
    .from("job_items")
    .insert({
      project_id: projectId,
      category,
      sub_type: item.mainWork,
      position_note: item.positionNote,
      details: item.answers,
      note: item.note,
      sort_order: sortOrder,
    })
    .select()
    .single();

  if (jobItemError) throw jobItemError;

  const photoRows = [
    ...positionPhotosUploaded.map((p, idx) => ({
      project_id: projectId,
      item_id: jobItemRow.item_id,
      photo_type: "position",
      image_url: p.url,
      storage_path: p.path,
      sort_order: idx,
    })),
    ...workPhotosUploaded.map((p, idx) => ({
      project_id: projectId,
      item_id: jobItemRow.item_id,
      photo_type: "work",
      image_url: p.url,
      storage_path: p.path,
      sort_order: idx,
    })),
  ];

  if (photoRows.length > 0) {
    const { error: photoError } = await supabase.from("site_photos").insert(photoRows);
    if (photoError) throw photoError;
  }

  return jobItemRow;
}

// บันทึกชิ้นงานย่อยทั้งหมดของโปรเจกต์ (ใช้ตอนสร้างใหม่ หรือหลังลบของเก่าตอนแก้ไข)
export async function saveAllWorkItems(items, projectId, workCatalog) {
  return Promise.all(items.map((item, idx) => saveWorkItem(item, idx, projectId, workCatalog)));
}