import { createRouter, createWebHistory } from 'vue-router'

import DashboardView from '../views/DashboardView.vue'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { title: 'Home' },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: { title: 'Dashboard' },
    },
    {
      path: '/design-system',
      name: 'design-system',
      // Route-level code splitting: the styleguide is not part of daily use.
      component: () => import('../views/DesignSystemView.vue'),
      meta: { title: 'Дизайн-система' },
    },
  ],
})

export default router
