const BAD_CHARS = /[^a-zA-Z\u0E00-\u0E7F\s]/g;
const NAME_OK = /^[a-zA-Z\u0E00-\u0E7F\s]+$/;
const PHONE_OK = /^0\d{2}-\d{3}-\d{4}$/;

export const filterName = (v) => v.replace(BAD_CHARS, "");
export const cleanName = (v) => v.replace(/\s+/g, " ").trim();
export const isValidName = (v) => {
  const c = cleanName(v);
  return c.length > 0 && NAME_OK.test(c);
};
export const joinName = (first, last) => cleanName(`${first || ""} ${last || ""}`);

// "สมชาย ใจดี มั่นคง" -> { firstName: "สมชาย", lastName: "ใจดี มั่นคง" }
export function splitName(full = "") {
  const c = cleanName(full);
  const i = c.indexOf(" ");
  return i === -1
    ? { firstName: c, lastName: "" }
    : { firstName: c.slice(0, i), lastName: c.slice(i + 1) };
}

// เหลือเฉพาะตัวเลข 10 หลัก แล้วใส่ขีดเป็น 0XX-XXX-XXXX
export function formatPhone(v) {
  const d = v.replace(/\D/g, "").slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
}
export const isValidPhone = (v) => PHONE_OK.test(v);