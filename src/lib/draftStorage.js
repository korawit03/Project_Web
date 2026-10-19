/**
 * ระบบจัดการแบบร่างอัตโนมัติ (Auto-save Draft) สำหรับ SiteWorkForm
 * - ใช้ IndexedDB เป็นหลัก เพื่อให้สามารถบันทึก Binary Data (File / Blob รูปถ่าย) ได้โดยตรง
 * - มี fallback ไปยัง localStorage สำหรับข้อมูลข้อความ
 * - ตรวจสอบว่ามีข้อมูลที่มีความหมายก่อนทำการบันทึก
 */

const DB_NAME = "site_work_db";
const DB_VERSION = 1;
const STORE_NAME = "form_drafts";
const DRAFT_KEY = "current_site_work_draft";

function openDb() {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      resolve(null);
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
}

// ตรวจสอบว่าฟอร์มมีข้อมูลที่ผู้ใช้กรอกจริงหรือไม่
export function hasDraftContent(draft) {
  if (!draft) return false;
  if (draft.projectTitle && draft.projectTitle.trim().length > 0) return true;
  if (draft.selectedCustomerId && draft.selectedCustomerId !== "") return true;
  if (draft.selectedLocationId && draft.selectedLocationId !== "") return true;

  const items = draft.items || [];
  return items.some((it) => {
    if (it.itemName && it.itemName.trim().length > 0) return true;
    if (it.mainWork && it.mainWork.trim().length > 0) return true;
    if (it.positionNote && it.positionNote.trim().length > 0) return true;
    if (it.positionDetail && it.positionDetail.trim().length > 0) return true;
    if (it.note && it.note.trim().length > 0) return true;
    if (it.workDetail && it.workDetail.trim().length > 0) return true;
    if (it.positionPhotos && it.positionPhotos.length > 0) return true;
    if (it.workPhotos && it.workPhotos.length > 0) return true;
    if (it.answers && Object.keys(it.answers).length > 0) return true;
    return false;
  });
}

// บันทึกแบบร่างลง IndexedDB
export async function saveFormDraft(draftData) {
  if (!hasDraftContent(draftData)) {
    return false;
  }

  try {
    const db = await openDb();

    // ทำความสะอาด items และเก็บ File/Blob ไว้ใน object
    const cleanItems = (draftData.items || []).map((item) => ({
      id: item.id,
      itemName: item.itemName || "",
      mainWork: item.mainWork || "",
      answers: item.answers || {},
      positionNote: item.positionNote || "",
      positionDetail: item.positionDetail || "",
      workDetail: item.workDetail || "",
      note: item.note || "",
      status: item.status || "pending",
      positionPhotos: (item.positionPhotos || []).map((p) => ({
        id: p.id,
        name: p.name,
        file: p.file || null,
        originalSize: p.originalSize,
        compressedSize: p.compressedSize,
        savingsPercent: p.savingsPercent,
      })),
      workPhotos: (item.workPhotos || []).map((p) => ({
        id: p.id,
        name: p.name,
        file: p.file || null,
        originalSize: p.originalSize,
        compressedSize: p.compressedSize,
        savingsPercent: p.savingsPercent,
      })),
    }));

    const record = {
      selectedCustomerId: draftData.selectedCustomerId || "",
      projectName: draftData.projectName || "",
      projectTitle: draftData.projectTitle || "",
      projectDate: draftData.projectDate || "",
      selectedLocationId: draftData.selectedLocationId || "",
      showCreateNew: Boolean(draftData.showCreateNew),
      items: cleanItems,
      savedAt: Date.now(),
    };

    if (db) {
      return new Promise((resolve) => {
        try {
          const tx = db.transaction(STORE_NAME, "readwrite");
          const store = tx.objectStore(STORE_NAME);
          const req = store.put(record, DRAFT_KEY);
          req.onsuccess = () => resolve(true);
          req.onerror = () => resolve(false);
        } catch {
          resolve(false);
        }
      });
    }

    // Fallback: localStorage (เก็บเฉพาะ metadata ข้อความ)
    try {
      const textOnly = {
        ...record,
        items: cleanItems.map((it) => ({
          ...it,
          positionPhotos: it.positionPhotos.map((p) => ({ id: p.id, name: p.name })),
          workPhotos: it.workPhotos.map((p) => ({ id: p.id, name: p.name })),
        })),
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(textOnly));
      return true;
    } catch {
      return false;
    }
  } catch (err) {
    console.warn("Auto-save draft error:", err);
    return false;
  }
}

// ตรวจสอบและดึงข้อมูลแบบร่างล่าสุด
export async function getFormDraft() {
  try {
    const db = await openDb();
    let record = null;

    if (db) {
      record = await new Promise((resolve) => {
        try {
          const tx = db.transaction(STORE_NAME, "readonly");
          const store = tx.objectStore(STORE_NAME);
          const req = store.get(DRAFT_KEY);
          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => resolve(null);
        } catch {
          resolve(null);
        }
      });
    }

    if (!record) {
      const local = localStorage.getItem(DRAFT_KEY);
      if (local) {
        try {
          record = JSON.parse(local);
        } catch {}
      }
    }

    if (!record || !hasDraftContent(record)) {
      return null;
    }

    // สร้าง Blob URLs คืนสำหรับรูปภาพที่เก็บไว้ใน IndexedDB
    const restoredItems = (record.items || []).map((item) => ({
      ...item,
      positionPhotos: (item.positionPhotos || []).map((p) => ({
        ...p,
        url: p.file instanceof Blob ? URL.createObjectURL(p.file) : "",
      })),
      workPhotos: (item.workPhotos || []).map((p) => ({
        ...p,
        url: p.file instanceof Blob ? URL.createObjectURL(p.file) : "",
      })),
    }));

    return {
      ...record,
      items: restoredItems,
    };
  } catch (err) {
    console.warn("Get form draft error:", err);
    return null;
  }
}

// ลบแบบร่าง (เมื่อบันทึกงานสำเร็จ หรือผู้ใช้เลือกทิ้งแบบร่าง)
export async function clearFormDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
    const db = await openDb();
    if (db) {
      try {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        store.delete(DRAFT_KEY);
      } catch {}
    }
    return true;
  } catch {
    return false;
  }
}

// ฟอร์แมตเวลาที่บันทึกแบบร่าง
export function formatDraftTime(timestamp) {
  if (!timestamp) return "";
  try {
    const d = new Date(timestamp);
    const timeStr = d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
    const isToday = new Date().toDateString() === d.toDateString();
    if (isToday) {
      return `วันนี้ ${timeStr} น.`;
    }
    return `${d.toLocaleDateString("th-TH", { day: "numeric", month: "short" })} ${timeStr} น.`;
  } catch {
    return "";
  }
}
