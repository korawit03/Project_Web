import React, { useState, useEffect } from "react";
import { Wrench, Plus, MapPin, Layers, Save, AlertCircle } from "lucide-react";
import { COLORS } from "../lib/tokens.js";
import { FieldLabel, TextInput, ErrorText } from "../components/ui.jsx";
import WorkItemCard from "../components/WorkItemCard.jsx";
import { validateForm, hasErrors, buildErrorMessages } from "../lib/validation.js";
import SuccessBurst from "../components/SuccessBurst.jsx";
let itemCounter = 1;
function newWorkItem() {
  return {
    id: `item-${Date.now()}-${itemCounter++}`,
    mainWork: "",
    answers: {},
    positionNote: "",
    positionPhotos: [],
    workPhotos: [],
    note: "",
  };
}

export default function SiteWorkForm({ onSaved }) {
  const [projectName, setProjectName] = useState("");
  const [location, setLocation] = useState("");
  const [items, setItems] = useState([newWorkItem()]);
  const [savedMsg, setSavedMsg] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({ projectName: false, items: {} });

  // เมื่อเคยกดบันทึกแล้วครั้งหนึ่ง ให้ตรวจซ้ำอัตโนมัติทุกครั้งที่แก้ไข
  useEffect(() => {
    if (submitted) {
      setErrors(validateForm(projectName, items));
    }
  }, [submitted, projectName, items]);

  const updateItem = (id, next) => setItems((prev) => prev.map((it) => (it.id === id ? next : it)));
  const removeItem = (id) => setItems((prev) => prev.filter((it) => it.id !== id));
  const addItem = () => setItems((prev) => [...prev, newWorkItem()]);

  const errorMessages = buildErrorMessages(errors, items);

  const handleSave = () => {
    setSubmitted(true);
    const nextErrors = validateForm(projectName, items);
    setErrors(nextErrors);

    if (hasErrors(nextErrors)) {
      setSavedMsg("");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // TODO: ขั้นถัดไป - อัปโหลดรูปขึ้น Firebase Storage แล้วบันทึกลง Firestore จริง
    const project = {
      id: `project-${Date.now()}`,
      customerName: projectName.trim(),
      location: location.trim(),
      items,
      savedAt: new Date().toISOString(),
    };

    onSaved(project);

    // เคลียร์ฟอร์มให้พร้อมกรอกรายการถัดไป แต่ยังอยู่หน้าเดิม ไม่เด้งไปหน้าลูกค้า
    setProjectName("");
    setLocation("");
    setItems([newWorkItem()]);
    setSubmitted(false);
    setErrors({ projectName: false, items: {} });
    setSavedMsg("บันทึกข้อมูลเรียบร้อย ดูรายการที่บันทึกได้ที่เมนู \"ลูกค้า\"");
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => setSavedMsg(""), 4000);
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
      </div>

      <SuccessBurst message={savedMsg} trigger={savedMsg ? Date.now() : null} />

      {/* {errorMessages.length > 0 && (
        <div className="mb-6 rounded-lg border p-4" style={{ borderColor: COLORS.red, background: "#FDECEC" }}>
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold" style={{ color: COLORS.red }}>
            <AlertCircle size={16} />
            กรุณากรอกข้อมูลให้ครบก่อนบันทึก ({errorMessages.length} จุด)
          </p>
          <ul className="ml-1 space-y-1 text-xs" style={{ color: COLORS.red }}>
            {errorMessages.map((msg, i) => (
              <li key={i}>• {msg}</li>
            ))}
          </ul>
        </div>
      )} */}

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel required>ชื่อโครงการ / ข้อมูลลูกค้า</FieldLabel>
          <TextInput
            placeholder="เช่น คุณสมชาย - บ้านเดี่ยว ซ.ลาดพร้าว 15"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            error={errors.projectName}
          />
          {errors.projectName && <ErrorText>กรุณากรอกชื่อโครงการ / ข้อมูลลูกค้า</ErrorText>}
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
          <WorkItemCard
            key={item.id}
            item={item}
            index={idx}
            onChange={(next) => updateItem(item.id, next)}
            onRemove={() => removeItem(item.id)}
            removable={items.length > 1}
            errors={errors.items[item.id] || {}}
          />
        ))}
      </div>

      <div className="mt-7 flex flex-col items-center gap-2">
        <button type="button" onClick={handleSave} className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-sm transition-transform active:scale-95 hover:-translate-y-0.5" style={{ background: COLORS.charcoal }}>
          <Save size={16} style={{ color: COLORS.amber }} />
          บันทึกข้อมูลและอัปเดตลงระบบหลัก
        </button>
      </div>
    </div>
  );
}