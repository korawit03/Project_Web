import React, { useState } from "react";
import {
  Share2,
  Copy,
  Check,
  X,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Send,
} from "lucide-react";
import { COLORS } from "../lib/tokens.js";

/**
 * คอมโพเนนต์หน้าต่างแชร์สรุปงานไปยัง LINE (Share to LINE Modal)
 * - สร้างข้อความสรุปการดำเนินงานหน้างานแบบอัตโนมัติ
 * - มีปุ่ม "เปิดแชร์ใน LINE" (รองรับ line:// บนมือถือ และ https://line.me/R/msg/text/... บนเว็บ)
 * - มีปุ่ม "คัดลอกข้อความ" สำหรับนำไปวางในแชตได้ทันที
 */
export default function LineShareModal({ project, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!project) return null;

  const items = project.items || [];
  const doneItems = items.filter((it) => it.status === "done");
  const inProgressItems = items.filter((it) => it.status === "in_progress");
  const pendingItems = items.filter((it) => it.status === "pending");

  const total = items.length;
  const done = doneItems.length;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  const lat = project.latitude != null && project.latitude !== "" ? Number(project.latitude) : null;
  const lng = project.longitude != null && project.longitude !== "" ? Number(project.longitude) : null;
  const hasCoords = lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0);

  // สร้างข้อความสรุปสำหรับส่งเข้า LINE
  const buildShareText = () => {
    const lines = [
      `📋 สรุปการดำเนินงานช่างหน้างาน`,
      `🔹 โครงการ: ${project.projectName || "(ไม่ระบุชื่อโครงงาน)"}`,
      `👤 ลูกค้า: ${project.customerName || "(ไม่ระบุชื่อ)"}`,
      `📊 ความคืบหน้า: เสร็จแล้ว ${done}/${total} รายการ (${percent}%)`,
      ``,
    ];

    if (doneItems.length > 0) {
      lines.push(`✅ ชิ้นงานที่เสร็จสิ้น (${doneItems.length}):`);
      doneItems.forEach((it, idx) => {
        lines.push(`  ${idx + 1}. ${it.itemName || it.mainWork || "ชิ้นงาน"}${it.note ? ` (${it.note})` : ""}`);
      });
      lines.push(``);
    }

    if (inProgressItems.length > 0) {
      lines.push(`⏳ ชิ้นงานที่กำลังดำเนินการ (${inProgressItems.length}):`);
      inProgressItems.forEach((it, idx) => {
        lines.push(`  ${idx + 1}. ${it.itemName || it.mainWork || "ชิ้นงาน"}${it.positionNote ? ` [ตำแหน่ง: ${it.positionNote}]` : ""}`);
      });
      lines.push(``);
    }

    if (pendingItems.length > 0) {
      lines.push(`📌 ชิ้นงานรอดำเนินการ (${pendingItems.length}):`);
      pendingItems.forEach((it, idx) => {
        lines.push(`  ${idx + 1}. ${it.itemName || it.mainWork || "ชิ้นงาน"}`);
      });
      lines.push(``);
    }

    if (hasCoords) {
      lines.push(`📍 แผนที่หน้างาน: https://maps.google.com/?q=${lat},${lng}`);
    } else if (project.location || project.locationAddress) {
      lines.push(`📍 สถานที่หน้างาน: ${[project.location, project.locationAddress].filter(Boolean).join(" ")}`);
    }

    lines.push(``);
    lines.push(`ส่งจากระบบ Site Work App 🛠️`);

    return lines.join("\n");
  };

  const shareText = buildShareText();

  // สร้าง URL สำหรับเปิด LINE
  // 1. social-plugins lineit share (ทำงานได้ดีทั้งคอมและมือถือ)
  const lineWebShareUrl = `https://social-plugins.line.me/lineit/share?text=${encodeURIComponent(shareText)}`;

  const handleCopy = () => {
    navigator.clipboard?.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenLine = (e) => {
    e.preventDefault();
    // คัดลอกข้อความลงคลิปบอร์ดสำรองไว้ให้อัตโนมัติทันที
    navigator.clipboard?.writeText(shareText);

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      // บนมือถือ: เปิดแอป LINE โดยตรงผ่าน URL Scheme
      window.location.href = `line://msg/text/${encodeURIComponent(shareText)}`;
    } else {
      // บนคอมพิวเตอร์: เปิดหน้าต่างแชร์ของ LINE (ขนาด popup พอดี)
      const popup = window.open(
        lineWebShareUrl,
        "line_share",
        "width=600,height=600,menubar=no,toolbar=no,status=no"
      );
      if (!popup || popup.closed || typeof popup.closed === "undefined") {
        window.open(lineWebShareUrl, "_blank");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs no-print">
      <div className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* แถบหัว Modal */}
        <div className="flex items-center justify-between border-b px-5 py-3.5" style={{ borderColor: COLORS.border, background: "#FAF8F5" }}>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#06C755] text-white">
              <MessageSquare size={17} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-gray-900">แชร์รายงานสรุปงานเข้า LINE</h3>
              <p className="text-[11px] text-gray-500">ส่งความคืบหน้าให้ลูกค้าหรือทีมช่างทาง LINE ทันที</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* เนื้อหาข้อความพรีวิว */}
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-gray-700 flex items-center gap-1">
              <Sparkles size={13} className="text-amber-500" />
              ข้อความที่พร้อมส่ง:
            </span>
            <span className="text-[11px] text-emerald-600 font-medium">คัดลอกลงคลิปบอร์ดให้อัตโนมัติเมื่อกดแชร์</span>
          </div>

          {/* กล่องข้อความ Preview */}
          <div className="rounded-xl border bg-gray-50 p-4 font-sans text-xs leading-relaxed text-gray-800 max-h-64 overflow-y-auto whitespace-pre-wrap selection:bg-[#06C755]/20" style={{ borderColor: COLORS.border }}>
            {shareText}
          </div>

          {/* ปุ่มคำสั่งด้านล่าง */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {/* ปุ่มคัดลอกข้อความ */}
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center justify-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
              style={{ borderColor: COLORS.border }}
            >
              {copied ? (
                <>
                  <Check size={14} className="text-emerald-600" />
                  <span className="text-emerald-600 font-bold">คัดลอกข้อความแล้ว!</span>
                </>
              ) : (
                <>
                  <Copy size={14} className="text-gray-500" />
                  <span>คัดลอกข้อความ</span>
                </>
              )}
            </button>

            {/* ปุ่มเปิดแอป LINE */}
            <button
              type="button"
              onClick={handleOpenLine}
              className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:opacity-95 active:scale-95 transition-all cursor-pointer"
              style={{ background: "#06C755" }}
            >
              <Send size={14} />
              <span>เปิดแชร์ในแอป LINE</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
