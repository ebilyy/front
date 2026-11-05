<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import type { VForm } from 'vuetify/components'

import { ApiError, MAX_SHEET_ROW, SUPPLIER_CONFIG_CURRENCIES, supplierConfigsApi } from '@/core/api'
import type {
  CreateSupplierConfigDto,
  ImportField,
  ImportFieldKey,
  SupplierConfig,
  SupplierConfigCurrency,
} from '@/core/api'

/**
 * Create/edit form for a supplier's parsing config. Passing `config` switches
 * it to edit mode.
 *
 * The mapping is laid out as one row per registry field rather than a list of
 * free "column → field" pairs, so a field simply cannot be mapped twice and the
 * required ones are always in view. The client rules repeat the backend's
 * class-validator rules; whatever it still rejects comes back in
 * `ApiError.fieldErrors` and is shown on the input it names.
 */
const props = defineProps<{
  supplierId: number
  /** The import-field registry, in display order. */
  fields: ImportField[]
  config?: SupplierConfig | null
}>()

const open = defineModel<boolean>({ required: true })

const emit = defineEmits<{ saved: [config: SupplierConfig, isEdit: boolean] }>()

interface MappingDraft {
  column: string
  headerText: string
}

interface FormState {
  name: string
  sheetName: string
  /** Kept as typed: a number input still hands over a string. */
  headerRow: string
  currency: SupplierConfigCurrency
  mappings: Record<string, MappingDraft>
}

const CURRENCY_TITLES: Record<SupplierConfigCurrency, string> = {
  UAH: 'UAH — гривня',
  USD: 'USD — долар',
}
const currencyItems = SUPPLIER_CONFIG_CURRENCIES.map((value) => ({
  value,
  title: CURRENCY_TITLES[value],
}))

const formId = useId()
const formRef = ref<VForm>()
const form = ref<FormState>(blankState())
/** The form as it opened, to tell whether closing would throw edits away. */
const snapshot = ref('')
/** Per-input messages from the last rejected save, cleared as the user types. */
const serverErrors = ref<Record<string, string>>({})
/** Whatever the backend refused without naming an input — a 404, a 500. */
const formError = ref<string | null>(null)
const saving = ref(false)

const isEdit = computed(() => Boolean(props.config))
const dirty = computed(() => JSON.stringify(form.value) !== snapshot.value)

function blankState(): FormState {
  const byField = new Map(props.config?.columns.map((column) => [column.field, column]))

  return {
    name: props.config?.name ?? '',
    sheetName: props.config?.sheetName ?? '',
    headerRow: String(props.config?.headerRow ?? 1),
    currency: props.config?.currency ?? 'UAH',
    mappings: Object.fromEntries(
      props.fields.map((field) => {
        const mapped = byField.get(field.key)
        return [field.key, { column: mapped?.column ?? '', headerText: mapped?.headerText ?? '' }]
      }),
    ),
  }
}

// Reset on open rather than on close, so the fields do not visibly wipe
// themselves while the dialog is still fading out.
watch(open, (isOpen) => {
  if (!isOpen) return

  form.value = blankState()
  snapshot.value = JSON.stringify(form.value)
  serverErrors.value = {}
  formError.value = null
})

/** Mappings to fields the registry no longer has: the backend would refuse them. */
const droppedMappings = computed(() => {
  const registry = new Set<string>(props.fields.map((field) => field.key))
  return props.config?.columns.filter((column) => !registry.has(column.field)) ?? []
})

const letterOf = (value: string) => value.trim().toUpperCase()
const columnOf = (key: string) => letterOf(form.value.mappings[key]?.column ?? '')
const labelOf = (key: string) => props.fields.find((field) => field.key === key)?.label ?? key

// A cross-row rule cannot live in `:rules`: those re-run only for the input
// being edited, so the other half of a pair would keep a stale verdict.
const duplicateErrors = computed(() => {
  const owners = new Map<string, string[]>()
  for (const field of props.fields) {
    const letter = columnOf(field.key)
    if (letter) owners.set(letter, [...(owners.get(letter) ?? []), field.key])
  }

  const errors: Record<string, string> = {}
  for (const keys of owners.values()) {
    if (keys.length < 2) continue
    for (const key of keys) {
      errors[key] = `Також у: ${keys
        .filter((other) => other !== key)
        .map(labelOf)
        .join(', ')}`
    }
  }
  return errors
})

