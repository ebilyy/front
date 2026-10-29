<script setup lang="ts">
import { VDataTable, VDataTableServer } from 'vuetify/components'

import EmptyState from './EmptyState.vue'

type DataTableProps = InstanceType<typeof VDataTable>['$props']

/**
 * The admin's table surface: a card-framed `v-data-table` with the toolbar,
 * loading and empty states already wired up.
 *
 * Everything not declared below is forwarded to the table, and so are all of
 * its slots — so `#item.name` and friends keep working unchanged.
 *
 * With `server`, it renders `v-data-table-server` instead: paging and sorting
 * then belong to the backend, so pass `items-length` and drive `page` /
 * `items-per-page` yourself. Built-in search filters the loaded rows only,
 * which on a server table means one page — leave `searchable` off there unless
 * the endpoint itself can search.
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
    /** Paging happens on the backend — pair with `itemsLength`. */
    server?: boolean
    /** Total row count across all pages. Required when `server` is set. */
    itemsLength?: number
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
  <v-card class="overflow-hidden">
    <div
      v-if="title || searchable || $slots.actions"
      class="d-flex flex-wrap align-center justify-space-between ga-3 px-4 py-3"
    >
      <h2 v-if="title" class="text-h6">{{ title }}</h2>

      <div class="d-flex align-center ga-2 ms-auto">
        <v-text-field
          v-if="searchable"
          v-model="search"
          :placeholder="searchPlaceholder"
          prepend-inner-icon="mdi-magnify"
          density="compact"
          hide-details
          clearable
          class="table__search"
        />
        <slot name="actions" />
      </div>
    </div>

    <v-divider v-if="title || searchable || $slots.actions" />

    <component
      :is="server ? VDataTableServer : VDataTable"
      v-bind="$attrs"
      :headers="headers"
      :items="items"
      :items-length="itemsLength"
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
    </component>
  </v-card>
</template>

<style scoped>
.table__search {
  min-width: 220px;
}
</style>
