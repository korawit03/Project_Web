import React, { useState } from "react";
import { Wrench, ChevronLeft, Plus, MapPin, Layers, Save } from "lucide-react";
import { COLORS } from "../lib/tokens.js";
import { FieldLabel, TextInput } from "../components/ui.jsx";
import WorkItemCard from "../components/WorkItemCard.jsx";

let itemCounter = 1;
function newWorkItem() {
  return {
    id: `item-${Date.now()}-${itemCounter++}`,
    mainWork: "",
    answers: {}, // เก็บค่ารายละเอียด/วัสดุที่เปลี่ยนไปตามชิ้นงานหลักที่เลือก เช่น { frameColor: "ขาว", glassColor: "ใส" }
    positionNote: "",
    positionPhotos: [],
    workPhotos: [],
    note: "",
  };
}

export default function SiteWorkForm() {
  const [projectName, setProjectName] = useState("");
  const [location, setLocation] = useState("");
  const [items, setItems] = useState([newWorkItem()]);
  const [savedMsg, setSavedMsg] = useState("");

  const updateItem = (id, next) => setItems((prev) => prev.map((it) => (it.id === id ? next : it)));
  const removeItem = (id) => setItems((prev) => prev.filter((it) => it.id !== id));
  const addItem = () => setItems((prev) => [...prev, newWorkItem()]);

  const handleSave = () => {
    // TODO: ขั้นถัดไป - อัปโหลดรูปขึ้น Firebase Storage แล้วบันทึกข้อมูลลง Firestore
    setSavedMsg("บันทึกข้อมูลเรียบร้อย (โหมดตัวอย่าง ยังไม่เชื่อมต่อฐานข้อมูลจริง)");
    setTimeout(() => setSavedMsg(""), 3500);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-8">
      <div className="mb-6 flex items-center justify-between gap-3 border-b pb-4" style={{ borderColor: COLORS.border }}>
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: COLORS.charcoal }}>
            <Wrench size={17} color={COLORS.amber} />
          </span>
          <h1 className="text-lg font-bold" style={{ color: COLORS.charcoal }}>
            ฟอร์มจัดการข้อมูลหน้างานหลัก
          </h1>
        </div>
        
        {/* ปุ่มกลับหน้ารายการถูกซ่อนชั่วคราว เพราะยังไม่มีหน้ารายการจริง (ยังไม่เชื่อมต่อฐานข้อมูล) */}
        {/* <button type="button" className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium text-white shrink-0" style={{ background: COLORS.charcoalSoft }}>
          <ChevronLeft size={15} />
          กลับหน้ารายการ
        </button> */}
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel required>ชื่อโครงการ / ข้อมูลลูกค้า</FieldLabel>
          <TextInput placeholder="เช่น คุณสมชาย - บ้านเดี่ยว ซ.ลาดพร้าว 15" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
        </div>
        <div>
          <FieldLabel icon={MapPin}>สถานที่ / พิกัดที่ตั้ง</FieldLabel>
          <TextInput placeholder="ที่อยู่ หรือพิกัด GPS" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: COLORS.charcoal }}>
          <Layers size={15} style={{ color: COLORS.amber }} />
          ชิ้นงานที่ต้องการบันทึกข้อมูล
        </div>
        <button type="button" onClick={addItem} className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium text-white" style={{ background: COLORS.green }}>
          <Plus size={15} />
          เพิ่มชิ้นงานถัดไป
        </button>
      </div>

      <div className="space-y-4">
        {items.map((item, idx) => (
          <WorkItemCard key={item.id} item={item} index={idx} onChange={(next) => updateItem(item.id, next)} onRemove={() => removeItem(item.id)} removable={items.length > 1} />
        ))}
      </div>

      <div className="mt-7 flex flex-col items-center gap-2">
        <button type="button" onClick={handleSave} className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-sm" style={{ background: COLORS.charcoal }}>
          <Save size={16} style={{ color: COLORS.amber }} />
          บันทึกข้อมูลและอัปเดตลงระบบหลัก
        </button>
        {savedMsg && (
          <p className="text-xs font-medium" style={{ color: COLORS.green }}>
            {savedMsg}
          </p>
        )}
      </div>
    </div>
  );
}