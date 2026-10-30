import { createRouter, createWebHistory } from 'vue-router'

import DashboardView from '../views/DashboardView.vue'
import FilesView from '../views/FilesView.vue'
import HomeView from '../views/HomeView.vue'
import SuppliersView from '../views/SuppliersView.vue'

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
      path: '/suppliers',
      name: 'suppliers',
      component: SuppliersView,
      meta: { title: 'Постачальники' },
    },
    {
      path: '/files',
      name: 'files',
      component: FilesView,
      meta: { title: 'Файли' },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: { title: 'Dashboard' },
    },
  ],
})

export default router
