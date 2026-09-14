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
 * Resolves the Discord application icon URL, querying Discord RPC API or Steam Store API if needed.
 */
export async function resolveAppIcon(appId: string, gameName?: string, force = false): Promise<string | null> {
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
      let iconHash: string | null = null;
      let iconUrl: string | null = null;
      let executables: any[] = [];

      // 1. Try fetching from Discord RPC Application API
      try {
        const resStr = await invoke<string>('fetch_discord_application', { app_id: cleanId });
        const data = JSON.parse(resStr);

        executables = data.executables || [];

        if (data.icon) {
          iconHash = data.icon;
          iconUrl = `https://cdn.discordapp.com/app-icons/${cleanId}/${iconHash}.png?size=128`;
        } else if (data.cover_image) {
          iconUrl = `https://cdn.discordapp.com/app-assets/${cleanId}/${data.cover_image}.png?size=128`;
        } else if (data.third_party_skus && Array.isArray(data.third_party_skus)) {
          const steamSku = data.third_party_skus.find((s: any) => s.distributor === 'steam');
          if (steamSku?.id) {
            iconUrl = `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${steamSku.id}/capsule_sm_120.jpg`;
          }
        }
      } catch {}

      // 2. If Discord has no icon and we have a game name, search Steam Store API fallback
      if (!iconUrl && gameName) {
        try {
          const cleanName = gameName
            .replace(/[\(\[\{].*?[\)\]\}]/g, '') // remove brackets like (Demo)
            .replace(/:\s*CO-OP.*$/i, '')       // remove suffixes like ": CO-OP Deckbuilder"
            .trim();
          const steamResStr = await invoke<string>('fetch_steam_game_icon', { game_name: cleanName || gameName });
          const steamData = JSON.parse(steamResStr);
          if (steamData?.items && steamData.items.length > 0) {
            const first = steamData.items[0];
            if (first.tiny_image) {
              iconUrl = first.tiny_image;
            } else if (first.id) {
              iconUrl = `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${first.id}/capsule_sm_120.jpg`;
            }
          }
        } catch {}
      }

      appIconCache[cleanId] = {
        iconHash,
        iconUrl,
        executables
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

  // 4. Known cover image hash from detectable.json
  if (game.cover_image_hash && game.id) {
    return `https://cdn.discordapp.com/app-assets/${game.id}/${game.cover_image_hash}.png?size=128`;
  }

  // 5. Check if game has a Steam SKU directly in third_party_skus
  if (game.third_party_skus && Array.isArray(game.third_party_skus)) {
    const steamSku = game.third_party_skus.find((s: any) => s.distributor === 'steam');
    if (steamSku?.id) {
      return `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${steamSku.id}/capsule_sm_120.jpg`;
    }
  }

  // 6. Trigger auto-resolution in background if not yet cached
  if (game.id && !appIconCache[game.id] && !inFlightRequests.has(game.id)) {
    resolveAppIcon(game.id, game.name);
  }

  return null;
}
