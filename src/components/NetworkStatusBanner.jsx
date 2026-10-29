import React from "react";
import { WifiOff, Wifi, AlertTriangle } from "lucide-react";
import { useNetworkStatus } from "../lib/useNetworkStatus.js";

/**
 * แถบแจ้งเตือนสถานะการเชื่อมต่ออินเทอร์เน็ต
 * - แสดงสีส้ม/แดงเมื่อไม่มีสัญญาณเน็ต (Offline)
 * - แสดงสีเขียวชั่วคราวเมื่อสัญญาณเน็ตกลับมา (Back Online)
 */
export default function NetworkStatusBanner() {
  const { isOnline, wasOffline } = useNetworkStatus();

  // กำลังออฟไลน์
  if (!isOnline) {
    return (
      <div className="no-print sticky top-0 z-50 flex items-center justify-center gap-2 bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-md transition-all">
        <WifiOff size={15} className="animate-pulse" />
        <span>โหมดออฟไลน์: กำลังทำงานแบบไม่มีสัญญาณเน็ต (ข้อมูลและแบบร่างจะถูกบันทึกไว้ในเครื่อง)</span>
      </div>
    );
  }

  // เพิ่งต่อเน็ตกลับมาติด
  if (wasOffline) {
    return (
      <div className="no-print sticky top-0 z-50 flex items-center justify-center gap-2 bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-md transition-all animate-bounce">
        <Wifi size={15} />
        <span>เชื่อมต่อสัญญาณอินเทอร์เน็ตแล้ว ระบบพร้อมซิงค์ข้อมูล</span>
      </div>
    );
  }

  return null;
}

