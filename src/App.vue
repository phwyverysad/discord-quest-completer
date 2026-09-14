<script setup lang="ts">
import { onMounted } from 'vue';
import { getCurrentWindow } from '@tauri-apps/api/window';
import MainLayout from './components/MainLayout.vue';
import { Pages, useGlobalState } from './composables/app-state';
import { useSound } from './composables/sound';
import HomeView from './pages/HomeView.vue';
import Playground from './pages/Playground.vue';
import SettingsView from './pages/SettingsView.vue';

const appState = useGlobalState();
const { page } = appState;
useSound();

onMounted(async () => {
  try {
    const win = getCurrentWindow();
    const isMax = await win.isMaximized();
    if (!isMax) {
      await win.maximize();
    }
  } catch {}
});
</script>

<template>
  <MainLayout>
    <HomeView v-show="page === Pages.HOME"/>
    <Playground v-show="page === Pages.PLAYGROUND"/>
    <SettingsView v-show="page === Pages.SETTINGS"/>
  </MainLayout>
</template>

<style>
/* Global styles are managed by Tailwind CSS */
</style>