<script setup lang="ts">
import { computed, ref } from 'vue'

import {
  EmptyState,
  PageHeader,
  StatusBadge,
  fontSize,
  palette,
  radius,
  semanticColors,
  shadow,
  space,
  useAppTheme,
  type SemanticColorToken,
  type StatusTone,
} from '@/design-system'

const { activeTheme } = useAppTheme()

/**
 * Everything below is rendered from the token modules themselves, so this page
 * cannot drift from the system it documents — adding a token shows up here.
 */
const colorGroups: { title: string; tokens: SemanticColorToken[] }[] = [
  {
    title: 'Поверхні',
    tokens: ['canvas', 'surface', 'surface-raised', 'surface-sunken', 'surface-inverse'],
  },
  { title: 'Нейтральні заливки', tokens: ['fill-subtle', 'fill-muted', 'fill-strong'] },
  {
    title: 'Текст',
    tokens: ['text', 'text-muted', 'text-subtle', 'text-disabled', 'text-inverse'],
  },
  { title: 'Межі', tokens: ['border-subtle', 'border', 'border-strong', 'border-focus'] },
  {
    title: 'Primary — головна дія',
    tokens: [
      'primary',
      'primary-hover',
      'primary-active',
      'primary-fg',
      'primary-subtle',
      'primary-subtle-fg',
    ],
  },
  {
    title: 'Accent — фокус, лінки, вибір',
    tokens: [
      'accent',
      'accent-hover',
      'accent-fg',
      'accent-subtle',
      'accent-subtle-fg',
      'accent-border',
    ],
  },
  {
    title: 'Статуси',
    tokens: [
      'success',
      'success-subtle',
      'warning',
      'warning-subtle',
      'danger',
      'danger-subtle',
      'info',
      'info-subtle',
    ],
  },
]

const hexOf = (token: SemanticColorToken) => semanticColors[activeTheme.value][token]

/** Relative luminance, so each ramp label picks a readable ink for its stop. */
function isLight(hex: string) {
  const channel = (offset: number) => {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  }
  const luminance = 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5)
  return luminance > 0.45
}

const ramps = computed(() =>
  Object.entries(palette).map(([family, stops]) => ({
    family,
    stops: Object.entries(stops).map(([stop, hex]) => ({ stop, hex, light: isLight(hex) })),
  })),
)

const typeScale = Object.entries(fontSize).map(([name, [size, lineHeight]]) => ({
  name,
  size,
  lineHeight,
}))
const radiusScale = Object.entries(radius)
const spaceScale = Object.entries(space)
const shadowScale = Object.entries(shadow).filter(([name]) => name !== 'none')

const tones: StatusTone[] = ['neutral', 'accent', 'success', 'warning', 'danger', 'info']

const demo = ref({
  text: '',
  select: null as string | null,
  checkbox: true,
  radio: 'a',
  toggle: true,
  tab: 'overview',
})
</script>

