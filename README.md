<div align="center">

**Automated Discord game quest completer, lightweight, safe, and requiring no actual game installation**

[![Platform](https://img.shields.io/badge/Platform-Windows%2010%20%7C%2011-0078D6?style=flat-square&logo=windows&logoColor=white)](https://github.com/phwyverysad/discord-quest-completer)
[![Built With](https://img.shields.io/badge/Built%20With-Tauri%202%20%7C%20Rust%20%7C%20Vue%203-FFC131?style=flat-square&logo=tauri&logoColor=white)](https://tauri.app/)
[![Languages](https://img.shields.io/badge/Languages-TH%20%7C%20EN-5c5ce0?style=flat-square)](https://github.com/phwyverysad/discord-quest-completer)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)
[![Download](https://img.shields.io/badge/Download-Latest%20Release-brightgreen?style=flat-square)](https://github.com/phwyverysad/discord-quest-completer/releases/latest)
[![VirusTotal](https://img.shields.io/badge/VirusTotal-Clean%20%2F%20Safe-brightgreen?style=flat-square&logo=virustotal&logoColor=white)](https://www.virustotal.com/gui/file/3f8559ede61b9930c1896b09a8fc8a87d0fe1905c5a8910396d40ae2595c507d?nocache=1)

</div>

---

## Overview
Discord Quest Completer is a desktop application for Windows built with Tauri 2 (Rust + Vue 3). It simulates game presence (Rich Presence / RPC) and launches tiny dummy runner processes to complete Discord Quests without downloading or installing full game files. Save disk space, reduce resource usage, and automate multi-game questing with built-in Auto-Pilot.

---

https://github.com/user-attachments/assets/855b96be-8e35-4083-8735-f9754e9376c7

---

## Key Features
* **Discord Quest Simulation**: Directly simulates game presence and connects to Discord RPC, allowing you to complete quests without installing large game assets.
* **Ultra-Lightweight Dummy Runner**: Tiny runner processes (~6 KB) written with native Win32 API, using virtually zero CPU and RAM.
* **Multi-Client RPC**: Simultaneously detects and broadcasts game presence to Discord Stable, Discord PTB, and Discord Canary in parallel.
* **Auto-Pilot Mode**: Automatically cycles through quest queues with configurable per-game timers (5m, 10m, 15m, 20m) and real-time countdown progress bars.
* **Steam Icon Resolution Engine**: Multi-tiered Steam game icon resolution ensuring crisp high-resolution icons for any game.
* **Custom Game Queue & Reordering**: Easily add, remove, and reorder game quest queues using precise Move Up / Move Down controls.
* **Multi-Language (i18n)**: Seamless multi-language support (English & Thai) with instantaneous live switching.
* **Modern Clean UI**: Minimalist aesthetic supporting Dark Mode, maximized window states, and an Always-on-Top pin button.
* **Safety & Privacy**: Local-only execution with RPC risk confirmation prompts. Never accesses or requests your Discord tokens or credentials.

---

## Downloads
Download the latest version from [GitHub Releases](https://github.com/phwyverysad/discord-quest-completer/releases/latest):

| File | Size | Type |
| :--- | :---: | :--- |
| **`Discord Quest Completer_1.0.0_x64-setup.exe`** | **~5.8 MB** | **Standard Installer (Setup)** Installs to the system and creates a desktop shortcut. |
| **`discord-quest-completer.exe`** | **~19 MB** | **Standalone Portable Executable** Runs immediately without installation. |
| **`Discord Quest Completer_1.0.0_x64_en-US.msi`** | **~7.9 MB** | **Windows Package (MSI)** System-wide installer for Windows environments. |

> **Security (VirusTotal)**: Verified 100% clean and malware-free. View full scan results at [VirusTotal Scan Report](https://www.virustotal.com/gui/file/3f8559ede61b9930c1896b09a8fc8a87d0fe1905c5a8910396d40ae2595c507d?nocache=1).

---

### Run from Source Code
```bash
# Clone the repository and install dependencies
git clone https://github.com/phwyverysad/discord-quest-completer.git
cd discord-quest-completer
pnpm install

# Start the application in development mode
pnpm tauri dev
```

### Build Commands
```bash
# Build the native Windows runner
pnpm build:runner:win
pnpm copy:runner:win

# Build the release executables and installer (.exe / .msi)
pnpm tauri build
```

---

This project is licensed under the [MIT License](LICENSE) - Copyright (c) 2026 phwyverysad
