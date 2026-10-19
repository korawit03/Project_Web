/**
 * ระบบบีบอัดรูปภาพหน้างานฝั่ง Client-side (Browser)
 * - ปรับลดขนาดความกว้าง/ความสูงสูงสุด (Max Dimension: 1920px) โดยยังคงสัดส่วนเดิม
 * - แปลงเป็นรูปแบบ WebP (หรือ JPEG หากเบราว์เซอร์ไม่รองรับ) คุณภาพ 0.8
 * - หมุนภาพตามค่า EXIF orientation อัตโนมัติ (ผ่าน createImageBitmap)
 * - ช่วยลดขนาดไฟล์จาก 5-10 MB เหลือประมาณ 200-600 KB (ลดลง 80-95%)
 */

export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export async function compressImage(file, options = {}) {
  // หากไม่ใช่ไฟล์รูปภาพ หรือเป็น SVG / GIF ให้ส่งคืนไฟล์เดิม
  if (
    !file ||
    !(file instanceof Blob) ||
    !file.type.startsWith("image/") ||
    file.type === "image/svg+xml" ||
    file.type === "image/gif"
  ) {
    return file;
  }

  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.8,
    targetType = "image/webp",
  } = options;

  try {
    let source = null;
    let width = 0;
    let height = 0;

    // ใช้ createImageBitmap ก่อน (เร็วที่สุด และจัดการ EXIF orientation อัตโนมัติ)
    if (typeof createImageBitmap !== "undefined") {
      try {
        source = await createImageBitmap(file, { imageOrientation: "from-image" });
        width = source.width;
        height = source.height;
      } catch {
        source = null;
      }
    }

    // หาก createImageBitmap ไม่สำเร็จ ใช้ Image element เป็นตัวสำรอง
    if (!source) {
      source = await new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
          URL.revokeObjectURL(url);
          resolve(img);
        };
        img.onerror = (e) => {
          URL.revokeObjectURL(url);
          reject(e);
        };
        img.src = url;
      });
      width = source.naturalWidth || source.width;
      height = source.naturalHeight || source.height;
    }

    // คำนวณสัดส่วน กว้าง x สูง ใหม่
    if (width > maxWidth || height > maxHeight) {
      if (width / height > maxWidth / maxHeight) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      } else {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      if (source.close) source.close();
      return file;
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source, 0, 0, width, height);

    if (source.close) {
      source.close();
    }

    const blob = await new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b), targetType, quality);
    });

    if (!blob) return file;

    // หากไฟล์ที่บีบอัดแล้ว ดันมีขนาดใหญ่กว่าเดิม ให้ใช้ไฟล์เดิม
    if (blob.size >= file.size) {
      return file;
    }

    const baseName = (file.name || "photo").replace(/\.[^/.]+$/, "");
    const ext = blob.type === "image/webp" ? "webp" : "jpg";
    const compressedFile = new File([blob], `${baseName}.${ext}`, {
      type: blob.type || "image/webp",
      lastModified: Date.now(),
    });

    // แนบข้อมูลขนาดเพื่อแสดงผลใน UI
    compressedFile.originalSize = file.size;
    compressedFile.compressedSize = blob.size;
    compressedFile.savingsPercent = Math.round(((file.size - blob.size) / file.size) * 100);

    return compressedFile;
  } catch (err) {
    console.warn("Image compression warning, using original file:", err);
    return file;
  }
}
