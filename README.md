<div align="center">

**โปรแกรมช่วยทำเควสต์เกม Discord อัตโนมัติ ปลอดภัย และไม่จำเป็นต้องติดตั้งตัวเกมจริง**

[![Platform](https://img.shields.io/badge/Platform-Windows%2010%20%7C%2011-0078D6?style=flat-square&logo=windows&logoColor=white)](https://github.com/phwyverysad/discord-quest-completer)
[![Built With](https://img.shields.io/badge/Built%20With-Tauri%202%20%7C%20Rust%20%7C%20Vue%203-FFC131?style=flat-square&logo=tauri&logoColor=white)](https://tauri.app/)
[![Languages](https://img.shields.io/badge/Languages-TH%20%7C%20EN-5c5ce0?style=flat-square)](https://github.com/phwyverysad/discord-quest-completer)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)
[![Download](https://img.shields.io/badge/Download-Latest%20Release-brightgreen?style=flat-square)](https://github.com/phwyverysad/discord-quest-completer/releases/latest)
[![VirusTotal](https://img.shields.io/badge/VirusTotal-Clean%20%2F%20Safe-brightgreen?style=flat-square&logo=virustotal&logoColor=white)](https://www.virustotal.com/gui/file/3f8559ede61b9930c1896b09a8fc8a87d0fe1905c5a8910396d40ae2595c507d?nocache=1)

</div>

---

## ภาพรวม (Overview)
Discord Quest Completer คือโปรแกรมสำหรับรันและทำเควสต์ Discord อัตโนมัติบน Windows พัฒนาด้วย Tauri 2 (Rust + Vue 3) จำลองสถานะเกม (Rich Presence / RPC) และรัน Process เกมจำลองขนาดจิ๋ว (Dummy Runner) ช่วยให้ทำภารกิจ Discord Quests ได้จนจบโดยไม่จำเป็นต้องดาวน์โหลดหรือติดตั้งตัวเกมจริง พร้อมระบบ Auto-Pilot สลับคิวเกมให้อัตโนมัติ

---


https://github.com/user-attachments/assets/855b96be-8e35-4083-8735-f9754e9376c7

---

## ฟีเจอร์เด่น (Key Features)
* **Discord Quest Simulation**: จำลองสถานะเกมและเชื่อมต่อ Discord RPC โดยตรง ทำเควสต์สำเร็จได้โดยไม่ต้องติดตั้งตัวเกมจริง
* **Ultra-Lightweight Dummy Runner**: ตัวจำลอง Process ขนาดจิ๋ว (~6 KB) พัฒนาด้วย Win32 API กินทรัพยากรเครื่องต่ำมาก แทบไม่ใช้ RAM และ CPU
* **Multi-Client RPC**: รองรับการส่งสถานะไปยัง Discord ทุกรุ่นพร้อมกัน (Discord Stable, Discord PTB, Discord Canary)
* **Auto-Pilot Mode**: ระบบสลับคิวทำเควสต์อัตโนมัติ ตั้งเวลาเล่นแต่ละเกมได้ (5m, 10m, 15m, 20m) พร้อมแถบเวลานับถอยหลังแบบเรียลไทม์
* **Steam Icon Resolution Engine**: ดึงไอคอนเกม Steam แบบคมชัดอัตโนมัติหลายระดับ หมดปัญหาไอคอนเกมไม่แสดง
* **Custom Game Queue & Reordering**: จัดการเพิ่ม ลบ และเรียงลำดับคิวเกมได้อย่างอิสระผ่านปุ่มเลื่อนขึ้น-ลง
* **Multi-Language (i18n)**: รองรับ 2 ภาษา (ไทย และ อังกฤษ) สลับเปลี่ยนภาษาได้ทันทีแบบเรียลไทม์
* **Modern Clean UI**: หน้าต่างโปรแกรมสไตล์มินิมอล รองรับ Dark Mode, หน้าต่าง Maximized และปุ่ม Pin ปักหมุดหน้าต่างบนสุด
* **Safety & Privacy**: มีระบบยืนยันความเสี่ยง RPC ปลอดภัย 100% ไม่มีการเข้าถึงโทเคนหรือข้อมูลบัญชี Discord

---

## ดาวน์โหลด (Downloads)
ดาวน์โหลดเวอร์ชันล่าสุดได้ที่ [GitHub Releases](https://github.com/phwyverysad/discord-quest-completer/releases/latest):

| ไฟล์ | ขนาด | รูปแบบการใช้งาน |
| :--- | :---: | :--- |
| **`Discord Quest Completer_1.0.0_x64-setup.exe`** | **~5.8 MB** | **ตัวติดตั้งมาตรฐาน (Setup)** ติดตั้งลงระบบและสร้างช็อตคัทบนเดสก์ท็อปให้อัตโนมัติ |
| **`discord-quest-completer.exe`** | **~19 MB** | **โปรแกรมตัวเต็มแบบ Portable** พกพาเปิดใช้งานได้ทันทีไม่ต้องติดตั้ง |
| **`Discord Quest Completer_1.0.0_x64_en-US.msi`** | **~7.9 MB** | **ไฟล์ติดตั้งระบบ (MSI)** สำหรับการติดตั้งในระดับระบบ Windows |

> **ความปลอดภัย (VirusTotal)**: ตรวจสอบผลการสแกนไวรัสแล้ว ปลอดภัย 100% ไร้มัลแวร์ ดูรายงานฉบับเต็มได้ที่ [VirusTotal Scan Report](https://www.virustotal.com/gui/file/3f8559ede61b9930c1896b09a8fc8a87d0fe1905c5a8910396d40ae2595c507d?nocache=1)

---

### รันจาก Source Code
```bash
# โคลนและติดตั้ง Dependencies
git clone https://github.com/phwyverysad/discord-quest-completer.git
cd discord-quest-completer
pnpm install

# เริ่มต้นใช้งานโปรแกรม (Development)
pnpm tauri dev
```

### คำสั่งคอมไพล์ (Build Commands)
```bash
# บิลด์ตัวรันจำลองเกม (Win Runner)
pnpm build:runner:win
pnpm copy:runner:win

# คอมไพล์โปรแกรมเป็นไฟล์ติดตั้งและไฟล์ .exe (Release Mode)
pnpm tauri build
```

---

โปรเจกต์นี้เผยแพร่ภายใต้สัญญาอนุญาต [MIT License](LICENSE) - Copyright (c) 2026 phwyverysad
