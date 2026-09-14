<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useI18n, type Locale } from '@/composables/i18n';
import { useAppSettings } from '@/composables/settings';
import { useGlobalState } from '@/composables/app-state';
import { useSound } from '@/composables/sound';
import IconRustLang from '@/components/IconRustLang.vue';
import IconVueJs from '@/components/IconVueJs.vue';
import CustomDropdown, { type DropdownOption } from '@/components/CustomDropdown.vue';
import discordStableIcon from '@/assets/discord-stable.png';
import discordCanaryIcon from '@/assets/discord-canary.png';

type SettingsTab = 'general' | 'language' | 'theme' | 'sound' | 'discordRpc';

const activeTab = ref<SettingsTab>('sound');

const { t, currentLocale, setLocale, SUPPORTED_LANGUAGES } = useI18n();
const {
  themeMode,
  setTheme,
  autoRefresh,
  setAutoRefresh,
  skipRpcWarning,
  setSkipRpcWarning,
  gamesStats,
  refreshGamesStats,
  openGamesFolder,
  clearGamesFolder,
  formatBytes
} = useAppSettings();

const { discordTargets, setDiscordTarget } = useGlobalState();
const {
  currentProfile,
  volume,
  customSounds,
  SOUND_PROFILES,
  setProfile,
  setVolume,
  previewSound,
  previewCustom,
  uploadCustomSound,
  deleteCustomSound
} = useSound();

const languageOptions = computed<DropdownOption<Locale>[]>(() => {
  return SUPPORTED_LANGUAGES.map((lang) => ({
    value: lang.code,
    label: lang.label,
    sublabel: lang.englishName
  }));
});

const isClearing = ref(false);
const clearMessage = ref('');
const fileInputRef = ref<HTMLInputElement | null>(null);

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

function triggerCustomAudioUpload() {
  fileInputRef.value?.click();
}

async function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) {
    await uploadCustomSound(file);
    input.value = '';
  }
}

function handleVolumeChange(e: Event) {
  const target = e.target as HTMLInputElement;
  const val = parseInt(target.value, 10);
  setVolume(val / 100);
}

onMounted(() => {
  refreshGamesStats();
});
</script>

