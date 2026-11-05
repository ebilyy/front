<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import { useDisplay } from 'vuetify'
import type { VForm } from 'vuetify/components'

import { ApiError, MAX_SHEET_ROW, SUPPLIER_CONFIG_CURRENCIES, supplierConfigsApi } from '@/core/api'
import type {
  CreateSupplierConfigDto,
  ImportField,
  ImportFieldKey,
  SupplierConfig,
  SupplierConfigCurrency,
} from '@/core/api'
import { EmptyState } from '@/core/components/data'
import {
  columnIndex,
  columnLetter,
  guessHeaderRow,
  PREVIEW_ROW_LIMIT,
  readWorkbookPreview,
  suggestMappings,
  type SheetPreview,
} from '@/core/xlsx'

/**
 * Builds a supplier's parsing config by pointing at a sample price list
 * instead of typing column letters. The file is read in the browser and never
 * uploaded; the operator clicks the header row's number and picks a field
 * above each column, and every header text is copied from the sample as is.
 *
 * It lives beside `SupplierConfigFormDialog` on purpose — same props, same
 * payload, same `saved` event — so both ways of filling a config can be tried
 * on the same configs. Opened on an existing config with a sample, it also
 * shows where the stored header texts no longer match the file.
 *
 * Without a sample it can only rename a config or change its currency: the
 * structure always comes from a file.
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
  /** Column letter, e.g. `D`. */
  column: string
  /** The header cell's text; `null` when the cell is blank. */
  headerText: string | null
}

interface FormState {
  name: string
  /** `null` — whichever sheet comes first in the workbook. */
  sheetName: string | null
  /** Kept as typed: a number input still hands over a string. */
  headerRow: string
  currency: SupplierConfigCurrency
  /** Only mapped fields have an entry, so a field cannot point at two columns. */
  mappings: Partial<Record<ImportFieldKey, MappingDraft>>
}

interface Sample {
  fileName: string
  sheets: SheetPreview[]
}

/** Excel forbids empty sheet names, so `''` can stand for "the first sheet". */
const FIRST_SHEET = ''
/** Rows on screen; more appear when the header row sits lower. */
const VISIBLE_ROWS = 60

const CURRENCY_TITLES: Record<SupplierConfigCurrency, string> = {
  UAH: 'UAH — гривня',
  USD: 'USD — долар',
}
const currencyItems = SUPPLIER_CONFIG_CURRENCIES.map((value) => ({
  value,
  title: CURRENCY_TITLES[value],
}))

const { smAndDown } = useDisplay()

const formId = useId()
const formRef = ref<VForm>()
const form = ref<FormState>(blankState())
/** The form as it opened, to tell whether closing would throw edits away. */
const snapshot = ref('')
const serverErrors = ref<Record<string, string>>({})
/** Whatever cannot be shown on one input: missing fields, a 404, a 500. */
const formError = ref<string | null>(null)
const saving = ref(false)

// The sample outlives the dialog: one file usually serves every config of a
// supplier, and keeping it is what makes opening config after config cheap.
const sample = ref<Sample | null>(null)
const sampleInput = ref<File | null>(null)
const reading = ref(false)
const readError = ref<string | null>(null)

const isEdit = computed(() => Boolean(props.config))
const dirty = computed(() => JSON.stringify(form.value) !== snapshot.value)

function blankState(): FormState {
  const registry = new Set<string>(props.fields.map((field) => field.key))

  return {
    name: props.config?.name ?? '',
    sheetName: props.config?.sheetName ?? null,
    headerRow: String(props.config?.headerRow ?? 1),
    currency: props.config?.currency ?? 'UAH',
    mappings: Object.fromEntries(
      (props.config?.columns ?? [])
        .filter((column) => registry.has(column.field))
        .map((column) => [column.field, { column: column.column, headerText: column.headerText }]),
    ),
  }
}

watch(open, (isOpen) => {
  if (!isOpen) return

  form.value = blankState()
  snapshot.value = JSON.stringify(form.value)
  serverErrors.value = {}
  formError.value = null
  readError.value = null
  // A sample kept from the previous config fills a new one straight away. An
  // existing config is left as stored, so the differences stay visible.
  if (!isEdit.value && sample.value) applySuggestions()
})

