import { COLORS } from "./tokens.js";

export const DEFAULT_STATUS = "pending";

// นิยามสถานะที่ช่างเลือกเองได้ต่อชิ้นงาน
export const STATUS_OPTIONS = [
         { value: "pending", label: "รอดำเนินการ", color: COLORS.textMuted, bg: "#EEECE6" },
         { value: "in_progress", label: "กำลังทำ", color: COLORS.amberDark, bg: "#FCEFDB" },
         { value: "done", label: "เสร็จแล้ว", color: COLORS.green, bg: "#E4F3EA" },
];

export function getStatusMeta(status) {
         return STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];
}

// นับจำนวนชิ้นงานแยกตามสถานะ จาก array ของ items (ที่มี field status)
export function countByStatus(items) {
         const counts = { pending: 0, in_progress: 0, done: 0 };
         (items || []).forEach((it) => {
                  const key = counts[it.status] !== undefined ? it.status : "pending";
                  counts[key] += 1;
         });
         return counts;
}