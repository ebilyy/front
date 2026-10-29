<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from 'vuetify'

import { saveThemePreference, type ThemePreference } from '@/core/plugins/vuetify'

const theme = useTheme()

const options: { value: ThemePreference; icon: string; label: string }[] = [
  { value: 'light', icon: 'mdi-weather-sunny', label: 'Світла' },
  { value: 'dark', icon: 'mdi-weather-night', label: 'Темна' },
  { value: 'system', icon: 'mdi-monitor', label: 'Як у системі' },
]

/** `theme.name` is already resolved, so it never reads `system` itself. */
const preference = computed<ThemePreference>(() =>
  theme.isSystem.value ? 'system' : (theme.name.value as ThemePreference),
)

/** `system` has no icon of its own on the trigger — show what it resolved to. */
const triggerIcon = computed(() =>
  theme.current.value.dark ? 'mdi-weather-night' : 'mdi-weather-sunny',
)

function setPreference(value: ThemePreference) {
  theme.change(value)
  saveThemePreference(value)
}
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
