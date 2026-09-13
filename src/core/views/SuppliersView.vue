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

const dialog = ref(false)

</script>

<template>
  <PageHeader title="Постачальники" description="Список постачальників та та конфігів для їх данних">
    <template #actions>
      <!-- <v-btn prepend-icon="mdi-tray-arrow-down">Експорт</v-btn> -->
      <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="dialog = true">
        Додати постачальника
      </v-btn>
    </template>
  </PageHeader>

  <!-- <div class="stats">
    <v-card v-for="stat in stats" :key="stat.label" class="stat">
      <div class="stat__label">{{ stat.label }}</div>
      <div class="stat__row">
        <span class="stat__value">{{ stat.value }}</span>
        <StatusBadge :tone="stat.tone" :label="stat.delta" :dot="false" />
      </div>
    </v-card>
  </div> -->

    <v-dialog
      v-model="dialog"
      transition="dialog-bottom-transition"
      fullscreen
    >
     <v-card>
        <v-toolbar  color="primary">
          <v-btn
            icon="mdi-close"
            @click="dialog = false"
          ></v-btn>

          <v-toolbar-title>Settings</v-toolbar-title>
        </v-toolbar>
     
        <template v-slot:actions>
          <v-btn
            class="ms-auto"
            text="Ok"
            @click="dialog = false"
          ></v-btn>
        </template>
      </v-card>
    </v-dialog>

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
