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
} from "lucide-react";
import { COLORS } from "../lib/tokens.js";
import { FieldLabel, TextInput } from "./ui.jsx";
import WorkItemCard from "./WorkItemCard.jsx";
import LocationPicker from "./LocationPicker.jsx";
import { validateForm, hasErrors } from "../lib/validation.js";
import { DEFAULT_STATUS } from "../lib/status.js";

let editItemCounter = 1;
function newWorkItem() {
         return {
                  id: `edit-item-${Date.now()}-${editItemCounter++}`,
                  mainWork: "",
                  answers: {},
                  positionNote: "",
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
export default function ProjectCard({ project, onUpdate, onDelete, workCatalog, categoryOrder }) {
         const [expanded, setExpanded] = useState(false);
         const [editing, setEditing] = useState(false);
         const [saving, setSaving] = useState(false);
         const [deleting, setDeleting] = useState(false);
         const [submitted, setSubmitted] = useState(false);
         const [errors, setErrors] = useState({ projectName: false, items: {} });

         const [editLocation, setEditLocation] = useState(project.location || "");
         const [editLatitude, setEditLatitude] = useState(project.latitude ?? null);
         const [editLongitude, setEditLongitude] = useState(project.longitude ?? null);
         const [editItems, setEditItems] = useState(() =>
                  project.items.map((it) => ({ ...it, answers: { ...it.answers } }))
         );

         const startEdit = () => {
                  setEditLocation(project.location || "");
                  setEditLatitude(project.latitude ?? null);
                  setEditLongitude(project.longitude ?? null);
                  setEditItems(project.items.map((it) => ({ ...it, answers: { ...it.answers } })));
                  setSubmitted(false);
                  setErrors({ projectName: false, items: {} });
                  setEditing(true);
                  setExpanded(true);
         };

         const cancelEdit = () => {
                  setEditing(false);
                  setSubmitted(false);
                  setErrors({ projectName: false, items: {} });
         };

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

                  const confirmed = window.confirm("ยืนยันบันทึกการแก้ไขโครงงานนี้ใช่หรือไม่?");
                  if (!confirmed) return;

                  setSaving(true);
                  try {
                           const ok = await onUpdate({
                                    ...project,
                                    location: editLocation,
                                    latitude: editLatitude,
                                    longitude: editLongitude,
                                    items: editItems,
                           });
                           if (ok !== false) setEditing(false);
                  } finally {
                           setSaving(false);
                  }
         };

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

         const itemCount = project.items?.length || 0;

         return (
                  <div className="p-4">
                           <div className="flex flex-wrap items-start justify-between gap-3">
                                    <button
                                             type="button"
                                             onClick={() => setExpanded((v) => !v)}
                                             className="flex flex-1 min-w-0 items-start gap-2 text-left"
                                    >
                                             <span
                                                      className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                                                      style={{ background: "#FAF8F3", border: `1px solid ${COLORS.border}` }}
                                             >
                                                      <Layers size={13} style={{ color: COLORS.amber }} />
                                             </span>
                                             <span className="min-w-0">
                                                      <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm font-medium" style={{ color: COLORS.charcoal }}>
                                                               <span className="flex items-center gap-1">
                                                                        <MapPin size={12} style={{ color: COLORS.textMuted }} />
                                                                        {project.location ? (
                                                                                 <>สถานที่หน้างาน: {project.location}</>
                                                                        ) : (
                                                                                 <span style={{ color: COLORS.textMuted }}>(ยังไม่ระบุสถานที่หน้างาน)</span>
                                                                        )}
                                                               </span>
                                                               <span className="text-xs font-normal" style={{ color: COLORS.textMuted }}>
                                                                        ทั้งหมด {itemCount} ชิ้นงาน
                                                               </span>
                                                      </span>
                                                      <span className="mt-0.5 flex items-center gap-1 text-xs" style={{ color: COLORS.textMuted }}>
                                                               <Calendar size={11} />
                                                               บันทึกล่าสุด: {formatDate(project.updatedAt || project.savedAt)}
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
                                                      <button
                                                               type="button"
                                                               onClick={startEdit}
                                                               className="flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium"
                                                               style={{ borderColor: COLORS.border, color: COLORS.charcoalSoft, background: "white" }}
                                                      >
                                                               <Pencil size={12} />
                                                               แก้ไข
                                                      </button>
                                                      <button
                                                               type="button"
                                                               onClick={handleDelete}
                                                               disabled={deleting}
                                                               className="flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-white disabled:opacity-60"
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
                                                               {(it.workPhotos?.length > 0 || it.positionPhotos?.length > 0) && (
                                                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                                                                 {[...it.positionPhotos, ...it.workPhotos].map((p) => (
                                                                                          <a key={p.id}
                                                                                                   href={p.url}
                                                                                                   target="_blank"
                                                                                                   rel="noreferrer"
                                                                                                   className="block h-12 w-12 overflow-hidden rounded-md border"
                                                                                                   style={{ borderColor: COLORS.border }}>
                                                                                                   
                                                                                                   <img src={p.url} alt={p.name} className="h-full w-full object-cover" />
                                                                                          </a>
                                                                                 ))}
                                                                        </div>
                                                               )}
                                                      </div>
                                             ))}
                                    </div>
                           )}

                           {editing && (
                                    <div className="mt-4 space-y-4 border-t pt-4" style={{ borderColor: COLORS.border }}>
                                             <div>
                                                      <FieldLabel icon={MapPin}>สถานที่ / พิกัดที่ตั้ง</FieldLabel>
                                                      <TextInput placeholder="" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} />
                                                      <div className="mt-2">
                                                               <LocationPicker
                                                                        latitude={editLatitude}
                                                                        longitude={editLongitude}
                                                                        onChange={({ latitude: lat, longitude: lng }) => {
                                                                                 setEditLatitude(lat);
                                                                                 setEditLongitude(lng);
                                                                        }}
                                                               />
                                                      </div>
                                             </div>

                                             <div className="flex items-center justify-between">
                                                      <div className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: COLORS.charcoal }}>
                                                               <Layers size={14} style={{ color: COLORS.amber }} />
                                                               ชิ้นงาน
                                                      </div>
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