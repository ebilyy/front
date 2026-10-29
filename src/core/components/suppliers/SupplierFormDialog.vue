<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { VForm } from 'vuetify/components'

import { ApiError } from '@/core/api'
import type { CreateSupplierDto, Supplier } from '@/core/api'
import { useSuppliersStore } from '@/core/stores/suppliers'

/**
 * Create/edit form for a supplier. Passing `supplier` switches it to edit mode.
 *
 * The client rules mirror the backend's Zod schema so obvious mistakes never
 * cost a round trip, but the backend stays the authority: whatever it rejects
 * comes back in `ApiError.fieldErrors` and is shown on the very field it names
 * (uniqueness of the email, for one, can only be decided there).
 */
const props = defineProps<{ supplier?: Supplier | null }>()

const open = defineModel<boolean>({ required: true })

const emit = defineEmits<{ saved: [supplier: Supplier, isEdit: boolean] }>()

const store = useSuppliersStore()

const formRef = ref<VForm>()
const form = ref({ name: '', email: '', description: '' })
/** Per-field messages from the last rejected save, cleared as the user types. */
const serverErrors = ref<Record<string, string>>({})
/** Whatever the backend refused without naming a field — a conflict, a 500. */
const formError = ref<string | null>(null)
const saving = ref(false)

const isEdit = computed(() => Boolean(props.supplier))

// Reset on open rather than on close, so the fields do not visibly wipe
// themselves while the dialog is still fading out.
watch(open, (isOpen) => {
  if (!isOpen) return

  form.value = {
    name: props.supplier?.name ?? '',
    email: props.supplier?.email ?? '',
    description: props.supplier?.description ?? '',
  }
  serverErrors.value = {}
  formError.value = null
})

const required = (label: string) => (value: string) => !!value?.trim() || `Вкажіть ${label}`
const maxLength = (max: number) => (value: string) =>
  !value || value.length <= max || `Не більше ${max} символів`
const isEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value?.trim() ?? '') || 'Некоректний email'

const nameRules = [required('назву'), maxLength(255)]
const emailRules = [required('email'), isEmail, maxLength(255)]

function clearServerError(field: string) {
  if (field in serverErrors.value) delete serverErrors.value[field]
  formError.value = null
}

async function submit() {
  const validation = await formRef.value?.validate()
  if (!validation?.valid) return

  saving.value = true
  serverErrors.value = {}
  formError.value = null

  const payload: CreateSupplierDto = {
    name: form.value.name.trim(),
    email: form.value.email.trim().toLowerCase(),
    // An emptied description means "no description", not "leave it alone".
    description: form.value.description.trim() || null,
  }

  try {
    const saved = props.supplier
      ? await store.update(props.supplier.id, payload)
      : await store.create(payload)

    emit('saved', saved, isEdit.value)
    open.value = false
  } catch (err) {
    if (err instanceof ApiError) {
      // A 409 can only mean the email is taken — the one unique column on the
      // table — so it belongs on that field rather than in a banner above it.
      if (err.status === 409) serverErrors.value = { email: err.message }
      else serverErrors.value = err.fieldErrors

      if (!err.hasFieldErrors && err.status !== 409) formError.value = err.message
    } else {
      formError.value = 'Не вдалося зберегти постачальника'
    }
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <v-dialog v-model="open" max-width="520" :persistent="saving">
    <v-card>
      <!-- The form wraps the actions too, so the primary button can be a real
           submit and Enter inside a field saves the way it is expected to. -->
      <v-form ref="formRef" @submit.prevent="submit">
        <v-card-title>
          {{ isEdit ? 'Редагувати постачальника' : 'Новий постачальник' }}
        </v-card-title>

        <v-card-text class="d-flex flex-column ga-4">
          <v-alert v-if="formError" type="error" :text="formError" />

          <v-text-field
            v-model="form.name"
            label="Назва"
            placeholder="ТОВ «Ромашка»"
            autofocus
            :rules="nameRules"
            :error-messages="serverErrors.name"
            @update:model-value="clearServerError('name')"
          />

          <v-text-field
            v-model="form.email"
            label="Email"
            placeholder="sales@romashka.ua"
            type="email"
            :rules="emailRules"
            :error-messages="serverErrors.email"
            @update:model-value="clearServerError('email')"
          />

          <v-textarea
            v-model="form.description"
            label="Опис"
            placeholder="Постачає канцелярію"
            rows="3"
            auto-grow
            :error-messages="serverErrors.description"
            @update:model-value="clearServerError('description')"
          />
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" :disabled="saving" @click="open = false">Скасувати</v-btn>
          <v-btn type="submit" color="primary" variant="flat" :loading="saving">
            {{ isEdit ? 'Зберегти' : 'Створити' }}
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>
