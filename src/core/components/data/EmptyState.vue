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
  <div
    class="d-flex flex-column align-center text-center ga-2 px-6"
    :class="size === 'page' ? 'py-16' : 'py-10'"
  >
    <v-avatar :icon="icon" size="44" variant="tonal" class="mb-1 text-medium-emphasis" />
    <p class="text-subtitle-1 font-weight-medium">{{ title }}</p>
    <p v-if="description" class="empty__description text-body-2 text-medium-emphasis">
      {{ description }}
    </p>
    <div v-if="$slots.actions" class="mt-2">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped>
.empty__description {
  max-width: 44ch;
}
</style>
