<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { Pages, useGlobalState } from '@/composables/app-state';
import { useI18n } from '@/composables/i18n';
import TitleBar from './TitleBar.vue';
import AboutModal from './AboutModal.vue';
import funnyIcon from '@/assets/funny.ico';
import discordStableIcon from '@/assets/discord-stable.png';
import discordCanaryIcon from '@/assets/discord-canary.png';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

const appState = useGlobalState();
const { page, setPage, discordTargets, setDiscordTarget, activeRpcClients, setActiveRpcClients } = appState;
const { t } = useI18n();

const showAbout = ref(false);

interface DiscordClientsStatus {
  stable: boolean;
  ptb: boolean;
  canary: boolean;
}

const discordClients = ref<DiscordClientsStatus>({
  stable: false,
  ptb: false,
  canary: false,
});

let pollTimer: ReturnType<typeof setInterval> | null = null;
let unlistenConnected: (() => void) | null = null;
let unlistenDisconnect: (() => void) | null = null;

async function checkDiscordStatus() {
  try {
    const res = await invoke<DiscordClientsStatus>('check_discord_clients');
    if (res) {
      discordClients.value = res;
    }
  } catch {
    // Fallback or outside Tauri runtime
  }
}

function isRpcActive(client: 'Stable' | 'PTB' | 'Canary'): boolean {
  const cLower = client.toLowerCase();
  const directMatch = activeRpcClients.value.some((c) => c.toLowerCase() === cLower);
  if (directMatch) return true;

  const genericMatch = activeRpcClients.value.some((c) => c.toLowerCase() === 'discord' || c.toLowerCase() === 'all');
  const isRunning =
    client === 'Stable'
      ? discordClients.value.stable
      : client === 'PTB'
      ? discordClients.value.ptb
      : discordClients.value.canary;

  return genericMatch && isRunning;
}

onMounted(async () => {
  checkDiscordStatus();
  pollTimer = setInterval(checkDiscordStatus, 4000);

  try {
    unlistenConnected = await listen<{ app_id?: string; active_clients?: string[] }>(
      'client_connected',
      (event) => {
        if (event.payload?.active_clients && event.payload.active_clients.length > 0) {
          const mapped = event.payload.active_clients.map((c) =>
            c.toLowerCase() === 'discord' ? 'Stable' : c
          );
          setActiveRpcClients(mapped);
        } else {
          const list: string[] = [];
          if (discordTargets.value.stable) list.push('Stable');
          if (discordTargets.value.ptb) list.push('PTB');
          if (discordTargets.value.canary) list.push('Canary');
          setActiveRpcClients(list);
        }
      }
    );

    unlistenDisconnect = await listen('event_disconnect', () => {
      setActiveRpcClients([]);
    });
  } catch {}
});

onUnmounted(() => {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  if (unlistenConnected) {
    unlistenConnected();
  }
  if (unlistenDisconnect) {
    unlistenDisconnect();
  }
});
</script>

