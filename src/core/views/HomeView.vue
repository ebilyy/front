<script setup lang="ts">
import { ref } from 'vue'

import { DataTable, PageHeader, StatusBadge, type StatusTone } from '@/design-system'

/** Placeholder data — replace with the real API once the endpoints exist. */
interface SchemeRow {
  id: number
  name: string
  owner: string
  status: StatusTone
  statusLabel: string
  updatedAt: string
}

const stats = [
  { label: 'Активні схеми', value: '128', delta: '+12', tone: 'success' as const },
  { label: 'Чернетки', value: '34', delta: '+3', tone: 'neutral' as const },
  { label: 'Помилки валідації', value: '7', delta: '−2', tone: 'danger' as const },
  { label: 'Користувачі', value: '52', delta: '+1', tone: 'neutral' as const },
]

const headers = [
  { title: 'Назва', key: 'name' },
  { title: 'Власник', key: 'owner' },
  { title: 'Статус', key: 'status', width: 160 },
  { title: 'Оновлено', key: 'updatedAt', align: 'end' as const, width: 140 },
]

const rows: SchemeRow[] = [
  {
    id: 1,
    name: 'Складський облік',
    owner: 'О. Дорошенко',
    status: 'success',
    statusLabel: 'Опубліковано',
    updatedAt: '08.09.2026',
  },
  {
    id: 2,
    name: 'Логістика — маршрути',
    owner: 'І. Панченко',
    status: 'warning',
    statusLabel: 'На перевірці',
    updatedAt: '07.09.2026',
  },
  {
    id: 3,
    name: 'Каталог постачальників',
    owner: 'М. Левчук',
    status: 'neutral',
    statusLabel: 'Чернетка',
    updatedAt: '05.09.2026',
  },
  {
    id: 4,
    name: 'Тарифна сітка',
    owner: 'О. Дорошенко',
    status: 'danger',
    statusLabel: 'Помилка',
    updatedAt: '02.09.2026',
  },
]

const search = ref('')
</script>

<template>
  <PageHeader title="Огляд" description="Стан схем і активність за останній тиждень.">
    <template #actions>
      <v-btn prepend-icon="mdi-tray-arrow-down">Експорт</v-btn>
      <v-btn color="primary" variant="flat" prepend-icon="mdi-plus">Нова схема</v-btn>
    </template>
  </PageHeader>

  <div class="stats">
    <v-card v-for="stat in stats" :key="stat.label" class="stat">
      <div class="stat__label">{{ stat.label }}</div>
      <div class="stat__row">
        <span class="stat__value">{{ stat.value }}</span>
        <StatusBadge :tone="stat.tone" :label="stat.delta" :dot="false" />
      </div>
    </v-card>
  </div>

  <DataTable
    v-model:search="search"
    title="Останні зміни"
    searchable
    :headers="headers"
    :items="rows"
    item-value="id"
    empty-title="Схем поки немає"
    empty-description="Створіть першу схему, щоб побачити її тут."
  >
    <template #actions>
      <v-btn icon="mdi-filter-variant" variant="text" size="small" aria-label="Фільтри" />
    </template>

    <template #[`item.status`]="{ item }">
      <StatusBadge :tone="item.status" :label="item.statusLabel" />
    </template>

    <template #empty-actions>
      <v-btn color="primary" variant="flat" prepend-icon="mdi-plus">Нова схема</v-btn>
    </template>
  </DataTable>
</template>

<style scoped>
.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--ds-space-4);
  margin-bottom: var(--ds-space-6);
}

.stat {
  padding: var(--ds-space-4);
}

.stat__label {
  color: var(--ds-text-muted);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: var(--ds-tracking-wide);
  text-transform: uppercase;
}

.stat__row {
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  margin-top: var(--ds-space-2);
}

.stat__value {
  font-size: var(--ds-font-size-3xl);
  line-height: var(--ds-line-height-3xl);
  font-weight: var(--ds-font-weight-semibold);
  letter-spacing: var(--ds-tracking-tight);
}
</style>
