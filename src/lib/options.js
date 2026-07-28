// แคตตาล็อกชิ้นงาน: แต่ละ "ชิ้นงานหลัก" มีชุดฟิลด์รายละเอียด/วัสดุของตัวเอง
// เวลาผู้ใช้เลือกชิ้นงานหลักใน dropdown แรก ระบบจะไปดึงรายการฟิลด์จากที่นี่มาแสดงต่อ (dependent dropdown)
//
// วิธีแก้ไข/เพิ่มชิ้นงานใหม่: เพิ่ม object ใหม่ใน WORK_CATALOG โดยใช้ชื่อชิ้นงานเป็น key
// แล้วใส่ category (ใช้จัดกลุ่มใน dropdown) และ fields (รายการฟิลด์ย่อย พร้อม options ของแต่ละฟิลด์)

export const WORK_CATALOG = {
  "บานสไลด์": {
    category: "ประตู",
    fields: [
      { key: "frameColor", label: "สีอลูมิเนียม", options: ["ขาว", "ชา", "ดำ", "สีอลูมิเนียม"] },
      { key: "aluminumThickness", label: "ความหนาอลูมิเนียม (มม.)", options: ["1", "1.2", "1.5"] },
      { key: "hasGlass", label: "มีกระจกไหม", options: ["มี", "ไม่มี"] },
      { key: "glassColor", label: "สีกระจก", options: ["ใส", "สีเขียว", "ชาดำ", "กระจกฝ้า"] },
      { key: "trimStyle", label: "มือจับ", options: ["แบบโค้ง", "แบบเหลี่ยม"] },
      { key: "handleColor", label: "สีมือจับ", options: ["สแตนเลส", "ดำ", "ขาว"] },
    ],
  },
  "บานเลื่อน": {
    category: "ประตู",
    fields: [
      { key: "frameColor", label: "สีอลูมิเนียม", options: ["ขาว", "ชา", "ดำ", "สีอลูมิเนียม"] },
      { key: "aluminumThickness", label: "ความหนาอลูมิเนียม (มม.)", options: ["1", "1.2", "1.5"] },
      { key: "hasGlass", label: "มีกระจกไหม", options: ["มี", "ไม่มี"] },
      { key: "glassColor", label: "สีกระจก", options: ["ใส", "สีเขียว", "ชาดำ", "กระจกฝ้า"] },
    ],
  },
  "บานสวิง": {
    category: "ประตู",
    fields: [
      { key: "frameColor", label: "สีอลูมิเนียม", options: ["ขาว", "ชา", "ดำ", "สีอลูมิเนียม"] },
      { key: "aluminumThickness", label: "ความหนาอลูมิเนียม (มม.)", options: ["1", "1.2", "1.5"] },
      { key: "glassColor", label: "สีกระจก", options: ["ใส", "สีเขียว", "ชาดำ", "กระจกฝ้า"] },
      { key: "trimStyle", label: "มือจับ", options: ["แบบโค้ง", "แบบเหลี่ยม"] },
      { key: "handleColor", label: "สีมือจับ", options: ["สแตนเลส", "ดำ", "ขาว"] },
    ],
  },
  "หน้าต่างบานเลื่อน": {
    category: "หน้าต่าง",
    fields: [
      { key: "frameColor", label: "สีอลูมิเนียม", options: ["ขาว", "ชา", "ดำ", "สีอลูมิเนียม"] },
      { key: "aluminumThickness", label: "ความหนาอลูมิเนียม (มม.)", options: ["1", "1.2", "1.5"] },
      { key: "glassColor", label: "สีกระจก", options: ["ใส", "ใสเขียว", "ชาดำ", "กระจกฝ้า"] },
    ],
  },
  "บานกระทุ้ง": {
    category: "หน้าต่าง",
    fields: [
      { key: "frameColor", label: "สีอลูมิเนียม", options: ["ขาว", "ชา", "ดำ", "สีอลูมิเนียม"] },
      { key: "aluminumThickness", label: "ความหนาอลูมิเนียม (มม.)", options: ["1", "1.2", "1.5"] },
      { key: "glassColor", label: "สีกระจก", options: ["ใส", "ใสเขียว", "ชาดำ", "กระจกฝ้า"] },
    ],
  },
  "หลังคาธรรมดา": {
    category: "หลังคา",
    fields: [
      { key: "material", label: "วัสดุ", options: ["เหล็กชุบ", "เหล็ก มอก.", "เหล็กบลูสโคป"] },
      { key: "roofSheetThickness", label: "ความหนาแผ่นหลังคา (มม.)", options: ["0.30", "0.35", "0.40", "0.47"] },
      { key: "frameType", label: "โครง", options: ["ตัวซี 3 นิ้ว", "ตัวซี 4 นิ้ว", "กล่อง 2x2", "กล่อง 1½x3", "กล่อง 2x4"] },
      { key: "frameThickness", label: "ความหนาโครง (มม.)", options: ["1.5", "2.5", "3"] },
      { key: "postSize", label: "ขนาดเสา", options: ["3x3", "4x4"] },
    ],
  },
  "หลังคา PU โฟม": {
    category: "หลังคา",
    fields: [
      { key: "foamThickness", label: "ความหนาของโฟม (นิ้ว)", options: ["1", "2"] },
      { key: "material", label: "วัสดุ", options: ["เหล็กชุบ", "เหล็ก มอก.", "เหล็กบลูสโคป"] },
      { key: "roofSheetThickness", label: "ความหนาแผ่นเมทัลชีท (มม.)", options: ["0.30", "0.35", "0.40", "0.47"] },
      { key: "frameType", label: "โครง", options: ["ตัวซี 3 นิ้ว", "ตัวซี 4 นิ้ว", "กล่อง 2x2", "กล่อง 1½x3", "กล่อง 2x4"] },
      { key: "frameThickness", label: "ความหนาโครง (มม.)", options: ["1.5", "2.5", "3"] },
      { key: "postSize", label: "ขนาดเสา", options: ["3x3", "4x4"] },
    ],
  },
  "ผนังเบา": {
    category: "กั้นห้อง",
    fields: [{ key: "material", label: "วัสดุ", options: ["ฝ้า", "ไอโซวอลล์"] }],
  },
  "กระจก": {
    category: "กั้นห้อง",
    fields: [{ key: "material", label: "วัสดุ", options: ["กระจกธรรมดา", "กระจกนิรภัย"] }],
  },
};

// จัดลำดับหมวดหมู่ที่จะแสดงใน dropdown (ใช้ทำ optgroup)
export const CATEGORY_ORDER = ["ประตู", "หน้าต่าง", "หลังคา", "กั้นห้อง"];