// The page reuses this instance when it moves to another supplier, whose
// files look nothing like this one's.
watch(
  () => props.supplierId,
  () => {
    sample.value = null
    sampleInput.value = null
  },
)

/** Mappings to fields the registry no longer has: the backend would refuse them. */
const droppedMappings = computed(() => {
  const registry = new Set<string>(props.fields.map((field) => field.key))
  return props.config?.columns.filter((column) => !registry.has(column.field)) ?? []
})

const mappingEntries = computed(
  () => Object.entries(form.value.mappings) as [ImportFieldKey, MappingDraft][],
)
const fieldByColumn = computed(
  () => new Map(mappingEntries.value.map(([key, mapping]) => [mapping.column, key])),
)
const labelOf = (key: string) => props.fields.find((field) => field.key === key)?.label ?? key

const missingRequired = computed(() =>
  props.fields.filter((field) => field.required && !form.value.mappings[field.key]),
)

/* ---------- Sample ---------- */

const sheets = computed(() => sample.value?.sheets ?? [])

const activeSheet = computed(() =>
  form.value.sheetName === null
    ? sheets.value[0]
    : sheets.value.find((sheet) => sheet.name === form.value.sheetName),
)

const sheetMissing = computed(() => Boolean(sample.value) && !activeSheet.value)

const sheetItems = computed(() => {
  const first = sheets.value[0]
  const items = [
    {
      value: FIRST_SHEET,
      title: first ? `Перший аркуш — зараз «${first.name}»` : 'Перший аркуш',
    },
    ...sheets.value.map((sheet) => ({ value: sheet.name, title: sheet.name })),
  ]
  if (sheetMissing.value && form.value.sheetName !== null) {
    items.push({ value: form.value.sheetName, title: `${form.value.sheetName} — немає у зразку` })
  }
  return items
})

const sheetChoice = computed(() => form.value.sheetName ?? FIRST_SHEET)

/** `null` while the input does not hold a valid row number. */
const headerRow = computed(() => {
  const value = form.value.headerRow.trim()
  if (!/^\d+$/.test(value)) return null
  const row = Number(value)
  return row >= 1 && row <= MAX_SHEET_ROW ? row : null
})

/**
 * The header text the sample has for a column: `null` for a blank cell,
 * `undefined` when the preview does not reach that far and there is no way
 * to tell.
 */
function sampleHeaderText(column: number): string | null | undefined {
  const sheet = activeSheet.value
  const row = headerRow.value
  if (!sheet || row === null || column < 0) return undefined

  const cells = sheet.grid[row - 1]
  // Below the last filled row is blank — unless the preview stopped early.
  if (!cells) return row > PREVIEW_ROW_LIMIT ? undefined : null
  if (column >= cells.length) return column < sheet.totalColumns ? undefined : null
  return cells[column]!.trim() || null
}

/** Re-reads every mapped column's header text from the sample. */
function refreshHeaderTexts() {
  for (const [, mapping] of mappingEntries.value) {
    const text = sampleHeaderText(columnIndex(mapping.column))
    if (text !== undefined) mapping.headerText = text
  }
}

/** Fields whose stored header text differs from the sample's, with the sample's. */
const headerMismatches = computed(() => {
  const mismatches = new Map<ImportFieldKey, string | null>()
  for (const [key, mapping] of mappingEntries.value) {
    const text = sampleHeaderText(columnIndex(mapping.column))
    if (text !== undefined && text !== mapping.headerText) mismatches.set(key, text)
  }
  return mismatches
})

/** Guesses the header row, then a field for each column it names. */
function applySuggestions() {
  const sheet = activeSheet.value
  if (!sheet) return

  const keys = props.fields.map((field) => field.key)
  const row = guessHeaderRow(sheet.grid, keys)
  form.value.headerRow = String(row)

  const suggested = suggestMappings(sheet.grid[row - 1] ?? [], keys)
  form.value.mappings = Object.fromEntries(
    [...suggested].map(([key, column]) => [
      key,
      { column: columnLetter(column), headerText: sampleHeaderText(column) ?? null },
    ]),
  )
}

