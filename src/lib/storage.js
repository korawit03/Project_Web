import { supabase } from "./supabase.js";
import { compressImage } from "./imageCompression.js";

// อัปโหลดไฟล์รูปหนึ่งรูปขึ้น Supabase Storage แล้วคืน public URL
export async function uploadPhoto(file, folder = "misc") {
  // บีบอัดรูปก่อนอัปโหลดเสมอ (ป้องกันกรณีได้ไฟล์ดิบที่ยังไม่ได้บีบอัด)
  const processedFile = await compressImage(file);

  const ext = processedFile.name.split(".").pop();
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage.from("site-photos").upload(path, processedFile, {
    contentType: processedFile.type || "image/webp",
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from("site-photos").getPublicUrl(path);
  return { url: data.publicUrl, path, name: processedFile.name };
}

// อัปโหลดหลายไฟล์พร้อมกัน คืน array ของ { url, path, name }
export async function uploadPhotos(photoItems, folder = "misc") {
  if (!photoItems || photoItems.length === 0) return [];

  // ใช้ Promise.all เพื่ออัปโหลดแบบขนาน (Concurrent) ช่วยให้เร็วกว่าเดิมหลายเท่า
  const uploadPromises = photoItems.map(async (p) => {
    if (p.url && p.url.startsWith("http") && !p.file) {
      // รูปเดิมที่อัปโหลดไปแล้ว (โหมดแก้ไข) ไม่ต้องอัปซ้ำ
      return { url: p.url, path: p.path, name: p.name };
    }
    const { url, path } = await uploadPhoto(p.file, folder);
    return { url, path, name: p.name };
  });

  return Promise.all(uploadPromises);
}

// ลบรูปออกจาก storage ตาม path
export async function deletePhotos(photoItems) {
  const paths = photoItems.map((p) => p.path).filter(Boolean);
  if (paths.length === 0) return;
  const { error } = await supabase.storage.from("site-photos").remove(paths);
  if (error) console.error("Delete photos failed:", error);
}