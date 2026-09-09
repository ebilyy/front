<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import { AdminShell, type Crumb, type NavItem } from '@/design-system'

const route = useRoute()

const navItems: NavItem[] = [
  { title: 'Огляд (приклад дизайну)', icon: 'mdi-view-dashboard-outline', to: { name: 'dashboard' } },
  { title: 'Постачальники', icon: 'mdi-account-multiple-outline', to: { name: 'dashboard' } },
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
  //     {
  //       title: 'Дизайн-система',
  //       icon: 'mdi-palette-swatch-outline',
  //       to: { name: 'design-system' },
  //     },
  //     { title: 'Налаштування', icon: 'mdi-cog-outline', disabled: true },
  //   ],
  // },
]

const breadcrumbs = computed<Crumb[]>(() => {
  const trail: Crumb[] = [{ title: 'Schemka', to: { name: 'dashboard' } }]
  const title = route.meta.title
  if (typeof title === 'string' && route.name !== 'dashboard') trail.push({ title })
  return trail
})
</script>

<template>
  <<AdminShell :nav-items="navItems" :breadcrumbs="breadcrumbs">
    <template #brand>
      <div class="brand">
        <span class="brand__mark">S</span>
        <span class="brand__name">Schemka</span>
      </div>
    </template>

    <template #account>
      <v-btn icon="mdi-account-circle-outline" variant="text" size="small" aria-label="Профіль" />
    </template>

    <RouterView />
  </AdminShell>
  <RouterView />
</template>

<style scoped>
.brand {
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  min-width: 0;
}

.brand__mark {
  display: grid;
  place-items: center;
  flex: none;
  width: 28px;
  height: 28px;
  border-radius: var(--ds-radius-md);
  background-color: var(--ds-primary);
  color: var(--ds-primary-fg);
  font-size: var(--ds-font-size-base);
  font-weight: var(--ds-font-weight-bold);
}

.brand__name {
  font-size: var(--ds-font-size-lg);
  font-weight: var(--ds-font-weight-semibold);
  letter-spacing: var(--ds-tracking-tight);
  white-space: nowrap;
}
</style>
