<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'

import { ApiError, type Supplier } from '@/core/api'
import { SupplierFormDialog } from '@/core/components/suppliers'
import { useSuppliersStore } from '@/core/stores/suppliers'
import { ConfirmDialog, DataTable, PageHeader } from '@/design-system'

const store = useSuppliersStore()
const { items, total, page, limit, loading, error } = storeToRefs(store)

// The endpoint orders by id and offers no sort or search parameters, so the
// table must not pretend otherwise: sorting a single page would reorder four
// rows out of four hundred.
const headers = [
  { title: 'Назва', key: 'name', sortable: false },
  { title: 'Email', key: 'email', sortable: false },
  { title: 'Опис', key: 'description', sortable: false },
  { title: 'Оновлено', key: 'updatedAt', align: 'end' as const, width: 150, sortable: false },
  { title: '', key: 'actions', align: 'end' as const, width: 96, sortable: false },
]

const dateFormat = new Intl.DateTimeFormat('uk-UA', { dateStyle: 'short', timeStyle: 'short' })
const formatDate = (iso: string) => dateFormat.format(new Date(iso))

const formOpen = ref(false)
const editing = ref<Supplier | null>(null)

function openCreate() {
  editing.value = null
  formOpen.value = true
}

function openEdit(supplier: Supplier) {
  editing.value = supplier
  formOpen.value = true
}

function onSaved(supplier: Supplier, isEdit: boolean) {
  notify(
    isEdit
      ? `Постачальника «${supplier.name}» оновлено`
      : `Постачальника «${supplier.name}» створено`,
  )
}

const pendingDelete = ref<Supplier | null>(null)
const deleting = ref(false)

async function confirmDelete() {
  const supplier = pendingDelete.value
  if (!supplier) return

  deleting.value = true
  try {
    await store.remove(supplier.id)
    pendingDelete.value = null
    notify(`Постачальника «${supplier.name}» видалено`)
  } catch (err) {
    // The dialog stays open on failure, with the reason in the snackbar.
    notify(err instanceof ApiError ? err.message : 'Не вдалося видалити постачальника', 'danger')
  } finally {
    deleting.value = false
  }
}

const snackbar = ref({ open: false, text: '', color: 'success' })

function notify(text: string, color: 'success' | 'danger' = 'success') {
  snackbar.value = { open: true, text, color }
}

onMounted(store.fetchAll)
</script>

<template>
  <PageHeader title="Постачальники" description="Список постачальників та конфігів для їх даних.">
    <template #actions>
      <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="openCreate">
        Додати постачальника
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
    empty-title="Постачальників ще немає"
    empty-description="Додайте першого постачальника, щоб він з’явився у списку."
    @update:page="store.goToPage"
    @update:items-per-page="store.setLimit"
  >
    <template #[`item.description`]="{ item }">
      <span v-if="item.description" class="description">{{ item.description }}</span>
      <span v-else class="muted">—</span>
    </template>

    <template #[`item.updatedAt`]="{ item }">
      <span class="muted">{{ formatDate(item.updatedAt) }}</span>
    </template>

    <template #[`item.actions`]="{ item }">
      <div class="row-actions">
        <v-btn
          icon="mdi-pencil-outline"
          variant="text"
          size="small"
          aria-label="Редагувати"
          @click="openEdit(item)"
        />
        <v-btn
          icon="mdi-trash-can-outline"
          variant="text"
          size="small"
          color="danger"
          aria-label="Видалити"
          @click="pendingDelete = item"
        />
      </div>
    </template>

    <template #empty-actions>
      <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="openCreate">
        Додати постачальника
      </v-btn>
    </template>
  </DataTable>

  <SupplierFormDialog v-model="formOpen" :supplier="editing" @saved="onSaved" />

  <ConfirmDialog
    :model-value="Boolean(pendingDelete)"
    title="Видалити постачальника?"
    :message="`«${pendingDelete?.name}» зникне зі списку. Дію можна скасувати лише на боці бекенду.`"
    confirm-label="Видалити"
    tone="danger"
    :loading="deleting"
    @update:model-value="pendingDelete = null"
    @confirm="confirmDelete"
  />

  <v-snackbar v-model="snackbar.open" :color="snackbar.color" timeout="4000">
    {{ snackbar.text }}
  </v-snackbar>
</template>

<style scoped>
.row-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--ds-space-1);
}

.description {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
  max-width: 42ch;
}

.muted {
  color: var(--ds-text-muted);
}
</style>
