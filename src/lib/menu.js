import { ClipboardList, Users, UserPlus, Contact, ListChecks } from "lucide-react";

// เมนูหลักของระบบ - Sidebar (เดสก์ท็อป) และ MobileBottomNav (มือถือ) ใช้ร่วมกัน
// เมนูที่มี children = กดแล้วกางเมนูย่อยลงมาให้เลือก
export const MENU = [
  {
    key: "customer-group",
    label: "ลูกค้า",
    icon: Users,
    children: [
      { key: "customer-list", label: "รายละเอียดลูกค้า", icon: Contact },
      { key: "customer-new", label: "เพิ่มลูกค้า", icon: UserPlus },
    ],
  },
  { key: "form", label: "โครงงาน", icon: ClipboardList },
  // เดิมชื่อ "ลูกค้า" - เปลี่ยนเพื่อไม่ให้ซ้ำกับเมนูลูกค้าใหม่ (หน้านี้คือสถานะงานของลูกค้า)
  { key: "customers", label: "สถานะงาน", icon: ListChecks },
];

export function isGroupActive(menuItem, activeView) {
  return Boolean(menuItem.children?.some((c) => c.key === activeView));
}