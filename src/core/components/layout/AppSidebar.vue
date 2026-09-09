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
  <v-navigation-drawer
    :rail="rail"
    :width="260"
    :rail-width="68"
    color="surface"
    class="ds-sidebar"
  >
    <div class="ds-sidebar__brand">
      <slot name="brand" />
    </div>

    <v-divider />

    <div class="ds-sidebar__nav">
      <template v-for="item in items" :key="item.title">
        <template v-if="isGroup(item)">
          <!-- In rail mode the section label would be clipped, so it collapses
               to a divider instead of overflowing. -->
          <v-divider v-if="rail" class="my-2" />
          <div v-else class="ds-sidebar__section">{{ item.title }}</div>

          <v-list nav density="comfortable" class="pa-0">
            <v-list-item
              v-for="child in item.children"
              :key="child.title"
              :to="child.to"
              :href="child.href"
              :prepend-icon="child.icon"
              :title="child.title"
              :disabled="child.disabled"
              color="accent"
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
            color="accent"
          >
            <template v-if="item.badge !== undefined && !rail" #append>
              <v-chip size="x-small" variant="tonal">{{ item.badge }}</v-chip>
            </template>
          </v-list-item>
        </v-list>
      </template>
    </div>

    <template #append>
      <div class="ds-sidebar__footer">
        <slot name="footer" />
      </div>
    </template>
  </v-navigation-drawer>
</template>

<style scoped>
.ds-sidebar {
  border-right: 1px solid var(--ds-border);
}

.ds-sidebar__brand {
  display: flex;
  align-items: center;
  height: var(--ds-layout-topbar-height);
  padding-inline: var(--ds-space-4);
}

.ds-sidebar__nav {
  padding: var(--ds-space-2);
}

.ds-sidebar__section {
  padding: var(--ds-space-4) var(--ds-space-3) var(--ds-space-1);
  color: var(--ds-text-subtle);
  font-size: var(--ds-font-size-2xs);
  font-weight: var(--ds-font-weight-semibold);
  letter-spacing: var(--ds-tracking-wide);
  text-transform: uppercase;
}

.ds-sidebar__footer {
  padding: var(--ds-space-2);
  border-top: 1px solid var(--ds-border);
}
</style>
