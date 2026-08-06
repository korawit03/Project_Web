import React, { useState } from "react";
import { MapPin, LocateFixed, X, ExternalLink } from "lucide-react";
import { COLORS } from "../lib/tokens.js";

// ปุ่มปักหมุดตำแหน่งปัจจุบันของช่าง (ใช้ Geolocation API ของเบราว์เซอร์/มือถือ)
// เก็บเป็น latitude/longitude แยกจากช่องข้อความ "สถานที่" เพื่อให้กดเปิด Google Maps ได้แม่นยำ
export default function LocationPicker({ latitude, longitude, onChange }) {
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");

  const hasPin = latitude != null && longitude != null;

  const handlePin = () => {
    if (!navigator.geolocation) {
      setError("อุปกรณ์นี้ไม่รองรับการปักหมุดตำแหน่ง");
      return;
    }
    setError("");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setError("กรุณาอนุญาตให้เข้าถึงตำแหน่งในเบราว์เซอร์ แล้วลองใหม่อีกครั้ง");
        } else {
          setError("ไม่สามารถระบุตำแหน่งได้ กรุณาลองใหม่อีกครั้ง");
        }
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const handleClear = () => {
    onChange({ latitude: null, longitude: null });
    setError("");
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handlePin}
          disabled={locating}
          className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium disabled:opacity-60"
          style={{ borderColor: COLORS.border, color: COLORS.charcoalSoft, background: "white" }}
        >
          <LocateFixed size={13} />
          {locating ? "กำลังค้นหาตำแหน่ง..." : hasPin ? "ปักหมุดใหม่" : "ปักหมุดตำแหน่งปัจจุบัน"}
        </button>

        {hasPin && (
          <>
            <a
              href={`https://www.google.com/maps?q=${latitude},${longitude}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-xs font-medium"
              style={{ color: COLORS.amberDark }}
            >
              <MapPin size={12} />
              เปิดดูในแผนที่
              <ExternalLink size={11} />
            </a>
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center gap-1 text-xs font-medium"
              style={{ color: COLORS.textMuted }}
            >
              <X size={11} />
              ลบหมุด
            </button>
          </>
        )}
      </div>

      {hasPin && (
        <p className="text-xs" style={{ color: COLORS.textMuted }}>
          พิกัด: {latitude.toFixed(6)}, {longitude.toFixed(6)}
        </p>
      )}

      {error && (
        <p className="text-xs font-medium" style={{ color: COLORS.red }}>
          {error}
        </p>
      )}
    </div>
  );
}