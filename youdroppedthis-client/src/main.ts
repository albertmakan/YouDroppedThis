import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './style.css'

import CanvasView from '@/components/Canvas/CanvasView.vue'
import SettingsView from './components/User/Settings/SettingsView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: CanvasView },
    { path: '/c/:id', name: 'canvas', component: CanvasView },
    { path: '/settings/:tab', name: 'settings', component: SettingsView },
  ],
})

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