const required = (message: string) => (value: string) => !!value?.trim() || message
const maxLength = (max: number) => (value: string) =>
  !value || value.trim().length <= max || `Не більше ${max} символів`

const nameRules = [required('Вкажіть назву'), maxLength(255)]
const sheetNameRules = [maxLength(255)]
const headerRowRules = [
  (value: string) => /^\d+$/.test(value?.trim() ?? '') || 'Ціле число від 1',
  (value: string) => {
    const row = Number(value)
    return (row >= 1 && row <= MAX_SHEET_ROW) || `Від 1 до ${MAX_SHEET_ROW}`
  },
]
const headerTextRules = [maxLength(255)]

function columnRules(field: ImportField) {
  return [
    (value: string) => !field.required || !!letterOf(value) || 'Вкажіть колонку',
    (value: string) => !letterOf(value) || /^[A-Z]{1,3}$/.test(letterOf(value)) || 'Літери: A, AB',
  ]
}

function columnErrors(key: string) {
  return serverErrors.value[`column:${key}`] ?? duplicateErrors.value[key]
}

function clearServerError(key: string) {
  if (key in serverErrors.value) delete serverErrors.value[key]
  formError.value = null
}

const TOP_LEVEL_FIELDS = new Set(['name', 'sheetName', 'headerRow', 'currency'])

/**
 * Puts each backend message on the input it is about. `columns.3.column`
 * indexes the array as it was sent, hence `sentKeys` to translate it back to
 * a registry field; a message on `columns` as a whole goes to the banner.
 */
function placeServerErrors(err: ApiError, sentKeys: ImportFieldKey[]) {
  const placed: Record<string, string> = {}
  const unplaced: string[] = []

  for (const [path, message] of Object.entries(err.fieldErrors)) {
    const match = /^columns\.(\d+)\.(column|headerText)$/.exec(path)
    const key = match ? sentKeys[Number(match[1])] : undefined

    if (match && key) placed[`${match[2]}:${key}`] = message
    else if (TOP_LEVEL_FIELDS.has(path)) placed[path] = message
    else unplaced.push(message)
  }

  serverErrors.value = placed
  formError.value = unplaced.join('. ') || null
}

