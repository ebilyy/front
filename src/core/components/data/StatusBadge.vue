<script setup lang="ts">
import type { StatusTone } from './status'

withDefaults(
  defineProps<{
    tone?: StatusTone
    label: string
    /** Small filled circle before the label — reads faster in a dense table. */
    dot?: boolean
  }>(),
  { tone: 'neutral', dot: true },
)
</script>

<template>
  <!-- `tonal` keeps a column of badges quiet next to the surrounding text. -->
  <v-chip :color="tone === 'neutral' ? undefined : tone" size="small" variant="tonal">
    <v-icon v-if="dot" icon="mdi-circle" size="8" start />
    {{ label }}
  </v-chip>
</template>
