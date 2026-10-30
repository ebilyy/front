<script setup lang="ts">
import { ref, watch } from 'vue'
import type { VForm } from 'vuetify/components'

import {
  ApiError,
  FILES_FIELD,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
  MAX_FILES_PER_REQUEST,
} from '@/core/api'
import type { FileUpload } from '@/core/api'
import { useFilesStore } from '@/core/stores/files'

/**
 * Picks a batch of files (browse or drop onto the field) and sends it as one
 * `POST /files`.
 *
 * The client rules repeat the backend limits so a 50 MB file is refused
 * before it is sent rather than after, but the backend stays the authority:
 * what it rejects — a 413, or a 400 naming the `files` field — is shown on
 * the field itself.
 */
const open = defineModel<boolean>({ required: true })

const emit = defineEmits<{ uploaded: [files: FileUpload[]] }>()

const store = useFilesStore()

const formRef = ref<VForm>()
const files = ref<File[]>([])
/** The backend's verdict on the last batch, cleared once the selection changes. */
const serverError = ref<string | null>(null)
/** Whatever the backend refused without pointing at the files — a 500, no connection. */
const formError = ref<string | null>(null)
const uploading = ref(false)

// Reset on open rather than on close, so the selection does not visibly wipe
// itself while the dialog is still fading out.
watch(open, (isOpen) => {
  if (!isOpen) return

  files.value = []
  serverError.value = null
  formError.value = null
})

const fileRules = [
  (value: File[]) => value.length > 0 || 'Оберіть хоча б один файл',
  (value: File[]) =>
    value.length <= MAX_FILES_PER_REQUEST ||
    `Не більше ${MAX_FILES_PER_REQUEST} файлів за один раз`,
  (value: File[]) => {
    const tooBig = value.find((file) => file.size > MAX_FILE_SIZE_BYTES)
    return !tooBig || `Файл «${tooBig.name}» більший за ${MAX_FILE_SIZE_MB} МБ`
  },
]

function onSelectionChange() {
  serverError.value = null
  formError.value = null
}

async function submit() {
  const validation = await formRef.value?.validate()
  if (!validation?.valid) return

  uploading.value = true
  serverError.value = null
  formError.value = null

  try {
    const uploaded = await store.upload(files.value)
    emit('uploaded', uploaded)
    open.value = false
  } catch (err) {
    if (!(err instanceof ApiError)) {
      formError.value = 'Не вдалося завантажити файли'
    } else if (err.status === 413) {
      // A 413 only ever means a file over the size limit, and its message names it.
      serverError.value = err.message
    } else if (err.fieldErrors[FILES_FIELD]) {
      serverError.value = err.fieldErrors[FILES_FIELD]
    } else {
      formError.value = err.message
    }
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <v-dialog v-model="open" max-width="560" :persistent="uploading">
    <v-card>
      <v-form ref="formRef" @submit.prevent="submit">
        <v-card-title>Завантажити файли</v-card-title>

        <v-card-text class="d-flex flex-column ga-4">
          <v-alert v-if="formError" type="error" :text="formError" />

          <v-file-input
            v-model="files"
            label="Файли"
            :hint="`До ${MAX_FILES_PER_REQUEST} файлів, кожен до ${MAX_FILE_SIZE_MB} МБ. Можна перетягнути сюди.`"
            persistent-hint
            prepend-icon=""
            prepend-inner-icon="mdi-paperclip"
            multiple
            chips
            show-size
            counter
            :disabled="uploading"
            :rules="fileRules"
            :error-messages="serverError ?? undefined"
            @update:model-value="onSelectionChange"
          />
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" :disabled="uploading" @click="open = false">Скасувати</v-btn>
          <v-btn
            type="submit"
            color="primary"
            variant="flat"
            prepend-icon="mdi-upload"
            :loading="uploading"
          >
            Завантажити
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>
