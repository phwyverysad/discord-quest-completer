<script setup lang="ts">
import { ref, computed, useTemplateRef, shallowRef, provide, watch, onMounted, onUnmounted } from 'vue';
import { onClickOutside, refDebounced } from '@vueuse/core';
import { useFuse } from '@vueuse/integrations/useFuse';
import { invoke } from '@tauri-apps/api/core';
import { randomString } from '@/utils/random-string';
import { GameActionsProvider, GameExecutable, type Game } from '@/types/types';
import IconVerified from '@/components/IconVerified.vue';
import IconDiscord from '@/components/IconDiscord.vue';
import { isEmpty } from 'lodash-es';
import GameExecutables from '@/components/GameExecutables.vue';
import { GameActionsKey } from '@/constants/constants';
import { emit, listen } from '@tauri-apps/api/event';
import { useFetchGameList } from '@/composables/fetch-gamelist';
import { UseFuseOptions } from '@vueuse/integrations';
import Fuse from 'fuse.js';
import { useGlobalState } from '@/composables/app-state';
import { useI18n } from '@/composables/i18n';
import GameIcon from '@/components/GameIcon.vue';
import { useAutoPilot } from '@/composables/auto-pilot';
import { appIconCache } from '@/services/icon-service';
import { useAppSettings } from '@/composables/settings';
import { useSound } from '@/composables/sound';

type DialogKey = 'none' | 'rpc_message_1' | 'no_game_selected';

const {
  gameDB,
  isLoadingBundled,
  isLoadingDiscord,
  isLoadingGH,
  fetchGameList,
} = useFetchGameList();

const { addLog, discordTargets, setDiscordTarget, discordClients, activeRpcClients, setActiveRpcClients } = useGlobalState();
const { t } = useI18n();

const isAnyFetching = computed(() => isLoadingGH.value || isLoadingDiscord.value || isLoadingBundled.value);

const dialogRef = useTemplateRef<HTMLDialogElement>('dialogRef');
const searchResultContainerRef = useTemplateRef<HTMLElement>('searchResultContainerRef');
const dialogMessage = ref('');
const isDialogOpen = ref(false);
const dialogKey = ref<DialogKey>('none');
const isConnectedToRPC = ref(false);
const isConnecting = ref(false);
const { skipRpcWarning, setSkipRpcWarning } = useAppSettings();
const { playClickSound } = useSound();
const dontShowRpcWarningAgain = ref(false);

// Search functionality
const searchQuery = shallowRef('');
const debouncedSearchQuery = refDebounced(searchQuery, 300);
const searchResultsIsOpen = ref(false);
const isOnSearchResults = ref(false);

// Game status
const currentlyPlaying = ref<string | null>(null);

function getSelectedDiscordTargets(): string[] {
  const list: string[] = [];
  if (discordTargets.value.stable) list.push('Stable');
  if (discordTargets.value.ptb) list.push('PTB');
  if (discordTargets.value.canary) list.push('Canary');
  if (list.length === 0) {
    return ['Stable', 'PTB', 'Canary'];
  }
  return list;
}

function getRunningDiscordTargets(): string[] {
  const list: string[] = [];
  if (discordTargets.value.stable && discordClients.value.stable) list.push('Stable');
  if (discordTargets.value.ptb && discordClients.value.ptb) list.push('PTB');
  if (discordTargets.value.canary && discordClients.value.canary) list.push('Canary');
  return list;
}

let unlistenHomeConnected: (() => void) | null = null;
let unlistenHomeDisconnect: (() => void) | null = null;

onMounted(async () => {
  try {
    unlistenHomeConnected = await listen<{ app_id?: string; active_clients?: string[] }>(
      'client_connected',
      (event) => {
        if (event.payload?.active_clients && event.payload.active_clients.length > 0) {
          const runningOnly = event.payload.active_clients.filter((c) => {
            const cl = c.toLowerCase();
            if (cl === 'stable' || cl === 'discord') return discordClients.value.stable;
            if (cl === 'ptb') return discordClients.value.ptb;
            if (cl === 'canary') return discordClients.value.canary;
            return false;
          });
          setActiveRpcClients(runningOnly);
          if (runningOnly.length > 0) {
            addLog('info', `[Discord RPC] ${t.value.rpcBroadcastingIn}: Discord ${runningOnly.join(', Discord ')}`);
          }
        }
      }
    );

    unlistenHomeDisconnect = await listen('event_disconnect', () => {
      setActiveRpcClients([]);
    });
  } catch {}
});

onUnmounted(() => {
  if (unlistenHomeConnected) unlistenHomeConnected();
  if (unlistenHomeDisconnect) unlistenHomeDisconnect();
});

onClickOutside(searchResultContainerRef, () => {
  searchResultsIsOpen.value = false;
});

const COPYRIGHT_SYMBOL = '\u00A9';
const TRADEMARK_SYMBOL = '\u2122';
const REGISTERED_SYMBOL = '\u00AE';
const ignoredSymbols = [COPYRIGHT_SYMBOL, TRADEMARK_SYMBOL, REGISTERED_SYMBOL];
const ignoredSymbolsRegex = new RegExp(`[${ignoredSymbols.join('')}]`, 'g');

const fuseOptions = computed<UseFuseOptions<Game>>(() => ({
  fuseOptions: {
    keys: [
      { name: 'name', weight: 0.7 },
      { name: 'aliases', weight: 0.2 },
      { name: 'executables.name', weight: 0.1 },
    ],
    getFn: (obj: any, path: string[] | string) => {
      const value = Fuse.config.getFn(obj, path);
      return typeof value === 'string'
        ? value.replace(ignoredSymbolsRegex, '')
        : value;
    },
    isCaseSensitive: false,
    threshold: 0.35,
    includeScore: true,
    includeMatches: false,
  },
  resultLimit: 12,
  matchAllWhenSearchEmpty: false,
}));

const { results: searchResults } = useFuse(debouncedSearchQuery, gameDB, fuseOptions);

// Discord Quest URL / ID extraction & fetching
interface QuestInfo {
  questId: string;
  game: Game;
  questName: string;
  targetSeconds: number;
  targetMinutes: number;
  publisher?: string;
  raw?: any;
}

