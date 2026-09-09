<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    description?: string
    icon?: string
    /** `compact` fits inside a table body; `page` stands alone on a view. */
    size?: 'compact' | 'page'
  }>(),
  { icon: 'mdi-tray-remove', size: 'compact' },
)
</script>

<template>
  <div class="ds-empty" :class="`ds-empty--${size}`">
    <div class="ds-empty__icon">
      <v-icon :icon="icon" size="24" />
    </div>
    <p class="ds-empty__title">{{ title }}</p>
    <p v-if="description" class="ds-empty__description">{{ description }}</p>
    <div v-if="$slots.actions" class="ds-empty__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped>
.ds-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--ds-space-2);
}

.ds-empty--compact {
  padding: var(--ds-space-10) var(--ds-space-6);
}

.ds-empty--page {
  padding: var(--ds-space-20) var(--ds-space-6);
}

.ds-empty__icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  margin-bottom: var(--ds-space-1);
  border-radius: var(--ds-radius-full);
  background-color: var(--ds-fill-subtle);
  color: var(--ds-text-subtle);
}

.ds-empty__title {
  color: var(--ds-text);
  font-size: var(--ds-font-size-md);
  font-weight: var(--ds-font-weight-semibold);
}

.ds-empty__description {
  max-width: 44ch;
  color: var(--ds-text-muted);
}

.ds-empty__actions {
  margin-top: var(--ds-space-2);
}
</style>
