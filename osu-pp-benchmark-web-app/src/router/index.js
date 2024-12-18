import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      href: '/',
      name: 'Main',
      component: () => import('../views/MainPage.vue')
    }
  ],
})

export default router
