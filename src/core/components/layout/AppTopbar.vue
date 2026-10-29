<script setup lang="ts">
import ThemeToggle from './ThemeToggle.vue'
import type { Crumb } from './nav'

defineProps<{
  breadcrumbs?: Crumb[]
}>()

defineEmits<{ 'toggle-nav': [] }>()
</script>

<template>
  <v-app-bar :height="56" color="surface" flat border="b">
    <v-btn
      icon="mdi-menu"
      variant="text"
      size="small"
      class="ms-2"
      aria-label="Згорнути навігацію"
      @click="$emit('toggle-nav')"
    />

    <nav
      v-if="breadcrumbs?.length"
      class="topbar__crumbs d-flex align-center ga-2 ms-2 text-body-2"
      aria-label="Хлібні крихти"
    >
      <template v-for="(crumb, index) in breadcrumbs" :key="crumb.title">
        <span v-if="index > 0" class="text-disabled" aria-hidden="true">/</span>
        <RouterLink
          v-if="crumb.to && index < breadcrumbs.length - 1"
          :to="crumb.to"
          class="text-medium-emphasis text-decoration-none text-no-wrap"
        >
          {{ crumb.title }}
        </RouterLink>
        <span
          v-else
          class="font-weight-medium text-truncate"
          :aria-current="index === breadcrumbs.length - 1 ? 'page' : undefined"
        >
          {{ crumb.title }}
        </span>
      </template>
    </nav>

    <v-spacer />

    <div class="d-flex align-center ga-1 pe-3">
      <slot name="actions" />
      <ThemeToggle />
      <slot name="account" />
    </div>
  </v-app-bar>
</template>

<style scoped>
/* Lets the current crumb shrink and ellipsize instead of pushing the actions off. */
.topbar__crumbs {
  min-width: 0;
}
</style>
