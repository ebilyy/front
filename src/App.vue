<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import { AdminShell, type Crumb, type NavItem } from '@/core/components'

const route = useRoute()

const navItems: NavItem[] = [
  // {
  //   title: 'Огляд (приклад дизайну)',
  //   icon: 'mdi-view-dashboard-outline',
  //   to: { name: 'dashboard' },
  // },
  { title: 'Постачальники', icon: 'mdi-account-multiple-outline', to: { name: 'suppliers' } },
  { title: 'Файли', icon: 'mdi-file-document-multiple-outline', to: { name: 'files' } },
  // {
  //   title: 'Постачальники',
  //   children: [
  //     { title: 'Схеми', icon: 'mdi-sitemap-outline', disabled: true },
  //     { title: 'Користувачі', icon: 'mdi-account-multiple-outline', disabled: true },
  //     { title: 'Журнал подій', icon: 'mdi-history', disabled: true },
  //   ],
  // },
  // {
  //   title: 'Дані',
  //   children: [
  //     { title: 'Схеми', icon: 'mdi-sitemap-outline', disabled: true },
  //     { title: 'Користувачі', icon: 'mdi-account-multiple-outline', disabled: true },
  //     { title: 'Журнал подій', icon: 'mdi-history', disabled: true },
  //   ],
  // },
  // {
  //   title: 'Система',
  //   children: [
  //     { title: 'Налаштування', icon: 'mdi-cog-outline', disabled: true },
  //   ],
  // },
]

const breadcrumbs = computed<Crumb[]>(() => {
  const trail: Crumb[] = [{ title: 'Schemka', to: { name: 'dashboard' } }]
  if (route.name === 'dashboard') return trail

  // `record.meta` is the record's own, unlike the merged `route.meta`, so a
  // nested page yields its parent's title and then its own. Only the last
  // crumb is unlinked, and only a parent record — no params — gets a link.
  for (const record of route.matched) {
    if (record.meta.title) trail.push({ title: record.meta.title, to: { path: record.path } })
  }
  return trail
})
</script>

<template>
  <AdminShell :nav-items="navItems" :breadcrumbs="breadcrumbs">
    <template #brand>
      <div class="d-flex align-center ga-2">
        <v-avatar color="primary" size="28" rounded="lg" class="font-weight-bold">S</v-avatar>
        <span class="text-h6 text-no-wrap">Schemka</span>
      </div>
    </template>

    <template #account>
      <v-btn icon="mdi-account-circle-outline" variant="text" size="small" aria-label="Профіль" />
    </template>

    <RouterView />
  </AdminShell>
</template>