async function onSampleInput(value: File | File[] | null) {
  const file = Array.isArray(value) ? value[0] : value
  sampleInput.value = file ?? null
  readError.value = null

  if (!file) {
    sample.value = null
    return
  }

  reading.value = true
  try {
    // Parsing holds the thread for up to a couple of seconds on a big .xls;
    // let the progress bar paint first.
    await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve)))
    sample.value = { fileName: file.name, sheets: await readWorkbookPreview(file) }
    if (!isEdit.value) applySuggestions()
  } catch {
    sample.value = null
    readError.value = `Не вдалося прочитати «${file.name}». Потрібен .xls або .xlsx без пароля.`
  } finally {
    reading.value = false
  }
}

function onSheetChoice(choice: string) {
  form.value.sheetName = choice === FIRST_SHEET ? null : choice
  clearServerError('sheetName')
  refreshHeaderTexts()
}

function onHeaderRowInput(value: string) {
  form.value.headerRow = value
  clearServerError('headerRow')
  if (headerRow.value !== null) refreshHeaderTexts()
}

function pickHeaderRow(row: number) {
  onHeaderRowInput(String(row))
}

/** Gives `column` to `key` (taking it from wherever it was), or frees it with `null`. */
function assignColumn(column: number, key: ImportFieldKey | null) {
  const letter = columnLetter(column)
  const mappings: FormState['mappings'] = {}

  for (const [other, mapping] of mappingEntries.value) {
    if (mapping.column !== letter && other !== key) mappings[other] = mapping
  }
  if (key) mappings[key] = { column: letter, headerText: sampleHeaderText(column) ?? null }

  form.value.mappings = mappings
  formError.value = null
}

function clearField(key: ImportFieldKey) {
  const mappings = { ...form.value.mappings }
  delete mappings[key]
  form.value.mappings = mappings
}

/* ---------- Grid ---------- */

interface GridCell {
  column: number
  text: string
  rowspan: number
  colspan: number
}

const visibleRowCount = computed(() => {
  const sheet = activeSheet.value
  if (!sheet) return 0
  return Math.min(sheet.grid.length, Math.max(VISIBLE_ROWS, (headerRow.value ?? 0) + 20))
})

const gridColumns = computed(() =>
  Array.from({ length: activeSheet.value?.grid[0]?.length ?? 0 }, (_, index) => {
    const letter = columnLetter(index)
    return { index, letter, field: fieldByColumn.value.get(letter) }
  }),
)

/** Rows to draw, with merged cells as one spanning cell — as Excel shows them. */
const gridRows = computed(() => {
  const sheet = activeSheet.value
  if (!sheet) return []

  const count = visibleRowCount.value
  const spans = new Map<string, { rowspan: number; colspan: number }>()
  const covered = new Set<string>()

  for (const merge of sheet.merges) {
    if (merge.s.r >= count) continue
    const lastRow = Math.min(merge.e.r, count - 1)
    spans.set(`${merge.s.r}:${merge.s.c}`, {
      rowspan: lastRow - merge.s.r + 1,
      colspan: merge.e.c - merge.s.c + 1,
    })
    for (let r = merge.s.r; r <= lastRow; r++) {
      for (let c = merge.s.c; c <= merge.e.c; c++) {
        if (r !== merge.s.r || c !== merge.s.c) covered.add(`${r}:${c}`)
      }
    }
  }

  return sheet.grid.slice(0, count).map((cells, r) => ({
    number: r + 1,
    cells: cells.flatMap<GridCell>((text, column) =>
      covered.has(`${r}:${column}`)
        ? []
        : [{ column, text, ...(spans.get(`${r}:${column}`) ?? { rowspan: 1, colspan: 1 }) }],
    ),
  }))
})

const gridCaption = computed(() => {
  const sheet = activeSheet.value
  if (!sheet) return ''

  const rows = `Показано ${visibleRowCount.value} з ${sheet.totalRows} рядків`
  const width = sheet.grid[0]?.length ?? 0
  return sheet.totalColumns > width
    ? `${rows} · перші ${width} з ${sheet.totalColumns} колонок`
    : rows
})

const headerRowBlank = computed(
  () =>
    Boolean(activeSheet.value) &&
    headerRow.value !== null &&
    !activeSheet.value!.grid[headerRow.value - 1]?.some((cell) => cell.trim()),
)

