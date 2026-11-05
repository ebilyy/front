<script setup lang="ts">
import { ref, watch } from 'vue'

import {
  ApiError,
  importFieldsApi,
  supplierConfigsApi,
  suppliersApi,
  type ImportField,
  type Supplier,
  type SupplierConfig,
} from '@/core/api'
import { EmptyState, PageHeader } from '@/core/components'
import {
  SupplierConfigCard,
  SupplierConfigFormDialog,
  SupplierConfigSampleDialog,
  SupplierFormDialog,
} from '@/core/components/suppliers'

const props = defineProps<{ id: number }>()

const supplier = ref<Supplier | null>(null)
const configs = ref<SupplierConfig[]>([])
const fields = ref<ImportField[]>([])
const loading = ref(true)
const notFound = ref(false)
const error = ref<string | null>(null)

async function load() {
  loading.value = true
  notFound.value = false
  error.value = null

  try {
    // The supplier 404s on its own, so it is not worth waiting on it before
    // asking for the configs: their endpoint 404s for the same reason.
    const [loadedSupplier, loadedConfigs, loadedFields] = await Promise.all([
      suppliersApi.get(props.id),
      supplierConfigsApi.list(props.id),
      importFieldsApi.list(),
    ])
    supplier.value = loadedSupplier
    configs.value = loadedConfigs
    fields.value = loadedFields
  } catch (err) {
    supplier.value = null
    configs.value = []
    if (err instanceof ApiError && err.status === 404) notFound.value = true
    else
      error.value = err instanceof ApiError ? err.message : 'Не вдалося завантажити постачальника'
  } finally {
    loading.value = false
  }
}

// The same component instance is reused when only `:id` changes.
watch(() => props.id, load, { immediate: true })

const formOpen = ref(false)
const snackbar = ref({ open: false, text: '' })

function onSaved(updated: Supplier) {
  supplier.value = updated
  snackbar.value = { open: true, text: `Постачальника «${updated.name}» оновлено` }
}

// Two ways to fill the same config: typing letters in the form, or pointing at
// a sample file. Both take the same props and emit the same `saved`, so they
// share the config being edited and the handler.
const configFormOpen = ref(false)
const configSampleOpen = ref(false)
const editingConfig = ref<SupplierConfig | null>(null)

function openCreateConfig(fromSample = false) {
  editingConfig.value = null
  if (fromSample) configSampleOpen.value = true
  else configFormOpen.value = true
}

function openEditConfig(config: SupplierConfig, fromSample = false) {
  editingConfig.value = config
  if (fromSample) configSampleOpen.value = true
  else configFormOpen.value = true
}

// The saved row comes back whole, so it is spliced in rather than refetched.
function onConfigSaved(saved: SupplierConfig, isEdit: boolean) {
  if (isEdit) {
    configs.value = configs.value.map((config) => (config.id === saved.id ? saved : config))
  } else {
    configs.value = [...configs.value, saved]
  }

  snackbar.value = {
    open: true,
    text: isEdit ? `Конфіг «${saved.name}» оновлено` : `Конфіг «${saved.name}» створено`,
  }
}
</script>

<template>
  <template v-if="loading && !supplier">
    <v-skeleton-loader type="heading, text" class="mb-6 bg-transparent" max-width="480" />
    <v-row>
      <v-col v-for="n in 2" :key="n" cols="12" lg="6">
        <v-skeleton-loader type="list-item-avatar-two-line, table-tbody" />
      </v-col>
    </v-row>
  </template>

  <v-card v-else-if="notFound">
    <EmptyState
      size="page"
      icon="mdi-account-question-outline"
      title="Постачальника не знайдено"
      description="Можливо, його видалили або посилання застаріло."
    >
      <template #actions>
        <v-btn variant="tonal" prepend-icon="mdi-arrow-left" :to="{ name: 'suppliers' }">
          До списку постачальників
        </v-btn>
      </template>
    </EmptyState>
  </v-card>

  <v-alert v-else-if="error" type="error">
    {{ error }}
    <template #append>
      <v-btn variant="text" size="small" @click="load">Спробувати ще раз</v-btn>
    </template>
  </v-alert>

  <template v-else-if="supplier">
    <PageHeader :title="supplier.name" :description="supplier.description ?? undefined">
      <template #meta>
        <a :href="`mailto:${supplier.email}`" class="text-body-2 text-medium-emphasis">
          {{ supplier.email }}
        </a>
      </template>
      <template #actions>
        <v-btn variant="tonal" prepend-icon="mdi-pencil-outline" @click="formOpen = true">
          Редагувати
        </v-btn>
      </template>
    </PageHeader>

    <section aria-labelledby="configs-title">
      <div class="d-flex flex-wrap align-start justify-space-between ga-4 mb-4">
        <div>
          <div class="d-flex align-baseline ga-2 mb-1">
            <h2 id="configs-title" class="text-h6">Конфіги парсингу</h2>
            <span v-if="configs.length" class="text-body-2 text-medium-emphasis">
              {{ configs.length }}
            </span>
          </div>
          <p class="text-body-2 text-medium-emphasis">
            З якого аркуша й рядка читати прайс і яка колонка файлу відповідає якому полю товару.
          </p>
        </div>
        <div v-if="configs.length" class="d-flex flex-wrap ga-2">
          <v-btn variant="tonal" prepend-icon="mdi-plus" @click="openCreateConfig()">
            Вручну
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            prepend-icon="mdi-file-table-outline"
            @click="openCreateConfig(true)"
          >
            Із зразка файлу
          </v-btn>
        </div>
      </div>

      <v-row v-if="configs.length">
        <v-col v-for="config in configs" :key="config.id" cols="12" lg="6">
          <SupplierConfigCard
            :config="config"
            :fields="fields"
            @edit="openEditConfig(config)"
            @edit-from-sample="openEditConfig(config, true)"
          />
        </v-col>
      </v-row>

      <v-card v-else>
        <EmptyState
          size="page"
          icon="mdi-file-cog-outline"
          title="Конфігів ще немає"
          description="Конфіг описує, як читати прайс цього постачальника: аркуш, рядок заголовків і колонки для коду, назви та ціни."
        >
          <template #actions>
            <div class="d-flex flex-wrap justify-center ga-2">
              <v-btn variant="tonal" prepend-icon="mdi-plus" @click="openCreateConfig()">
                Вручну
              </v-btn>
              <v-btn
                color="primary"
                variant="flat"
                prepend-icon="mdi-file-table-outline"
                @click="openCreateConfig(true)"
              >
                Із зразка файлу
              </v-btn>
            </div>
          </template>
        </EmptyState>
      </v-card>
    </section>

    <SupplierFormDialog v-model="formOpen" :supplier="supplier" @saved="onSaved" />

    <SupplierConfigFormDialog
      v-model="configFormOpen"
      :supplier-id="supplier.id"
      :fields="fields"
      :config="editingConfig"
      @saved="onConfigSaved"
    />

    <SupplierConfigSampleDialog
      v-model="configSampleOpen"
      :supplier-id="supplier.id"
      :fields="fields"
      :config="editingConfig"
      @saved="onConfigSaved"
    />

    <v-snackbar v-model="snackbar.open" color="success" timeout="4000">
      {{ snackbar.text }}
    </v-snackbar>
  </template>
</template>