<template>
  <PageHeader
    title="Дизайн-система"
    description="Живий довідник токенів і компонентів. Усе на сторінці читається напряму з
      src/design-system/tokens — перемкніть тему у шапці, щоб перевірити обидва режими."
  >
    <template #meta>
      <div class="mt-2">
        <StatusBadge
          :tone="activeTheme === 'dark' ? 'accent' : 'neutral'"
          :label="`Активна тема: ${activeTheme}`"
        />
      </div>
    </template>
  </PageHeader>

  <!-- Semantic colours -->
  <section class="section">
    <h2 class="section__title">Семантичні кольори</h2>
    <p class="section__hint">
      Компоненти використовують лише ці токени. Значення міняються разом із темою — імена ні.
    </p>

    <div v-for="group in colorGroups" :key="group.title" class="group">
      <h3 class="group__title">{{ group.title }}</h3>
      <div class="swatches">
        <div v-for="token in group.tokens" :key="token" class="swatch">
          <div class="swatch__chip" :style="{ backgroundColor: `var(--ds-${token})` }" />
          <code class="swatch__name">--ds-{{ token }}</code>
          <span class="swatch__hex">{{ hexOf(token) }}</span>
        </div>
      </div>
    </div>
  </section>

  <!-- Primitive ramps -->
  <section class="section">
    <h2 class="section__title">Примітивні рампи</h2>
    <p class="section__hint">
      Сировина системи. У продуктовому коді напряму не використовується — тільки як джерело для
      семантичних токенів. <code>neutral&nbsp;900</code> — брендовий <code>#1B1E23</code>.
    </p>

    <div v-for="ramp in ramps" :key="ramp.family" class="ramp">
      <span class="ramp__name">{{ ramp.family }}</span>
      <div class="ramp__stops">
        <div
          v-for="stop in ramp.stops"
          :key="stop.stop"
          class="ramp__stop"
          :style="{ backgroundColor: stop.hex }"
          :title="`${ramp.family} ${stop.stop} — ${stop.hex}`"
        >
          <span class="ramp__label" :class="{ 'ramp__label--on-light': stop.light }">
            {{ stop.stop }}
          </span>
        </div>
      </div>
    </div>
  </section>

  <!-- Type -->
  <section class="section">
    <h2 class="section__title">Типографіка</h2>
    <p class="section__hint">Inter, базовий розмір 14px — щільність, звична для адмінок.</p>

    <div class="type">
      <div v-for="item in typeScale" :key="item.name" class="type__row">
        <code class="type__name">{{ item.name }}</code>
        <span class="type__meta">{{ item.size }} / {{ item.lineHeight }}</span>
        <span class="type__sample" :style="{ fontSize: item.size, lineHeight: item.lineHeight }">
          Швидка бура лисиця
        </span>
      </div>
    </div>
  </section>

  <!-- Space, radius, elevation -->
  <section class="section section--split">
    <div>
      <h2 class="section__title">Відступи</h2>
      <p class="section__hint">Сітка 4px. Ключ = множник, тож <code>space.4</code> — 16px.</p>
      <div class="scale">
        <div v-for="[name, value] in spaceScale" :key="name" class="scale__row">
          <code class="scale__name">{{ name }}</code>
          <div class="scale__bar" :style="{ width: value }" />
          <span class="scale__value">{{ value }}</span>
        </div>
      </div>
    </div>

    <div>
      <h2 class="section__title">Радіуси</h2>
      <p class="section__hint">Радіуси компонентів Vuetify перевизначені у vuetify-bridge.css.</p>
      <div class="tiles">
        <div v-for="[name, value] in radiusScale" :key="name" class="tile">
          <div class="tile__box" :style="{ borderRadius: value }" />
          <code class="tile__name">{{ name }}</code>
          <span class="tile__value">{{ value }}</span>
        </div>
      </div>

      <h2 class="section__title mt-8">Тіні</h2>
      <p class="section__hint">Колір і сила тіні задаються темою, тож у темній вони глибші.</p>
      <div class="tiles">
        <div v-for="[name] in shadowScale" :key="name" class="tile">
          <div
            class="tile__box tile__box--shadow"
            :style="{ boxShadow: `var(--ds-shadow-${name})` }"
          />
          <code class="tile__name">{{ name }}</code>
        </div>
      </div>
    </div>
  </section>

  <!-- Buttons -->
  <section class="section">
    <h2 class="section__title">Кнопки</h2>
    <p class="section__hint">
      Дефолти задані глобально у <code>theme/defaults.ts</code> — звичайний
      <code>&lt;v-btn&gt;</code>
      вже виглядає правильно.
    </p>

    <v-card class="demo">
      <div class="row">
        <v-btn color="primary" variant="flat">Головна дія</v-btn>
        <v-btn>Другорядна</v-btn>
        <v-btn variant="text">Текстова</v-btn>
        <v-btn color="danger" variant="flat">Видалити</v-btn>
        <v-btn color="accent" variant="tonal">Тональна</v-btn>
        <v-btn disabled>Вимкнена</v-btn>
        <v-btn loading color="primary" variant="flat">Завантаження</v-btn>
      </div>
      <v-divider class="my-4" />
      <div class="row">
        <v-btn size="small">Small</v-btn>
        <v-btn>Default</v-btn>
        <v-btn size="large">Large</v-btn>
        <v-btn icon="mdi-pencil" variant="text" size="small" aria-label="Редагувати" />
        <v-btn prepend-icon="mdi-plus" color="primary" variant="flat">З іконкою</v-btn>
      </div>
    </v-card>
  </section>

  <!-- Form controls -->
  <section class="section">
    <h2 class="section__title">Поля та контроли</h2>
    <v-card class="demo">
      <div class="grid">
        <v-text-field v-model="demo.text" label="Назва схеми" />
        <v-text-field
          label="З підказкою"
          model-value="значення"
          hint="Допоміжний текст під полем"
          persistent-hint
        />
        <v-text-field label="З помилкою" model-value="12" :error-messages="['Мінімум 3 символи']" />
        <v-text-field label="Вимкнене" model-value="Недоступно" disabled />
        <v-select
          v-model="demo.select"
          label="Статус"
          :items="['Чернетка', 'На перевірці', 'Опубліковано']"
        />
        <v-textarea label="Опис" rows="3" />
      </div>

      <v-divider class="my-4" />

      <div class="row">
        <v-checkbox v-model="demo.checkbox" label="Активна" />
        <v-switch v-model="demo.toggle" label="Публічна" />
        <v-radio-group v-model="demo.radio" inline>
          <v-radio label="Усі" value="a" />
          <v-radio label="Мої" value="b" />
        </v-radio-group>
      </div>
    </v-card>
  </section>

  <!-- Status / feedback -->
  <section class="section">
    <h2 class="section__title">Статуси</h2>
    <v-card class="demo">
      <div class="row">
        <StatusBadge v-for="tone in tones" :key="tone" :tone="tone" :label="tone" />
      </div>
      <v-divider class="my-4" />
      <div class="row">
        <v-chip>Тег</v-chip>
        <v-chip color="accent">Accent</v-chip>
        <v-chip color="success">Успіх</v-chip>
        <v-chip color="warning">Увага</v-chip>
        <v-chip color="danger">Помилка</v-chip>
      </div>
      <v-divider class="my-4" />
      <div class="stack">
        <v-alert type="info" title="Інформація" text="Схему буде опубліковано після перевірки." />
        <v-alert type="success" text="Зміни збережено." />
        <v-alert type="warning" text="Два поля заповнені не повністю." />
        <v-alert type="error" text="Не вдалося зберегти — перевірте зʼєднання." />
      </div>
    </v-card>
  </section>

  <!-- Data display -->
  <section class="section">
    <h2 class="section__title">Дані</h2>
    <v-card class="demo">
      <v-tabs v-model="demo.tab">
        <v-tab value="overview">Огляд</v-tab>
        <v-tab value="history">Історія</v-tab>
        <v-tab value="access">Доступи</v-tab>
      </v-tabs>
      <v-divider />
      <div class="pt-4">
        <EmptyState
          title="Тут поки порожньо"
          description="Компонент EmptyState використовується всередині таблиць і на порожніх сторінках."
        >
          <template #actions>
            <v-btn color="primary" variant="flat" prepend-icon="mdi-plus">Додати запис</v-btn>
          </template>
        </EmptyState>
      </div>
      <v-divider class="mb-4" />
      <v-skeleton-loader type="table-row@3" />
    </v-card>
  </section>
