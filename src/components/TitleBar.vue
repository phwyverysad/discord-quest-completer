<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useAppSettings } from '@/composables/settings';
import IconDiscord from './IconDiscord.vue';

const emit = defineEmits<{
  (e: 'open-about'): void;
}>();

const { themeMode, setTheme } = useAppSettings();

const appWindow = getCurrentWindow();
const isPinned = ref(false);
const isMaximized = ref(false);

async function handleClose() {
  try {
    await appWindow.close();
  } catch (e) {
    console.error('Failed to close window:', e);
  }
}

async function handleMinimize() {
  try {
    await appWindow.minimize();
  } catch (e) {
    console.error('Failed to minimize window:', e);
  }
}

async function handleToggleMaximize() {
  try {
    await appWindow.toggleMaximize();
    isMaximized.value = await appWindow.isMaximized();
  } catch (e) {
    console.error('Failed to toggle maximize window:', e);
  }
}

async function togglePin() {
  try {
    isPinned.value = !isPinned.value;
    await appWindow.setAlwaysOnTop(isPinned.value);
  } catch (e) {
    console.error('Failed to set always on top:', e);
  }
}

function toggleTheme() {
  setTheme(themeMode.value === 'dark' ? 'light' : 'dark');
}

let unlistenResize: (() => void) | null = null;

onMounted(async () => {
  try {
    isMaximized.value = await appWindow.isMaximized();
    unlistenResize = await appWindow.onResized(async () => {
      isMaximized.value = await appWindow.isMaximized();
    });
  } catch (e) {
    // Graceful fallback for non-Tauri preview
  }
});

onUnmounted(() => {
  if (unlistenResize) {
    unlistenResize();
  }
});
</script>

