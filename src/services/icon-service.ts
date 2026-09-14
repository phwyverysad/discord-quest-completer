import { reactive } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import type { Game } from '@/types/types';

interface CachedAppInfo {
  iconHash?: string | null;
  iconUrl?: string | null;
  executables?: Array<{ os: string; name: string; is_launcher?: boolean }>;
}

const STORAGE_KEY = 'dqc_app_icons_cache';

// Load cached icons from localStorage
function loadCache(): Record<string, CachedAppInfo> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to read icon cache:', e);
  }
  return {};
}

// In-memory reactive cache
export const appIconCache = reactive<Record<string, CachedAppInfo>>(loadCache());

function saveCache() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appIconCache));
  } catch (e) {
    console.warn('Failed to save icon cache:', e);
  }
}

// In-flight fetch promises to prevent redundant duplicate network requests
const inFlightRequests = new Map<string, Promise<string | null>>();

/**
 * Resolves the Discord application icon URL, querying Discord RPC API if needed.
 */
export async function resolveAppIcon(appId: string, force = false): Promise<string | null> {
  if (!appId) return null;

  const cleanId = appId.trim();
  const cached = appIconCache[cleanId];
  if (!force && cached) {
    if (cached.iconHash) {
      return `https://cdn.discordapp.com/app-icons/${cleanId}/${cached.iconHash}.png?size=128`;
    }
    if (cached.iconUrl) {
      return cached.iconUrl;
    }
    // If previously recorded as failed, avoid spamming unless forced
    return null;
  }

  // Deduplicate network requests
  if (inFlightRequests.has(cleanId)) {
    return inFlightRequests.get(cleanId)!;
  }

  const promise = (async () => {
    try {
      const resStr = await invoke<string>('fetch_discord_application', { app_id: cleanId });
      const data = JSON.parse(resStr);

      let iconHash: string | null = null;
      let iconUrl: string | null = null;

      if (data.icon) {
        iconHash = data.icon;
        iconUrl = `https://cdn.discordapp.com/app-icons/${cleanId}/${iconHash}.png?size=128`;
      } else if (data.cover_image) {
        iconUrl = `https://cdn.discordapp.com/app-assets/${cleanId}/${data.cover_image}.png?size=128`;
      }

      appIconCache[cleanId] = {
        iconHash,
        iconUrl,
        executables: data.executables || []
      };
      saveCache();

      return iconUrl;
    } catch (err) {
      // If application RPC fetch failed, remember empty so we don't spam
      appIconCache[cleanId] = {
        iconHash: null,
        iconUrl: null
      };
      saveCache();
      return null;
    } finally {
      inFlightRequests.delete(cleanId);
    }
  })();

  inFlightRequests.set(cleanId, promise);
  return promise;
}

/**
 * Computes the icon URL for a game, or triggers background resolution if missing.
 */
export function getGameIconUrl(game: Game | null | undefined): string | null {
  if (!game) return null;

  // 1. Direct custom or quest icon URL
  if (game.icon_url) {
    return game.icon_url;
  }

  // 2. Check reactive cache first (e.g. if freshly resolved)
  if (game.id && appIconCache[game.id]) {
    const cached = appIconCache[game.id];
    if (cached.iconHash) {
      return `https://cdn.discordapp.com/app-icons/${game.id}/${cached.iconHash}.png?size=128`;
    }
    if (cached.iconUrl) {
      return cached.iconUrl;
    }
  }

  // 3. Known icon hash from detectable.json or initial data
  if (game.icon_hash && game.id) {
    return `https://cdn.discordapp.com/app-icons/${game.id}/${game.icon_hash}.png?size=128`;
  }

  // 4. Trigger auto-resolution in background if not yet cached
  if (game.id && !appIconCache[game.id] && !inFlightRequests.has(game.id)) {
    resolveAppIcon(game.id);
  }

  return null;
}
