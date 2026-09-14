<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useI18n, type Locale } from '@/composables/i18n';
import { useAppSettings } from '@/composables/settings';
import IconRustLang from '@/components/IconRustLang.vue';
import IconVueJs from '@/components/IconVueJs.vue';
import CustomDropdown, { type DropdownOption } from '@/components/CustomDropdown.vue';

const { t, currentLocale, setLocale, SUPPORTED_LANGUAGES } = useI18n();
const {
  themeMode,
  setTheme,
  autoRefresh,
  setAutoRefresh,
  gamesStats,
  refreshGamesStats,
  openGamesFolder,
  clearGamesFolder,
  formatBytes
} = useAppSettings();

const languageOptions = computed<DropdownOption<Locale>[]>(() => {
  return SUPPORTED_LANGUAGES.map((lang) => ({
    value: lang.code,
    label: lang.label,
    sublabel: lang.englishName
  }));
});

const isClearing = ref(false);
const clearMessage = ref('');

async function handleClearFolder() {
  if (isClearing.value) return;
  isClearing.value = true;
  clearMessage.value = '';
  try {
    const count = await clearGamesFolder();
    clearMessage.value = `${t.value.clearedSuccess} (${count})`;
    setTimeout(() => {
      clearMessage.value = '';
    }, 3000);
  } finally {
    isClearing.value = false;
  }
}

