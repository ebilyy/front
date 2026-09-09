<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <header class="ds-page-header">
    <div class="ds-page-header__text">
      <h1 class="ds-page-header__title">{{ title }}</h1>
      <p v-if="description" class="ds-page-header__description">{{ description }}</p>
      <slot name="meta" />
    </div>

    <div v-if="$slots.actions" class="ds-page-header__actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<style scoped>
.ds-page-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--ds-space-4);
  margin-bottom: var(--ds-space-6);
}

.ds-page-header__text {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
  min-width: 0;
}

.ds-page-header__title {
  font-size: var(--ds-font-size-2xl);
  line-height: var(--ds-line-height-2xl);
  font-weight: var(--ds-font-weight-semibold);
}

.ds-page-header__description {
  color: var(--ds-text-muted);
  font-size: var(--ds-font-size-md);
  line-height: var(--ds-line-height-md);
  max-width: 72ch;
}

.ds-page-header__actions {
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
}
</style>
