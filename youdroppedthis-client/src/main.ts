import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import App from './App.vue'
import './style.css'

import CanvasView from '@/components/Canvas/CanvasView.vue'
import ShopView from './components/Shop/ShopView.vue'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: CanvasView },
  { path: '/shop', name: 'shop', component: ShopView },
  // { path: '/profile', name: 'profile', component: ProfileView, meta: { requiresAuth: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Auth guard
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('auth_token')

  if (to.meta.requiresAuth && !token) {
    next() //('/login')
  } else {
    next()
  }
})

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
