import { createRouter, createWebHistory } from 'vue-router'

import DashboardView from '../views/DashboardView.vue'
import FilesView from '../views/FilesView.vue'
import HomeView from '../views/HomeView.vue'
import SupplierView from '../views/SupplierView.vue'
import SuppliersView from '../views/SuppliersView.vue'

declare module 'vue-router' {
  interface RouteMeta {
    /** Topbar breadcrumb for this record; a nested page shows its parent's too. */
    title?: string
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { title: 'Home' },
    },
    // Nested rather than flat so a supplier's page matches the `/suppliers`
    // record too: the sidebar link stays active and the breadcrumbs get the
    // list as a parent, both straight from `route.matched`.
    {
      path: '/suppliers',
      meta: { title: 'Постачальники' },
      children: [
        { path: '', name: 'suppliers', component: SuppliersView },
        {
          path: ':id(\\d+)',
          name: 'supplier',
          component: SupplierView,
          props: (route) => ({ id: Number(route.params.id) }),
          meta: { title: 'Постачальник' },
        },
      ],
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
