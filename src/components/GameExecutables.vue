<template>
  <div class="text-slate-600 dark:text-slate-300 space-y-3">
    <p v-if="isMac" class="text-xs text-slate-500 dark:text-slate-400">
      {{ t.macOsWindowTip }}
    </p>

    <div v-if="filteredExecutables.length > 0" class="flex items-center justify-between">
      <h3 class="text-xs font-semibold text-slate-700 dark:text-slate-300">
        {{ t.selectExecutableToLaunch }}
      </h3>
      <span class="text-[11px] text-slate-400 font-mono">
        {{ filteredExecutables.length }} {{ filteredExecutables.length > 1 ? t.executableUnitPlural : t.executableUnitSingle }}
      </span>
    </div>

    <p v-if="usingCrossPlatformFallback" class="text-xs text-amber-600 dark:text-amber-400">
      {{ t.crossPlatformFallbackTip }}
    </p>

    <p v-if="filteredExecutables.length === 0" class="text-xs text-amber-500">
      {{ t.noExecutablesForPlatform }} ({{ currentPlatform }}).
    </p>

    <!-- Executable Cards with Big, Beautiful Play Buttons -->
    <div class="space-y-3">
      <div
        v-for="executable in filteredExecutables"
        :key="executable.name"
        class="rounded-2xl p-4 bg-slate-50/80 dark:bg-slate-900/60 border-2 border-slate-200/80 dark:border-slate-800 shadow-sm transition-all hover:border-[#5865F2]/40 space-y-3.5"
      >
        <!-- Executable Info Header -->
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
            <!-- OS Badge: Prominent Blurple Badge -->
            <span class="shrink-0 px-2 py-0.5 rounded-md font-mono text-[10px] font-extrabold uppercase tracking-wider bg-[#5865F2]/10 dark:bg-[#5865F2]/25 text-[#5865F2] dark:text-[#A5AFFA] border border-[#5865F2]/30 shadow-2xs">
              {{ executable.os }}
            </span>

            <!-- Path / File Name -->
            <div class="flex items-center gap-1.5 min-w-0 overflow-x-auto scrollbar-none pr-1">
              <span
                v-for="(section, i) in splitExecutableName(executable)"
                :key="i"
                class="inline-block px-2.5 py-1 font-mono text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white shadow-2xs whitespace-nowrap"
              >
                {{ section }}
              </span>
            </div>
          </div>

          <!-- Running Status Badge -->
          <span
            v-if="gameActions?.isExecutableRunning(executable)"
            class="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700 shadow-2xs"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            {{ t.running }}
          </span>
        </div>

        <!-- Big, Beautiful, Prominent Play / Stop Button -->
        <button
          type="button"
          @click="handleLaunch(executable)"
          class="w-full py-3.5 px-6 rounded-2xl font-extrabold text-base text-white transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.98] group select-none shadow-xs"
          :class="[
            gameActions?.isExecutableRunning(executable)
              ? 'bg-[#F23F43] hover:bg-[#DA373C] active:bg-[#A12828]'
              : 'bg-[#23A55A] hover:bg-[#1F9550] active:bg-[#1A7B42]'
          ]"
        >
          <!-- Play Icon (with smooth micro-interaction) -->
          <svg
            v-if="!gameActions?.isExecutableRunning(executable)"
            class="w-4 h-4 fill-current transition-transform duration-200 group-hover:scale-115 group-hover:translate-x-0.5 shrink-0"
            viewBox="0 0 24 24"
          >
            <path d="M8 5.14v13.72a1 1 0 001.55.83l11-6.86a1 1 0 000-1.66l-11-6.86a1 1 0 00-1.55.83z" />
          </svg>

          <!-- Stop Icon -->
          <svg
            v-else
            class="w-3.5 h-3.5 fill-current transition-transform duration-200 group-hover:scale-115 shrink-0"
            viewBox="0 0 24 24"
          >
            <rect x="5" y="5" width="14" height="14" rx="2.5" />
          </svg>

          <span class="tracking-wide">
            {{ gameActions?.isExecutableRunning(executable) ? t.stop : t.play }}
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { EXECUTABLE_OS, GameActionsKey, getCurrentOS, isMacOS } from '@/constants/constants';
import { GameActionsProvider, type Game, type GameExecutable } from '@/types/types';
import { useI18n } from '@/composables/i18n';
import { path } from '@tauri-apps/api';
import { computed, inject } from 'vue';

const props = defineProps<{
  game: Game;
}>();

const emit = defineEmits<{
  play: [{ game: Game; executable: GameExecutable }];
  stop: [{ game: Game; executable: GameExecutable }];
  install_and_play: [{ game: Game; executable: GameExecutable }];
}>();

const { t } = useI18n();
const gameActions = inject<GameActionsProvider>(GameActionsKey);

function isValidPath(name: string) {
  const illegalChars = ['>', '<', ':', '"', '|', '?', '*'];
  return !illegalChars.some((char) => name.includes(char));
}

const validExecutables = computed(() =>
  props.game.executables.filter((executable) => isValidPath(executable.name))
);

const currentPlatform = getCurrentOS();
const isMac = isMacOS();

const filteredExecutables = computed(() => {
  const platformMatches = validExecutables.value.filter(
    (executable) => executable.os === currentPlatform
  );

  if (platformMatches.length > 0) {
    return platformMatches;
  }

  return validExecutables.value;
});

const usingCrossPlatformFallback = computed(() => {
  if (validExecutables.value.length === 0) {
    return false;
  }

  return !validExecutables.value.some((executable) => executable.os === currentPlatform);
});

function splitExecutableName(executable: GameExecutable) {
  const allSections = executable.name.split(/\\|\//);
  const last = executable.name.split(/\\|\//).pop();
  const name = last?.split('.').slice(0, -1).join('.') || last;
  return [...allSections.slice(0, -1), name];
}

function getExecutablePath(executable: GameExecutable) {
  const allSections = executable.name.split(/\\|\//);
  return allSections.slice(0, -1).join(path.sep());
}

function getFilename(executable: GameExecutable) {
  return executable.name.split(/\\|\//).pop() || '';
}

function handleLaunch(executable: GameExecutable) {
  if (executable.is_running) {
    emit('stop', {
      game: props.game,
      executable: {
        path: getExecutablePath(executable),
        segments: splitExecutableName(executable).length,
        filename: getFilename(executable),
        ...executable,
      },
    });
  } else {
    if (!gameActions?.isGameExecutableInstalled(executable)) {
      emit('install_and_play', {
        game: props.game,
        executable: {
          path: getExecutablePath(executable),
          segments: splitExecutableName(executable).length,
          filename: getFilename(executable),
          ...executable,
        },
      });
    } else {
      emit('play', {
        game: props.game,
        executable: {
          path: getExecutablePath(executable),
          segments: splitExecutableName(executable).length,
          filename: getFilename(executable),
          ...executable,
        },
      });
    }
  }
}
</script>

<style scoped>
.scrollbar-none {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
</style>
