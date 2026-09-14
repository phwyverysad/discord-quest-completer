<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { Game } from '@/types/types';
import { getGameIconUrl } from '@/services/icon-service';

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

watch(
  () => [props.game?.id, props.game?.icon_hash, props.game?.icon_url],
  () => {
    hasError.value = false;
    isLoaded.value = false;
  }
);

const iconUrl = computed(() => {
  return getGameIconUrl(props.game);
});

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

const initialLetter = computed(() => {
  if (!props.game?.name) return '?';
  return props.game.name.trim().charAt(0).toUpperCase();
});

// Color palettes for fallback badges based on game ID
const fallbackColors = [
  'bg-[#5865F2]',
  'bg-[#576585]',
  'bg-[#7180A0]',
  'bg-[#4752C4]',
  'bg-[#4E5D94]'
];

const fallbackColor = computed(() => {
  const idNum = parseInt(props.game?.id?.slice(-3) || '0', 10) || 0;
  return fallbackColors[idNum % fallbackColors.length];
});
</script>

<template>
  <div
    class="relative shrink-0 overflow-hidden shadow-2xs border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center select-none"
    :class="[sizeClasses, customClass]"
  >
    <!-- Actual Image from Discord CDN -->
    <img
      v-if="iconUrl && !hasError"
      :src="iconUrl"
      :alt="game.name"
      loading="lazy"
      @load="isLoaded = true"
      @error="hasError = true"
      class="w-full h-full object-cover transition-opacity duration-200"
      :class="isLoaded ? 'opacity-100' : 'opacity-0'"
    />

    <!-- Fallback when image is missing or loading/failed -->
    <div
      v-if="!iconUrl || hasError || !isLoaded"
      class="absolute inset-0 flex items-center justify-center font-bold text-white"
      :class="fallbackColor"
    >
      <!-- Controller SVG Icon if tiny or letter if normal -->
      <span v-if="initialLetter" class="tracking-tight drop-shadow-2xs">
        {{ initialLetter }}
      </span>
      <svg v-else class="w-1/2 h-1/2 fill-current opacity-90" viewBox="0 0 24 24">
        <path d="M15 7.5V2H9v5.5l3 3 3-3zM7.5 9H2v6h5.5l3-3-3-3zM9 16.5V22h6v-5.5l-3-3-3 3zM16.5 9l-3 3 3 3H22V9h-5.5z" />
      </svg>
    </div>
  </div>
</template>
