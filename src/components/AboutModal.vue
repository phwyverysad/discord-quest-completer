<script setup lang="ts">
import IconDiscord from './IconDiscord.vue';
import { openUrl } from '@tauri-apps/plugin-opener';

const emit = defineEmits<{
  (e: 'close'): void;
}>();

async function openGitHub() {
  try {
    await openUrl('https://github.com/phwyverysad/Discord-Quest-Orbs');
  } catch (err) {
    window.open('https://github.com/phwyverysad/Discord-Quest-Orbs', '_blank');
  }
}
</script>

<template>
  <!-- Modal Backdrop -->
  <div 
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs transition-opacity duration-200"
    @click.self="emit('close')"
    @keydown.esc="emit('close')"
  >
    <!-- Modal Card -->
    <div 
      class="bg-white dark:bg-[#131927] rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xl p-6 max-w-sm w-full relative transform transition-all duration-200 scale-100 animate-in fade-in-50 zoom-in-95"
    >
      <!-- Close X Button -->
      <button 
        @click="emit('close')" 
        class="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      <!-- App Header Branding -->
      <div class="flex items-center gap-3.5 mb-4">
        <div class="w-11 h-11 rounded-2xl flex items-center justify-center p-0.5 shrink-0 shadow-xs overflow-hidden">
          <img src="/app-icon.png" alt="Discord Quest Completer" class="w-full h-full object-contain select-none pointer-events-none" />
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h3 class="font-extrabold text-slate-900 dark:text-white text-base">Discord</h3>
            <span class="px-2 py-0.5 text-[10px] font-bold text-[#5865F2] dark:text-[#A5AFFA] bg-[#5865F2]/10 dark:bg-[#5865F2]/20 border border-[#5865F2]/25 rounded-md">
              Quest Completer
            </span>
          </div>
          <p class="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5">v1.0.0</p>
        </div>
      </div>

      <!-- Description -->
      <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4 font-normal">
        โปรแกรมช่วยทำเควสต์เกม Discord อัตโนมัติ ปลอดภัย ใช้งานง่าย พร้อมระบบ Auto-Pilot สลับเล่นหลายเกมและตรวจจับสถานะแบบ Real-time
      </p>

      <!-- Quick Feature Tips -->
      <div class="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200/80 dark:border-slate-800 space-y-2 mb-5 text-xs text-slate-600 dark:text-slate-300">
        <div class="flex items-center gap-2 text-[11px]">
          <span class="w-1.5 h-1.5 rounded-full bg-[#5865F2]"></span>
          <span><b>ลากแถบด้านบน:</b> เพื่อขยับย้ายหน้าต่างได้อิสระ</span>
        </div>
        <div class="flex items-center gap-2 text-[11px]">
          <span class="w-1.5 h-1.5 rounded-full bg-[#5865F2]"></span>
          <span><b>ปุ่มปักหมุด (Pin):</b> ล็อกหน้าต่างให้อยู่บนสุดตลอดเวลา</span>
        </div>
        <div class="flex items-center gap-2 text-[11px]">
          <span class="w-1.5 h-1.5 rounded-full bg-[#5865F2]"></span>
          <span><b>Auto-Pilot:</b> สลับเกมให้อัตโนมัติตามระยะเวลาที่เลือก</span>
        </div>
      </div>

      <!-- Footer Buttons -->
      <div class="flex items-center gap-2 justify-end">
        <button 
          @click="openGitHub"
          class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-[#5865F2] dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
        >
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
          </svg>
          GitHub
        </button>
        <button 
          @click="emit('close')"
          class="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#5865F2] hover:bg-[#4752C4] active:bg-[#3C45A5] active:scale-95 shadow-xs transition-all cursor-pointer"
        >
          ตกลง
        </button>
      </div>
    </div>
  </div>
</template>
