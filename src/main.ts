import { createApp } from "vue";
import '@/theme/style.css'
import App from "./App.vue";

// Disable classic browser context menu across the entire app
window.addEventListener('contextmenu', (e) => {
  e.preventDefault();
});

createApp(App).mount("#app");