<template>
  <!-- Sleek Custom TitleBar with Classic Windows Controls -->
  <div 
    data-tauri-drag-region
    @dblclick="handleToggleMaximize"
    class="w-full h-10 select-none flex items-center justify-between pl-3 pr-0 bg-white/95 dark:bg-[#141A26]/95 backdrop-blur-md border-b border-[#C0C3DA]/40 dark:border-[#8C99B6]/15 z-40 transition-colors duration-150"
  >
    <!-- Left: App Branding -->
    <div data-tauri-drag-region class="flex items-center gap-2 select-none z-10 py-1 cursor-default">
      <div class="w-6 h-6 rounded-lg flex items-center justify-center p-0.5 shrink-0 shadow-2xs overflow-hidden">
        <img src="/app-icon.png" alt="Discord Quest Completer" class="w-full h-full object-contain select-none pointer-events-none" />
      </div>
      <span class="font-bold text-xs tracking-tight text-slate-900 dark:text-white">
        Discord
      </span>
      <span class="px-2 py-0.5 text-[10px] font-bold tracking-wide text-[#5865F2] dark:text-[#A5AFFA] bg-[#5865F2]/10 dark:bg-[#5865F2]/20 border border-[#5865F2]/25 rounded-md shadow-2xs">
        Quest Completer
      </span>
    </div>

    <!-- Center: Large Drag Region for smooth window movement -->
    <div data-tauri-drag-region class="flex-1 h-full mx-2 flex items-center justify-center cursor-default">
    </div>

    <!-- Right: Quick Utilities & Classic Window Controls -->
    <div class="flex items-center h-full shrink-0 z-10">
      <!-- Utilities Group -->
      <div class="flex items-center gap-1 pr-2">
        <!-- Pin / Always on Top Button -->
        <button
          type="button"
          @click.stop="togglePin"
          :title="isPinned ? 'Unpin (ยกเลิกปักหมุดบนสุด)' : 'Always on Top (ปักหมุดหน้าต่างไว้บนสุด)'"
          class="p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center"
          :class="[
            isPinned 
              ? 'bg-[#EEF0F8] text-[#576585] dark:bg-[#8C99B6]/25 dark:text-[#C0C3DA] ring-1 ring-[#8C99B6]/40 font-semibold' 
              : 'text-slate-400 hover:text-[#576585] dark:hover:text-slate-200 hover:bg-[#EEF0F8]/70 dark:hover:bg-[#1A2233]'
          ]"
        >
          <svg 
            class="w-3.5 h-3.5 transition-transform duration-150" 
            :class="{ '-rotate-45 text-[#576585] dark:text-[#C0C3DA]': isPinned }" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="2" 
            stroke-linecap="round" 
            stroke-linejoin="round"
          >
            <line x1="12" y1="17" x2="12" y2="22"></line>
            <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path>
          </svg>
        </button>

        <!-- Theme Mode Toggle Button -->
        <button
          type="button"
          @click.stop="toggleTheme"
          title="Toggle Theme (เปลี่ยนโหมดสี สว่าง / มืด)"
          class="p-1.5 rounded-lg text-slate-400 hover:text-[#576585] dark:hover:text-slate-200 hover:bg-[#EEF0F8]/70 dark:hover:bg-[#1A2233] transition-colors cursor-pointer"
        >
          <!-- Sun icon in dark mode -->
          <svg v-if="themeMode === 'dark'" class="w-3.5 h-3.5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
          <!-- Moon icon in light mode -->
          <svg v-else class="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        </button>

        <!-- Help / About Button -->
        <button
          type="button"
          @click.stop="emit('open-about')"
          title="Help & About (ช่วยเหลือและข้อมูลแอพ)"
          class="p-1.5 rounded-lg text-slate-400 hover:text-[#576585] dark:hover:text-slate-200 hover:bg-[#EEF0F8]/70 dark:hover:bg-[#1A2233] transition-colors cursor-pointer"
        >
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </button>
      </div>

      <!-- Subtle Vertical Divider -->
      <div class="h-4 w-px bg-[#C0C3DA]/50 dark:bg-[#8C99B6]/25 mr-1"></div>

      <!-- Classic Windows Control Buttons (—, □, ✕) matching reference image -->
      <div class="flex items-center h-full">
        <!-- Minimize (—) -->
        <button
          type="button"
          @click.stop="handleMinimize"
          title="Minimize (ย่อหน้าต่าง)"
          class="w-11 h-full flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-[#1C2436] active:bg-slate-300 dark:active:bg-[#253046] transition-colors cursor-pointer"
        >
          <svg class="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none" stroke="currentColor">
            <line x1="0.5" y1="5" x2="9.5" y2="5" stroke-width="1.1" stroke-linecap="round" />
          </svg>
        </button>

        <!-- Maximize / Restore (□ / ❐) -->
        <button
          type="button"
          @click.stop="handleToggleMaximize"
          :title="isMaximized ? 'Restore (คืนขนาดเดิม)' : 'Maximize (ขยายเต็มจอ)'"
          class="w-11 h-full flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-[#1C2436] active:bg-slate-300 dark:active:bg-[#253046] transition-colors cursor-pointer"
        >
          <!-- Maximize Icon (Single Square) -->
          <svg v-if="!isMaximized" class="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none" stroke="currentColor">
            <rect x="0.6" y="0.6" width="8.8" height="8.8" stroke-width="1.1" rx="0.5" />
          </svg>
          <!-- Restore Icon (Overlapping Squares) -->
          <svg v-else class="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none" stroke="currentColor">
            <path d="M2.5 2V0.6h6.9v6.9H8" stroke-width="1" />
            <rect x="0.6" y="2.5" width="6.9" height="6.9" stroke-width="1.1" rx="0.5" />
          </svg>
        </button>

        <!-- Close (✕) with classic red hover -->
        <button
          type="button"
          @click.stop="handleClose"
          title="Close (ปิดหน้าต่าง)"
          class="w-11 h-full flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-[#E81123] hover:text-white dark:hover:bg-[#E81123] dark:hover:text-white active:bg-[#C40E1E] transition-colors cursor-pointer"
        >
          <svg class="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none" stroke="currentColor">
            <line x1="1" y1="1" x2="9" y2="9" stroke-width="1.1" stroke-linecap="round" />
            <line x1="9" y1="1" x2="1" y2="9" stroke-width="1.1" stroke-linecap="round" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>
