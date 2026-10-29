<script setup lang="ts">
import { ref } from 'vue'

import AppSidebar from './AppSidebar.vue'
import AppTopbar from './AppTopbar.vue'
import type { Crumb, NavItem } from './nav'

defineProps<{
  navItems: NavItem[]
  breadcrumbs?: Crumb[]
}>()

/** Collapsed sidebar state lives here so both children stay in step. */
const rail = ref(false)
</script>

<template>
  <v-app>
    <AppSidebar :items="navItems" :rail="rail">
      <template #brand><slot name="brand" /></template>
      <template #footer><slot name="sidebar-footer" /></template>
    </AppSidebar>

    <AppTopbar :breadcrumbs="breadcrumbs" @toggle-nav="rail = !rail">
      <template #actions><slot name="topbar-actions" /></template>
      <template #account><slot name="account" /></template>
    </AppTopbar>

    <v-main>
      <v-container max-width="1440" class="pa-6">
        <slot />
      </v-container>
    </v-main>
  </v-app>
</template>
