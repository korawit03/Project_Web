import {
  ClipboardList,
  Users,
  UserPlus,
  Contact,
  ListChecks,
  Plus,
  Settings,
  Layers,
  SlidersHorizontal,
  List,
} from "lucide-react";

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
  {
    key: "project-group",
    label: "โครงงาน",
    icon: ClipboardList,
    children: [
      { key: "form", label: "เพิ่ม", icon: Plus },
      { key: "project-detail", label: "รายละเอียดงาน", icon: ListChecks },
    ],
  },
  {
    key: "catalog-group",
    label: "ตั้งค่างาน",
    icon: Settings,
    children: [
      { key: "catalog-types", label: "ประเภทชิ้นงาน", icon: Layers },
      { key: "catalog-fields", label: "รายละเอียดชิ้นงาน", icon: SlidersHorizontal },
      { key: "catalog-options", label: "ตัวเลือก", icon: List },
    ],
  },
];

export function isGroupActive(menuItem, activeView) {
  return Boolean(menuItem.children?.some((c) => c.key === activeView));
}