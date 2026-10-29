<script setup lang="ts">
import type { NavItem } from './nav'

defineProps<{
  items: NavItem[]
  /** Collapsed to icons only. */
  rail?: boolean
}>()

const isGroup = (item: NavItem) => Boolean(item.children?.length)
</script>

<template>
  <v-navigation-drawer :rail="rail" :width="260" :rail-width="68" color="surface">
    <!-- Same height as the app bar, so the divider below lines up with its border. -->
    <div class="sidebar__brand d-flex align-center px-4">
      <slot name="brand" />
    </div>

    <v-divider />

    <div class="pa-2">
      <template v-for="item in items" :key="item.title">
        <template v-if="isGroup(item)">
          <!-- In rail mode the section label would be clipped, so it collapses
               to a divider instead of overflowing. -->
          <v-divider v-if="rail" class="my-2" />
          <div v-else class="text-overline text-medium-emphasis px-3 pt-2">{{ item.title }}</div>

          <v-list nav density="comfortable" class="pa-0">
            <v-list-item
              v-for="child in item.children"
              :key="child.title"
              :to="child.to"
              :href="child.href"
              :prepend-icon="child.icon"
              :title="child.title"
              :disabled="child.disabled"
              color="primary"
            >
              <template v-if="child.badge !== undefined && !rail" #append>
                <v-chip size="x-small" variant="tonal">{{ child.badge }}</v-chip>
              </template>
            </v-list-item>
          </v-list>
        </template>

        <v-list v-else nav density="comfortable" class="pa-0">
          <v-list-item
            :to="item.to"
            :href="item.href"
            :prepend-icon="item.icon"
            :title="item.title"
            :disabled="item.disabled"
            color="primary"
          >
            <template v-if="item.badge !== undefined && !rail" #append>
              <v-chip size="x-small" variant="tonal">{{ item.badge }}</v-chip>
            </template>
          </v-list-item>
        </v-list>
      </template>
    </div>

    <template #append>
      <div class="pa-2 border-t">
        <slot name="footer" />
      </div>
    </template>
  </v-navigation-drawer>
</template>

<style scoped>
.sidebar__brand {
  height: 56px;
}
</style>
