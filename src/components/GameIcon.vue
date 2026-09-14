<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { Game } from '@/types/types';
import { getGameIconUrl, resolveAppIcon } from '@/services/icon-service';

const props = withDefaults(
  defineProps<{
    game: Game;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    customClass?: string;
  }>(),
  {
    size: 'md',
    customClass: ''
  }
);

const hasError = ref(false);
const isLoaded = ref(false);

const iconUrl = computed(() => {
  return getGameIconUrl(props.game);
});

watch(
  iconUrl,
  (newUrl) => {
    hasError.value = false;
    isLoaded.value = false;
  },
  { immediate: true }
);

function onImageLoad() {
  isLoaded.value = true;
  hasError.value = false;
}

function onImageError() {
  hasError.value = true;
  isLoaded.value = false;
  // If image failed to load, try resolving fresh hash or Steam image
  if (props.game?.id) {
    resolveAppIcon(props.game.id, props.game.name, true);
  }
}

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'w-8 h-8 rounded-lg text-[11px]';
    case 'lg':
      return 'w-14 h-14 rounded-2xl text-base';
    case 'xl':
      return 'w-16 h-16 rounded-2xl text-lg';
    case 'md':
    default:
      return 'w-10 h-10 rounded-xl text-xs';
  }
});

// Vibrant gradients for fallback badges based on game ID
const fallbackGradients = [
  'bg-gradient-to-br from-[#5865F2] to-[#4752C4]',
  'bg-gradient-to-br from-[#576585] to-[#36393F]',
  'bg-gradient-to-br from-[#4E5D94] to-[#2C2F33]',
  'bg-gradient-to-br from-[#7289DA] to-[#5865F2]',
  'bg-gradient-to-br from-[#4752C4] to-[#3C45A5]'
];

const fallbackGradient = computed(() => {
  const idNum = parseInt(props.game?.id?.slice(-3) || '0', 10) || 0;
  return fallbackGradients[idNum % fallbackGradients.length];
});
</script>

<template>
  <div
    class="relative shrink-0 overflow-hidden shadow-2xs border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center select-none"
    :class="[sizeClasses, customClass]"
  >
    <!-- Fallback badge underneath: Sleek Game Controller -->
    <div
      v-if="!iconUrl || hasError || !isLoaded"
      class="absolute inset-0 flex items-center justify-center text-white"
      :class="fallbackGradient"
    >
      <svg class="w-1/2 h-1/2 text-white/90 drop-shadow-2xs" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 11h4m-2-2v4m7-2h.01M18 13h.01M5.05 6.05A7 7 0 0118.95 6.05l1.9 6.65A4 4 0 0117 17.5l-2.5-2.5h-5L7 17.5a4 4 0 01-3.85-4.8l1.9-6.65z" />
      </svg>
    </div>

    <!-- Actual Image from Discord CDN -->
    <img
      v-if="iconUrl && !hasError"
      :src="iconUrl"
      :alt="game?.name || 'Game'"
      draggable="false"
      loading="eager"
      decoding="async"
      referrerpolicy="no-referrer"
      @load="onImageLoad"
      @error="onImageError"
      class="relative w-full h-full object-cover transition-opacity duration-150 pointer-events-none select-none"
      :class="isLoaded ? 'opacity-100' : 'opacity-0'"
    />
  </div>
</template>
