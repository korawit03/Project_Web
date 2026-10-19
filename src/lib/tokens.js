// โทนสีหลักของระบบ - ใช้ร่วมกันทุกคอมโพเนนต์
export const COLORS = {
  bg: "#F6F4EF",
  surface: "#FFFFFF",
  border: "#E4E0D6",
  charcoal: "#20242A",
  charcoalSoft: "#343A42",
  amber: "#E8951C",
  amberDark: "#C77A0F",
  green: "#3E8E5C",
  red: "#D14343",
  textMuted: "#6B7078",
  
};
// สีประจำแต่ละส่วนในการ์ดชิ้นงาน: พื้นอ่อน / เส้นขอบ / สีเน้น (ไอคอน + แถบซ้าย)
export const SECTION = {
  detail: { bg: "#FEF6E7", border: "#F3D9A4", accent: "#E8951C" }, // ส้ม: รายละเอียด/วัสดุ
  before: { 
    bg: "#FFFBEB", 
    border: "#FDE68A", 
    accent: "#D97706", 
    badgeBg: "#FEF3C7", 
    badgeText: "#B45309",
    label: "ก่อนทำ (Before)" 
  }, // ส้ม/เหลือง: ก่อนเริ่มงาน (Before)
  after: { 
    bg: "#F0FDF4", 
    border: "#BBF7D0", 
    accent: "#16A34A", 
    badgeBg: "#DCFCE7", 
    badgeText: "#15803D",
    label: "หลังทำ (After)" 
  }, // เขียวมรกต: ผลงานหลังทำเสร็จ (After)
  site: { bg: "#FFFBEB", border: "#FDE68A", accent: "#D97706" }, // alias for backward-compat
  work: { bg: "#F0FDF4", border: "#BBF7D0", accent: "#16A34A" }, // alias for backward-compat
};

