import React, { useState } from "react";
import {
         MapPin,
         Calendar,
         Layers,
         Pencil,
         Trash2,
         ChevronDown,
         ChevronUp,
         Save,
         X,
         Plus,
         Navigation,
} from "lucide-react";
import { COLORS } from "../lib/tokens.js";
import { FieldLabel, LocationSelect } from "./ui.jsx";
import WorkItemCard from "./WorkItemCard.jsx";
import LocationPicker from "./LocationPicker.jsx";
import { validateForm, hasErrors } from "../lib/validation.js";
import { DEFAULT_STATUS } from "../lib/status.js";
import PhotoLightbox from "./PhotoLightbox.jsx";

let editItemCounter = 1;
function newWorkItem() {
         return {
                  id: `edit-item-${Date.now()}-${editItemCounter++}`,
                  itemName: "",
                  mainWork: "",
                  answers: {},
                  positionNote: "",
                  positionDetail: "",
                  workDetail: "",
                  positionPhotos: [],
                  workPhotos: [],
                  note: "",
                  status: DEFAULT_STATUS,
         };
}

function formatDate(dateStr) {
         if (!dateStr) return "-";
         try {
                  return new Date(dateStr).toLocaleString("th-TH", {
                           dateStyle: "medium",
                           timeStyle: "short",
                  });
         } catch {
                  return dateStr;
         }
}