const isFetchingQuest = ref(false);
const questFetchError = ref<string | null>(null);
const questResult = ref<QuestInfo | null>(null);

function extractDiscordQuestId(query: string): string | null {
  const trimmed = query.trim();
  if (!trimmed) return null;
  const urlMatch = trimmed.match(/(?:discord\.(?:com|gg)|discordapp\.com)\/quests\/(\d{16,21})/i);
  if (urlMatch) {
    return urlMatch[1];
  }
  if (/^\d{17,20}$/.test(trimmed)) {
    return trimmed;
  }
  return null;
}

const isQuestQuery = computed(() => !!extractDiscordQuestId(searchQuery.value));

let currentQuestFetchId = 0;

// Watch raw searchQuery immediately (0ms debounce for Quest links/IDs)
watch(searchQuery, async (newQuery) => {
  const questId = extractDiscordQuestId(newQuery);
  const fetchId = ++currentQuestFetchId;

  if (!questId) {
    questResult.value = null;
    questFetchError.value = null;
    isFetchingQuest.value = false;
    return;
  }

  isFetchingQuest.value = true;
  questFetchError.value = null;
  questResult.value = null;
  searchResultsIsOpen.value = true;

  try {
    addLog('info', `[Discord Quest] Fetching quest ID: ${questId}...`);
    const responseStr = await invoke<string>('fetch_discord_quest', { quest_id: questId });
    if (fetchId !== currentQuestFetchId) return;

    const raw = JSON.parse(responseStr);

    const appId =
      raw.application?.id ||
      raw.task_config_v2?.tasks?.PLAY_ON_DESKTOP?.applications?.[0]?.id ||
      raw.task_config_v2?.tasks?.PLAY_ON_PLAYSTATION?.applications?.[0]?.id ||
      '';
    let gameName =
      raw.application?.name ||
      raw.messages?.game_title ||
      'Discord Quest Game';
    const questName = raw.messages?.quest_name || gameName;
    const targetSeconds =
      raw.task_config_v2?.tasks?.PLAY_ON_DESKTOP?.target ||
      raw.task_config_v2?.tasks?.PLAY_ON_PLAYSTATION?.target ||
      900;
    const targetMinutes = Math.max(1, Math.round(targetSeconds / 60));
    const publisher = raw.messages?.game_publisher || '';

    // 1. Resolve official Discord Application details (Icon, Executables, Name)
    let appIconHash: string | null = null;
    let appExecutables: GameExecutable[] = [];
    let officialName: string = gameName;

    if (appId) {
      try {
        const appResStr = await invoke<string>('fetch_discord_application', { app_id: appId });
        const appData = JSON.parse(appResStr);
        if (appData.icon) {
          appIconHash = appData.icon;
        }
        if (appData.name) {
          officialName = appData.name;
        }
        if (Array.isArray(appData.executables) && appData.executables.length > 0) {
          appExecutables = appData.executables.map((exe: any) => ({
            is_launcher: exe.is_launcher ?? false,
            name: exe.name,
            filename: exe.name,
            os: exe.os || 'win32',
            is_installed: false,
          }));
        }
      } catch (appErr) {
        console.warn('Could not fetch application RPC data for', appId, appErr);
      }
    }

    // 2. Fallback to Discord Quest tile or hero asset if icon hash is not available
    let questIconUrl: string | null = null;
    if (!appIconHash && raw.assets) {
      const tile =
        (raw.assets.game_tile_dark && raw.assets.game_tile_dark !== 'PLACEHOLDER' && raw.assets.game_tile_dark) ||
        (raw.assets.game_tile_light && raw.assets.game_tile_light !== 'PLACEHOLDER' && raw.assets.game_tile_light) ||
        (raw.assets.hero && raw.assets.hero !== 'PLACEHOLDER' && raw.assets.hero) ||
        (raw.assets.quest_bar_hero && raw.assets.quest_bar_hero !== 'PLACEHOLDER' && raw.assets.quest_bar_hero);
      if (tile) {
        questIconUrl = tile.startsWith('http') ? tile : `https://cdn.discordapp.com/${tile}`;
      }
    }

    // Match with existing game in gameDB if detectable
    const matchedGame = gameDB.value.find(
      (g) => g.id === appId || g.name.toLowerCase() === gameName.toLowerCase()
    );

    let finalGame: Game;
    if (matchedGame) {
      finalGame = {
        ...matchedGame,
        quest_title: questName,
        quest_target_minutes: targetMinutes,
        icon_hash: appIconHash || matchedGame.icon_hash || null,
        icon_url: questIconUrl || matchedGame.icon_url || null,
        executables: appExecutables.length > 0 ? appExecutables : matchedGame.executables,
      };
    } else {
      finalGame = {
        id: appId,
        name: gameName,
        aliases: [gameName, officialName].filter(Boolean),
        quest_title: questName,
        quest_target_minutes: targetMinutes,
        executables: appExecutables.length > 0 ? appExecutables : [
          {
            is_launcher: false,
            name: `${gameName}.exe`,
            filename: `${gameName.replace(/[^a-zA-Z0-9_-]/g, '_')}.exe`,
            os: 'win32',
            is_installed: false,
          },
        ],
        icon_hash: appIconHash,
        icon_url: questIconUrl,
      };
    }

    // Update global icon cache so that icon is instantly available across all UI components
    if (appId) {
      appIconCache[appId] = {
        iconHash: appIconHash,
        iconUrl: questIconUrl,
        executables: appExecutables,
      };
    }

    questResult.value = {
      questId,
      game: finalGame,
      questName,
      targetSeconds,
      targetMinutes,
      publisher,
      raw,
    };

    addLog('info', `[Discord Quest] Found quest "${questName}" for game "${gameName}" (${targetMinutes}m)`);
  } catch (err: any) {
    if (fetchId !== currentQuestFetchId) return;

    // Direct Discord Application lookup fallback (if input was an App ID rather than a Quest ID)
    try {
      addLog('info', `[Discord App] Trying direct application lookup for ID: ${questId}...`);
      const appResStr = await invoke<string>('fetch_discord_application', { app_id: questId });
      if (fetchId !== currentQuestFetchId) return;
      const appData = JSON.parse(appResStr);

      if (appData && (appData.name || appData.id)) {
        const appExecs: GameExecutable[] = (appData.executables || []).map((exe: any) => ({
          is_launcher: exe.is_launcher ?? false,
          name: exe.name,
          filename: exe.name,
          os: exe.os || 'win32',
          is_installed: false,
        }));

        const appGame: Game = {
          id: appData.id || questId,
          name: appData.name || `App ${questId}`,
          aliases: [appData.name].filter(Boolean),
          executables: appExecs.length > 0 ? appExecs : [
            {
              is_launcher: false,
              name: `${appData.name || 'Game'}.exe`,
              filename: `${(appData.name || 'Game').replace(/[^a-zA-Z0-9_-]/g, '_')}.exe`,
              os: 'win32',
              is_installed: false,
            }
          ],
          icon_hash: appData.icon || null,
        };

        if (appData.icon) {
          appIconCache[appGame.id] = {
            iconHash: appData.icon,
            executables: appExecs,
          };
        }

        questResult.value = {
          questId,
          game: appGame,
          questName: appData.name || 'Discord Application',
          targetSeconds: 900,
          targetMinutes: 15,
          publisher: 'Discord Application',
          raw: appData,
        };
        addLog('info', `[Discord App] Found application "${appData.name}" (${appGame.id})`);
        return;
      }
    } catch (appLookupErr) {
      // Both quest and direct app lookup failed
    }

    console.error('Failed to fetch Discord quest:', err);
    questFetchError.value = String(err);
    addLog('error', `[Discord Quest] Error fetching quest ${questId}: ${err}`);
  } finally {
    if (fetchId === currentQuestFetchId) {
      isFetchingQuest.value = false;
    }
  }
});

