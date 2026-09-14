import { createGlobalState } from '@vueuse/core'
import { computed, ComputedRef, Ref, ShallowRef, shallowRef } from 'vue'

export const Pages = {
    HOME: 'home',
    PLAYGROUND: 'playground',
    SETTINGS: 'settings',
} as const
export type Pages = typeof Pages[keyof typeof Pages]
export interface AppLogObject {
    type: 'info' | 'error' | 'warning' | 'debug';
    message: string;
    timestamp: Date;
}
export interface DiscordTargets {
    stable: boolean;
    ptb: boolean;
    canary: boolean;
}

export interface DiscordClientsStatus {
    stable: boolean;
    ptb: boolean;
    canary: boolean;
}

export interface UseGlobalStateReturn {
    page: ShallowRef<Pages>,
    count: ShallowRef<number>,
    doubleCount: ComputedRef<number>,
    setPage: (newPage: Pages) => void,
    increment: () => void,
    logs: ShallowRef<AppLogObject[]>,
    addLog: {
        (type: 'info' | 'error' | 'warning' | 'debug', newLog: string): void;
        (newLog: string): void;
    };
    clearLogs: () => void,
    discordTargets: ShallowRef<DiscordTargets>,
    setDiscordTarget: (client: 'stable' | 'ptb' | 'canary', value: boolean) => void,
    discordClients: ShallowRef<DiscordClientsStatus>,
    setDiscordClients: (status: DiscordClientsStatus) => void,
    activeRpcClients: ShallowRef<string[]>,
    setActiveRpcClients: (clients: string[]) => void,
}
export const useGlobalState = createGlobalState(
  () => {
    // state
    const page = shallowRef<Pages>(Pages.HOME)

    const logs = shallowRef<AppLogObject[]>([])

    const count = shallowRef(0)

    const discordTargets = shallowRef<DiscordTargets>({
      stable: true,
      ptb: true,
      canary: true,
    })

    const discordClients = shallowRef<DiscordClientsStatus>({
      stable: false,
      ptb: false,
      canary: false,
    })

    const activeRpcClients = shallowRef<string[]>([])

    // getters
    const doubleCount = computed(() => count.value * 2)

    // actions
    function increment() {
      count.value++
    }

    function setPage(newPage: Pages) {
      page.value = newPage
    }

    function setDiscordTarget(client: 'stable' | 'ptb' | 'canary', value: boolean) {
      discordTargets.value = {
        ...discordTargets.value,
        [client]: value,
      }
    }

    function setDiscordClients(status: DiscordClientsStatus) {
      discordClients.value = status;
    }

    function setActiveRpcClients(clients: string[]) {
      activeRpcClients.value = clients
    }

    function addLog(type: string | 'info' | 'error' | 'warning' | 'debug' , newLog?: string) {
      if (!newLog) {
        newLog = type;
        type = 'info';
      }
      const formattedLog = `${newLog}`;
      logs.value = [
        ...logs.value,
        { type: type as 'info' | 'error' | 'warning' | 'debug', message: formattedLog, timestamp: new Date() }
      ];
    }

    function clearLogs() {
      logs.value = []
    }

    return {
        page,
        count, 
        doubleCount,
        setPage, 
        increment,
        logs,
        addLog,
        clearLogs,
        discordTargets,
        setDiscordTarget,
        discordClients,
        setDiscordClients,
        activeRpcClients,
        setActiveRpcClients,
    } as UseGlobalStateReturn
  }
)

