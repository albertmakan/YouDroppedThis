import { createRouter, createWebHistory } from 'vue-router'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'
import './style.css'
import CanvasPage from './components/Canvas/CanvasPage.vue'
import SettingsView from './components/User/Settings/SettingsView.vue'
import App from './App.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: CanvasPage },
    { path: '/c/:id', name: 'canvas', component: CanvasPage },
    { path: '/settings/:tab', name: 'settings', component: SettingsView },
  ],
})

const app = createApp(App)
app.use(createPinia())
app.use(VueQueryPlugin, {
  queryClientConfig: {
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  },
})
app.use(router)
app.mount('#app')