/* ---------- Saving ---------- */

const required = (message: string) => (value: string) => !!value?.trim() || message
const nameRules = [
  required('Вкажіть назву'),
  (value: string) => !value || value.trim().length <= 255 || 'Не більше 255 символів',
]
const headerRowRules = [
  (value: string) => /^\d+$/.test(value?.trim() ?? '') || 'Ціле число від 1',
  (value: string) => {
    const row = Number(value)
    return (row >= 1 && row <= MAX_SHEET_ROW) || `Від 1 до ${MAX_SHEET_ROW}`
  },
]

function clearServerError(key: string) {
  if (key in serverErrors.value) delete serverErrors.value[key]
  formError.value = null
}

const TOP_LEVEL_FIELDS = new Set(['name', 'sheetName', 'headerRow', 'currency'])

/**
 * Top-level messages go on their inputs. A column message names the field it
 * is about — `columns.3` indexes the array as sent — and joins the banner,
 * since a column has no input of its own here.
 */
function placeServerErrors(err: ApiError, sentKeys: ImportFieldKey[]) {
  const placed: Record<string, string> = {}
  const unplaced: string[] = []

  for (const [path, message] of Object.entries(err.fieldErrors)) {
    const key = sentKeys[Number(/^columns\.(\d+)\./.exec(path)?.[1] ?? NaN)]
    if (TOP_LEVEL_FIELDS.has(path)) placed[path] = message
    else unplaced.push(key ? `${labelOf(key)}: ${message}` : message)
  }

  serverErrors.value = placed
  formError.value = unplaced.join('. ') || null
}

