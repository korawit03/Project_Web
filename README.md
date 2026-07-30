# Site Work App

ระบบบันทึกข้อมูลหน้างานสำหรับช่าง (React + Tailwind CSS + Firebase)

## วิธีติดตั้งและรัน

```bash
npm install
npm run dev
```

จากนั้นเปิดเบราว์เซอร์ไปที่ลิงก์ที่ขึ้นในเทอร์มินัล (ปกติคือ http://localhost:5173)

## ตั้งค่า Firebase

1. สร้างโปรเจกต์ใน [Firebase Console](https://console.firebase.google.com)
2. เปิดใช้งาน Authentication, Firestore Database, Storage
3. คัดลอก `.env.example` เป็น `.env` แล้วใส่ค่า config จริงจาก Firebase Console

## โครงสร้างโฟลเดอร์

```
src/
├── components/     UI ที่ใช้ซ้ำได้ (Sidebar, การ์ดชิ้นงาน, ช่องแนบรูป ฯลฯ)
├── pages/          แต่ละหน้าของแอป
├── firebase/       การเชื่อมต่อ Firebase
└── lib/            ค่าคงที่ที่ใช้ร่วมกัน (โทนสี, รายการ dropdown)
```