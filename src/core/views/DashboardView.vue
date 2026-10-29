<script setup lang="ts">
import { ref } from 'vue'

import { DataTable, PageHeader, StatusBadge, type StatusTone } from '@/core/components'

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
  { label: 'Помилки валідації', value: '7', delta: '−2', tone: 'error' as const },
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
    status: 'error',
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

  <v-row class="mb-2">
    <v-col v-for="stat in stats" :key="stat.label" cols="12" sm="6" lg="3">
      <v-card class="pa-4">
        <div class="text-overline text-medium-emphasis">{{ stat.label }}</div>
        <div class="d-flex align-center ga-2">
          <span class="text-h4 font-weight-medium">{{ stat.value }}</span>
          <StatusBadge :tone="stat.tone" :label="stat.delta" :dot="false" />
        </div>
      </v-card>
    </v-col>
  </v-row>

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