async function submit() {
  const validation = await formRef.value?.validate()
  if (!validation?.valid) return

  if (missingRequired.value.length) {
    formError.value = `Виберіть колонки для полів: ${missingRequired.value
      .map((field) => field.label)
      .join(', ')}`
    return
  }

  const tooLong = mappingEntries.value.find(
    ([, mapping]) => (mapping.headerText?.length ?? 0) > 255,
  )
  if (tooLong) {
    formError.value = `Заголовок колонки ${tooLong[1].column} довший за 255 символів`
    return
  }

  // Registry order, so the saved array reads the same as the other form's.
  const mapped = props.fields.filter((field) => form.value.mappings[field.key])
  const sentKeys = mapped.map((field) => field.key)

  const payload: CreateSupplierConfigDto = {
    name: form.value.name.trim(),
    sheetName: form.value.sheetName,
    headerRow: Number(form.value.headerRow),
    currency: form.value.currency,
    columns: mapped.map((field) => {
      const mapping = form.value.mappings[field.key]!
      return {
        field: field.key,
        column: mapping.column,
        headerText: mapping.headerText?.trim() || null,
      }
    }),
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
  <v-dialog
    v-model="open"
    max-width="1440"
    scrollable
    :fullscreen="smAndDown"
    :persistent="saving || reading || dirty"
  >
    <v-card>
      <v-card-item>
        <v-card-title>
          {{ isEdit ? 'Конфіг за зразком' : 'Новий конфіг за зразком' }}
        </v-card-title>
        <v-card-subtitle>
          Відкрийте прайс постачальника, клацніть номер рядка із заголовками й виберіть поле над
          кожною потрібною колонкою.
        </v-card-subtitle>
      </v-card-item>

      <v-card-text>
        <v-form :id="formId" ref="formRef" @submit.prevent="submit">
          <div class="d-flex flex-column ga-4">
            <v-alert v-if="formError" type="error" :text="formError" />

            <v-alert v-if="droppedMappings.length" type="warning" variant="tonal" density="compact">
              Полів {{ droppedMappings.map((column) => column.field).join(', ') }} більше немає в
              реєстрі — їхні зіставлення буде прибрано під час збереження.
            </v-alert>

            <v-row dense>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="form.name"
                  label="Назва"
                  placeholder="Основний прайс"
                  :rules="nameRules"
                  :error-messages="serverErrors.name"
                  @update:model-value="clearServerError('name')"
                />
              </v-col>
              <v-col cols="12" sm="4" md="2">
                <v-select
                  v-model="form.currency"
                  label="Валюта цін"
                  :items="currencyItems"
                  :error-messages="serverErrors.currency"
                  @update:model-value="clearServerError('currency')"
                />
              </v-col>
              <v-col cols="12" sm="8" md="6">
                <v-file-input
                  :model-value="sampleInput"
                  label="Зразок прайсу (.xls, .xlsx)"
                  accept=".xls,.xlsx"
                  prepend-icon=""
                  prepend-inner-icon="mdi-file-table-outline"
                  hint="Файл читається в браузері й нікуди не завантажується"
                  persistent-hint
                  show-size
                  :loading="reading"
                  :error-messages="readError ?? undefined"
                  @update:model-value="onSampleInput"
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12" lg="8" xl="9" class="d-flex flex-column ga-3 sample">
                <template v-if="sample">
                  <div class="d-flex flex-wrap align-center ga-3">
                    <v-select
                      :model-value="sheetChoice"
                      label="Аркуш"
                      :items="sheetItems"
                      density="compact"
                      hide-details="auto"
                      class="sample__sheet"
                      :error-messages="serverErrors.sheetName"
                      @update:model-value="onSheetChoice"
                    />
                    <v-text-field
                      :model-value="form.headerRow"
                      label="Рядок заголовків"
                      type="number"
                      inputmode="numeric"
                      min="1"
                      :max="MAX_SHEET_ROW"
                      density="compact"
                      hide-details="auto"
                      class="sample__row"
                      :rules="headerRowRules"
                      :error-messages="serverErrors.headerRow"
                      @update:model-value="onHeaderRowInput"
                    />
                    <v-btn
                      variant="tonal"
                      prepend-icon="mdi-auto-fix"
                      :disabled="!activeSheet"
                      @click="applySuggestions"
                    >
                      Підказати колонки
                    </v-btn>
                    <v-btn
                      v-if="headerMismatches.size"
                      variant="tonal"
                      color="warning"
                      prepend-icon="mdi-sync"
                      @click="refreshHeaderTexts"
                    >
                      Взяти заголовки зі зразка ({{ headerMismatches.size }})
                    </v-btn>
                  </div>

                  <v-alert v-if="sheetMissing" type="warning" variant="tonal" density="compact">
                    У зразку «{{ sample.fileName }}» немає аркуша «{{ form.sheetName }}». Виберіть
                    аркуш зі списку, або це файл іншого постачальника.
                  </v-alert>
                  <v-alert v-else-if="headerRowBlank" type="info" variant="tonal" density="compact">
                    Рядок {{ headerRow }} у зразку порожній: заголовків там немає.
                  </v-alert>

                  <v-progress-linear v-if="reading" indeterminate color="primary" />

                  <div v-if="activeSheet && gridRows.length" class="sheet-scroll">
                    <table class="sheet">
                      <thead>
                        <tr>
                          <th class="sheet__corner" scope="col">
                            <span class="text-caption text-medium-emphasis">Рядок</span>
                          </th>
                          <th
                            v-for="column in gridColumns"
                            :key="column.index"
                            scope="col"
                            :class="{ 'is-mapped': column.field }"
                          >
                            <div class="sheet__letter">{{ column.letter }}</div>
                            <v-menu location="bottom start">
                              <template #activator="{ props: menuProps }">
                                <v-btn
                                  v-bind="menuProps"
                                  block
                                  size="small"
                                  :variant="column.field ? 'flat' : 'text'"
                                  :color="column.field ? 'primary' : undefined"
                                  append-icon="mdi-menu-down"
                                  class="sheet__field"
                                  :aria-label="`Поле для колонки ${column.letter}`"
                                >
                                  {{ column.field ? labelOf(column.field) : '—' }}
                                </v-btn>
                              </template>
                              <v-list density="compact" min-width="240">
                                <v-list-subheader>Колонка {{ column.letter }}</v-list-subheader>
                                <!-- First, not last: at the bottom of eleven fields it
                                     ended up below the fold on a short screen. -->
                                <template v-if="column.field">
                                  <v-list-item
                                    prepend-icon="mdi-close"
                                    title="Не імпортувати"
                                    @click="assignColumn(column.index, null)"
                                  />
                                  <v-divider class="my-1" />
                                </template>
                                <v-list-item
                                  v-for="field in fields"
                                  :key="field.key"
                                  :active="column.field === field.key"
                                  color="primary"
                                  @click="assignColumn(column.index, field.key)"
                                >
                                  <v-list-item-title>
                                    {{ field.label }}
                                    <span v-if="field.required" class="text-error">*</span>
                                  </v-list-item-title>
                                  <template
                                    v-if="
                                      form.mappings[field.key] &&
                                      form.mappings[field.key]!.column !== column.letter
                                    "
                                    #append
                                  >
                                    <span class="text-caption text-medium-emphasis">
                                      зараз у {{ form.mappings[field.key]!.column }}
                                    </span>
                                  </template>
                                </v-list-item>
                              </v-list>
                            </v-menu>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="row in gridRows"
                          :key="row.number"
                          :class="{
                            'is-header': row.number === headerRow,
                            'is-above': headerRow !== null && row.number < headerRow,
                          }"
                        >
                          <th scope="row" class="sheet__rownum">
                            <button
                              type="button"
                              class="sheet__rowbtn"
                              :aria-pressed="row.number === headerRow"
                              :title="`Заголовки в рядку ${row.number}`"
                              @click="pickHeaderRow(row.number)"
                            >
                              {{ row.number }}
                            </button>
                          </th>
                          <td
                            v-for="cell in row.cells"
                            :key="cell.column"
                            :rowspan="cell.rowspan > 1 ? cell.rowspan : undefined"
                            :colspan="cell.colspan > 1 ? cell.colspan : undefined"
                            :class="{ 'is-mapped': gridColumns[cell.column]?.field }"
                            :title="cell.text || undefined"
                          >
                            {{ cell.text }}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <EmptyState
                    v-else-if="activeSheet"
                    icon="mdi-table-off"
                    title="Аркуш порожній"
                    description="Виберіть інший аркуш зразка."
                  />

                  <p
                    v-if="activeSheet && gridRows.length"
                    class="text-caption text-medium-emphasis"
                  >
                    {{ gridCaption }}. Злиті клітинки показано як у Excel: текст лежить у лівій
                    верхній, решта для імпорту порожні.
                  </p>
                </template>

                <v-sheet v-else border rounded class="sample__empty">
                  <v-progress-linear v-if="reading" indeterminate color="primary" absolute />
                  <EmptyState
                    icon="mdi-file-table-outline"
                    :title="reading ? 'Читаю файл…' : 'Відкрийте зразок прайсу'"
                    :description="
                      isEdit
                        ? `Зараз: ${config?.sheetName ?? 'перший аркуш'}, заголовки в рядку ${config?.headerRow}. Зі зразком видно, де колонки й заголовки розійшлися з файлом.`
                        : 'Ви побачите аркуш як у Excel; рядок заголовків і колонки підкажуться самі.'
                    "
                  />
                </v-sheet>
              </v-col>

              <v-col cols="12" lg="4" xl="3">
                <v-card variant="outlined" class="summary">
                  <v-card-item>
                    <v-card-title class="text-subtitle-1">Зіставлення</v-card-title>
                    <v-card-subtitle>
                      {{ form.sheetName ?? 'Перший аркуш' }} · заголовки в рядку
                      {{ form.headerRow || '—' }}
                    </v-card-subtitle>
                  </v-card-item>
                  <v-divider />
                  <v-list density="compact" class="py-0">
                    <v-list-item v-for="field in fields" :key="field.key" class="summary__item">
                      <v-list-item-title class="d-flex align-center ga-2">
                        <span :class="{ 'text-medium-emphasis': !form.mappings[field.key] }">
                          {{ field.label }}
                        </span>
                        <v-chip
                          v-if="field.required"
                          size="x-small"
                          variant="tonal"
                          :color="form.mappings[field.key] ? undefined : 'error'"
                        >
                          обов’язкове
                        </v-chip>
                      </v-list-item-title>

                      <v-list-item-subtitle v-if="form.mappings[field.key]">
                        <template v-if="form.mappings[field.key]!.headerText">
                          «{{ form.mappings[field.key]!.headerText }}»
                        </template>
                        <template v-else>без заголовка</template>
                      </v-list-item-subtitle>
                      <v-list-item-subtitle v-else>не вибрано</v-list-item-subtitle>

                      <div
                        v-if="headerMismatches.has(field.key)"
                        class="text-caption text-warning mt-1"
                      >
                        <v-icon icon="mdi-alert-outline" size="14" />
                        У зразку:
                        {{
                          headerMismatches.get(field.key)
                            ? `«${headerMismatches.get(field.key)}»`
                            : 'клітинка порожня'
                        }}
                      </div>

                      <template v-if="form.mappings[field.key]" #append>
                        <code class="column-letter">{{ form.mappings[field.key]!.column }}</code>
                        <v-btn
                          icon="mdi-close"
                          variant="text"
                          size="x-small"
                          class="ms-1"
                          :aria-label="`Прибрати колонку для поля «${field.label}»`"
                          @click="clearField(field.key)"
                        />
                      </template>
                    </v-list-item>
                  </v-list>
                </v-card>
              </v-col>
            </v-row>
          </div>
        </v-form>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <span v-if="missingRequired.length" class="text-body-2 text-medium-emphasis ps-2">
          Не вибрано: {{ missingRequired.map((field) => field.label).join(', ') }}
        </span>
        <v-spacer />
        <v-btn variant="text" :disabled="saving" @click="open = false">Скасувати</v-btn>
        <v-btn
          type="submit"
          :form="formId"
          color="primary"
          variant="flat"
          :loading="saving"
          :disabled="reading"
        >
          {{ isEdit ? 'Зберегти' : 'Створити' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.sample {
  min-width: 0;
}

.sample__sheet {
  flex: 1 1 240px;
  max-width: 360px;
}

.sample__row {
  flex: 0 0 168px;
}

.sample__empty {
  position: relative;
  overflow: hidden;
}

.sheet-scroll {
  overflow: auto;
  max-height: min(60vh, 640px);
  border: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
}

.sheet {
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.8125rem;
  line-height: 1.35;
}

.sheet th,
.sheet td {
  border-right: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-bottom: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  background-color: rgb(var(--v-theme-surface));
  padding: 4px 8px;
  max-width: 260px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: left;
  vertical-align: top;
}

/* Sticky cells need an opaque background; tints are layered over it as images. */
.sheet thead th {
  position: sticky;
  top: 0;
  z-index: 2;
  min-width: 132px;
  padding: 4px;
  font-weight: 500;
}

.sheet__rownum,
.sheet__corner {
  position: sticky;
  left: 0;
  z-index: 1;
  min-width: 0 !important;
  padding: 0 !important;
  text-align: center !important;
}

.sheet thead .sheet__corner {
  z-index: 3;
  padding: 4px 8px !important;
  vertical-align: bottom;
}

.sheet__letter {
  font-weight: 600;
  text-align: center;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  padding-bottom: 2px;
}

.sheet__field {
  text-transform: none;
  letter-spacing: normal;
  justify-content: space-between;
}

.sheet__rowbtn {
  display: block;
  width: 100%;
  min-width: 48px;
  padding: 4px 8px;
  font-variant-numeric: tabular-nums;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  cursor: pointer;
}

.sheet__rowbtn:hover,
.sheet__rowbtn:focus-visible {
  background: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
  outline: none;
}

.sheet .is-mapped {
  background-image: linear-gradient(
    rgba(var(--v-theme-primary), 0.06),
    rgba(var(--v-theme-primary), 0.06)
  );
}

.sheet .is-header > * {
  font-weight: 600;
  background-image: linear-gradient(
    rgba(var(--v-theme-primary), 0.16),
    rgba(var(--v-theme-primary), 0.16)
  );
}

.sheet .is-header .sheet__rowbtn {
  color: rgb(var(--v-theme-primary));
}

.sheet .is-above td {
  color: rgba(var(--v-theme-on-surface), var(--v-disabled-opacity));
}

.summary__item :deep(.v-list-item-subtitle) {
  white-space: normal;
  -webkit-line-clamp: 3;
}

.column-letter {
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(var(--v-theme-on-surface), 0.06);
}
</style>