</template>

<style scoped>
.section {
  margin-bottom: var(--ds-space-12);
}

.section--split {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: var(--ds-space-8);
}

.section__title {
  font-size: var(--ds-font-size-xl);
  line-height: var(--ds-line-height-xl);
  font-weight: var(--ds-font-weight-semibold);
}

.section__hint {
  margin-top: var(--ds-space-1);
  margin-bottom: var(--ds-space-4);
  max-width: 80ch;
  color: var(--ds-text-muted);
}

.group {
  margin-bottom: var(--ds-space-6);
}

.group__title {
  margin-bottom: var(--ds-space-2);
  color: var(--ds-text-muted);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-semibold);
  letter-spacing: var(--ds-tracking-wide);
  text-transform: uppercase;
}

.swatches {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: var(--ds-space-3);
}

.swatch {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--ds-space-2);
  border: 1px solid var(--ds-border);
  border-radius: var(--ds-radius-lg);
  background-color: var(--ds-surface);
}

.swatch__chip {
  height: 44px;
  border: 1px solid var(--ds-border);
  border-radius: var(--ds-radius-md);
}

.swatch__name {
  margin-top: var(--ds-space-1);
  font-size: var(--ds-font-size-2xs);
}

.swatch__hex {
  color: var(--ds-text-subtle);
  font-size: var(--ds-font-size-2xs);
}

.ramp {
  margin-bottom: var(--ds-space-3);
}

.ramp__name {
  display: block;
  margin-bottom: var(--ds-space-1);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-medium);
}

.ramp__stops {
  display: flex;
  overflow: hidden;
  border: 1px solid var(--ds-border);
  border-radius: var(--ds-radius-md);
}

.ramp__stop {
  flex: 1;
  display: grid;
  place-items: center;
  height: 48px;
  min-width: 0;
}

.ramp__label {
  color: var(--ds-color-neutral-0);
  font-size: var(--ds-font-size-2xs);
  font-weight: var(--ds-font-weight-medium);
}

.ramp__label--on-light {
  color: var(--ds-color-neutral-900);
}

.type__row {
  display: grid;
  grid-template-columns: 64px 100px 1fr;
  align-items: baseline;
  gap: var(--ds-space-4);
  padding: var(--ds-space-2) 0;
  border-bottom: 1px solid var(--ds-border-subtle);
}

.type__name {
  font-size: var(--ds-font-size-xs);
}

.type__meta {
  color: var(--ds-text-subtle);
  font-size: var(--ds-font-size-xs);
}

.type__sample {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.scale__row {
  display: grid;
  grid-template-columns: 40px 1fr 56px;
  align-items: center;
  gap: var(--ds-space-3);
  padding: var(--ds-space-1) 0;
}

.scale__name,
.scale__value {
  font-size: var(--ds-font-size-xs);
}

.scale__value {
  color: var(--ds-text-subtle);
  text-align: end;
}

.scale__bar {
  height: 12px;
  border-radius: var(--ds-radius-sm);
  background-color: var(--ds-accent);
}

.tiles {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-4);
}

.tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.tile__box {
  width: 64px;
  height: 48px;
  border: 1px solid var(--ds-border);
  background-color: var(--ds-fill-subtle);
}

.tile__box--shadow {
  border-color: transparent;
  border-radius: var(--ds-radius-lg);
  background-color: var(--ds-surface);
}

.tile__name,
.tile__value {
  font-size: var(--ds-font-size-2xs);
}

.tile__value {
  color: var(--ds-text-subtle);
}

.demo {
  padding: var(--ds-space-4);
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ds-space-3);
}

.stack {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-3);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--ds-space-4);
}
</style>
