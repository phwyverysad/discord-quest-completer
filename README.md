# Discord Quest Completer

<div align="center">

**โปรแกรมช่วยทำเควสต์เกม Discord อัตโนมัติ ปลอดภัย และไม่จำเป็นต้องติดตั้งตัวเกมจริง**

[![Platform](https://img.shields.io/badge/Platform-Windows-0078D6?style=flat-square&logo=windows&logoColor=white)](https://github.com/phwyverysad/discord-quest-completer)
[![Framework](https://img.shields.io/badge/Framework-Tauri%202-FFC131?style=flat-square&logo=tauri&logoColor=white)](https://tauri.app/)
[![Frontend](https://img.shields.io/badge/Frontend-Vue%203%20%7C%20TailwindCSS-4FC08D?style=flat-square&logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![Backend](https://img.shields.io/badge/Backend-Rust-DEA584?style=flat-square&logo=rust&logoColor=white)](https://www.rust-lang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)
[![Download](https://img.shields.io/badge/Download-Latest%20Release-brightgreen?style=flat-square)](https://github.com/phwyverysad/discord-quest-completer/releases)
[![GitHub Stars](https://img.shields.io/github/stars/phwyverysad/discord-quest-completer?style=flat-square&color=gold)](https://github.com/phwyverysad/discord-quest-completer/stargazers)
[![GitHub Issues](https://img.shields.io/github/issues/phwyverysad/discord-quest-completer?style=flat-square&color=orange)](https://github.com/phwyverysad/discord-quest-completer/issues)

[ภาพรวม](#ภาพรวม) | [ฟีเจอร์หลัก](#ฟีเจอร์หลัก) | [การใช้งาน](#การใช้งาน) | [การคอมไพล์จาก Source Code](#การคอมไพล์จาก-source-code) | [ความปลอดภัยและประสิทธิภาพ](#ความปลอดภัยและประสิทธิภาพ) | [สัญญาอนุญาต](#สัญญาอนุญาต)

</div>

---

## ภาพรวม

**Discord Quest Completer** คือแอปพลิเคชันสำหรับ Windows ที่พัฒนาด้วย Tauri 2 (Rust + Vue 3) ออกแบบมาเพื่อจำลองสถานะการเล่นเกม (Rich Presence / RPC) และรัน Process เกมจำลองขนาดจิ๋ว ช่วยให้ผู้ใช้สามารถทำภารกิจ **Discord Quests** ได้จนจบโดยไม่จำเป็นต้องดาวน์โหลดหรือติดตั้งตัวเกมจริงขนาดใหญ่ ประหยัดพื้นที่จัดเก็บข้อมูล และมีระบบ Auto-Pilot สลับเกมให้อัตโนมัติ

---

## ฟีเจอร์หลัก

### การจำลองและทำเควสต์ Discord
* **ค้นหาเกมหรือเควสต์ได้ทันที**: ค้นหารายชื่อเกม Discord ที่มีเควสต์ หรือวางลิงก์เควสต์เพื่อดึงข้อมูลเกมเข้าสู่ระบบได้ทันที
* **จำลอง Process เกมขนาดจิ๋ว (Dummy Runner)**: สร้างและรัน Process เสมือนขนาดเล็กมาก เพื่อให้ระบบตรวจจับเกมของ Discord ตรวจพบว่ากำลังเล่นเกมจริง
* **รองรับ Discord ทุกเวอร์ชันพร้อมกัน (Multi-Client RPC)**: ส่งสถานะ Rich Presence ไปยัง Discord Stable, Discord PTB และ Discord Canary ได้พร้อมกันแบบขนาน

### ระบบทำงานอัตโนมัติ (Auto-Pilot)
* **สลับคิวเกมอัตโนมัติ**: จัดลำดับคิวเกมที่ต้องการทำเควสต์ และปล่อยให้ระบบสลับเปิดแต่ละเกมตามเวลาที่ตั้งไว้ (5 นาที, 10 นาที, 15 นาที หรือ 20 นาที)
* **แสดงแถบเวลาถอยหลัง (Progress Bar)**: ติดตามเวลาคงเหลือของแต่ละเกมในคิวแบบเรียลไทม์

### ความปลอดภัยและความสะดวกในการใช้งาน
* **แจ้งเตือนความเสี่ยง (RPC Risk Warning)**: มีระบบแจ้งเตือนและยืนยันก่อนเริ่มรัน RPC เพื่อความปลอดภัยของผู้ใช้
* **หน้าต่างปรับแต่งได้ยืดหยุ่น**: รองรับการเปิดแบบ Maximized เต็มจอ, ปุ่มปักหมุดหน้าต่างให้อยู่บนสุด (Pin), และระบบภาษา (ไทย / อังกฤษ)

---

## การใช้งาน

1. **ดาวน์โหลดและเปิดโปรแกรม**: ดาวน์โหลดไฟล์ `Discord Quest Completer_1.0.0_x64-setup.exe` หรือไฟล์ Portable `.exe` จากหน้า [Releases](https://github.com/phwyverysad/discord-quest-completer/releases)
2. **เลือกหรือเพิ่มเกม**: ค้นหาชื่อเกมหรือเควสต์ที่ต้องการจากช่องค้นหาด้านบน แล้วกด **เพิ่มลงรายการเกม**
3. **เริ่มเล่นเกมหรือทำเควสต์**: 
   * **กดเล่นรายเกม**: คลิกปุ่ม **เล่น** ในการ์ดย่อยทางขวา กดยอมรับความเสี่ยง แล้วปล่อยให้โปรแกรมจำลองการเล่นตามเวลาที่เควสต์กำหนด
   * **เปิดใช้งาน Auto-Pilot**: เลือกช่วงเวลาที่ต้องการ (เช่น 15m) แล้วกด **เริ่มทำงานอัตโนมัติ** ระบบจะรันเกมและหมุนเวียนคิวให้เองจนเสร็จสิ้น

---

## การคอมไพล์จาก Source Code

### สิ่งที่จำเป็นต้องมี
* ระบบปฏิบัติการ Windows 10 หรือ Windows 11 (64-bit)
* [Node.js](https://nodejs.org/) (เวอร์ชัน 18+ หรือ 20+) และ [pnpm](https://pnpm.io/)
* [Rust](https://rustup.rs/) (พร้อม MSVC toolchain)
* C++ Build Tools (สำหรับคอมไพล์ dummy runner)

### ขั้นตอนการคอมไพล์
1. คลอนคลังข้อมูล (Repository)
   ```bash
   git clone https://github.com/phwyverysad/discord-quest-completer.git
   cd discord-quest-completer
   ```

2. ติดตั้ง Dependencies
   ```bash
   pnpm install
   ```

3. บิลด์ตัวรันจำลองเกม (Win Runner)
   ```bash
   pnpm build:runner:win
   pnpm copy:runner:win
   ```

4. คอมไพล์โปรแกรมเป็นไฟล์ `.exe`
   ```bash
   pnpm tauri build
   ```
   *ไฟล์ `.exe` ที่ได้จะอยู่ในโฟลเดอร์ `src-tauri/target/release/` และตัวติดตั้งใน `src-tauri/target/release/bundle/nsis/`*

---

## ความปลอดภัยและประสิทธิภาพ
* **กินทรัพยากรต่ำมาก**: ตัวจำลองเกม (Dummy Runner) เขียนด้วย C++ / Win32 API มีขนาดเพียงไม่กี่กิโลไบต์ ไม่กิน RAM และไม่เปลือง CPU
* **ปลอดภัยและทำงานในเครื่อง (Local Only)**: ไม่มีการเก็บข้อมูลบัญชี ไม่มีการขโมยโทเคน Discord หรือส่งข้อมูลส่วนตัวใดๆ ออกนอกเครื่อง

---

## สัญญาอนุญาต
โปรเจกต์นี้เผยแพร่ภายใต้สัญญาอนุญาต MIT License

```text
MIT License - Copyright (c) 2026 phwyverysad
```
