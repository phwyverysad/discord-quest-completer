#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const isWindows = process.platform === "win32";
const isDarwin = process.platform === "darwin";

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: false,
    cwd: cwd || rootDir,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const resourcesDir = path.join(rootDir, "src-tauri", "resources");
if (!fs.existsSync(resourcesDir)) {
  fs.mkdirSync(resourcesDir, { recursive: true });
}

if (isWindows) {
  const vcvars = "D:\\Program Files (x86)\\Microsoft Visual Studio\\2022\\BuildTools\\VC\\Auxiliary\\Build\\vcvars64.bat";
  const rustBin = "C:\\Users\\Administrator\\.rustup\\toolchains\\stable-x86_64-pc-windows-msvc\\bin";
  const srcWinDir = path.join(rootDir, "src-win");

  if (fs.existsSync(vcvars)) {
    const cmdLine = `call "${vcvars}" && cd /d "${srcWinDir}" && cargo build --release`;
    const res = spawnSync("cmd.exe", ["/c", cmdLine], {
      stdio: "inherit",
      windowsVerbatimArguments: true,
      env: {
        ...process.env,
        PATH: `${rustBin};${process.env.PATH || ""}`,
      },
    });
    if (res.status !== 0) process.exit(res.status ?? 1);
  } else {
    run("cargo", ["build", "--release"], srcWinDir);
  }

  const src = path.join(rootDir, "src-win", "target", "release", "src-win.exe");
  const dest = path.join(resourcesDir, "src-win.exe");
  fs.copyFileSync(src, dest);
  console.log(`[sync-runner] Copied ${src} -> ${dest}`);
} else if (isDarwin) {
  run("cargo", ["build", "--release"], path.join(rootDir, "src-darwin"));
  const src = path.join(rootDir, "src-darwin", "target", "release", "src-darwin");
  const dest = path.join(resourcesDir, "src-darwin");
  fs.copyFileSync(src, dest);
  console.log(`[sync-runner] Copied ${src} -> ${dest}`);
} else {
  run("cargo", ["build", "--release"], path.join(rootDir, "src-linux"));
  const src = path.join(rootDir, "src-linux", "target", "release", "src-linux");
  const dest = path.join(resourcesDir, "src-linux");
  fs.copyFileSync(src, dest);
  console.log(`[sync-runner] Copied ${src} -> ${dest}`);
}
