<script setup lang="ts">
import type { VDataTable } from 'vuetify/components'

import EmptyState from './EmptyState.vue'

type DataTableProps = InstanceType<typeof VDataTable>['$props']

/**
 * The admin's table surface: a card-framed `v-data-table` with the toolbar,
 * loading and empty states already wired up.
 *
 * Everything not declared below is forwarded to `v-data-table`, and so are all
 * of its slots — so `#item.name` and friends keep working unchanged.
 */
withDefaults(
  defineProps<{
    headers: DataTableProps['headers']
    items: DataTableProps['items']
    loading?: boolean
    title?: string
    searchable?: boolean
    searchPlaceholder?: string
    emptyTitle?: string
    emptyDescription?: string
  }>(),
  {
    searchPlaceholder: 'Пошук…',
    emptyTitle: 'Нічого не знайдено',
  },
)

const search = defineModel<string>('search', { default: '' })

defineOptions({ inheritAttrs: false })
</script>

<template>
  <v-card class="ds-table">
    <div v-if="title || searchable || $slots.actions" class="ds-table__toolbar">
      <h2 v-if="title" class="ds-table__title">{{ title }}</h2>

      <div class="ds-table__toolbar-end">
        <v-text-field
          v-if="searchable"
          v-model="search"
          :placeholder="searchPlaceholder"
          prepend-inner-icon="mdi-magnify"
          density="compact"
          hide-details
          clearable
          class="ds-table__search"
        />
        <slot name="actions" />
      </div>
    </div>

    <v-divider v-if="title || searchable || $slots.actions" />

    <v-data-table
      v-bind="$attrs"
      :headers="headers"
      :items="items"
      :search="search"
      :loading="loading"
    >
      <template #no-data>
        <EmptyState :title="emptyTitle" :description="emptyDescription">
          <template v-if="$slots['empty-actions']" #actions>
            <slot name="empty-actions" />
          </template>
        </EmptyState>
      </template>

      <!-- Forward every consumer-provided slot straight through. -->
      <template v-for="(_, name) in $slots" #[name]="slotProps">
        <slot :name="name" v-bind="slotProps ?? {}" />
      </template>
    </v-data-table>
  </v-card>
</template>

<style scoped>
.ds-table {
  overflow: hidden;
}

.ds-table__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-3);
  padding: var(--ds-space-3) var(--ds-space-4);
}

.ds-table__title {
  font-size: var(--ds-font-size-lg);
  font-weight: var(--ds-font-weight-semibold);
}

.ds-table__toolbar-end {
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  margin-inline-start: auto;
}

.ds-table__search {
  min-width: 220px;
}
</style>
