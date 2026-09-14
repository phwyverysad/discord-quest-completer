import { ref, computed } from 'vue';
import type { Game } from '@/types/types';

const isAutoPilotActive = ref(false);
const autoPilotIntervalMinutes = ref(15);
const currentQueueIndex = ref(0);
const remainingSeconds = ref(0);
const totalSecondsForCurrent = ref(0);
let timerId: ReturnType<typeof setInterval> | null = null;

export function useAutoPilot() {
  const progressPercent = computed(() => {
    if (totalSecondsForCurrent.value <= 0) return 0;
    const elapsed = totalSecondsForCurrent.value - remainingSeconds.value;
    return Math.min(100, Math.max(0, (elapsed / totalSecondsForCurrent.value) * 100));
  });

  const formattedRemainingTime = computed(() => {
    const m = Math.floor(remainingSeconds.value / 60);
    const s = remainingSeconds.value % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  });

  function setIntervalMinutes(mins: number) {
    if (mins > 0 && mins <= 180) {
      autoPilotIntervalMinutes.value = mins;
    }
  }

  async function startAutoPilot(
    games: Game[],
    onSwitchGame: (game: Game) => Promise<void>
  ) {
    if (!games || games.length === 0) return;
    if (isAutoPilotActive.value) return;

    isAutoPilotActive.value = true;
    currentQueueIndex.value = 0;
    await activateGame(games, 0, onSwitchGame);
  }

  async function activateGame(
    games: Game[],
    index: number,
    onSwitchGame: (game: Game) => Promise<void>
  ) {
    if (index >= games.length) {
      // Completed all games
      await stopAutoPilot(() => Promise.resolve());
      return;
    }

    currentQueueIndex.value = index;
    const duration = Math.max(1, autoPilotIntervalMinutes.value) * 60;
    totalSecondsForCurrent.value = duration;
    remainingSeconds.value = duration;

    // Trigger RPC connect callback for this game
    const game = games[index];
    if (game) {
      await onSwitchGame(game);
    }

    if (timerId) {
      clearInterval(timerId);
    }

    timerId = setInterval(async () => {
      if (!isAutoPilotActive.value) {
        if (timerId) clearInterval(timerId);
        return;
      }

      if (remainingSeconds.value > 1) {
        remainingSeconds.value -= 1;
      } else {
        // Current interval finished! Advance to next game
        if (timerId) clearInterval(timerId);
        const nextIndex = currentQueueIndex.value + 1;
        if (nextIndex < games.length) {
          await activateGame(games, nextIndex, onSwitchGame);
        } else {
          // Loop or stop
          await stopAutoPilot(() => Promise.resolve());
        }
      }
    }, 1000);
  }

  async function skipNext(
    games: Game[],
    onSwitchGame: (game: Game) => Promise<void>
  ) {
    if (!isAutoPilotActive.value || games.length === 0) return;
    const nextIndex = (currentQueueIndex.value + 1) % games.length;
    await activateGame(games, nextIndex, onSwitchGame);
  }

  async function stopAutoPilot(onStopCallback?: () => Promise<void>) {
    isAutoPilotActive.value = false;
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
    remainingSeconds.value = 0;
    totalSecondsForCurrent.value = 0;
    currentQueueIndex.value = 0;

    if (onStopCallback) {
      await onStopCallback();
    }
  }

  return {
    isAutoPilotActive,
    autoPilotIntervalMinutes,
    currentQueueIndex,
    remainingSeconds,
    totalSecondsForCurrent,
    progressPercent,
    formattedRemainingTime,
    setIntervalMinutes,
    startAutoPilot,
    stopAutoPilot,
    skipNext
  };
}
