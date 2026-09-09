<script setup lang="ts">
import { computed } from 'vue'

import { useAppTheme, type ThemePreference } from '@/design-system/composables/useAppTheme'

const { preference, activeTheme, setPreference } = useAppTheme()

const options: { value: ThemePreference; icon: string; label: string }[] = [
  { value: 'light', icon: 'mdi-weather-sunny', label: 'Світла' },
  { value: 'dark', icon: 'mdi-weather-night', label: 'Темна' },
  { value: 'system', icon: 'mdi-monitor', label: 'Як у системі' },
]

/** `system` has no icon of its own on the trigger — show what it resolved to. */
const triggerIcon = computed(() =>
  activeTheme.value === 'dark' ? 'mdi-weather-night' : 'mdi-weather-sunny',
)
</script>

<template>
  <v-menu location="bottom end">
    <template #activator="{ props: menu }">
      <v-btn
        v-bind="menu"
        :icon="triggerIcon"
        variant="text"
        size="small"
        aria-label="Тема оформлення"
      />
    </template>

    <v-list :selected="[preference]" density="compact" min-width="180">
      <v-list-item
        v-for="option in options"
        :key="option.value"
        :value="option.value"
        :prepend-icon="option.icon"
        :title="option.label"
        @click="setPreference(option.value)"
      />
    </v-list>
  </v-menu>
</template>
