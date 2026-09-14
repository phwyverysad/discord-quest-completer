<script setup lang="ts">
import { ref } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { emit } from '@tauri-apps/api/event';
import { useGlobalState } from '@/composables/app-state';
import { useI18n } from '@/composables/i18n';
import CustomDropdown, { type DropdownOption } from '@/components/CustomDropdown.vue';

const ActivityKind = {
  Playing: 0,
  Listening: 2,
  Watching: 3,
  Competing: 5,
} as const;

const activityOptions: DropdownOption<number>[] = [
  { value: ActivityKind.Playing, label: 'Playing' },
  { value: ActivityKind.Listening, label: 'Listening' },
  { value: ActivityKind.Watching, label: 'Watching' },
  { value: ActivityKind.Competing, label: 'Competing' },
];

const isConnected = ref(false);
const appId = ref('1361728268088381706');
const details = ref('Testing Discord Quest Completer');
const state = ref('Quest In Progress');
const selectedActivityKind = ref<number>(0);

const { logs, addLog, clearLogs, discordTargets } = useGlobalState();
const { t } = useI18n();

const copied = ref(false);

async function copyAllLogs() {
  if (logs.value.length === 0) return;
  const text = logs.value
    .map(
      (l) => `[${new Date(l.timestamp).toLocaleTimeString()}] [${l.type.toUpperCase()}] ${l.message}`
    )
    .join('\n');
  try {
    await navigator.clipboard.writeText(text);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch {}
}

function discordTest() {
  if (isConnected.value) {
    emit('event_disconnect');
    isConnected.value = false;
    addLog('info', 'Disconnected from Discord RPC');
    return;
  }

  const targets: string[] = [];
  if (discordTargets.value.stable) targets.push('Stable');
  if (discordTargets.value.ptb) targets.push('PTB');
  if (discordTargets.value.canary) targets.push('Canary');

  try {
    invoke('connect_to_discord_rpc_3', {
      activity_json: JSON.stringify({
        app_id: appId.value,
        details: details.value,
        state: state.value,
        activity_kind: selectedActivityKind.value,
        timestamp: Math.floor(Date.now() / 1000) - 3600,
      }),
      action: 'connect',
      target_clients: targets.length > 0 ? targets : ['Stable', 'PTB', 'Canary'],
    });
    isConnected.value = true;
    addLog('info', `Connected to Discord RPC with App ID: ${appId.value}`);
  } catch (e) {
    addLog('error', `RPC Connection Error: ${e}`);
  }
}
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-6 animate-fadeIn">
    <!-- Top Hero Banner Card: Matching HomeView and SettingsView Style -->
    <div class="rounded-3xl bg-white dark:bg-[#141A26] border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-xs">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div class="flex items-center gap-5">
          <!-- Science / Flask Icon Box: Solid Clean Discord Blurple -->
          <div class="w-14 h-14 rounded-2xl bg-[#5865F2] text-white flex items-center justify-center p-3.5 shrink-0 shadow-xs">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>

          <div>
            <div class="flex items-center gap-2.5 flex-wrap">
              <h1 class="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {{ t.playgroundTitle }}
              </h1>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#5865F2]/10 dark:bg-[#5865F2]/20 text-[#5865F2] dark:text-[#A5AFFA] border border-[#5865F2]/20 flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-[#5865F2]"></span>
                Testing & Logs
              </span>
            </div>
            <p class="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 font-normal">
              Experiment with custom Discord Rich Presence activity parameters and review live app logs.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- RPC Simulator Card -->
    <div class="bg-white dark:bg-[#131927] rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] border border-slate-200/90 dark:border-slate-800 transition-all space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-base font-bold text-slate-900 dark:text-white">
          Discord RPC Custom Simulator
        </h2>
        <span
          class="px-2.5 py-1 text-xs rounded-full font-bold flex items-center gap-1.5 shadow-2xs"
          :class="isConnected ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'"
        >
          <span class="w-1.5 h-1.5 rounded-full" :class="isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'"></span>
          {{ isConnected ? t.connected : t.disconnected }}
        </span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Discord App / Client ID</label>
          <input
            v-model="appId"
            type="text"
            class="w-full px-3.5 py-2.5 text-xs font-mono font-medium border-2 border-slate-200/90 dark:border-slate-800 rounded-xl bg-slate-50/70 dark:bg-[#0B0F19] text-slate-800 dark:text-white focus:border-[#5865F2] focus:ring-4 focus:ring-[#5865F2]/15 outline-none transition-all"
          />
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Activity Type</label>
          <CustomDropdown
            v-model="selectedActivityKind"
            :options="activityOptions"
          />
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Details Line</label>
          <input
            v-model="details"
            type="text"
            class="w-full px-3.5 py-2.5 text-xs font-medium border-2 border-slate-200/90 dark:border-slate-800 rounded-xl bg-slate-50/70 dark:bg-[#0B0F19] text-slate-800 dark:text-white focus:border-[#5865F2] focus:ring-4 focus:ring-[#5865F2]/15 outline-none transition-all"
          />
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">State Line</label>
          <input
            v-model="state"
            type="text"
            class="w-full px-3.5 py-2.5 text-xs font-medium border-2 border-slate-200/90 dark:border-slate-800 rounded-xl bg-slate-50/70 dark:bg-[#0B0F19] text-slate-800 dark:text-white focus:border-[#5865F2] focus:ring-4 focus:ring-[#5865F2]/15 outline-none transition-all"
          />
        </div>
      </div>

      <div class="pt-2 flex justify-end">
        <button
          @click="discordTest"
          class="px-6 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-xs cursor-pointer select-none active:scale-98"
          :class="isConnected ? 'bg-[#F23F43] hover:bg-[#DA373C] active:bg-[#A12828]' : 'bg-[#5865F2] hover:bg-[#4752C4] active:bg-[#3C45A5]'"
        >
          {{ isConnected ? t.disconnectRPC : t.discordTestBtn }}
        </button>
      </div>
    </div>

    <!-- Clean System Logs Card -->
    <div class="bg-white dark:bg-[#131927] rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] border border-slate-200/90 dark:border-slate-800 space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <svg class="w-4 h-4 text-[#8C99B6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {{ t.logsTitle }}
        </h2>

        <div class="flex items-center gap-2">
          <!-- Copy Logs -->
          <button
            type="button"
            @click="copyAllLogs"
            :disabled="logs.length === 0"
            :title="t.copyLogs"
            class="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 select-none"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            <span>{{ copied ? t.copied : t.copyLogs }}</span>
          </button>

          <!-- Clear Logs -->
          <button
            type="button"
            @click="clearLogs"
            :disabled="logs.length === 0"
            :title="t.clearLogs"
            class="px-3 py-1.5 rounded-xl text-xs font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 select-none"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>{{ t.clearLogs }}</span>
          </button>
        </div>
      </div>

      <!-- Clean Terminal Box -->
      <div class="bg-slate-950 text-slate-300 p-4 rounded-2xl font-mono text-xs max-h-80 overflow-y-auto space-y-1.5 border border-slate-800/80">
        <div v-if="logs.length === 0" class="text-slate-500 py-8 text-center">
          {{ t.noLogs }}
        </div>
        <div
          v-for="(log, idx) in logs"
          :key="idx"
          class="flex items-start gap-2.5 leading-relaxed hover:bg-white/[0.02] py-0.5 px-1 rounded transition-colors"
        >
          <span class="text-slate-500 select-none shrink-0 text-[11px]">
            [{{ new Date(log.timestamp).toLocaleTimeString() }}]
          </span>
          <span
            class="font-semibold text-[11px] uppercase shrink-0 tracking-wide"
            :class="{
              'text-sky-400': log.type === 'info',
              'text-rose-400': log.type === 'error',
              'text-amber-400': log.type === 'warning',
              'text-emerald-400': log.type === 'debug',
            }"
          >
            {{ log.type }}
          </span>
          <span class="flex-1 text-slate-300 break-all text-[12px]">{{ log.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.25s ease-out forwards;
}
</style>