// Selected games list with persistence
const savedGames = localStorage.getItem('dqc_selected_games');
let initialGames: Game[] = [];
if (savedGames) {
  try {
    initialGames = JSON.parse(savedGames);
  } catch {}
}
const gameList = ref<Game[]>(initialGames);
const selectedGameId = ref<string | null | undefined>(initialGames[0]?.uid || null);

function saveGameList() {
  localStorage.setItem('dqc_selected_games', JSON.stringify(gameList.value));
}

function isGameAlreadyAdded(gameId: string): boolean {
  return gameList.value.some((g) => g.id === gameId);
}

const selectedGame = computed(() => {
  if (!selectedGameId.value) return null;
  return gameList.value.find((g) => g.uid === selectedGameId.value) || null;
});

function closeSearchResults() {
  searchResultsIsOpen.value = false;
}
function openSearchResults() {
  searchResultsIsOpen.value = true;
}

function addGameToList(game: Game) {
  if (!isGameAlreadyAdded(game.id)) {
    const newGame: Game = {
      uid: randomString(),
      ...game,
    };
    gameList.value.push(newGame);
    saveGameList();
    if (!selectedGameId.value) {
      selectedGameId.value = newGame.uid;
    }
    addLog('info', `Added ${game.name} to list`);
  }
}

function removeGameFromList(game: Game) {
  const gameId = game.uid;
  gameList.value = gameList.value.filter((g) => g.uid !== gameId);
  saveGameList();
  if (selectedGameId.value === gameId) {
    selectedGameId.value = gameList.value[0]?.uid || null;
  }
}

// Game Reordering (Move Up / Move Down buttons)
function moveGameUp(index: number) {
  if (index > 0) {
    const item = gameList.value.splice(index, 1)[0];
    if (item) {
      gameList.value.splice(index - 1, 0, item);
      saveGameList();
      try {
        playClickSound();
      } catch {}
    }
  }
}

function moveGameDown(index: number) {
  if (index < gameList.value.length - 1) {
    const item = gameList.value.splice(index, 1)[0];
    if (item) {
      gameList.value.splice(index + 1, 0, item);
      saveGameList();
      try {
        playClickSound();
      } catch {}
    }
  }
}

// Auto-Pilot Composable Integration
const {
  isAutoPilotActive,
  autoPilotIntervalMinutes,
  currentQueueIndex,
  progressPercent,
  formattedRemainingTime,
  setIntervalMinutes,
  startAutoPilot,
  stopAutoPilot,
  skipNext
} = useAutoPilot();

function addQuestGameToList() {
  if (!questResult.value) return;
  addGameToList(questResult.value.game);
  if (questResult.value.targetMinutes) {
    setIntervalMinutes(questResult.value.targetMinutes);
    addLog('info', `[Auto-Pilot] Configured interval to ${questResult.value.targetMinutes}m from Quest`);
  }
}

async function handleStartAutoPilot() {
  if (gameList.value.length === 0) return;
  addLog('info', `[Auto-Pilot] Starting rotation for ${gameList.value.length} games (${autoPilotIntervalMinutes.value}m interval)...`);

  await startAutoPilot(gameList.value, async (game: Game) => {
    selectedGameId.value = game.uid || null;
    try {
      emit('event_disconnect');
      await invoke('connect_to_discord_rpc_3', {
        activity_json: JSON.stringify({
          app_id: game.id,
          details: game.quest_title || `Playing ${game.name}`,
          state: 'In Game',
          timestamp: Math.floor(Date.now() / 1000),
          activity_kind: 0,
        }),
        action: 'connect',
        target_clients: getSelectedDiscordTargets(),
      });
      isConnectedToRPC.value = true;
      currentlyPlaying.value = game.name;
      gameList.value.forEach((g) => {
        g.is_running = g.uid === game.uid;
      });
      addLog('info', `[Auto-Pilot] Active game: ${game.name} (${game.id})`);
    } catch (err) {
      addLog('error', `[Auto-Pilot] Failed to connect RPC for ${game.name}: ${err}`);
    }
  });
}

async function handleStopAutoPilot() {
  await stopAutoPilot(async () => {
    emit('event_disconnect');
    setActiveRpcClients([]);
    isConnectedToRPC.value = false;
    currentlyPlaying.value = null;
    gameList.value.forEach((g) => {
      g.is_running = false;
    });
    addLog('info', '[Auto-Pilot] Stopped');
  });
}

