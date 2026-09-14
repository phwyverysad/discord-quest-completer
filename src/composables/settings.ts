import { ref, watch, onMounted } from 'vue';
import { invoke } from '@tauri-apps/api/core';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface GamesStats {
  count: number;
  total_size_bytes: number;
  path: string;
}

const savedTheme = (localStorage.getItem('dqc_theme') as ThemeMode) || 'light';
const themeMode = ref<ThemeMode>(savedTheme);

const autoRefresh = ref<boolean>(localStorage.getItem('dqc_auto_refresh') !== 'false');

const gamesStats = ref<GamesStats>({
  count: 0,
  total_size_bytes: 0,
  path: ''
});

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (mode === 'dark' || (mode === 'system' && prefersDark)) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

// Listen to system theme change
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (themeMode.value === 'system') {
      applyTheme('system');
    }
  });
}

export function useAppSettings() {
  function setTheme(newTheme: ThemeMode) {
    themeMode.value = newTheme;
    localStorage.setItem('dqc_theme', newTheme);
    applyTheme(newTheme);
  }

  function setAutoRefresh(val: boolean) {
    autoRefresh.value = val;
    localStorage.setItem('dqc_auto_refresh', String(val));
  }

  async function refreshGamesStats() {
    try {
      const stats = await invoke<GamesStats>('get_games_folder_stats');
      gamesStats.value = stats;
    } catch (err) {
      console.error('Failed to get games folder stats:', err);
    }
  }

  async function openGamesFolder() {
    try {
      await invoke('open_games_folder');
    } catch (err) {
      console.error('Failed to open games folder:', err);
    }
  }

  async function clearGamesFolder(): Promise<number> {
    try {
      const removed = await invoke<number>('clear_games_folder');
      await refreshGamesStats();
      return removed;
    } catch (err) {
      console.error('Failed to clear games folder:', err);
      return 0;
    }
  }

  function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Initialize theme on app start
  applyTheme(themeMode.value);

  return {
    themeMode,
    setTheme,
    autoRefresh,
    setAutoRefresh,
    gamesStats,
    refreshGamesStats,
    openGamesFolder,
    clearGamesFolder,
    formatBytes,
    applyTheme
  };
}