async function submit() {
  const validation = await formRef.value?.validate()
  if (!validation?.valid || Object.keys(duplicateErrors.value).length) return

  // Registry order, so the saved array reads the same way the form does.
  const mapped = props.fields.filter((field) => columnOf(field.key))
  const sentKeys = mapped.map((field) => field.key)

  const payload: CreateSupplierConfigDto = {
    name: form.value.name.trim(),
    // An emptied sheet name means "the first sheet", not "leave it alone".
    sheetName: form.value.sheetName.trim() || null,
    headerRow: Number(form.value.headerRow),
    currency: form.value.currency,
    columns: mapped.map((field) => ({
      field: field.key,
      column: columnOf(field.key),
      headerText: form.value.mappings[field.key]!.headerText.trim() || null,
    })),
  }

  saving.value = true
  serverErrors.value = {}
  formError.value = null

  try {
    const saved = props.config
      ? await supplierConfigsApi.update(props.supplierId, props.config.id, payload)
      : await supplierConfigsApi.create(props.supplierId, payload)

    emit('saved', saved, isEdit.value)
    open.value = false
  } catch (err) {
    if (!(err instanceof ApiError)) formError.value = 'Не вдалося зберегти конфіг'
    else if (err.hasFieldErrors) placeServerErrors(err, sentKeys)
    else formError.value = err.message
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <!-- Persistent once edited: a stray click outside would otherwise throw away
       a dozen filled-in inputs. Cancel still closes it on purpose. -->
  <v-dialog v-model="open" max-width="860" scrollable :persistent="saving || dirty">
    <v-card>
      <v-card-title>{{ isEdit ? 'Редагувати конфіг' : 'Новий конфіг' }}</v-card-title>

      <!-- The form lives inside the scrolling text so `scrollable` keeps the
           title and actions pinned; the submit button reaches it via `form`. -->
      <v-card-text>
        <v-form :id="formId" ref="formRef" @submit.prevent="submit">
          <div class="d-flex flex-column ga-4">
            <v-alert v-if="formError" type="error" :text="formError" />

            <v-alert v-if="droppedMappings.length" type="warning" variant="tonal" density="compact">
              Полів {{ droppedMappings.map((column) => column.field).join(', ') }} більше немає в
              реєстрі — їхні зіставлення буде прибрано під час збереження.
            </v-alert>

            <v-text-field
              v-model="form.name"
              label="Назва"
              placeholder="Основний прайс"
              autofocus
              :rules="nameRules"
              :error-messages="serverErrors.name"
              @update:model-value="clearServerError('name')"
            />

            <v-row dense>
              <v-col cols="12" sm="5">
                <v-text-field
                  v-model="form.sheetName"
                  label="Аркуш"
                  placeholder="Sheet1"
                  hint="Порожньо — перший аркуш книги"
                  persistent-hint
                  :rules="sheetNameRules"
                  :error-messages="serverErrors.sheetName"
                  @update:model-value="clearServerError('sheetName')"
                />
              </v-col>
              <v-col cols="6" sm="3">
                <v-text-field
                  v-model="form.headerRow"
                  label="Рядок заголовків"
                  type="number"
                  inputmode="numeric"
                  min="1"
                  :max="MAX_SHEET_ROW"
                  hint="Дані йдуть нижче"
                  persistent-hint
                  :rules="headerRowRules"
                  :error-messages="serverErrors.headerRow"
                  @update:model-value="clearServerError('headerRow')"
                />
              </v-col>
              <v-col cols="6" sm="4">
                <v-select
                  v-model="form.currency"
                  label="Валюта цін"
                  :items="currencyItems"
                  :error-messages="serverErrors.currency"
                  @update:model-value="clearServerError('currency')"
                />
              </v-col>
            </v-row>

            <div>
              <h3 class="text-subtitle-1 font-weight-medium">Колонки</h3>
              <p class="text-body-2 text-medium-emphasis">
                Літера колонки в аркуші для кожного поля, яке є у файлі. Заголовок — текст клітинки
                в рядку заголовків: за ним імпорт помітить, що постачальник пересунув колонки.
              </p>
            </div>

            <v-table density="compact" class="mapping">
              <thead>
                <tr>
                  <th>Поле</th>
                  <th class="mapping__column">Колонка</th>
                  <th>Заголовок у файлі</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="field in fields" :key="field.key">
                  <td class="py-2">
                    <div class="d-flex align-center flex-wrap ga-2">
                      <span class="font-weight-medium">{{ field.label }}</span>
                      <v-chip v-if="field.required" size="x-small" variant="tonal">
                        обов’язкове
                      </v-chip>
                    </div>
                    <div class="text-caption text-medium-emphasis">{{ field.description }}</div>
                  </td>
                  <td class="py-2">
                    <v-text-field
                      v-model="form.mappings[field.key]!.column"
                      class="mapping__letter"
                      variant="outlined"
                      density="compact"
                      hide-details="auto"
                      maxlength="3"
                      autocomplete="off"
                      spellcheck="false"
                      :aria-label="`Колонка для поля «${field.label}»`"
                      :rules="columnRules(field)"
                      :error-messages="columnErrors(field.key)"
                      @update:model-value="clearServerError(`column:${field.key}`)"
                    />
                  </td>
                  <td class="py-2">
                    <!-- Disabled rather than cleared while there is no column: retyping
                         a letter should not cost the header typed next to it. -->
                    <v-text-field
                      v-model="form.mappings[field.key]!.headerText"
                      variant="outlined"
                      density="compact"
                      hide-details="auto"
                      autocomplete="off"
                      :placeholder="columnOf(field.key) ? 'Без заголовка' : undefined"
                      :disabled="!columnOf(field.key)"
                      :aria-label="`Заголовок колонки для поля «${field.label}»`"
                      :rules="headerTextRules"
                      :error-messages="serverErrors[`headerText:${field.key}`]"
                      @update:model-value="clearServerError(`headerText:${field.key}`)"
                    />
                  </td>
                </tr>
              </tbody>
            </v-table>
          </div>
        </v-form>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" :disabled="saving" @click="open = false">Скасувати</v-btn>
        <v-btn type="submit" :form="formId" color="primary" variant="flat" :loading="saving">
          {{ isEdit ? 'Зберегти' : 'Створити' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.mapping__column {
  width: 168px;
}

.mapping__letter :deep(input) {
  text-transform: uppercase;
  font-weight: 600;
}

/* Rows already carry their own padding; the table only adds the frame. */
.mapping :deep(td) {
  vertical-align: top;
}
</style>
