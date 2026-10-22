import React, { useRef } from "react";
import {
  Printer,
  X,
  FileText,
  Calendar,
  MapPin,
  Phone,
  User,
  CheckCircle2,
  Clock,
  Layers,
  Camera,
} from "lucide-react";
import { COLORS } from "../lib/tokens.js";
import { getStatusMeta } from "../lib/status.js";

/**
 * คอมโพเนนต์หน้าต่างดูและพิมพ์รายงานสรุปงาน / ใบส่งมอบงาน (Print / Save as PDF)
 * - รูปแบบกระดาษ A4 สะอาด สวยงาม เป็นทางการ
 * - ซ่อนแถบควบคุมเวลากดสั่งพิมพ์จริงผ่าน @media print
 * - แสดงข้อมูลลูกค้า, โครงงาน, พิกัด, รายการชิ้นงาน และตารางรูป Before/After
 * - มีช่องลงนามลายเซ็นส่งมอบงานสำหรับช่างและลูกค้า
 */
export default function ProjectReportModal({
  project,
  workCatalog = {},
  onClose,
}) {
  const printAreaRef = useRef(null);

  if (!project) return null;

  const handlePrint = () => {
    window.print();
  };

  const items = project.items || [];
  const completedCount = items.filter((it) => it.status === "done").length;
  const inProgressCount = items.filter((it) => it.status === "in_progress").length;
  const pendingCount = items.filter((it) => it.status === "pending").length;

  const formatDate = (dateStr) => {
    if (!dateStr) return new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
    try {
      return new Date(dateStr).toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-xs">
      {/* กล่อง Modal Container */}
      <div className="flex h-full max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* แถบหัว Modal (ซ่อนเวลาสั่งพิมพ์ print) */}
        <div
          className="print:hidden no-print flex items-center justify-between border-b px-5 py-3.5"
          style={{ borderColor: COLORS.border, background: "#FAF8F5" }}
        >
          <div className="flex items-center gap-2">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: COLORS.charcoal, color: COLORS.amber }}
            >
              <FileText size={18} />
            </span>
            <div>
              <h2 className="text-sm font-bold text-gray-900">
                เอกสารสรุปรายงานและใบส่งมอบงาน
              </h2>
              <p className="text-[11px] text-gray-500">
                พร้อมสั่งพิมพ์หรือบันทึกเป็น PDF (Print to PDF)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer"
              style={{ background: COLORS.charcoal }}
            >
              <Printer size={15} style={{ color: COLORS.amber }} />
              พิมพ์ / บันทึกเป็น PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-200/60 hover:text-gray-700 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* เนื้อหาเอกสารที่พิมพ์ (Scroll ได้บนจอ และพิมพ์พอดีหน้ากระดาษ) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-gray-50 print:bg-white print:p-0 print:overflow-visible">
          <div
            ref={printAreaRef}
            className="mx-auto max-w-[210mm] bg-white p-6 sm:p-10 shadow-sm print:shadow-none print:p-0 text-gray-900 rounded-xl print:rounded-none"
            style={{ minHeight: "297mm" }}
          >
            {/* หัวเอกสาร / Letterhead */}
            <div className="border-b-2 pb-5" style={{ borderColor: COLORS.amber }}>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="rounded px-2 py-0.5 text-xs font-extrabold uppercase tracking-wider text-white"
                      style={{ background: COLORS.charcoal }}
                    >
                      SITE WORK REPORT
                    </span>
                    <span className="text-xs font-semibold text-amber-700">
                      ระบบบันทึกงานช่างหน้างาน
                    </span>
                  </div>
                  <h1 className="mt-2 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                    รายงานสรุปผลงานและการส่งมอบงาน
                  </h1>
                  <p className="text-xs text-gray-500 mt-0.5">
                    โครงการ: <strong className="text-gray-800">{project.projectName || "(ไม่ระบุชื่อโครงงาน)"}</strong>
                  </p>
                </div>

                <div className="text-left sm:text-right text-xs space-y-1">
                  <div className="flex items-center sm:justify-end gap-1 text-gray-600">
                    <Calendar size={13} className="text-amber-600" />
                    <span>วันที่ออกเอกสาร: {formatDate(project.savedAt)}</span>
                  </div>
                  <div className="font-mono text-[11px] text-gray-400">
                    ID: {String(project.id).slice(0, 8).toUpperCase()}
                  </div>
                </div>
              </div>
            </div>

            {/* ข้อมูลลูกค้า และ ข้อมูลสถานที่หน้างาน */}
            <div className="my-5 grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border p-4 text-xs bg-[#FCFBF9]" style={{ borderColor: COLORS.border }}>
              <div className="space-y-1.5">
                <span className="font-bold flex items-center gap-1.5 text-gray-800 text-[13px]">
                  <User size={14} className="text-amber-600" />
                  ข้อมูลลูกค้า
                </span>
                <p className="font-semibold text-gray-900 text-sm">
                  {project.customerName || "-"}
                </p>
                {project.customerPhone && (
                  <p className="flex items-center gap-1 text-gray-600">
                    <Phone size={12} className="text-gray-400" />
                    {project.customerPhone}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <span className="font-bold flex items-center gap-1.5 text-gray-800 text-[13px]">
                  <MapPin size={14} className="text-amber-600" />
                  สถานที่ปฏิบัติงาน
                </span>
                <p className="font-medium text-gray-900">
                  {project.location || project.locationAddress || "-"}
                </p>
                {project.locationAddress && project.location && (
                  <p className="text-gray-500 text-[11px] leading-relaxed">
                    {project.locationAddress}
                  </p>
                )}
                {project.latitude && project.longitude && (
                  <p className="font-mono text-[10px] text-gray-400">
                    พิกัด GPS: {Number(project.latitude).toFixed(6)}, {Number(project.longitude).toFixed(6)}
                  </p>
                )}
              </div>
            </div>

            {/* สรุปสถานะภาพรวม */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-gray-100/70 px-4 py-2.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-700">ภาพรวมชิ้นงาน:</span>
                <span>ทั้งหมด {items.length} รายการ</span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1 font-medium text-emerald-700">
                  <CheckCircle2 size={13} /> เสร็จสิ้น {completedCount}
                </span>
                {inProgressCount > 0 && (
                  <span className="flex items-center gap-1 font-medium text-amber-700">
                    <Clock size={13} /> กำลังทำ {inProgressCount}
                  </span>
                )}
                {pendingCount > 0 && (
                  <span className="flex items-center gap-1 font-medium text-gray-600">
                    รอดำเนินการ {pendingCount}
                  </span>
                )}
              </div>
            </div>

            {/* รายการชิ้นงาน & เปรียบเทียบรูปภาพก่อน-หลัง */}
            <div className="space-y-6">
              <div className="flex items-center gap-1.5 text-sm font-bold text-gray-900 border-b pb-2">
                <Layers size={16} className="text-amber-600" />
                รายละเอียดชิ้นงาน และภาพถ่ายหน้างาน (Before & After)
              </div>

              {items.map((item, idx) => {
                const catalogEntry = workCatalog[item.mainWork];
                const beforePhotos = item.positionPhotos || [];
                const afterPhotos = item.workPhotos || [];
                const statusMeta = getStatusMeta(item.status);

                return (
                  <div
                    key={item.id || idx}
                    className="rounded-xl border p-4 space-y-3 break-inside-avoid"
                    style={{ borderColor: COLORS.border }}
                  >
                    {/* หัวชิ้นงาน */}
                    <div className="flex flex-wrap items-start justify-between gap-2 border-b pb-2.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="flex h-5 w-5 items-center justify-center rounded text-[11px] font-bold text-white"
                          style={{ background: COLORS.charcoal }}
                        >
                          {idx + 1}
                        </span>
                        <div>
                          <h3 className="text-sm font-bold text-gray-900">
                            {item.itemName || item.mainWork || `ชิ้นงานที่ ${idx + 1}`}
                          </h3>
                          {item.itemName && item.mainWork && (
                            <p className="text-[11px] text-gray-500">{item.mainWork}</p>
                          )}
                        </div>
                      </div>

                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                        style={{ color: statusMeta.color, background: statusMeta.bg }}
                      >
                        {statusMeta.label}
                      </span>
                    </div>

                    {/* ข้อมูลสเปก / Answers */}
                    {item.answers && Object.keys(item.answers).length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 rounded bg-gray-50 p-2.5 text-[11px]">
                        {Object.entries(item.answers).map(([key, val]) => {
                          const field = catalogEntry?.fields?.find((f) => f.key === key);
                          return (
                            <div key={key}>
                              <span className="text-gray-500">{field?.label || key}: </span>
                              <span className="font-semibold text-gray-800">{String(val)}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* ตารางเปรียบเทียบรูป Before vs After */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {/* ฝั่งซ้าย: ก่อนเริ่มงาน (Before) */}
                      <div className="rounded-lg border p-3 space-y-2 bg-[#FFFDF7]" style={{ borderColor: "#FDE68A" }}>
                        <div className="flex items-center justify-between text-xs font-bold text-amber-800">
                          <span className="flex items-center gap-1">
                            <Camera size={12} />
                            ก่อนเริ่มงาน (Before)
                          </span>
                          <span className="text-[10px] text-amber-700/80">
                            {beforePhotos.length} รูป
                          </span>
                        </div>

                        {beforePhotos.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                            {beforePhotos.slice(0, 3).map((p, i) => (
                              <div key={p.id || i} className="aspect-square overflow-hidden rounded border bg-white">
                                <img
                                  src={p.url}
                                  alt="Before"
                                  className="h-full w-full object-cover"
                                  crossOrigin="anonymous"
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded border border-dashed py-3 text-center text-[11px] text-gray-400">
                            ไม่มีรูปภาพก่อนเริ่มงาน
                          </div>
                        )}

                        <div className="text-[11px] space-y-0.5 text-gray-700">
                          {item.positionNote && (
                            <p>
                              <strong className="text-gray-900">ผัง/ตำแหน่ง & ขนาด:</strong> {item.positionNote}
                            </p>
                          )}
                          {item.positionDetail && (
                            <p className="text-gray-500 text-[10px] whitespace-pre-line">{item.positionDetail}</p>
                          )}
                        </div>
                      </div>

                      {/* ฝั่งขวา: หลังทำเสร็จ (After) */}
                      <div className="rounded-lg border p-3 space-y-2 bg-[#F6FEF8]" style={{ borderColor: "#BBF7D0" }}>
                        <div className="flex items-center justify-between text-xs font-bold text-emerald-800">
                          <span className="flex items-center gap-1">
                            <CheckCircle2 size={12} />
                            ผลงานหลังทำเสร็จ (After)
                          </span>
                          <span className="text-[10px] text-emerald-700/80">
                            {afterPhotos.length} รูป
                          </span>
                        </div>

                        {afterPhotos.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                            {afterPhotos.slice(0, 3).map((p, i) => (
                              <div key={p.id || i} className="aspect-square overflow-hidden rounded border bg-white">
                                <img
                                  src={p.url}
                                  alt="After"
                                  className="h-full w-full object-cover"
                                  crossOrigin="anonymous"
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded border border-dashed py-3 text-center text-[11px] text-gray-400">
                            ไม่มีรูปผลงานหลังทำเสร็จ
                          </div>
                        )}

                        <div className="text-[11px] space-y-0.5 text-gray-700">
                          {item.note && (
                            <p>
                              <strong className="text-gray-900">ผลงานติดตั้ง:</strong> {item.note}
                            </p>
                          )}
                          {item.workDetail && (
                            <p className="text-gray-500 text-[10px] whitespace-pre-line">{item.workDetail}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ส่วนลงนามลายเซ็น (Signatures) */}
            <div className="mt-10 pt-6 border-t break-inside-avoid" style={{ borderColor: COLORS.border }}>
              <p className="text-center text-xs text-gray-500 mb-8">
                ข้าพเจ้าได้ตรวจสอบผลงานการติดตั้งตามรายการข้างต้นเรียบร้อยแล้ว ถูกต้องครบถ้วนตามข้อตกลง
              </p>

              <div className="grid grid-cols-2 gap-8 text-center text-xs">
                {/* ลายเซ็นช่างผู้ส่งมอบงาน */}
                <div className="space-y-12">
                  <div className="border-b border-dashed border-gray-400 mx-auto w-48 h-10" />
                  <div>
                    <p className="font-bold text-gray-800">(________________________________)</p>
                    <p className="text-gray-500 mt-1">ช่างผู้ส่งมอบงาน</p>
                    <p className="text-gray-400 text-[10px] mt-0.5">วันที่ ____ / ____ / ________</p>
                  </div>
                </div>

                {/* ลายเซ็นลูกค้าผู้ตรวจรับงาน */}
                <div className="space-y-12">
                  <div className="border-b border-dashed border-gray-400 mx-auto w-48 h-10" />
                  <div>
                    <p className="font-bold text-gray-800">(________________________________)</p>
                    <p className="text-gray-500 mt-1">ลูกค้าผู้ตรวจรับงาน</p>
                    <p className="text-gray-400 text-[10px] mt-0.5">วันที่ ____ / ____ / ________</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ท้ายเอกสาร */}
            <div className="mt-8 text-center text-[10px] text-gray-400 border-t pt-3">
              เอกสารนี้สร้างจากระบบ Site Work App · วันที่พิมพ์: {new Date().toLocaleString("th-TH")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
