<script setup lang="ts">
import ThemeToggle from './ThemeToggle.vue'
import type { Crumb } from './nav'

defineProps<{
  breadcrumbs?: Crumb[]
}>()

defineEmits<{ 'toggle-nav': [] }>()
</script>

<template>
  <v-app-bar :height="56" color="surface" flat class="ds-topbar">
    <v-btn
      icon="mdi-menu"
      variant="text"
      size="small"
      class="ms-2"
      aria-label="Згорнути навігацію"
      @click="$emit('toggle-nav')"
    />

    <nav v-if="breadcrumbs?.length" class="ds-topbar__crumbs" aria-label="Хлібні крихти">
      <template v-for="(crumb, index) in breadcrumbs" :key="crumb.title">
        <span v-if="index > 0" class="ds-topbar__separator" aria-hidden="true">/</span>
        <RouterLink
          v-if="crumb.to && index < breadcrumbs.length - 1"
          :to="crumb.to"
          class="ds-topbar__crumb"
        >
          {{ crumb.title }}
        </RouterLink>
        <span
          v-else
          class="ds-topbar__crumb ds-topbar__crumb--current"
          :aria-current="index === breadcrumbs.length - 1 ? 'page' : undefined"
        >
          {{ crumb.title }}
        </span>
      </template>
    </nav>

    <v-spacer />

    <div class="ds-topbar__actions">
      <slot name="actions" />
      <ThemeToggle />
      <slot name="account" />
    </div>
  </v-app-bar>
</template>

<style scoped>
.ds-topbar {
  border-bottom: 1px solid var(--ds-border);
}

.ds-topbar__crumbs {
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  min-width: 0;
  margin-inline-start: var(--ds-space-2);
  font-size: var(--ds-font-size-base);
}

.ds-topbar__separator {
  color: var(--ds-text-disabled);
}

.ds-topbar__crumb {
  color: var(--ds-text-muted);
  white-space: nowrap;
}

.ds-topbar__crumb--current {
  color: var(--ds-text);
  font-weight: var(--ds-font-weight-medium);
  overflow: hidden;
  text-overflow: ellipsis;
}

a.ds-topbar__crumb:hover {
  color: var(--ds-text);
}

.ds-topbar__actions {
  display: flex;
  align-items: center;
  gap: var(--ds-space-1);
  padding-inline-end: var(--ds-space-3);
}
</style>
