import { supabase } from "./supabase.js";

// อัปโหลดไฟล์รูปหนึ่งรูปขึ้น Supabase Storage แล้วคืน public URL
export async function uploadPhoto(file, folder = "misc") {
  const ext = file.name.split(".").pop();
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage.from("site-photos").upload(path, file);
  if (error) throw error;

  const { data } = supabase.storage.from("site-photos").getPublicUrl(path);
  return { url: data.publicUrl, path };
}

// อัปโหลดหลายไฟล์พร้อมกัน คืน array ของ { url, path, name }
export async function uploadPhotos(photoItems, folder = "misc") {
  const results = [];
  for (const p of photoItems) {
    if (p.url && p.url.startsWith("http") && !p.file) {
      // รูปเดิมที่อัปโหลดไปแล้ว (โหมดแก้ไข) ไม่ต้องอัปซ้ำ
      results.push({ url: p.url, path: p.path, name: p.name });
      continue;
    }
    const { url, path } = await uploadPhoto(p.file, folder);
    results.push({ url, path, name: p.name });
  }
  return results;
}

// ลบรูปออกจาก storage ตาม path
export async function deletePhotos(photoItems) {
  const paths = photoItems.map((p) => p.path).filter(Boolean);
  if (paths.length === 0) return;
  const { error } = await supabase.storage.from("site-photos").remove(paths);
  if (error) console.error("Delete photos failed:", error);
}