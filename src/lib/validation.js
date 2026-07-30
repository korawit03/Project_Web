import { WORK_CATALOG } from "./options.js";

// ตรวจ 1 ชิ้นงานย่อย: ชิ้นงานหลัก, ตำแหน่งติดตั้ง, และทุก dropdown รายละเอียด/วัสดุ (ยกเว้นหมายเหตุ)
export function validateItem(item) {
  const errors = {};
  if (!item.mainWork) errors.mainWork = true;
  if (!item.positionNote || !item.positionNote.trim()) errors.positionNote = true;

  if (item.mainWork && WORK_CATALOG[item.mainWork]) {
    const answerErrors = {};
    WORK_CATALOG[item.mainWork].fields.forEach((field) => {
      if (!item.answers?.[field.key]) answerErrors[field.key] = true;
    });
    if (Object.keys(answerErrors).length > 0) errors.answers = answerErrors;
  }

  return errors;
}

export function validateForm(projectName, items) {
  const errors = { projectName: !projectName.trim(), items: {} };
  items.forEach((it) => {
    const itemErrors = validateItem(it);
    if (Object.keys(itemErrors).length > 0) errors.items[it.id] = itemErrors;
  });
  return errors;
}

export function hasErrors(errors) {
  return errors.projectName || Object.keys(errors.items).length > 0;
}

// รวมข้อความแจ้งเตือนทั้งหมด สำหรับแสดงเป็นกล่องสรุปด้านบนฟอร์ม
export function buildErrorMessages(errors, items) {
  const msgs = [];
  if (errors.projectName) msgs.push('"ชื่อโครงการ / ข้อมูลลูกค้า" ยังไม่ได้กรอก');

  items.forEach((it, idx) => {
    const err = errors.items[it.id];
    if (!err) return;
    const label = `ชิ้นงานย่อยรายการที่ ${idx + 1}`;
    if (err.mainWork) msgs.push(`${label}: ยังไม่ได้เลือกชิ้นงานหลัก`);
    if (err.positionNote) msgs.push(`${label}: ยังไม่ได้ระบุตำแหน่งติดตั้ง`);
    if (err.answers) {
      const catalogEntry = WORK_CATALOG[it.mainWork];
      Object.keys(err.answers).forEach((key) => {
        const field = catalogEntry?.fields.find((f) => f.key === key);
        msgs.push(`${label}: ยังไม่ได้เลือก${field?.label || key}`);
      });
    }
  });

  return msgs;
}