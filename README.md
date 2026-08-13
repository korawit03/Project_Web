# Site Work App

ระบบบันทึกข้อมูลหน้างานสำหรับช่าง (React + Tailwind CSS + Supabase)

## วิธีติดตั้งและรัน

```bash
npm install
npm run dev
```

จากนั้นเปิดเบราว์เซอร์ไปที่ลิงก์ที่ขึ้นในเทอร์มินัล  ➜  Local:  https://localhost:5173/
➜ Network: https://192.168.1.39:5173/

## ตั้งค่า Supabase

1. สร้างโปรเจกต์ใน [Supabase Dashboard](https://supabase.com/dashboard)
2. สร้างตารางที่จำเป็น: `customers`, `projects`, `work_items`, `work_categories`, `work_types`, `work_type_fields`, `work_type_field_options`
3. เปิดใช้งาน Storage แล้วสร้าง bucket ชื่อ `site-photos` (public bucket สำหรับเก็บรูปหน้างาน)
4. ตั้งค่า Row Level Security (RLS) policy ให้เหมาะสมกับแต่ละตาราง (โดยเฉพาะ `customers` ต้องอนุญาต DELETE ด้วย ไม่งั้นการลบลูกค้าอัตโนมัติเมื่อไม่มีโครงการเหลือจะล้มเหลวแบบเงียบๆ)
5. คัดลอก `.env.example` เป็น `.env` แล้วใส่ค่าจริงจาก Supabase Dashboard:
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=xxxxx
   ```

## โครงสร้างโฟลเดอร์

```
src/
├── components/     UI ที่ใช้ซ้ำได้ (Sidebar, การ์ดชิ้นงาน, ช่องแนบรูป ฯลฯ)
├── pages/          แต่ละหน้าของแอป
├── lib/            การเชื่อมต่อ Supabase, hooks, ค่าคงที่ที่ใช้ร่วมกัน (โทนสี, validation)
```