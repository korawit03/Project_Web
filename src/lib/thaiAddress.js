let cache = null;

// โหลดข้อมูลครั้งเดียว ใช้ซ้ำทั้งแอป โครงสร้าง: [[จังหวัด, [[อำเภอ, [[ตำบล, รหัสไปรษณีย์], ...]], ...]], ...]
export function loadThaiAddress() {
  cache =
    cache ||
    fetch("/thai-address.json")
      .then((r) => {
        if (!r.ok) throw new Error("load thai address failed");
        return r.json();
      })
      .catch((e) => {
        cache = null;
        throw e;
      });
  return cache;
}

export const EMPTY_ADDR = { addressLine: "", province: "", district: "", subdistrict: "", postalCode: "" };

// ประกอบข้อความที่อยู่เต็ม เช่น "99/1 ซอย 5 ต.หาดใหญ่ อ.หาดใหญ่ จ.สงขลา 90110"
export function buildAddress(a) {
  const bkk = a.province === "กรุงเทพมหานคร";
  return [
    a.addressLine?.trim(),
    a.subdistrict && (bkk ? "แขวง" : "ต.") + a.subdistrict,
    a.district && (bkk ? "เขต" : "อ.") + a.district,
    a.province && (bkk ? "" : "จ.") + a.province,
    a.postalCode,
  ]
    .filter(Boolean)
    .join(" ");
}

// อ่านจากแถว customer_locations ใน DB (ข้อมูลเก่าที่มีแต่ address จะถูกใส่ช่องบ้านเลขที่ให้)
export function addrFromLocation(l) {
  const structured = l.province || l.district || l.subdistrict || l.address_line;
  return {
    addressLine: structured ? l.address_line || "" : l.address || "",
    province: l.province || "",
    district: l.district || "",
    subdistrict: l.subdistrict || "",
    postalCode: l.postal_code || "",
  };
}

// แปลงเป็น payload สำหรับบันทึกลง DB
export function addressPayload(a) {
  const t = (v) => v?.trim() || null;
  return {
    address: buildAddress(a) || null,
    address_line: t(a.addressLine),
    province: t(a.province),
    district: t(a.district),
    subdistrict: t(a.subdistrict),
    postal_code: t(a.postalCode),
  };
}