<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <header class="d-flex flex-wrap align-start justify-space-between ga-4 mb-6">
    <div class="page-header__text d-flex flex-column ga-1">
      <h1 class="text-h5 font-weight-medium">{{ title }}</h1>
      <p v-if="description" class="page-header__description text-body-1 text-medium-emphasis">
        {{ description }}
      </p>
      <slot name="meta" />
    </div>

    <div v-if="$slots.actions" class="d-flex align-center ga-2">
      <slot name="actions" />
    </div>
  </header>
</template>

<style scoped>
.page-header__text {
  min-width: 0;
}

.page-header__description {
  max-width: 72ch;
}
</style>