async function handleSkipAutoPilot() {
  await skipNext(gameList.value, async (game: Game) => {
    selectedGameId.value = game.uid || null;
    try {
      emit('event_disconnect');
      await invoke('connect_to_discord_rpc_3', {
        activity_json: JSON.stringify({
          app_id: game.id,
          details: game.quest_title || `Playing ${game.name}`,
          state: 'In Game',
          timestamp: Math.floor(Date.now() / 1000),
          activity_kind: 0,
        }),
        action: 'connect',
        target_clients: getSelectedDiscordTargets(),
      });
      isConnectedToRPC.value = true;
      currentlyPlaying.value = game.name;
      gameList.value.forEach((g) => {
        g.is_running = g.uid === game.uid;
      });
      addLog('info', `[Auto-Pilot] Skipped to ${game.name} (${game.id})`);
    } catch (err) {
      addLog('error', `[Auto-Pilot] Failed to connect RPC: ${err}`);
    }
  });
}

function selectGame(game: Game) {
  selectedGameId.value = game?.uid;
  searchResultsIsOpen.value = false;
}

function canPlayGame(game: Game | null) {
  if (!game) return false;
  return (game.is_installed && !game.is_running) ?? false;
}

function isExecutableRunning(executable: GameExecutable) {
  return executable.is_running ?? false;
}

function isGameExecutableInstalled(executable: GameExecutable) {
  return executable.is_installed ?? false;
}

function isGameInstalled(game: Game | null) {
  if (!game) return false;
  return game.is_installed ?? false;
}

async function createDummyGame(game: Game | null, executable: GameExecutable) {
  if (!game) return false;
  const gameUid = game.uid;
  const gameToInstall = gameList.value.find((g) => g.uid === gameUid);
  const executableItem = gameToInstall?.executables.find((exe) => exe.name === executable.name);
  if (gameToInstall && executableItem) {
    const payload = {
      path: executable.path,
      executable_name: executable.filename,
      path_len: executable.segments,
      app_id: Number(gameToInstall.id),
      display_name: gameToInstall.name,
    };
    await invoke('create_fake_game', payload);
    gameToInstall.is_installed = true;
    executableItem.is_installed = true;
    return true;
  }
  return false;
}

async function installAndPlay({ game, executable }: { game: Game; executable: GameExecutable }) {
  if (!game) return;
  try {
    const gameCreated = await createDummyGame(game, executable);
    if (gameCreated) {
      addLog('info', `[Setup] Prepared dummy game executable for ${game.name}`);
    }
  } catch (err) {
    console.warn('Dummy game setup note:', err);
  }
  await playGame({ game, executable });
}

async function playGame({ game, executable }: { game: Game; executable: GameExecutable }) {
  if (!game) return;
  const gameUid = game.uid;
  try {
    addLog('info', `Playing game: ${game.name}`);
    currentlyPlaying.value = game.name;
    const gameToPlay = gameList.value.find((g) => g.uid === gameUid);
    const executableItem = gameToPlay?.executables.find((exe) => exe.name === executable.name);

    // 1. Directly connect Discord Rich Presence (RPC) via IPC pipe so Discord status displays immediately
    try {
      const connected = await invoke<string[]>('connect_to_discord_rpc_3', {
        activity_json: JSON.stringify({
          app_id: game.id,
          details: game.quest_title || `Playing ${game.name}`,
          state: 'In Game',
          timestamp: Math.floor(Date.now() / 1000),
          activity_kind: 0,
        }),
        action: 'connect',
        target_clients: getRunningDiscordTargets(),
      });
      isConnectedToRPC.value = true;
      if (connected && connected.length > 0) {
        setActiveRpcClients(connected);
      } else {
        setActiveRpcClients(getRunningDiscordTargets());
      }
      addLog('info', `[Discord RPC] Connected Rich Presence for ${game.name} (${game.id})`);
    } catch (rpcErr) {
      console.warn('Discord RPC connection warning:', rpcErr);
      addLog('warning', `[Discord RPC] Connection warning: ${rpcErr}`);
    }

    // 2. Launch background dummy game process for Windows game detection
    if (gameToPlay && executableItem) {
      const payload = {
        name: game.name,
        path: executable.path,
        executable_name: executable.filename,
        path_len: executable.segments,
        app_id: Number(gameToPlay.id),
      };
      try {
        await invoke('run_background_process', payload);
        gameToPlay.is_running = true;
        executableItem.is_running = true;
        addLog('info', `[Process] Started background runner: ${executable.filename || game.name}`);
      } catch (procErr) {
        console.error('Failed to launch game process:', procErr);
        addLog('warning', `[Process] Process runner note: ${procErr}`);
        gameToPlay.is_running = true;
        executableItem.is_running = true;
      }
    }
  } catch (error) {
    console.error('Failed to launch game:', error);
    addLog('error', `Failed to launch game: ${error}`);
  }
}

async function stopPlaying({ game, executable }: { game: Game; executable: GameExecutable }) {
  if (!game) return;
  const gameUid = game.uid;
  currentlyPlaying.value = null;

  // 1. Disconnect Discord RPC
  try {
    emit('event_disconnect');
    setActiveRpcClients([]);
    isConnectedToRPC.value = false;
    addLog('info', `[Discord RPC] Disconnected Rich Presence for ${game.name}`);
  } catch (rpcErr) {
    console.warn('Error disconnecting RPC:', rpcErr);
  }

  // 2. Terminate running background game process
  const gameToPlay = gameList.value.find((g) => g.uid === gameUid);
  const executableItem = gameToPlay?.executables.find((exe) => exe.name === executable.name);
  if (gameToPlay && executableItem) {
    try {
      if (executable.filename) {
        await invoke('stop_process', {
          exec_name: executable.filename,
        });
        addLog('info', `[Process] Stopped game process: ${executable.filename}`);
      }
    } catch (error) {
      addLog('error', `Failed to stop game process: ${error}`);
    } finally {
      gameToPlay.is_running = false;
      executableItem.is_running = false;
    }
  }
}

