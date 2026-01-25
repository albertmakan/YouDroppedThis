import { createRouter, createWebHistory } from 'vue-router'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'
import '@/style.css'
import IndexPage from '@/components/LandingPage/IndexPage.vue'
import CanvasPage from '@/components/Canvas/CanvasPage.vue'
import CanvasCreationForm from '@/components/Canvas/CanvasCreationForm.vue'
import SettingsView from '@/components/User/Settings/SettingsView.vue'
import NowPage from './components/LandingPage/NowPage.vue'
import App from '@/App.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: IndexPage },
    { path: '/c/:id', name: 'canvas', component: CanvasPage },
    { path: '/settings/:tab', name: 'settings', component: SettingsView },
    { path: '/new', name: 'new', component: CanvasCreationForm },
    { path: '/now', name: 'now', component: NowPage },
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
