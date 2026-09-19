import { supabase } from "./supabase.js";
import { uploadPhotos } from "./storage.js";
import { DEFAULT_STATUS } from "./status.js";

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
      status: item.status || DEFAULT_STATUS,
      sort_order: sortOrder,
      item_name: item.itemName?.trim() || null,
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

export async function saveAllWorkItems(items, projectId, workCatalog) {
  return Promise.all(items.map((item, idx) => saveWorkItem(item, idx, projectId, workCatalog)));
}

// อัปเดตสถานะของชิ้นงานเดียวแบบเร็ว ใช้ในหน้าสรุปสถานะ ไม่ต้อง submit ทั้งโปรเจค
export async function updateItemStatus(itemId, status) {
  const { error } = await supabase.from("job_items").update({ status }).eq("item_id", itemId);
  if (error) throw error;
  return true;
}