// การ์ดแสดง 1 โครงงาน พร้อมกางดูรายละเอียด / แก้ไข / ลบ
export default function ProjectCard({ project, onUpdate, onDelete, workCatalog, categoryOrder, locations = [] }) {
         const [expanded, setExpanded] = useState(false);
         const [editing, setEditing] = useState(false);
         const [saving, setSaving] = useState(false);
         const [deleting, setDeleting] = useState(false);
         const [submitted, setSubmitted] = useState(false);
         const [errors, setErrors] = useState({ projectName: false, items: {} });
         const [lightbox, setLightbox] = useState({ photos: [], index: null });

         const [editLocationId, setEditLocationId] = useState(project.locationId ?? "");
         const [editItems, setEditItems] = useState(() =>
                  project.items.map((it) => ({ ...it, answers: { ...it.answers } }))
         );
         // ฟอร์มแก้ไขโครงงาน: กดปุ่มแก้ไข = เปิดฟอร์มแก้ไข
         const startEdit = () => {
                  setEditLocationId(project.locationId ?? "");
                  setEditItems(project.items.map((it) => ({ ...it, answers: { ...it.answers } })));
                  setSubmitted(false);
                  setErrors({ projectName: false, items: {} });
                  setEditing(true);
                  setExpanded(true);
         };
         // ฟอร์มแก้ไขโครงงาน: กดปุ่มยกเลิก = ปิดฟอร์มแก้ไข
         const cancelEdit = () => {
                  setEditing(false);
                  setSubmitted(false);
                  setErrors({ projectName: false, items: {} });
         };
         // ฟอร์มแก้ไขโครงงาน: อัปเดตชิ้นงานที่แก้ไขแล้ว
         const updateEditItem = (id, next) =>
                  setEditItems((prev) => prev.map((it) => (it.id === id ? next : it)));
         const removeEditItem = (id) => setEditItems((prev) => prev.filter((it) => it.id !== id));
         const addEditItem = () => setEditItems((prev) => [...prev, newWorkItem()]);
         
         const handleSaveEdit = async () => {
                  setSubmitted(true);
                  // ฟอร์มแก้ไขนี้ไม่ได้ให้เปลี่ยนชื่อลูกค้า จึงส่งชื่ออะไรก็ได้ที่ไม่ว่างเพื่อผ่านการตรวจ
                  const nextErrors = validateForm(project.customerName || "x", editItems, workCatalog);
                  setErrors(nextErrors);
                  if (hasErrors(nextErrors)) return;

                  // ตรวจสอบว่าผู้ใช้ยืนยันการแก้ไขโครงงานหรือไม่
                  const confirmed = window.confirm("ยืนยันบันทึกการแก้ไขโครงงานนี้ใช่หรือไม่?");
                  if (!confirmed) return;

                  // ตรวจสอบว่าผู้ใช้เลือกสถานที่หน้างานหรือไม่
                  const chosen = locations.find((l) => String(l.location_id) === String(editLocationId));
                  const locationPatch = chosen
                           ? {
                                    locationId: chosen.location_id,
                                    location: chosen.name,
                                    latitude: chosen.latitude ?? null,
                                    longitude: chosen.longitude ?? null,
                           }
                           : {}; // ไม่ได้เลือก = คงค่าเดิมของโครงงาน

                  setSaving(true);
                  try {
                           const ok = await onUpdate({
                                    ...project,
                                    ...locationPatch,
                                    items: editItems,
                           });
                           if (ok) setEditing(false);
                  } finally {
                           setSaving(false);
                  }
         };

         // ฟอร์มแก้ไขโครงงาน: ลบโครงงาน
         const handleDelete = async () => {
                  const confirmed = window.confirm(
                           "ต้องการลบโครงงานนี้ใช่ไหม? ข้อมูลชิ้นงานและรูปภาพทั้งหมดในโครงงานนี้จะถูกลบถาวร"
                  );
                  if (!confirmed) return;
                  setDeleting(true);
                  try {
                           await onDelete();
                  } finally {
                           setDeleting(false);
                  }
         };
         // จำนวนชิ้นงานในโครงงานนี้
         const itemCount = project.items?.length || 0;

         const locFromList = locations.find(
                  (l) => l.location_id != null && String(l.location_id) === String(project.locationId)
         );
         const resolvedAddress = project.locationAddress || locFromList?.address || locFromList?.address_line || "";
         const rawLat = project.latitude ?? locFromList?.latitude;
         const rawLng = project.longitude ?? locFromList?.longitude;

         const lat = rawLat != null && rawLat !== "" ? Number(rawLat) : null;
         const lng = rawLng != null && rawLng !== "" ? Number(rawLng) : null;
         const hasCoords =
                  lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0);

         const locationQuery = [project.location, resolvedAddress]
                  .filter(Boolean)
                  .map((s) => String(s).trim())
                  .filter(Boolean)
                  .join(" ");

         const navUrl = hasCoords
                  ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
                  : locationQuery
                  ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationQuery)}`
                  : null;

         return (
                  <div className="p-4">
                           <div className="flex flex-wrap items-start justify-between gap-3">
                                    <button
                                             type="button"
                                             onClick={() => setExpanded((v) => !v)}
                                             className="flex flex-1 min-w-0 items-start gap-2 text-left cursor-pointer"
                                    >
                                             <span
                                                      className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                                                      style={{ background: "#FAF8F3", border: `1px solid ${COLORS.border}` }}
                                             >
                                                      <Layers size={13} style={{ color: COLORS.amber }} />
                                             </span>
                                             <span className="min-w-0 flex-1">
                                                      {/* ชื่องานเด่นด้านบน */}
                                                      <span className="block text-sm font-bold truncate" style={{ color: COLORS.charcoal }}>
                                                               {project.projectName || "(ไม่ระบุชื่อโครงงาน)"}
                                                      </span>

                                                      {/* สถานที่ จำนวนชิ้นงาน และวันที่บันทึก */}
                                                      <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs" style={{ color: COLORS.textMuted }}>
                                                               <span className="flex items-center gap-1">
                                                                        <MapPin size={12} style={{ color: COLORS.amberDark }} />
                                                                        {project.location ? (
                                                                                 <span style={{ color: COLORS.charcoalSoft }}>{project.location}</span>
                                                                        ) : (
                                                                                 <span>(ยังไม่ระบุสถานที่)</span>
                                                                        )}
                                                               </span>
                                                               <span>·</span>
                                                               <span>{itemCount} ชิ้นงาน</span>
                                                               <span>·</span>
                                                               <span className="flex items-center gap-1">
                                                                        <Calendar size={11} />
                                                                        {formatDate(project.updatedAt || project.savedAt)}
                                                               </span>
                                                      </span>
                                             </span>
                                             {expanded ? (
                                                      <ChevronUp size={16} className="mt-1 shrink-0" style={{ color: COLORS.textMuted }} />
                                             ) : (
                                                      <ChevronDown size={16} className="mt-1 shrink-0" style={{ color: COLORS.textMuted }} />
                                             )}
                                    </button>
                                             
                                    {!editing && (
                                             <div className="flex shrink-0 items-center gap-2">
                                                      {navUrl && (
                                                               <a
                                                                        href={navUrl}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        title="เปิดนำทาง Google Maps"
                                                                        className="flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
                                                               >
                                                                        <Navigation size={12} className="fill-emerald-600" />
                                                                        <span>นำทาง</span>
                                                               </a>
                                                      )}
                                                      <button
                                                               type="button"
                                                               onClick={startEdit}
                                                               className="flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium cursor-pointer"
                                                               style={{ borderColor: COLORS.border, color: COLORS.charcoalSoft, background: "white" }}
                                                      >
                                                               <Pencil size={12} />
                                                               แก้ไข
                                                      </button>
                                                      <button
                                                               type="button"
                                                               onClick={handleDelete}
                                                               disabled={deleting}
                                                               className="flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-white disabled:opacity-60 cursor-pointer"
                                                               style={{ background: COLORS.red }}
                                                      >
                                                               <Trash2 size={12} />
                                                               {deleting ? "กำลังลบ..." : "ลบ"}
                                                      </button>
                                             </div>
                                    )}
                           </div>

                           {expanded && !editing && (
                                    <div className="mt-4 space-y-3 border-t pt-4" style={{ borderColor: COLORS.border }}>
                                             {(project.location || resolvedAddress) && (
                                                      <div
                                                               className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-2.5 text-xs"
                                                               style={{ borderColor: COLORS.border, background: "#FAF8F3" }}
                                                      >
                                                               <div className="flex items-start gap-1.5 min-w-0 flex-1">
                                                                        <MapPin size={14} className="mt-0.5 shrink-0 text-amber-600" />
                                                                        <div className="min-w-0">
                                                                                 <p className="font-semibold" style={{ color: COLORS.charcoal }}>
                                                                                          {project.location || "สถานที่หน้างาน"}
                                                                                 </p>
                                                                                 {resolvedAddress && (
                                                                                          <p className="text-[11px] leading-relaxed" style={{ color: COLORS.charcoalSoft }}>
                                                                                                   {resolvedAddress}
                                                                                          </p>
                                                                                 )}
                                                                        </div>
                                                               </div>
                                                               {navUrl && (
                                                                        <a
                                                                                 href={navUrl}
                                                                                 target="_blank"
                                                                                 rel="noopener noreferrer"
                                                                                 className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-opacity hover:opacity-90 cursor-pointer"
                                                                                 style={{ background: "#059669" }}
                                                                        >
                                                                                 <Navigation size={12} className="fill-white" />
                                                                                 เปิดนำทาง Google Maps
                                                                        </a>
                                                               )}
                                                      </div>
                                             )}
                                             {project.items.map((it, idx) => (
                                                      <div
                                                               key={it.id}
                                                               className="rounded-lg border p-3"
                                                               style={{ borderColor: COLORS.border, background: "#FCFBF8" }}
                                                      >
                                                               <p className="text-sm font-semibold" style={{ color: COLORS.charcoal }}>
                                                                        {idx + 1}. {it.mainWork || "(ยังไม่ระบุชิ้นงาน)"}
                                                               </p>
                                                               {Object.keys(it.answers || {}).length > 0 && (() => {
                                                                        const catalogEntry = workCatalog[it.mainWork];
                                                                        return (
                                                                                 <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
                                                                                          {Object.entries(it.answers).map(([key, value]) => {
                                                                                                   const field = catalogEntry?.fields.find((f) => f.key === key);
                                                                                                   return (
                                                                                                            <span key={key} className="text-xs" style={{ color: COLORS.charcoalSoft }}>
                                                                                                                     <span style={{ color: COLORS.textMuted }}>{field?.label || key}:</span> {value}
                                                                                                            </span>
                                                                                                   );
                                                                                          })}
                                                                                 </div>
                                                                        );
                                                               })()}
                                                               {it.positionNote && (
                                                                        <p className="mt-1.5 flex items-start gap-1 text-xs" style={{ color: COLORS.charcoalSoft }}>
                                                                                 <MapPin size={11} className="mt-0.5 shrink-0" />
                                                                                 <span><span style={{ color: COLORS.textMuted }}>ตำแหน่งติดตั้ง:</span> {it.positionNote}</span>
                                                                        </p>
                                                               )}
                                                               {it.note && (
                                                                        <p className="mt-1 text-xs italic" style={{ color: COLORS.textMuted }}>
                                                                                 หมายเหตุ: {it.note}
                                                                        </p>

                                                               )}
                                                               {it.positionDetail && (
                                                                        <p className="mt-1 text-xs whitespace-pre-line" style={{ color: COLORS.charcoalSoft }}>
                                                                                 <span style={{ color: COLORS.textMuted }}>รายละเอียดหน้างานเพิ่มเติม:</span> {it.positionDetail}
                                                                        </p>
                                                               )}
                                                               {it.workDetail && (
                                                                        <p className="mt-1 text-xs whitespace-pre-line" style={{ color: COLORS.charcoalSoft }}>
                                                                                 <span style={{ color: COLORS.textMuted }}>รายละเอียดชิ้นงานเพิ่มเติม:</span> {it.workDetail}
                                                                        </p>
                                                               )}
                                                               {(it.workPhotos?.length > 0 || it.positionPhotos?.length > 0) && (() => {
                                                                        const all = [...(it.positionPhotos || []), ...(it.workPhotos || [])];
                                                                        return (
                                                                                 <div className="mt-2 flex flex-wrap gap-1.5">
                                                                                          {all.map((p, i) => (
                                                                                                   <button
                                                                                                            key={p.id}
                                                                                                            type="button"
                                                                                                            onClick={() => setLightbox({ photos: all, index: i })}
                                                                                                            className="block h-12 w-12 cursor-zoom-in overflow-hidden rounded-md border"
                                                                                                            style={{ borderColor: COLORS.border }}
                                                                                                   >
                                                                                                            <img src={p.url} alt={p.name} className="h-full w-full object-cover" />
                                                                                                   </button>
                                                                                          ))}
                                                                                 </div>
                                                                        );
                                                               })()}
                                                      </div>
                                             ))}
                                             <PhotoLightbox
                                                      photos={lightbox.photos}
                                                      index={lightbox.index}
                                                      onClose={() => setLightbox((l) => ({ ...l, index: null }))}
                                                      onChange={(i) => setLightbox((l) => ({ ...l, index: i }))}
                                             />
                                    </div>
                           )}

                           {editing && (
                                    <div className="mt-4 space-y-4 border-t pt-4" style={{ borderColor: COLORS.border }}>
                                             <div>
                                                      <FieldLabel icon={MapPin}>สถานที่หน้างาน</FieldLabel>
                                                      <LocationSelect
                                                               value={editLocationId}
                                                               onChange={(e) => setEditLocationId(e.target.value)}
                                                               locations={locations}
                                                               placeholder={
                                                                        project.location
                                                                                 ? `ไม่เปลี่ยน (ปัจจุบัน: ${project.location})`
                                                                                 : "-- เลือกสถานที่ --"
                                                               }
                                                      />
                                             </div>

                                             <div className="flex items-center justify-between">
                                                      <div className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: COLORS.charcoal }}>
                                                               <Layers size={14} style={{ color: COLORS.amber }} />
                                                               ชิ้นงาน
                                                      </div>
                                             </div>
                                                               
                                             <div className="space-y-4">
                                                      {editItems.map((item, idx) => (
                                                               <WorkItemCard
                                                                        key={item.id}
                                                                        item={item}
                                                                        index={idx}
                                                                        onChange={(next) => updateEditItem(item.id, next)}
                                                                        onRemove={() => removeEditItem(item.id)}
                                                                        removable={editItems.length > 1}
                                                                        errors={errors.items[item.id] || {}}
                                                                        workCatalog={workCatalog}
                                                                        categoryOrder={categoryOrder}
                                                               />
                                                      ))}
                                             </div>
                                             <div className="flex justify-center">
                                                      <button
                                                               type="button"
                                                               onClick={addEditItem}
                                                               className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-white"
                                                               style={{ background: COLORS.green }}
                                                      >
                                                               <Plus size={13} />
                                                               เพิ่มชิ้นงานถัดไป
                                                      </button>
                                             </div>


                                             <div className="flex items-center justify-end gap-2 border-t pt-4" style={{ borderColor: COLORS.border }}>
                                                      <button
                                                               type="button"
                                                               onClick={cancelEdit}
                                                               disabled={saving}
                                                               className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60"
                                                               style={{ border: `1px solid ${COLORS.border}`, color: COLORS.charcoalSoft, background: "white" }}
                                                      >
                                                               <X size={14} />
                                                               ยกเลิก
                                                      </button>
                                                      <button
                                                               type="button"
                                                               onClick={handleSaveEdit}
                                                               disabled={saving}
                                                               className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                                                               style={{ background: COLORS.charcoal }}
                                                      >
                                                               <Save size={14} style={{ color: COLORS.amber }} />
                                                               {saving ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
                                                      </button>
                                             </div>
                                    </div>
                           )}
                  </div>
         );
}
