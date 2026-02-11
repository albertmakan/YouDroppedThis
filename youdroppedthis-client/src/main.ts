import { createMemoryHistory, createRouter, createWebHistory } from 'vue-router'
import { createApp, createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'
import '@/style.css'
import IndexPage from '@/components/LandingPage/IndexPage.vue'
import App from '@/App.vue'

if (typeof window !== 'undefined') {
  const CanvasPage = () => import('@/components/Canvas/CanvasPage.vue')
  const CanvasCreationForm = () => import('@/components/Canvas/CanvasCreationForm.vue')
  const SettingsView = () => import('@/components/User/Settings/SettingsView.vue')
  const NowPage = () => import('@/components/LandingPage/NowPage.vue')

  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', name: 'landing', component: IndexPage },
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
  router.isReady().then(() => app.mount('#app'))
}

export async function prerender(data: { url: string }) {
  const { renderToString } = await import('vue/server-renderer')

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', name: 'landing', component: IndexPage }],
  })

  const app = createSSRApp(App).use(router)

  router.push(data.url)
  await router.isReady()

  const html = await renderToString(app)

  return { html }
}