async function handleTestRPC(game: Game | null) {
  const state = isConnectedToRPC.value ? 'disconnect' : 'connect';

  if (!game && state === 'connect') {
    showDialog('no_game_selected');
    return;
  }
  if (state === 'disconnect' || isConnecting.value) {
    emit('event_disconnect');
    setActiveRpcClients([]);
    isConnectedToRPC.value = false;
    if (game) {
      game.is_running = false;
      game.executables.forEach((e) => {
        if (e.filename && e.is_running) {
          invoke('stop_process', { exec_name: e.filename }).catch(() => {});
        }
        e.is_running = false;
      });
    }
    currentlyPlaying.value = null;
    isConnecting.value = false;
    addLog('info', '[Discord RPC] Disconnected from Discord Gateway');
    return;
  }
  showDialog('rpc_message_1');
}

async function continueRPCRisk(game: Game | null) {
  if (!game) return;
  const gameUid = game.uid;
  const gameToTest = gameList.value.find((g) => g.uid === gameUid);
  if (gameToTest) {
    isConnecting.value = true;
    try {
      const connected = await invoke<string[]>('connect_to_discord_rpc_3', {
        activity_json: JSON.stringify({
          app_id: gameToTest.id,
          details: gameToTest.quest_title || `Playing ${gameToTest.name}`,
          state: 'In Game',
          timestamp: Math.floor(Date.now() / 1000),
          activity_kind: 0,
        }),
        action: 'connect',
        target_clients: getRunningDiscordTargets(),
      });
      isConnectedToRPC.value = true;
      if (connected && connected.length > 0) {
        setActiveRpcClients(connected);
      } else {
        setActiveRpcClients(getRunningDiscordTargets());
      }
      gameToTest.is_running = true;
      currentlyPlaying.value = gameToTest.name;
      isConnecting.value = false;
      addLog('info', `[Discord RPC] Connected to Discord Gateway with ${gameToTest.name} (${gameToTest.id})`);
    } catch (err) {
      addLog('error', `RPC Connection error: ${err}`);
      isConnecting.value = false;
    }

    hideDialog();
  }
}

function handleSearchBlur() {
  setTimeout(() => {
    if (!isOnSearchResults.value) {
      searchResultsIsOpen.value = false;
    }
  }, 200);
}

const pendingPlayPayload = ref<{ game: Game; executable: GameExecutable; isInstall?: boolean } | null>(null);

function handlePlayClick(payload: { game: Game; executable: GameExecutable }, isInstall = false) {
  pendingPlayPayload.value = { ...payload, isInstall };
  showDialog('rpc_message_1');
}

async function onAcceptRisk() {
  if (dontShowRpcWarningAgain.value) {
    setSkipRpcWarning(true);
  }
  if (pendingPlayPayload.value) {
    const { game, executable, isInstall } = pendingPlayPayload.value;
    pendingPlayPayload.value = null;
    hideDialog();
    if (isInstall) {
      await installAndPlay({ game, executable });
    } else {
      await playGame({ game, executable });
    }
  } else {
    hideDialog();
    if (selectedGame.value) {
      await continueRPCRisk(selectedGame.value);
    }
  }
}

function showDialog(message: DialogKey) {
  if (message === 'rpc_message_1' && skipRpcWarning.value) {
    onAcceptRisk();
    return;
  }
  isDialogOpen.value = true;
  dialogMessage.value = message;
  dialogKey.value = message;
  dontShowRpcWarningAgain.value = false;
  if (!isEmpty(message)) {
    dialogRef.value?.showModal();
  }
}

function hideDialog() {
  dialogRef.value?.close();
  dialogMessage.value = '';
  dialogKey.value = 'none';
  pendingPlayPayload.value = null;
  isDialogOpen.value = false;
}

