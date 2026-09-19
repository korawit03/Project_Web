// ค่าที่ขึ้นต้นด้วย "ไม่มี" (เช่น "ไม่มีกระจก") ถือว่าไม่ต้องเลือกช่องที่ขึ้นกับมัน
export const isNoneValue = (v) => typeof v === "string" && v.trim().startsWith("ไม่มี");

// ช่องที่มี dependsOn จะแสดงเมื่อช่องแม่ถูกเลือกแล้ว และไม่ใช่ "ไม่มี..."
export function isFieldVisible(field, answers = {}) {
  if (!field.dependsOn) return true;
  const parent = answers[field.dependsOn];
  return Boolean(parent) && !isNoneValue(parent);
}

export function validateItem(item, workCatalog) {
  const errors = {};
  if (!item.mainWork) errors.mainWork = true;
  if (!item.positionNote || !item.positionNote.trim()) errors.positionNote = true;

  if (item.mainWork && workCatalog[item.mainWork]) {
    const answerErrors = {};
    workCatalog[item.mainWork].fields.forEach((field) => {
      if (!isFieldVisible(field, item.answers)) return; // ซ่อนอยู่ = ไม่ต้องบังคับ
      if (!item.answers?.[field.key]) answerErrors[field.key] = true;
    });
    if (Object.keys(answerErrors).length > 0) errors.answers = answerErrors;
  }
  return errors;
}

export function validateForm(projectName, items, workCatalog) {
  const errors = { projectName: !projectName.trim(), items: {} };
  items.forEach((it) => {
    const itemErrors = validateItem(it, workCatalog);
    if (Object.keys(itemErrors).length > 0) errors.items[it.id] = itemErrors;
  });
  return errors;
}

export function hasErrors(errors) {
  return errors.projectName || Object.keys(errors.items).length > 0;
}

// รวมข้อความแจ้งเตือนทั้งหมด สำหรับแสดงเป็นกล่องสรุปด้านบนฟอร์ม
export function buildErrorMessages(errors, items, workCatalog) {
  const msgs = [];
  if (errors.projectName) msgs.push('"ชื่อโครงการ / ข้อมูลลูกค้า" ยังไม่ได้กรอก');

  items.forEach((it, idx) => {
    const err = errors.items[it.id];
    if (!err) return;
    const label = `ชิ้นงานย่อยรายการที่ ${idx + 1}`;
    if (err.mainWork) msgs.push(`${label}: ยังไม่ได้เลือกชิ้นงานหลัก`);
    if (err.positionNote) msgs.push(`${label}: ยังไม่ได้ระบุรายละเอียดหน้างาน`);
    if (err.answers) {
      const catalogEntry = workCatalog[it.mainWork];
      Object.keys(err.answers).forEach((key) => {
        const field = catalogEntry?.fields.find((f) => f.key === key);
        msgs.push(`${label}: ยังไม่ได้เลือก${field?.label || key}`);
      });
    }
  });
  
  return msgs;
}