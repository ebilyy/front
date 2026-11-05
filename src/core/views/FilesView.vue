<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'

import type { FileUpload } from '@/core/api'
import { DataTable, PageHeader } from '@/core/components'
import { FileUploadDialog } from '@/core/components/files'
import { useFilesStore } from '@/core/stores/files'

const store = useFilesStore()
const { items, total, page, limit, loading, error } = storeToRefs(store)

// The endpoint orders by id and offers no sort parameters — see SuppliersView.
const headers = [
  { title: 'Назва', key: 'originalName', sortable: false },
  { title: 'Розмір', key: 'sizeBytes', align: 'end' as const, width: 120, sortable: false },
  { title: 'Завантажено', key: 'createdAt', align: 'end' as const, width: 150, sortable: false },
]

const dateFormat = new Intl.DateTimeFormat('uk-UA', { dateStyle: 'short', timeStyle: 'short' })
const formatDate = (iso: string) => dateFormat.format(new Date(iso))

const sizeFormat = new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 1 })
const SIZE_UNITS = ['Б', 'КБ', 'МБ', 'ГБ']

function formatSize(bytes: number) {
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < SIZE_UNITS.length - 1) {
    value /= 1024
    unit++
  }
  return `${sizeFormat.format(value)} ${SIZE_UNITS[unit]}`
}

const EXTENSION_ICONS: Record<string, string> = {
  xlsx: 'mdi-file-excel-outline',
  xls: 'mdi-file-excel-outline',
  csv: 'mdi-file-delimited-outline',
  pdf: 'mdi-file-pdf-box',
  doc: 'mdi-file-word-outline',
  docx: 'mdi-file-word-outline',
  zip: 'mdi-folder-zip-outline',
  png: 'mdi-file-image-outline',
  jpg: 'mdi-file-image-outline',
  jpeg: 'mdi-file-image-outline',
}

const iconFor = (file: FileUpload) =>
  (file.extension && EXTENSION_ICONS[file.extension]) || 'mdi-file-outline'

// «1 файл», «3 файли», «5 файлів» — Ukrainian needs all three forms.
const pluralRules = new Intl.PluralRules('uk-UA')
const FILE_FORMS: Partial<Record<Intl.LDMLPluralRule, string>> = {
  one: 'файл',
  few: 'файли',
  many: 'файлів',
}
const filesWord = (count: number) => FILE_FORMS[pluralRules.select(count)] ?? 'файлу'

const uploadOpen = ref(false)

function onUploaded(uploaded: FileUpload[]) {
  const [first] = uploaded
  notify(
    uploaded.length === 1 && first
      ? `Файл «${first.originalName}» завантажено`
      : `Завантажено ${uploaded.length} ${filesWord(uploaded.length)}`,
  )
}

const snackbar = ref({ open: false, text: '' })

function notify(text: string) {
  snackbar.value = { open: true, text }
}

onMounted(store.fetchAll)
</script>

<template>
  <PageHeader title="Файли" description="Завантажені прайси та інші файли постачальників.">
    <template #actions>
      <v-btn color="primary" variant="flat" prepend-icon="mdi-upload" @click="uploadOpen = true">
        Завантажити файли
      </v-btn>
    </template>
  </PageHeader>

  <v-alert v-if="error" type="error" class="mb-4">
    {{ error }}
    <template #append>
      <v-btn variant="text" size="small" @click="store.fetchAll">Спробувати ще раз</v-btn>
    </template>
  </v-alert>

  <DataTable
    server
    :headers="headers"
    :items="items"
    :items-length="total"
    :loading="loading"
    :page="page"
    :items-per-page="limit"
    :items-per-page-options="[10, 25, 50, 100]"
    item-value="id"
    empty-title="Файлів ще немає"
    empty-description="Завантажте перший файл, щоб він з’явився у списку."
    @update:page="store.goToPage"
    @update:items-per-page="store.setLimit"
  >
    <template #[`item.originalName`]="{ item }">
      <div class="d-flex align-center ga-3 py-2">
        <v-icon :icon="iconFor(item)" class="text-medium-emphasis" />
        <div class="file-name d-flex flex-column">
          <span class="text-truncate" :title="item.originalName">{{ item.originalName }}</span>
          <span class="text-caption text-medium-emphasis text-truncate">{{ item.mimeType }}</span>
        </div>
      </div>
    </template>

    <template #[`item.sizeBytes`]="{ item }">
      <span class="text-no-wrap">{{ formatSize(item.sizeBytes) }}</span>
    </template>

    <template #[`item.createdAt`]="{ item }">
      <span class="text-medium-emphasis">{{ formatDate(item.createdAt) }}</span>
    </template>

    <template #empty-actions>
      <v-btn color="primary" variant="flat" prepend-icon="mdi-upload" @click="uploadOpen = true">
        Завантажити файли
      </v-btn>
    </template>
  </DataTable>

  <FileUploadDialog v-model="uploadOpen" @uploaded="onUploaded" />

  <v-snackbar v-model="snackbar.open" color="success" timeout="4000">
    {{ snackbar.text }}
  </v-snackbar>
</template>

<style scoped>
.file-name {
  min-width: 0;
  max-width: 56ch;
}
</style>