provide<GameActionsProvider>(GameActionsKey, {
  canPlayGame,
  isGameInstalled,
  isExecutableRunning,
  isGameExecutableInstalled,
});
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-6 animate-fadeIn">
    <!-- Center Dialog for Warnings -->
    <dialog
      id="dialog"
      class="dialogStyle bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl p-6 max-w-md w-full backdrop:bg-black/50 backdrop:backdrop-blur-xs select-none"
      style="position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%); margin: 0; user-select: none; -webkit-user-select: none;"
      ref="dialogRef"
    >
      <div class="flex flex-col items-center text-center select-none" style="user-select: none; -webkit-user-select: none;">
        <div class="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-500 flex items-center justify-center mb-4 select-none">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <div class="mb-5 text-sm text-slate-600 dark:text-slate-300 select-none" style="user-select: none; -webkit-user-select: none;">
          <div v-if="dialogKey === 'rpc_message_1'" class="space-y-2 text-left select-none">
            <h3 class="font-bold text-base text-slate-900 dark:text-white text-center select-none">
              {{ t.dialogRpcWarningTitle }}
            </h3>
            <p class="select-none">{{ t.dialogRpcWarningDesc1 }}</p>
            <p class="text-xs text-slate-500 dark:text-slate-400 select-none">
              {{ t.dialogRpcWarningDesc2 }}
            </p>
            <p class="font-medium text-amber-600 dark:text-amber-400 select-none">
              {{ t.dialogRpcWarningDesc3 }}
            </p>

            <!-- Don't Show Again Checkbox -->
            <label class="flex items-center gap-2.5 cursor-pointer mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 select-none">
              <input
                type="checkbox"
                v-model="dontShowRpcWarningAgain"
                class="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-amber-500 focus:ring-amber-400 dark:bg-slate-700 cursor-pointer accent-amber-500"
              />
              <span class="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300">
                {{ t.dontShowAgain }}
              </span>
            </label>
          </div>

          <div v-if="dialogKey === 'no_game_selected'" class="select-none">
            <p class="font-medium select-none">{{ t.noGameSelectedMsg }}</p>
          </div>
        </div>

        <div class="flex gap-3 w-full justify-end">
          <button
            class="px-4 py-2 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer"
            @click="hideDialog()"
          >
            {{ dialogKey === 'rpc_message_1' ? t.cancel : t.ok }}
          </button>

          <button
            v-if="dialogKey === 'rpc_message_1'"
            class="px-4 py-2 text-xs font-medium bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-xs transition-all cursor-pointer"
            @click="onAcceptRisk"
          >
            {{ t.acceptRisk }}
          </button>
        </div>
      </div>
    </dialog>

    <!-- 1. Top Hero Banner Card: Completely Clean, Solid White/Dark, Zero Gradient Layers -->
    <div class="rounded-3xl bg-white dark:bg-[#141A26] border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-xs">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div class="flex items-center gap-5">
          <!-- Controller Icon Box: Solid Clean Discord Blurple -->
          <div class="w-14 h-14 rounded-2xl bg-[#5865F2] text-white flex items-center justify-center p-3 shrink-0 shadow-xs">
            <IconDiscord />
          </div>

          <div>
            <div class="flex items-center gap-2.5 flex-wrap">
              <h1 class="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {{ t.heroTitle }}
              </h1>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#5865F2]/10 dark:bg-[#5865F2]/20 text-[#5865F2] dark:text-[#A5AFFA] border border-[#5865F2]/20 flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-[#5865F2]"></span>
                Active Engine
              </span>
            </div>
            <p class="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 font-normal">
              {{ t.heroSubtitle }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. Search Bar Card: Clean White with Solid Button -->
    <div class="relative" ref="searchResultContainerRef">
      <div class="flex items-center gap-3 bg-white dark:bg-[#141A26] rounded-2xl px-4 py-2.5 shadow-xs border border-slate-200 dark:border-slate-800 transition-all focus-within:border-[#5865F2] focus-within:ring-2 focus-within:ring-[#5865F2]/20">
        <!-- Search SVG Icon -->
        <svg class="w-5 h-5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>

        <input
          v-model="searchQuery"
          type="text"
          :placeholder="t.searchPlaceholder"
          class="flex-1 bg-transparent border-0 outline-none text-sm text-slate-900 dark:text-white placeholder:text-slate-400 font-normal"
          @focus="openSearchResults"
          @blur="handleSearchBlur"
        />

        <!-- Loading spinner if fetching Quest -->
        <div v-if="isFetchingQuest || (isQuestQuery && !questResult && !questFetchError)" class="shrink-0 flex items-center gap-1.5 text-xs text-[#5865F2] font-semibold animate-pulse">
          <svg class="w-4 h-4 animate-spin text-[#5865F2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span class="hidden sm:inline">{{ t.fetchingQuest }}</span>
        </div>

        <!-- Refresh Game List Button: Solid Clean Discord Blurple -->
        <button
          @click="fetchGameList()"
          :disabled="isAnyFetching"
          class="shrink-0 px-4 py-2 rounded-xl text-xs font-medium text-white bg-[#5865F2] hover:bg-[#4752C4] active:bg-[#3C45A5] transition-colors flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-60 select-none"
        >
          <svg
            class="w-3.5 h-3.5"
            :class="{ 'animate-spin': isAnyFetching }"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>{{ isAnyFetching ? t.refreshing : t.refreshGameList }}</span>
        </button>
      </div>

      <!-- Search Results Dropdown -->
      <Transition
        enter-active-class="transition-all duration-150 ease-out"
        enter-from-class="opacity-0 translate-y-1"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-all duration-100 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-1"
      >
        <div
          v-if="searchResultsIsOpen"
          @click="isOnSearchResults = true"
          class="absolute z-50 mt-2 w-full bg-white dark:bg-[#141A26] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800"
        >
          <!-- 1. Quest Loading State -->
          <div v-if="isFetchingQuest || (isQuestQuery && !questResult && !questFetchError)" class="p-6 flex items-center justify-center gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <svg class="w-5 h-5 animate-spin text-[#5865F2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{{ t.fetchingQuest }}</span>
          </div>

          <!-- 2. Quest Error State -->
          <div v-else-if="questFetchError" class="p-4 text-center bg-rose-50/50 dark:bg-rose-950/20 text-rose-500">
            <div class="text-xs font-bold mb-0.5">{{ t.questNotFound }}</div>
            <div class="text-[11px] text-slate-400 font-mono">{{ questFetchError }}</div>
          </div>

          <!-- 3. Discord Quest Item -->
          <div v-if="questResult" class="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between gap-3.5 transition-colors border-b border-slate-100 dark:border-slate-800">
            <!-- Game Icon -->
            <GameIcon :game="questResult.game" size="md" />

            <div class="min-w-0 flex-1">
              <div class="font-semibold text-sm text-slate-900 dark:text-white truncate">
                {{ questResult.game.name }}
              </div>
              <div class="text-xs text-slate-400 mt-0.5 font-mono flex items-center gap-2">
                <span class="text-[#5865F2] font-semibold">{{ t.id }}: {{ questResult.game.id }}</span>
                <span v-if="questResult.publisher" class="text-slate-300 dark:text-slate-600">&middot;</span>
                <span v-if="questResult.publisher" class="truncate text-slate-500 dark:text-slate-400 font-sans">
                  {{ questResult.publisher }}
                </span>
              </div>
            </div>

            <!-- Add Quest Game Button -->
            <button
              @stop.prevent
              @click.stop="addQuestGameToList"
              :disabled="isGameAlreadyAdded(questResult.game.id)"
              class="shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs select-none"
              :class="[
                isGameAlreadyAdded(questResult.game.id)
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 cursor-default'
                  : 'bg-[#5865F2] hover:bg-[#4752C4] active:bg-[#3C45A5] text-white cursor-pointer'
              ]"
            >
              <svg v-if="isGameAlreadyAdded(questResult.game.id)" class="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
              </svg>
              <svg v-else class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>{{ isGameAlreadyAdded(questResult.game.id) ? t.gameAdded : t.addGameToList }}</span>
            </button>
          </div>

          <!-- 4. Standard Search Results -->
          <div v-if="!isQuestQuery && searchResults.length > 0">
            <div
              v-for="game in searchResults"
              :key="game.item.id"
              class="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between gap-3.5 transition-colors"
            >
              <!-- Game Icon from Discord CDN -->
              <GameIcon :game="game.item" size="md" />

              <div class="min-w-0 flex-1">
                <div class="font-semibold text-sm text-slate-900 dark:text-white truncate">
                  {{ game.item.name }}
                </div>
                <div class="text-xs text-slate-400 mt-0.5 font-mono flex items-center gap-2">
                  <span class="text-[#5865F2] font-semibold">{{ t.id }}: {{ game.item.id }}</span>
                  <span v-if="game.item.themes && game.item.themes.length > 0" class="text-slate-300 dark:text-slate-600">&middot;</span>
                  <span v-if="game.item.themes && game.item.themes.length > 0" class="truncate text-slate-500 dark:text-slate-400 font-sans">
                    {{ game.item.themes.slice(0, 2).join(', ') }}
                  </span>
                </div>
              </div>

              <!-- Add Game Button: Solid & Clean -->
              <button
                @stop.prevent
                @click.stop="addGameToList(game.item)"
                :disabled="isGameAlreadyAdded(game.item.id)"
                class="shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs select-none"
                :class="[
                  isGameAlreadyAdded(game.item.id)
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 cursor-default'
                    : 'bg-[#5865F2] hover:bg-[#4752C4] active:bg-[#3C45A5] text-white cursor-pointer'
                ]"
              >
                <svg v-if="isGameAlreadyAdded(game.item.id)" class="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                </svg>
                <svg v-else class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                <span>{{ isGameAlreadyAdded(game.item.id) ? t.gameAdded : t.addGameToList }}</span>
              </button>
            </div>
          </div>

          <div v-else-if="searchQuery && !isQuestQuery && !questResult && !isFetchingQuest && !questFetchError" class="p-6 text-center text-xs text-slate-400">
            {{ t.searchResultHelp }}
          </div>
        </div>
      </Transition>
    </div>

    <!-- 3. Auto-Pilot Queue & Rotation Panel: Clean, Solid Surface -->
    <div
      v-if="gameList.length > 0"
      class="bg-white dark:bg-[#141A26] rounded-3xl p-5 shadow-xs border border-slate-200 dark:border-slate-800 transition-all"
    >
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <!-- Header Info -->
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-[#5865F2]/10 dark:bg-[#5865F2]/20 text-[#5865F2] dark:text-[#A5AFFA] flex items-center justify-center shrink-0">
            <!-- Lightning Icon -->
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-sm font-bold text-slate-900 dark:text-white">
                {{ t.autoPilotTitle }}
              </h3>
              <span
                v-if="isAutoPilotActive"
                class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white"
              >
                ACTIVE
              </span>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
              {{ t.autoPilotDesc }}
            </p>
          </div>
        </div>

        <!-- Interval Controls & Action Buttons -->
        <div class="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <!-- Interval selector pills -->
          <div class="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              v-for="mins in [5, 10, 15, 20]"
              :key="mins"
              type="button"
              :disabled="isAutoPilotActive"
              @click="setIntervalMinutes(mins)"
              class="px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer select-none"
              :class="[
                autoPilotIntervalMinutes === mins
                  ? 'bg-[#5865F2] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700',
                isAutoPilotActive ? 'opacity-50 cursor-not-allowed' : ''
              ]"
            >
              {{ mins }}m
            </button>
          </div>

          <!-- Start / Stop Button: Solid Clean Color -->
          <button
            v-if="!isAutoPilotActive"
            type="button"
            @click="handleStartAutoPilot"
            class="px-4 py-2 rounded-xl text-xs font-medium text-white bg-[#5865F2] hover:bg-[#4752C4] active:bg-[#3C45A5] transition-colors flex items-center gap-2 shadow-xs cursor-pointer select-none"
          >
            <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            <span>{{ t.startAutoPilot }}</span>
          </button>

          <div v-else class="flex items-center gap-2">
            <!-- Skip to Next Game Button -->
            <button
              type="button"
              @click="handleSkipAutoPilot"
              class="px-3 py-2 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer select-none"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
              <span>{{ t.skipGame }}</span>
            </button>

            <!-- Stop Button -->
            <button
              type="button"
              @click="handleStopAutoPilot"
              class="px-4 py-2 rounded-xl text-xs font-medium text-white bg-rose-500 hover:bg-rose-600 active:bg-rose-700 transition-colors flex items-center gap-2 shadow-xs cursor-pointer select-none"
            >
              <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
              <span>{{ t.stopAutoPilot }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Active Countdown & Progress Bar (when Auto-Pilot is Running) -->
      <div v-if="isAutoPilotActive" class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
        <div class="flex items-center justify-between text-xs">
          <div class="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium truncate">
            <span class="text-[#5865F2] font-semibold">
              Game {{ currentQueueIndex + 1 }} of {{ gameList.length }}:
            </span>
            <span class="truncate font-semibold text-slate-900 dark:text-white">
              {{ gameList[currentQueueIndex]?.name }}
            </span>
          </div>
          <div class="font-mono font-semibold text-[#5865F2] shrink-0">
            {{ formattedRemainingTime }} {{ t.timeRemaining }}
          </div>
        </div>

        <!-- Progress Bar: Solid Clean Blurple -->
        <div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
          <div
            class="bg-[#5865F2] h-2 rounded-full transition-all duration-1000 ease-linear"
            :style="{ width: `${progressPercent}%` }"
          ></div>
        </div>
      </div>
    </div>

    <!-- 4. Two-Column Grid: Clean White Cards with Solid Accents -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
      <!-- Left Column: Games Card -->
      <div class="bg-white dark:bg-[#141A26] rounded-3xl p-6 shadow-xs border border-slate-200 dark:border-slate-800 flex flex-col h-fit">
        <!-- Header -->
        <div class="flex items-start justify-between gap-3 mb-4">
          <div class="flex items-start gap-3">
            <div class="p-2 rounded-xl bg-[#5865F2]/10 dark:bg-[#5865F2]/20 text-[#5865F2] dark:text-[#A5AFFA] shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v2a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v2a1 1 0 01-1 1h-3a1 1 0 00-1 1v1a2 2 0 11-4 0v-1a1 1 0 00-1-1H7a1 1 0 01-1-1v-2a1 1 0 011-1h1a2 2 0 100-4H7a1 1 0 01-1-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
              </svg>
            </div>
            <div>
              <h2 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {{ t.gamesTitle }}
                <span v-if="gameList.length > 0" class="text-xs px-2 py-0.5 rounded-full font-mono font-semibold bg-[#5865F2]/10 dark:bg-[#5865F2]/20 text-[#5865F2] dark:text-[#A5AFFA]">
                  {{ gameList.length }}
                </span>
              </h2>
              <p class="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-normal">
                {{ t.noGamesSelectedSubtitle }}
              </p>
            </div>
          </div>
        </div>

        <!-- Empty State with IconDiscord -->
        <div
          v-if="gameList.length === 0"
          class="flex flex-col items-center justify-center text-center p-6 py-10"
        >
          <div class="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3.5 p-3.5">
            <IconDiscord />
          </div>
          <h3 class="font-bold text-sm text-slate-800 dark:text-slate-200">
            {{ t.noGamesYet }}
          </h3>
          <p class="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs leading-relaxed">
            {{ t.noGamesYetDesc }}
          </p>
        </div>

        <!-- Selected Games List (Clean Solid Cards with Reorder Controls) -->
        <div v-else class="space-y-2.5 overflow-y-auto max-h-[520px] pr-1">
          <div
            v-for="(game, index) in gameList"
            :key="game.uid"
            @click="selectGame(game)"
            class="p-3.5 rounded-2xl border transition-colors cursor-pointer flex items-center gap-3 group relative select-none"
            :class="[
              selectedGame?.uid === game.uid
                ? 'border-2 border-[#5865F2] bg-[#5865F2]/5 dark:bg-[#5865F2]/15 shadow-xs'
                : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#141A26] hover:bg-slate-50 dark:hover:bg-slate-800/60'
            ]"
          >
            <!-- Game Icon from Discord CDN -->
            <GameIcon :game="game" size="md" />

            <!-- Game Info -->
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-1.5">
                <span class="font-bold text-sm text-slate-900 dark:text-white truncate">
                  {{ game.name }}
                </span>
                <IconVerified class="w-4 h-4 text-[#5865F2] shrink-0" />
              </div>

              <!-- Quest Badge if added from Discord Quest -->
              <div v-if="game.quest_title" class="flex items-center gap-1.5 mt-0.5">
                <span class="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-[#5865F2]/10 dark:bg-[#5865F2]/20 text-[#5865F2] dark:text-[#A5AFFA] truncate max-w-[180px]">
                  {{ game.quest_title }}
                </span>
                <span v-if="game.quest_target_minutes" class="text-[10px] font-mono font-semibold text-slate-400">
                  {{ game.quest_target_minutes }}m
                </span>
              </div>

              <!-- Running indicator or Auto-Pilot live badge -->
              <div v-if="game.is_running || (isAutoPilotActive && currentQueueIndex === index)" class="flex items-center gap-1.5 mt-1">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span class="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  {{ isAutoPilotActive && currentQueueIndex === index ? `${t.autoPilotRunningOn} ${formattedRemainingTime}` : t.running }}
                </span>
              </div>
            </div>

            <!-- Right Actions: Move Up / Down Buttons + Remove Button -->
            <div class="shrink-0 flex items-center gap-1.5 select-none">
              <!-- Move Up Button -->
              <button
                type="button"
                @click.stop="moveGameUp(index)"
                :disabled="index === 0"
                :title="t.reorderUp"
                class="w-7 h-7 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-20 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 15l7-7 7 7" />
                </svg>
              </button>

              <!-- Move Down Button -->
              <button
                type="button"
                @click.stop="moveGameDown(index)"
                :disabled="index === gameList.length - 1"
                :title="t.reorderDown"
                class="w-7 h-7 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-20 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <!-- Clean Solid Remove Button -->
              <button
                type="button"
                @click.stop="removeGameFromList(game)"
                :title="t.remove"
                class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-500 hover:text-white border border-rose-200 dark:border-rose-900/60 transition-colors cursor-pointer group/remove select-none"
              >
                <svg class="w-3.5 h-3.5 transition-transform duration-150 group-hover/remove:scale-110 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>{{ t.remove }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Game Actions Card -->
      <div class="bg-white dark:bg-[#141A26] rounded-3xl p-6 shadow-xs border border-slate-200 dark:border-slate-800 flex flex-col h-fit">
        <!-- Header -->
        <div class="flex items-start gap-3 mb-4">
          <div class="p-2 rounded-xl bg-[#5865F2]/10 dark:bg-[#5865F2]/20 text-[#5865F2] dark:text-[#A5AFFA] shrink-0">
            <!-- Zap / Lightning SVG Icon -->
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h2 class="text-base font-bold text-slate-900 dark:text-white">
              {{ t.gameActionsTitle }}
            </h2>
            <p class="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-normal">
              {{ t.selectGamePrompt }}
            </p>
          </div>
        </div>

        <div class="space-y-4 flex-1 flex flex-col">
          <!-- Executable Launchers -->
          <div v-if="selectedGame">
            <GameExecutables
              :game="selectedGame"
              @play="(payload) => handlePlayClick(payload, false)"
              @stop="stopPlaying"
              @install_and_play="(payload) => handlePlayClick(payload, true)"
            />
          </div>

          <!-- Status Card: Clean, Solid Surface -->
          <div class="mt-auto pt-4">
            <div class="rounded-2xl p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
              <div class="flex items-center gap-2">
                <span
                  class="w-2.5 h-2.5 rounded-full"
                  :class="currentlyPlaying ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-600'"
                ></span>
                <span class="text-xs font-bold text-slate-800 dark:text-slate-100">
                  {{ t.statusTitle }}
                </span>
              </div>

              <p class="text-xs text-slate-400 dark:text-slate-500">
                {{ t.statusHint }}
              </p>

              <div class="flex items-center gap-2 pt-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span v-if="currentlyPlaying" class="text-emerald-600 dark:text-emerald-400 font-semibold">
                  {{ t.currentlyPlaying }} {{ currentlyPlaying }}
                </span>
                <span v-else>
                  {{ t.notPlaying }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
dialog, .dialogStyle, #dialog, #dialog * {
  user-select: none !important;
  -webkit-user-select: none !important;
}

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