<template>
  <div class="max-w-6xl mx-auto w-full space-y-6 animate-fadeIn pb-12 select-none">
    <!-- Top Hero Banner Card: Matching HomeView Style -->
    <div class="rounded-3xl bg-white dark:bg-[#141A26] border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-xs">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div class="flex items-center gap-5">
          <!-- Settings Icon Box: Solid Clean Discord Blurple -->
          <div class="w-14 h-14 rounded-2xl bg-[#5865F2] text-white flex items-center justify-center p-3.5 shrink-0 shadow-xs">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>

          <div>
            <div class="flex items-center gap-2.5 flex-wrap">
              <h1 class="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {{ t.settingsTitle }}
              </h1>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#5865F2]/10 dark:bg-[#5865F2]/20 text-[#5865F2] dark:text-[#A5AFFA] border border-[#5865F2]/20 flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-[#5865F2]"></span>
                {{ t.preferencesAndAudioBadge }}
              </span>
            </div>
            <p class="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 font-normal">
              {{ t.settingsSubtitle }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation Tabs (Sleek pill tabs matching MultiRoblox style with clean SVGs) -->
    <div class="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
      <button
        type="button"
        @click="activeTab = 'general'"
        class="px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap select-none flex items-center gap-2"
        :class="[
          activeTab === 'general'
            ? 'bg-[#5865F2] text-white shadow-xs'
            : 'bg-white dark:bg-[#141A26] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800'
        ]"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
        <span>{{ t.tabGeneral }}</span>
      </button>

      <button
        type="button"
        @click="activeTab = 'language'"
        class="px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap select-none flex items-center gap-2"
        :class="[
          activeTab === 'language'
            ? 'bg-[#5865F2] text-white shadow-xs'
            : 'bg-white dark:bg-[#141A26] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800'
        ]"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
        <span>{{ t.tabLanguage }}</span>
      </button>

      <button
        type="button"
        @click="activeTab = 'theme'"
        class="px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap select-none flex items-center gap-2"
        :class="[
          activeTab === 'theme'
            ? 'bg-[#5865F2] text-white shadow-xs'
            : 'bg-white dark:bg-[#141A26] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800'
        ]"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
          <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
          <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
          <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
          <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
        </svg>
        <span>{{ t.tabTheme }}</span>
      </button>

      <button
        type="button"
        @click="activeTab = 'sound'"
        class="px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap select-none flex items-center gap-2"
        :class="[
          activeTab === 'sound'
            ? 'bg-[#5865F2] text-white shadow-xs'
            : 'bg-white dark:bg-[#141A26] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800'
        ]"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        </svg>
        <span>{{ t.tabSound }}</span>
      </button>

      <button
        type="button"
        @click="activeTab = 'discordRpc'"
        class="px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap select-none flex items-center gap-2"
        :class="[
          activeTab === 'discordRpc'
            ? 'bg-[#5865F2] text-white shadow-xs'
            : 'bg-white dark:bg-[#141A26] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800'
        ]"
      >
        <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
        </svg>
        <span>{{ t.tabDiscordRpc }}</span>
      </button>
    </div>

    <!-- TAB 1: SOUNDS - Matching MultiRoblox design in full max-w-6xl -->
    <div v-show="activeTab === 'sound'" class="space-y-5">
      <!-- Section 1: Sound Profiles -->
      <div class="bg-white dark:bg-[#141A26] rounded-3xl p-6 md:p-7 border border-slate-200 dark:border-slate-800 shadow-xs transition-all">
        <div class="mb-5">
          <div class="text-[11px] font-bold text-[#5865F2] dark:text-[#A5AFFA] uppercase tracking-wider mb-1">
            {{ t.soundSection }}
          </div>
          <h2 class="text-base font-bold tracking-tight text-slate-900 dark:text-white">
            {{ t.soundProfile }}
          </h2>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {{ t.soundProfileDesc }}
          </p>
        </div>

        <!-- Sound Profile Cards Grid: Expanded to 6 Columns with Beautiful Padding -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <!-- Built-in Profiles -->
          <div
            v-for="(prof, id) in SOUND_PROFILES"
            :key="id"
            @click="setProfile(String(id))"
            class="relative rounded-2xl p-4 border transition-all cursor-pointer flex flex-col justify-between group min-h-[140px] select-none"
            :class="[
              currentProfile === id
                ? 'border-[#5865F2] ring-2 ring-[#5865F2]/25 bg-[#5865F2]/5 dark:bg-[#5865F2]/15 shadow-xs'
                : 'border-slate-200/90 dark:border-slate-800/90 bg-slate-50/60 dark:bg-[#101624] hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-[#161D2B]'
            ]"
          >
            <!-- Card Top: Icon & Preview Button -->
            <div class="flex items-start justify-between">
              <!-- Icon Squircle -->
              <div
                class="w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-2xs"
                :class="[
                  currentProfile === id
                    ? 'bg-[#5865F2] text-white'
                    : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-slate-300/80 dark:group-hover:bg-slate-700'
                ]"
              >
                <!-- Keyboard Icon (Clicky) -->
                <svg v-if="prof.icon === 'keyboard'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="2" y="4" width="20" height="16" rx="2" stroke-width="2" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M7 16h10" />
                </svg>

                <!-- Piano/Keyboard Key Icon (Thocky) -->
                <svg v-else-if="prof.icon === 'piano'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>

                <!-- Water drop Icon (Creamy) -->
                <svg v-else-if="prof.icon === 'water_drop'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v.01M12 21a7 7 0 007-7c0-3.5-7-11-7-11S5 10.5 5 14a7 7 0 007 7z" />
                </svg>

                <!-- Poppy/Bubble Icon (Poppy) -->
                <svg v-else-if="prof.icon === 'bubble_chart'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="4" stroke-width="2" />
                  <circle cx="6" cy="7" r="2.5" stroke-width="1.8" />
                  <circle cx="17.5" cy="7" r="2" stroke-width="1.8" />
                  <circle cx="17" cy="17" r="2.5" stroke-width="1.8" />
                </svg>

                <!-- Typewriter/Document Icon (Typewriter) -->
                <svg v-else-if="prof.icon === 'article'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>

                <!-- Volume Off Icon (Off) -->
                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              </div>

              <!-- Preview Button (Top Right) -->
              <button
                type="button"
                @click.stop="previewSound(String(id))"
                :title="t.previewTitle"
                class="w-7 h-7 rounded-full bg-slate-200/80 dark:bg-slate-800 hover:bg-[#5865F2] hover:text-white text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors cursor-pointer select-none opacity-80 group-hover:opacity-100"
              >
                <svg class="w-3.5 h-3.5 fill-current ml-0.5" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            </div>

            <!-- Card Bottom: Text -->
            <div class="mt-3">
              <div class="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                {{ prof.label }}
              </div>
              <div class="text-[11px] text-slate-400 dark:text-slate-500 leading-tight mt-1 line-clamp-2">
                {{ prof.desc }}
              </div>
            </div>
          </div>

          <!-- Custom Uploaded Profiles (if any) -->
          <div
            v-for="custom in customSounds"
            :key="custom.id"
            @click="setProfile('__custom__' + custom.id)"
            class="relative rounded-2xl p-4 border transition-all cursor-pointer flex flex-col justify-between group min-h-[140px] select-none"
            :class="[
              currentProfile === '__custom__' + custom.id
                ? 'border-[#5865F2] ring-2 ring-[#5865F2]/25 bg-[#5865F2]/5 dark:bg-[#5865F2]/15 shadow-xs'
                : 'border-slate-200/90 dark:border-slate-800/90 bg-slate-50/60 dark:bg-[#101624] hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-[#161D2B]'
            ]"
          >
            <div class="flex items-start justify-between">
              <!-- Audio Track Icon -->
              <div
                class="w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-2xs"
                :class="[
                  currentProfile === '__custom__' + custom.id
                    ? 'bg-[#5865F2] text-white'
                    : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                ]"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>

              <!-- Actions: Preview & Delete -->
              <div class="flex items-center gap-1.5">
                <button
                  type="button"
                  @click.stop="previewCustom(custom.id)"
                  :title="t.previewTitle"
                  class="w-7 h-7 rounded-full bg-slate-200/80 dark:bg-slate-800 hover:bg-[#5865F2] hover:text-white text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors cursor-pointer select-none"
                >
                  <svg class="w-3.5 h-3.5 fill-current ml-0.5" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
                <button
                  type="button"
                  @click.stop="deleteCustomSound(custom.id)"
                  :title="t.deleteTitle"
                  class="w-7 h-7 rounded-full bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-500 hover:text-white text-rose-500 flex items-center justify-center transition-colors cursor-pointer select-none"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            <div class="mt-3">
              <div class="font-bold text-sm text-slate-900 dark:text-white truncate" :title="custom.name">
                {{ custom.name }}
              </div>
              <div class="text-[11px] text-slate-400 dark:text-slate-500">
                {{ t.customSoundItem }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Section 2: Custom Sound Profiles -->
      <div class="bg-white dark:bg-[#141A26] rounded-3xl p-6 md:p-7 border border-slate-200 dark:border-slate-800 shadow-xs transition-all">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-2xl bg-[#5865F2]/10 dark:bg-[#5865F2]/20 text-[#5865F2] dark:text-[#A5AFFA] flex items-center justify-center shrink-0">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <div>
              <h2 class="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                {{ t.soundCustom }}
              </h2>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {{ t.soundCustomDesc }}
              </p>
            </div>
          </div>

          <button
            type="button"
            @click="triggerCustomAudioUpload"
            class="shrink-0 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#5865F2] hover:bg-[#4752C4] active:bg-[#3C45A5] transition-colors flex items-center gap-2 shadow-xs cursor-pointer select-none self-start sm:self-auto"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>{{ t.uploadCustomSound }}</span>
          </button>
        </div>

        <input
          ref="fileInputRef"
          type="file"
          accept=".mp3,.wav,audio/*"
          class="hidden"
          @change="handleFileChange"
        />
      </div>

      <!-- Section 3: Click Volume -->
      <div class="bg-white dark:bg-[#141A26] rounded-3xl p-6 md:p-7 border border-slate-200 dark:border-slate-800 shadow-xs transition-all">
        <div class="mb-4">
          <div class="text-[11px] font-bold text-[#5865F2] dark:text-[#A5AFFA] uppercase tracking-wider mb-1">
            {{ t.soundVolume }}
          </div>
          <h2 class="text-base font-bold tracking-tight text-slate-900 dark:text-white">
            {{ t.soundVolumeLabel }}
          </h2>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {{ t.soundVolumeDesc }}
          </p>
        </div>

        <div class="flex items-center gap-5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800">
          <svg class="w-6 h-6 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>

          <input
            type="range"
            min="0"
            max="100"
            step="1"
            :value="Math.round(volume * 100)"
            @input="handleVolumeChange"
            class="flex-1 h-2.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#5865F2]"
          />

          <span class="min-w-[48px] text-right font-mono font-bold text-sm text-[#5865F2] dark:text-[#A5AFFA]">
            {{ Math.round(volume * 100) }}%
          </span>
        </div>
      </div>
    </div>

    <!-- TAB 2: GENERAL -->
    <div v-show="activeTab === 'general'" class="space-y-5">
      <!-- Storage & Cache Management Card -->
      <div class="bg-white dark:bg-[#141A26] rounded-3xl p-6 md:p-7 border border-slate-200 dark:border-slate-800 shadow-xs transition-all">
        <div class="mb-5">
          <h2 class="text-base font-bold tracking-tight text-slate-900 dark:text-white">
            {{ t.storageSection }}
          </h2>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {{ t.storageDesc }}
          </p>
        </div>

        <div class="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 mb-5 space-y-3">
          <div class="flex flex-wrap items-center justify-between text-xs text-slate-600 dark:text-slate-300 gap-2">
            <span class="font-normal">{{ t.dummyGamesFolder }}</span>
            <span class="font-mono text-xs text-slate-700 dark:text-slate-300 truncate max-w-xl bg-white dark:bg-[#131927] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              {{ gamesStats.path || './games' }}
            </span>
          </div>

          <div class="flex items-center gap-8 text-xs text-slate-600 dark:text-slate-300 pt-1">
            <div>
              {{ t.filesCount }} <strong class="text-[#5865F2] dark:text-[#818CF8] font-bold text-sm">{{ gamesStats.count }}</strong>
            </div>
            <div>
              {{ t.totalSize }} <strong class="text-[#5865F2] dark:text-[#818CF8] font-bold text-sm">{{ formatBytes(gamesStats.total_size_bytes) }}</strong>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <button
            type="button"
            @click="openGamesFolder"
            class="px-5 py-2.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-all cursor-pointer flex items-center gap-2 border border-slate-200 dark:border-slate-700 select-none"
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
            class="px-5 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer select-none"
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
      <div class="bg-white dark:bg-[#141A26] rounded-3xl p-6 md:p-7 border border-slate-200 dark:border-slate-800 shadow-xs transition-all space-y-5">
        <!-- Auto Refresh -->
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-base font-bold tracking-tight text-slate-900 dark:text-white">
              {{ t.autoRefreshTitle }}
            </h2>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {{ t.autoRefreshDesc }}
            </p>
          </div>

          <button
            type="button"
            @click="setAutoRefresh(!autoRefresh)"
            class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none select-none"
            :class="autoRefresh ? 'bg-[#5865F2]' : 'bg-slate-300 dark:bg-slate-700'"
          >
            <span
              class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out"
              :class="autoRefresh ? 'translate-x-5' : 'translate-x-0'"
            />
          </button>
        </div>

        <!-- RPC Risk Warning Toggle -->
        <div class="border-t border-slate-100 dark:border-slate-800 pt-5 flex items-center justify-between">
          <div>
            <h2 class="text-base font-bold tracking-tight text-slate-900 dark:text-white">
              {{ t.rpcWarningSettingLabel }}
            </h2>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {{ t.rpcWarningSettingDesc }}
            </p>
          </div>

          <button
            type="button"
            @click="setSkipRpcWarning(!skipRpcWarning)"
            class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none select-none"
            :class="!skipRpcWarning ? 'bg-[#5865F2]' : 'bg-slate-300 dark:bg-slate-700'"
          >
            <span
              class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out"
              :class="!skipRpcWarning ? 'translate-x-5' : 'translate-x-0'"
            />
          </button>
        </div>
      </div>

      <!-- About Section Card -->
      <div class="bg-white dark:bg-[#141A26] rounded-3xl p-6 md:p-7 border border-slate-200 dark:border-slate-800 shadow-xs transition-all">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-base font-bold tracking-tight text-slate-900 dark:text-white">
            {{ t.aboutSection }}
          </h2>
          <span class="text-xs px-3 py-1 bg-[#5865F2]/10 dark:bg-[#5865F2]/20 text-[#5865F2] dark:text-[#A5AFFA] rounded-full font-mono font-bold border border-[#5865F2]/25">
            v1.0.0
          </span>
        </div>

        <p class="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
          {{ t.aboutDesc }}
        </p>

        <div class="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-3">
          <div class="flex items-center gap-2.5">
            <span>Built with</span>
            <span class="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
              <IconRustLang class="w-4 h-4 text-orange-500" /> Rust
            </span>
            <span>&middot;</span>
            <span class="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
              <IconVueJs class="w-4 h-4 text-emerald-500" /> Vue.js
            </span>
            <span>&middot;</span>
            <span class="font-medium text-slate-700 dark:text-slate-300">Tauri 2</span>
          </div>

          <div>
            <a
              href="https://github.com/phwyverysad/discord-quest-completer"
              target="_blank"
              class="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 font-medium"
            >
              {{ t.githubRepo }}
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 3: LANGUAGE -->
    <div v-show="activeTab === 'language'" class="space-y-5">
      <div class="bg-white dark:bg-[#141A26] rounded-3xl p-6 md:p-7 border border-slate-200 dark:border-slate-800 shadow-xs transition-all">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <h2 class="text-base font-bold tracking-tight text-slate-900 dark:text-white">
              {{ t.languageSection }}
            </h2>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {{ t.languageLabel }}
            </p>
          </div>

          <div class="w-full sm:w-72">
            <CustomDropdown
              :model-value="currentLocale"
              :options="languageOptions"
              @change="(val) => setLocale(val)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 4: THEME -->
    <div v-show="activeTab === 'theme'" class="space-y-5">
      <div class="bg-white dark:bg-[#141A26] rounded-3xl p-6 md:p-7 border border-slate-200 dark:border-slate-800 shadow-xs transition-all">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <h2 class="text-base font-bold tracking-tight text-slate-900 dark:text-white">
              {{ t.themeSection }}
            </h2>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {{ t.themeLabel }}
            </p>
          </div>

          <!-- Sleek Segmented Pill Control -->
          <div class="inline-flex p-1.5 bg-slate-100 dark:bg-[#0B0F19] rounded-xl border border-slate-200/80 dark:border-slate-800 self-start sm:self-auto">
            <button
              type="button"
              @click="setTheme('light')"
              class="px-5 py-2 text-xs font-bold rounded-lg transition-all duration-150 cursor-pointer text-center min-w-[80px] select-none"
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
              class="px-5 py-2 text-xs font-bold rounded-lg transition-all duration-150 cursor-pointer text-center min-w-[80px] select-none"
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
              class="px-5 py-2 text-xs font-bold rounded-lg transition-all duration-150 cursor-pointer text-center min-w-[80px] select-none"
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
    </div>

    <!-- TAB 5: DISCORD RPC -->
    <div v-show="activeTab === 'discordRpc'" class="space-y-5">
      <div class="bg-white dark:bg-[#141A26] rounded-3xl p-6 md:p-7 border border-slate-200 dark:border-slate-800 shadow-xs transition-all">
        <div class="mb-5">
          <h2 class="text-base font-bold tracking-tight text-slate-900 dark:text-white">
            {{ t.discordRpcTargets }}
          </h2>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {{ t.discordRpcTargetsDesc }}
          </p>
        </div>

        <div class="space-y-3.5">
          <!-- Stable Target Toggle -->
          <div class="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <div class="flex items-center gap-3.5 min-w-0">
              <img
                :src="discordStableIcon"
                alt="Discord Stable"
                class="w-8 h-8 rounded-full object-contain shrink-0"
              />
              <div>
                <div class="text-sm font-bold text-slate-900 dark:text-white">
                  {{ t.discordStableLabel }}
                </div>
                <div class="text-xs text-slate-400 mt-0.5">
                  {{ t.officialRelease }}
                </div>
              </div>
            </div>
            <button
              type="button"
              @click="setDiscordTarget('stable', !discordTargets.stable)"
              class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none select-none"
              :class="discordTargets.stable ? 'bg-[#5865F2]' : 'bg-slate-300 dark:bg-slate-700'"
            >
              <span
                class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out"
                :class="discordTargets.stable ? 'translate-x-5' : 'translate-x-0'"
              />
            </button>
          </div>

          <!-- PTB Target Toggle -->
          <div class="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <div class="flex items-center gap-3.5 min-w-0">
              <img
                :src="discordStableIcon"
                alt="Discord PTB"
                class="w-8 h-8 rounded-full object-contain shrink-0"
              />
              <div>
                <div class="text-sm font-bold text-slate-900 dark:text-white">
                  {{ t.discordPtbLabel }}
                </div>
                <div class="text-xs text-slate-400 mt-0.5">
                  {{ t.discordPtbSubDesc }}
                </div>
              </div>
            </div>
            <button
              type="button"
              @click="setDiscordTarget('ptb', !discordTargets.ptb)"
              class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none select-none"
              :class="discordTargets.ptb ? 'bg-[#5865F2]' : 'bg-slate-300 dark:bg-slate-700'"
            >
              <span
                class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out"
                :class="discordTargets.ptb ? 'translate-x-5' : 'translate-x-0'"
              />
            </button>
          </div>

          <!-- Canary Target Toggle -->
          <div class="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <div class="flex items-center gap-3.5 min-w-0">
              <img
                :src="discordCanaryIcon"
                alt="Discord Canary"
                class="w-8 h-8 rounded-full object-contain shrink-0"
              />
              <div>
                <div class="text-sm font-bold text-slate-900 dark:text-white">
                  {{ t.discordCanaryLabel }}
                </div>
                <div class="text-xs text-slate-400 mt-0.5">
                  {{ t.discordCanarySubDesc }}
                </div>
              </div>
            </div>
            <button
              type="button"
              @click="setDiscordTarget('canary', !discordTargets.canary)"
              class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none select-none"
              :class="discordTargets.canary ? 'bg-[#5865F2]' : 'bg-slate-300 dark:bg-slate-700'"
            >
              <span
                class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out"
                :class="discordTargets.canary ? 'translate-x-5' : 'translate-x-0'"
              />
            </button>
          </div>
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

.scrollbar-none::-webkit-scrollbar {
  display: none;
}
.scrollbar-none {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
