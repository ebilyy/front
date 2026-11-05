<script setup lang="ts">
import { computed } from 'vue'

import type { ImportField, SupplierConfig, SupplierConfigColumn } from '@/core/api'
import { StatusBadge } from '@/core/components/data'

const props = defineProps<{
  config: SupplierConfig
  /** The import-field registry, in display order. */
  fields: ImportField[]
}>()

defineEmits<{
  /** Open the config in the manual form. */
  edit: []
  /** Open it over a sample price list. */
  editFromSample: []
}>()

interface MappingRow {
  key: string
  label: string
  required: boolean
  mapping: SupplierConfigColumn | undefined
  /** The config maps a field the registry no longer knows. */
  unknown: boolean
}

// Every registry field gets a row, mapped or not, so a reader sees at a glance
// what the file does not provide. Mappings to fields since dropped from the
// registry are listed last rather than hidden.
const rows = computed<MappingRow[]>(() => {
  const byField = new Map(props.config.columns.map((column) => [column.field, column]))

  const known: MappingRow[] = props.fields.map((field) => ({
    key: field.key,
    label: field.label,
    required: field.required,
    mapping: byField.get(field.key),
    unknown: false,
  }))

  const registry = new Set<string>(props.fields.map((field) => field.key))
  const orphans: MappingRow[] = props.config.columns
    .filter((column) => !registry.has(column.field))
    .map((column) => ({
      key: column.field,
      label: column.field,
      required: false,
      mapping: column,
      unknown: true,
    }))

  return [...known, ...orphans]
})

const missingRequired = computed(() => rows.value.filter((row) => row.required && !row.mapping))

const dateFormat = new Intl.DateTimeFormat('uk-UA', { dateStyle: 'short', timeStyle: 'short' })
</script>

<template>
  <v-card class="h-100">
    <v-card-item>
      <template #prepend>
        <v-avatar icon="mdi-file-cog-outline" variant="tonal" color="primary" rounded="lg" />
      </template>

      <v-card-title>{{ config.name }}</v-card-title>
      <v-card-subtitle>
        Оновлено {{ dateFormat.format(new Date(config.updatedAt)) }}
      </v-card-subtitle>

      <template #append>
        <StatusBadge
          v-if="missingRequired.length"
          tone="warning"
          :label="`Не задано: ${missingRequired.map((row) => row.label).join(', ')}`"
        />
        <StatusBadge v-else tone="success" label="Готовий" />
        <v-btn
          icon="mdi-file-table-outline"
          variant="text"
          size="small"
          class="ms-1"
          aria-label="Редагувати за зразком файлу"
          title="Редагувати за зразком файлу"
          @click="$emit('editFromSample')"
        />
        <v-btn
          icon="mdi-pencil-outline"
          variant="text"
          size="small"
          aria-label="Редагувати вручну"
          title="Редагувати вручну"
          @click="$emit('edit')"
        />
      </template>
    </v-card-item>

    <div class="d-flex flex-wrap ga-2 px-4 pb-4">
      <v-chip size="small" variant="outlined" prepend-icon="mdi-table">
        {{ config.sheetName ?? 'Перший аркуш' }}
      </v-chip>
      <v-chip size="small" variant="outlined" prepend-icon="mdi-format-header-pound">
        Заголовки в рядку {{ config.headerRow }}
      </v-chip>
      <v-chip size="small" variant="outlined" prepend-icon="mdi-currency-usd">
        {{ config.currency }}
      </v-chip>
    </div>

    <v-divider />

    <v-table density="compact">
      <thead>
        <tr>
          <th>Поле</th>
          <th class="text-center" style="width: 96px">Колонка</th>
          <th>Заголовок у файлі</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.key">
          <td>
            <div class="d-flex align-center ga-2">
              <span :class="{ 'text-medium-emphasis': !row.mapping }">{{ row.label }}</span>
              <v-chip
                v-if="row.required"
                size="x-small"
                variant="tonal"
                :color="row.mapping ? undefined : 'error'"
              >
                обов’язкове
              </v-chip>
              <v-chip v-if="row.unknown" size="x-small" variant="tonal" color="warning">
                невідоме поле
              </v-chip>
            </div>
          </td>
          <td class="text-center">
            <code v-if="row.mapping" class="column-letter">{{ row.mapping.column }}</code>
            <span v-else :class="row.required ? 'text-error' : 'text-disabled'">—</span>
          </td>
          <td>
            <span v-if="row.mapping?.headerText">{{ row.mapping.headerText }}</span>
            <span v-else-if="row.mapping" class="text-medium-emphasis">без заголовка</span>
            <span v-else class="text-disabled">—</span>
          </td>
        </tr>
      </tbody>
    </v-table>
  </v-card>
</template>

<style scoped>
.column-letter {
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(var(--v-theme-on-surface), 0.06);
}
</style>
