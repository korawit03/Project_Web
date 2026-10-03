import React, { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { COLORS } from "../lib/tokens.js";
import { FieldLabel, TextInput, Select } from "./ui.jsx";
import { loadThaiAddress } from "../lib/thaiAddress.js";

// value = { addressLine, province, district, subdistrict, postalCode }
// onChange(patch) ส่งเฉพาะช่องที่เปลี่ยน
export default function ThaiAddressFields({ value, onChange }) {
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    loadThaiAddress()
      .then((d) => alive && setData(d))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, []);

  const prov = data?.find((p) => p[0] === value.province);
  const dist = prov?.[1].find((d) => d[0] === value.district);

  return (
    <div className="space-y-3">
      <div>
        <FieldLabel icon={MapPin}>บ้านเลขที่ / หมู่ / ซอย / ถนน</FieldLabel>
        <TextInput
          placeholder="เช่น 99/1 หมู่ 3 ซอย 5 ถนนเพชรเกษม"
          value={value.addressLine}
          onChange={(e) => onChange({ addressLine: e.target.value })}
        />
      </div>

      {failed && (
        <p className="text-xs font-medium" style={{ color: COLORS.red }}>
          โหลดรายชื่อจังหวัดไม่สำเร็จ กรุณารีเฟรชหน้าแล้วลองใหม่
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <FieldLabel>จังหวัด</FieldLabel>
          <Select
            value={value.province}
            onChange={(e) => onChange({ province: e.target.value, district: "", subdistrict: "", postalCode: "" })}
            options={data ? data.map((p) => p[0]) : []}
            placeholder={data ? "-- เลือกจังหวัด --" : "กำลังโหลด..."}
          />
        </div>
        <div>
          <FieldLabel>อำเภอ / เขต</FieldLabel>
          <Select
            value={value.district}
            onChange={(e) => onChange({ district: e.target.value, subdistrict: "", postalCode: "" })}
            options={prov ? prov[1].map((d) => d[0]) : []}
            placeholder={prov ? "-- เลือกอำเภอ/เขต --" : "-- เลือกจังหวัดก่อน --"}
          />
        </div>
        <div>
          <FieldLabel>ตำบล / แขวง</FieldLabel>
          <Select
            value={value.subdistrict}
            onChange={(e) => {
              const name = e.target.value;
              const sub = dist?.[1].find((s) => s[0] === name);
              onChange({ subdistrict: name, postalCode: sub ? String(sub[1]) : "" });
            }}
            options={dist ? dist[1].map((s) => s[0]) : []}
            placeholder={dist ? "-- เลือกตำบล/แขวง --" : "-- เลือกอำเภอก่อน --"}
          />
        </div>
        <div>
          <FieldLabel>รหัสไปรษณีย์</FieldLabel>
          <TextInput
            inputMode="numeric"
            maxLength={5}
            placeholder="เติมให้อัตโนมัติ"
            value={value.postalCode}
            onChange={(e) => onChange({ postalCode: e.target.value.replace(/\D/g, "") })}
          />
        </div>
      </div>
    </div>
  );
}