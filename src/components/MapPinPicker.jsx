import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, LocateFixed, X, ExternalLink } from "lucide-react";
import { COLORS } from "../lib/tokens.js";

const DEFAULT_CENTER = [13.7563, 100.5018]; // กลางประเทศไทย (ใช้ตอนยังไม่มีหมุด)
const DEFAULT_ZOOM = 6;
const PIN_ZOOM = 17;

// แผนที่ปักหมุดแบบ "หมุดอยู่กลางจอ เลื่อนแผนที่ไปหาจุดที่ต้องการ"
// - โหมดแก้ไข: ลาก/ซูมแผนที่ได้ พิกัดหมุด = จุดกึ่งกลางแผนที่
// - readOnly: แสดงตำแหน่งที่ปักไว้เฉยๆ ลากไม่ได้
export default function MapPinPicker({ latitude, longitude, onChange, readOnly = false, height = 280 }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");

  const hasPin = latitude != null && longitude != null;

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // สร้างแผนที่ครั้งเดียวตอน mount
  useEffect(() => {
    const hasInitial = latitude != null && longitude != null;
    const interactive = !readOnly;

    const map = L.map(containerRef.current, {
      center: hasInitial ? [latitude, longitude] : DEFAULT_CENTER,
      zoom: hasInitial ? PIN_ZOOM : DEFAULT_ZOOM,
      zoomControl: interactive,
      dragging: interactive,
      touchZoom: interactive,
      scrollWheelZoom: interactive,
      doubleClickZoom: interactive,
      boxZoom: interactive,
      keyboard: interactive,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    if (interactive) {
      // เลื่อนแผนที่เสร็จ -> พิกัดหมุดคือจุดกึ่งกลางจอ
      map.on("moveend", () => {
        const c = map.getCenter();
        onChangeRef.current?.({ latitude: c.lat, longitude: c.lng });
      });
    }

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // โหมดอ่านอย่างเดียว: ถ้าพิกัดเปลี่ยนให้ย้ายแผนที่ตาม
  useEffect(() => {
    if (readOnly && hasPin && mapRef.current) {
      mapRef.current.setView([latitude, longitude], PIN_ZOOM);
    }
  }, [readOnly, hasPin, latitude, longitude]);

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setError("อุปกรณ์นี้ไม่รองรับการระบุตำแหน่ง");
      return;
    }
    setError("");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        mapRef.current?.setView([lat, lng], PIN_ZOOM);
        onChange?.({ latitude: lat, longitude: lng });
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        setError(
          err.code === err.PERMISSION_DENIED
            ? "กรุณาอนุญาตให้เข้าถึงตำแหน่งในเบราว์เซอร์ แล้วลองใหม่อีกครั้ง"
            : "ไม่สามารถระบุตำแหน่งได้ กรุณาลองใหม่อีกครั้ง"
        );
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const handleClear = () => {
    onChange?.({ latitude: null, longitude: null });
    setError("");
  };

  return (
    <div className="space-y-2">
      {/* isolation: กันไม่ให้ layer ของแผนที่ไปทับแถบเมนู */}
      <div
        className="relative overflow-hidden rounded-lg border"
        style={{ borderColor: COLORS.border, height, isolation: "isolate" }}
      >
        <div ref={containerRef} className="h-full w-full" />

        {(hasPin || !readOnly) && (
          <div
            className="pointer-events-none absolute left-1/2 top-1/2"
            style={{ transform: "translate(-50%, -100%)", zIndex: 1000 }}
          >
            <MapPin size={36} color={COLORS.charcoal} strokeWidth={1.8} fill={hasPin ? COLORS.amber : "#B9BCC2"} />
          </div>
        )}
      </div>

      {!readOnly && (
        <>
          <p className="text-xs" style={{ color: COLORS.textMuted }}>
            {hasPin
              ? "เลื่อนหรือซูมแผนที่ให้หมุดอยู่ตรงตำแหน่งที่ต้องการ"
              : "ยังไม่ได้ปักหมุด — เลื่อนแผนที่ไปยังตำแหน่งที่ต้องการ หรือกด \"ใช้ตำแหน่งปัจจุบัน\""}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleLocate}
              disabled={locating}
              className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium disabled:opacity-60"
              style={{ borderColor: COLORS.border, color: COLORS.charcoalSoft, background: "white" }}
            >
              <LocateFixed size={13} />
              {locating ? "กำลังค้นหาตำแหน่ง..." : "ใช้ตำแหน่งปัจจุบัน"}
            </button>
            {hasPin && (
              <button
                type="button"
                onClick={handleClear}
                className="flex items-center gap-1 text-xs font-medium"
                style={{ color: COLORS.textMuted }}
              >
                <X size={11} />
                ลบหมุด
              </button>
            )}
          </div>
        </>
      )}

      {hasPin && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs" style={{ color: COLORS.textMuted }}>
          <span>
            พิกัด: {Number(latitude).toFixed(6)}, {Number(longitude).toFixed(6)}
          </span>
          <a
            href={`https://www.google.com/maps?q=${latitude},${longitude}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 font-medium"
            style={{ color: COLORS.amberDark }}
          >
            เปิดใน Google Maps
            <ExternalLink size={11} />
          </a>
        </div>
      )}

      {error && (
        <p className="text-xs font-medium" style={{ color: COLORS.red }}>
          {error}
        </p>
      )}
    </div>
  );
}