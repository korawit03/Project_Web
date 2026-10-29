import { useState, useEffect } from "react";

/**
 * Hook ตรวจจับสถานะการเชื่อมต่ออินเทอร์เน็ต (Online / Offline)
 * คืนค่า:
 * - isOnline: boolean
 * - wasOffline: boolean (เคยออฟไลน์มาก่อนแล้วเพิ่งกลับมาต่อเน็ตติด)
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== "undefined" && typeof navigator.onLine === "boolean"
      ? navigator.onLine
      : true
  );
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      // ซ่อนสถานะ "กลับมาออนไลน์" หลังผ่านไป 4 วินาที
      const timer = setTimeout(() => {
        setWasOffline(false);
      }, 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return { isOnline, wasOffline };
}