<template>
  <div class="flex flex-col h-screen w-screen overflow-hidden bg-[#EDF1F7] dark:bg-[#0B0F19] text-slate-800 dark:text-slate-100 font-sans select-none antialiased border border-slate-300/60 dark:border-slate-800">
    <!-- Top Custom Window TitleBar -->
    <TitleBar @open-about="showAbout = true" />

    <!-- App Body: Sidebar + Main Content -->
    <div class="flex-1 flex min-h-0 overflow-hidden">
      <!-- Left Sidebar: Modern Crisp Surface with Vibrant Brand Accents -->
      <aside class="w-64 shrink-0 flex flex-col bg-white dark:bg-[#101624] border-r border-slate-200/90 dark:border-slate-800/80 z-20 shadow-[2px_0_16px_rgba(0,0,0,0.03)] dark:shadow-none">
        <!-- Sidebar Header (Custom funny.ico Badge - Enlarged) -->
        <div class="p-5 flex items-center gap-3">
          <div class="w-11 h-11 rounded-2xl bg-slate-50 dark:bg-[#141A26] border border-slate-200 dark:border-slate-800 flex items-center justify-center p-0.5 shrink-0 shadow-xs overflow-hidden group">
            <img :src="funnyIcon" alt="funny" class="w-full h-full object-contain select-none pointer-events-none transform scale-110 transition-transform group-hover:scale-120 duration-200" />
          </div>
          <div class="min-w-0">
            <div class="font-bold text-sm text-slate-900 dark:text-white leading-tight">
              Quest Completer
            </div>
            <span class="inline-block mt-0.5 px-2 py-0.5 text-[10px] font-bold rounded-md text-[#5865F2] dark:text-[#A5AFFA] bg-[#5865F2]/10 dark:bg-[#5865F2]/20 border border-[#5865F2]/20">
              Active Engine
            </span>
          </div>
        </div>

        <!-- Navigation Links with Clean Solid Active States -->
        <nav class="px-3 py-2 space-y-2 flex-1">
          <!-- Home -->
          <button
            @click="setPage(Pages.HOME)"
            class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-left cursor-pointer group select-none"
            :class="[
              page === Pages.HOME
                ? 'bg-[#5865F2] text-white font-semibold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
            ]"
          >
            <svg class="w-5 h-5 transition-transform group-hover:scale-105" :class="page === Pages.HOME ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>{{ t.navHome }}</span>
          </button>

          <!-- Playground -->
          <button
            @click="setPage(Pages.PLAYGROUND)"
            class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-left cursor-pointer group select-none"
            :class="[
              page === Pages.PLAYGROUND
                ? 'bg-[#5865F2] text-white font-semibold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
            ]"
          >
            <svg class="w-5 h-5 transition-transform group-hover:scale-105" :class="page === Pages.PLAYGROUND ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{{ t.navPlayground }}</span>
          </button>

          <!-- Settings -->
          <button
            @click="setPage(Pages.SETTINGS)"
            class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-left cursor-pointer group select-none"
            :class="[
              page === Pages.SETTINGS
                ? 'bg-[#5865F2] text-white font-semibold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
            ]"
          >
            <svg class="w-5 h-5 transition-transform group-hover:scale-105" :class="page === Pages.SETTINGS ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{{ t.navSettings }}</span>
          </button>
        </nav>

        <!-- Bottom Discord Clients Status -->
        <div class="p-3 m-3 rounded-2xl bg-slate-50/90 dark:bg-[#131927] border border-slate-200/80 dark:border-slate-800/80 shadow-xs select-none">
          <!-- Status Header -->
          <div class="flex items-center gap-1.5 mb-2.5 px-0.5">
            <svg class="w-3.5 h-3.5 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
            <span class="text-[11px] font-bold tracking-wide uppercase text-slate-500 dark:text-slate-400">
              {{ t.discordStatusTitle }}
            </span>
          </div>

          <!-- Discord Clients List with Status -->
          <div class="space-y-1.5">
            <!-- Client 1: Discord Stable -->
            <div
              class="flex items-center justify-between px-2.5 py-1.5 rounded-xl transition-all border text-xs"
              :class="[
                isRpcActive('Stable')
                  ? 'bg-emerald-500/15 border-emerald-500/50 shadow-xs ring-1 ring-emerald-500/30'
                  : discordClients.stable
                    ? 'bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/30 text-slate-900 dark:text-white shadow-xs'
                    : 'bg-white/70 dark:bg-[#141A26] border-slate-200/70 dark:border-slate-800/80 text-slate-400 dark:text-slate-500'
              ]"
              :title="t.discordStableDesc"
            >
              <div class="flex items-center gap-2.5 min-w-0">
                <img :src="discordStableIcon" alt="Discord Stable" class="w-5 h-5 rounded-full object-contain shrink-0 shadow-2xs" />
                <span class="font-bold tracking-tight truncate text-xs" :class="discordClients.stable ? 'text-slate-800 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'">
                  Discord Stable
                </span>
              </div>
              <div class="flex items-center gap-1.5 shrink-0 ml-2">
                <template v-if="isRpcActive('Stable')">
                  <span class="relative flex h-2 w-2">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span class="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md text-emerald-600 dark:text-emerald-300 bg-emerald-500/20 tracking-tight">
                    {{ t.statusRpcActive }}
                  </span>
                </template>
                <template v-else>
                  <span
                    class="w-1.5 h-1.5 rounded-full"
                    :class="discordClients.stable ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.9)] animate-pulse' : 'bg-slate-300 dark:bg-slate-600'"
                  ></span>
                  <span
                    class="text-[10px] font-bold px-1.5 py-0.5 rounded-md transition-colors"
                    :class="discordClients.stable ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10' : 'text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/60'"
                  >
                    {{ discordClients.stable ? t.statusRunning : t.statusOffline }}
                  </span>
                </template>
              </div>
            </div>

            <!-- Client 2: Discord PTB -->
            <div
              class="flex items-center justify-between px-2.5 py-1.5 rounded-xl transition-all border text-xs"
              :class="[
                isRpcActive('PTB')
                  ? 'bg-emerald-500/15 border-emerald-500/50 shadow-xs ring-1 ring-emerald-500/30'
                  : discordClients.ptb
                    ? 'bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/30 text-slate-900 dark:text-white shadow-xs'
                    : 'bg-white/70 dark:bg-[#141A26] border-slate-200/70 dark:border-slate-800/80 text-slate-400 dark:text-slate-500'
              ]"
              :title="t.discordPtbDesc"
            >
              <div class="flex items-center gap-2.5 min-w-0">
                <img :src="discordStableIcon" alt="Discord PTB" class="w-5 h-5 rounded-full object-contain shrink-0 shadow-2xs" />
                <span class="font-bold tracking-tight truncate text-xs" :class="discordClients.ptb ? 'text-slate-800 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'">
                  Discord PTB
                </span>
              </div>
              <div class="flex items-center gap-1.5 shrink-0 ml-2">
                <template v-if="isRpcActive('PTB')">
                  <span class="relative flex h-2 w-2">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span class="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md text-emerald-600 dark:text-emerald-300 bg-emerald-500/20 tracking-tight">
                    {{ t.statusRpcActive }}
                  </span>
                </template>
                <template v-else>
                  <span
                    class="w-1.5 h-1.5 rounded-full"
                    :class="discordClients.ptb ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.9)] animate-pulse' : 'bg-slate-300 dark:bg-slate-600'"
                  ></span>
                  <span
                    class="text-[10px] font-bold px-1.5 py-0.5 rounded-md transition-colors"
                    :class="discordClients.ptb ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10' : 'text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/60'"
                  >
                    {{ discordClients.ptb ? t.statusRunning : t.statusOffline }}
                  </span>
                </template>
              </div>
            </div>

            <!-- Client 3: Discord Canary -->
            <div
              class="flex items-center justify-between px-2.5 py-1.5 rounded-xl transition-all border text-xs"
              :class="[
                isRpcActive('Canary')
                  ? 'bg-emerald-500/15 border-emerald-500/50 shadow-xs ring-1 ring-emerald-500/30'
                  : discordClients.canary
                    ? 'bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/30 text-slate-900 dark:text-white shadow-xs'
                    : 'bg-white/70 dark:bg-[#141A26] border-slate-200/70 dark:border-slate-800/80 text-slate-400 dark:text-slate-500'
              ]"
              :title="t.discordCanaryDesc"
            >
              <div class="flex items-center gap-2.5 min-w-0">
                <img :src="discordCanaryIcon" alt="Discord Canary" class="w-5 h-5 rounded-full object-contain shrink-0 shadow-2xs" />
                <span class="font-bold tracking-tight truncate text-xs" :class="discordClients.canary ? 'text-slate-800 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'">
                  Discord Canary
                </span>
              </div>
              <div class="flex items-center gap-1.5 shrink-0 ml-2">
                <template v-if="isRpcActive('Canary')">
                  <span class="relative flex h-2 w-2">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span class="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md text-emerald-600 dark:text-emerald-300 bg-emerald-500/20 tracking-tight">
                    {{ t.statusRpcActive }}
                  </span>
                </template>
                <template v-else>
                  <span
                    class="w-1.5 h-1.5 rounded-full"
                    :class="discordClients.canary ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.9)] animate-pulse' : 'bg-slate-300 dark:bg-slate-600'"
                  ></span>
                  <span
                    class="text-[10px] font-bold px-1.5 py-0.5 rounded-md transition-colors"
                    :class="discordClients.canary ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10' : 'text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/60'"
                  >
                    {{ discordClients.canary ? t.statusRunning : t.statusOffline }}
                  </span>
                </template>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <!-- Main Content Area -->
      <div class="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <!-- Clean Top Header Bar -->
        <header class="h-11 px-8 flex items-center justify-between shrink-0 bg-white/90 dark:bg-[#101624]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 z-10">
          <div class="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 font-medium">
            <span>Discord Quest Completer</span>
            <span>/</span>
            <span class="capitalize text-[#5865F2] dark:text-[#818CF8] font-bold">{{ page }}</span>
          </div>
        </header>

        <!-- Content Scrollable Viewport (High-Contrast Desktop Canvas) -->
        <main class="flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-8 bg-[#EDF1F7] dark:bg-[#0B0F19]">
          <slot></slot>
        </main>
      </div>
    </div>

    <!-- Help & About Modal -->
    <AboutModal v-if="showAbout" @close="showAbout = false" />
  </div>
</template>

<style scoped>
</style>