onMounted(() => {
  refreshGamesStats();
});
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-5 animate-fadeIn">
    <!-- Header -->
    <div class="pb-3 border-b border-slate-200/80 dark:border-slate-800">
      <h1 class="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
        {{ t.settingsTitle }}
      </h1>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
        {{ t.settingsSubtitle }}
      </p>
    </div>

    <!-- Language Settings Card (Custom Animated Dropdown) -->
    <div class="bg-white dark:bg-[#131927] rounded-3xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] transition-all">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
            {{ t.languageSection }}
          </h2>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {{ t.languageLabel }}
          </p>
        </div>

        <div class="w-full sm:w-64">
          <CustomDropdown
            :model-value="currentLocale"
            :options="languageOptions"
            @change="(val) => setLocale(val)"
          />
        </div>
      </div>
    </div>

    <!-- Appearance & Theme Card (Minimal Segmented Pill, Zero SVGs on buttons) -->
    <div class="bg-white dark:bg-[#131927] rounded-3xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] transition-all">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
            {{ t.themeSection }}
          </h2>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {{ t.themeLabel }}
          </p>
        </div>

        <!-- Sleek Segmented Pill Control with Discord Blurple Highlight -->
        <div class="inline-flex p-1 bg-slate-100 dark:bg-[#0B0F19] rounded-xl border border-slate-200/80 dark:border-slate-800 self-start sm:self-auto">
          <button
            type="button"
            @click="setTheme('light')"
            class="px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-150 cursor-pointer text-center min-w-[72px] select-none"
            :class="[
              themeMode === 'light'
                ? 'bg-[#5865F2] text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            ]"
          >
            {{ t.themeLight }}
          </button>

          <button
            type="button"
            @click="setTheme('dark')"
            class="px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-150 cursor-pointer text-center min-w-[72px] select-none"
            :class="[
              themeMode === 'dark'
                ? 'bg-[#5865F2] text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            ]"
          >
            {{ t.themeDark }}
          </button>

          <button
            type="button"
            @click="setTheme('system')"
            class="px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-150 cursor-pointer text-center min-w-[72px] select-none"
            :class="[
              themeMode === 'system'
                ? 'bg-[#5865F2] text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            ]"
          >
            {{ t.themeSystem }}
          </button>
        </div>
      </div>
    </div>

    <!-- Storage & Cache Management Card -->
    <div class="bg-white dark:bg-[#131927] rounded-3xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] transition-all">
      <div class="mb-4">
        <h2 class="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
          {{ t.storageSection }}
        </h2>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {{ t.storageDesc }}
        </p>
      </div>

      <div class="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 mb-4 space-y-2">
        <div class="flex flex-wrap items-center justify-between text-xs text-slate-600 dark:text-slate-300 gap-2">
          <span class="font-normal">{{ t.dummyGamesFolder }}</span>
          <span class="font-mono text-[11px] text-slate-700 dark:text-slate-300 truncate max-w-md bg-white dark:bg-[#131927] px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs">
            {{ gamesStats.path || './games' }}
          </span>
        </div>

        <div class="flex items-center gap-6 text-xs text-slate-600 dark:text-slate-300 pt-1">
          <div>
            {{ t.filesCount }} <strong class="text-[#5865F2] dark:text-[#818CF8] font-bold">{{ gamesStats.count }}</strong>
          </div>
          <div>
            {{ t.totalSize }} <strong class="text-[#5865F2] dark:text-[#818CF8] font-bold">{{ formatBytes(gamesStats.total_size_bytes) }}</strong>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          @click="openGamesFolder"
          class="px-4 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-all cursor-pointer flex items-center gap-2 border border-slate-200 dark:border-slate-700"
        >
          <svg class="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
          </svg>
          {{ t.openFolder }}
        </button>

        <button
          type="button"
          @click="handleClearFolder"
          :disabled="isClearing || gamesStats.count === 0"
          class="px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer select-none"
          :class="[
            gamesStats.count === 0
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-700'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 hover:bg-rose-500 hover:text-white border border-rose-200 dark:border-rose-800/80 shadow-2xs hover:shadow-sm hover:shadow-rose-500/20'
          ]"
        >
          <svg v-if="!isClearing" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <svg v-else class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          {{ isClearing ? t.clearing : t.clearDummyFiles }}
        </button>

        <span v-if="clearMessage" class="text-xs text-emerald-600 dark:text-emerald-400 font-bold ml-2">
          {{ clearMessage }}
        </span>
      </div>
    </div>

    <!-- Preferences Card -->
    <div class="bg-white dark:bg-[#131927] rounded-3xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] transition-all">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
            {{ t.autoRefreshTitle }}
          </h2>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {{ t.autoRefreshDesc }}
          </p>
        </div>

        <button
          type="button"
          @click="setAutoRefresh(!autoRefresh)"
          class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
          :class="autoRefresh ? 'bg-[#5865F2]' : 'bg-slate-300 dark:bg-slate-700'"
        >
          <span
            class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out"
            :class="autoRefresh ? 'translate-x-5' : 'translate-x-0'"
          />
        </button>
      </div>
    </div>

    <!-- About Section Card -->
    <div class="bg-white dark:bg-[#131927] rounded-3xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] transition-all">
      <div class="flex items-center justify-between mb-2">
        <h2 class="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
          {{ t.aboutSection }}
        </h2>
        <span class="text-[11px] px-2.5 py-0.5 bg-[#5865F2]/10 dark:bg-[#5865F2]/20 text-[#5865F2] dark:text-[#A5AFFA] rounded-full font-mono font-bold border border-[#5865F2]/25">
          v1.0.0
        </span>
      </div>

      <p class="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
        {{ t.aboutDesc }}
      </p>

      <div class="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
        <div class="flex items-center gap-2">
          <span>Built with</span>
          <span class="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
            <IconRustLang class="w-3.5 h-3.5 text-orange-500" /> Rust
          </span>
          <span>&middot;</span>
          <span class="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
            <IconVueJs class="w-3.5 h-3.5 text-emerald-500" /> Vue.js
          </span>
          <span>&middot;</span>
          <span class="font-medium text-slate-700 dark:text-slate-300">Tauri 2</span>
        </div>

        <div>
          <a
            href="https://github.com/phwyverysad/Discord-Quest-Orbs"
            target="_blank"
            class="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 font-medium"
          >
            {{ t.githubRepo }}
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.2s ease-out forwards;
}
</style>

