<script setup lang="ts">
/**
 * A yes/no gate in front of an action that cannot be taken back.
 *
 * The dialog does not run the action itself: it emits `confirm` and stays open
 * while the caller flips `loading`, so a failed request can keep the question
 * on screen instead of closing over an error the user never sees.
 */
withDefaults(
  defineProps<{
    title: string
    message?: string
    confirmLabel?: string
    cancelLabel?: string
    loading?: boolean
    /** `danger` for destructive actions — matches the button colour tokens. */
    tone?: 'primary' | 'danger'
  }>(),
  {
    confirmLabel: 'Підтвердити',
    cancelLabel: 'Скасувати',
    tone: 'primary',
  },
)

const open = defineModel<boolean>({ required: true })

defineEmits<{ confirm: [] }>()
</script>

<template>
  <v-dialog v-model="open" max-width="420" :persistent="loading">
    <v-card>
      <v-card-title>{{ title }}</v-card-title>

      <v-card-text v-if="message || $slots.default">
        <slot>{{ message }}</slot>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" :disabled="loading" @click="open = false">{{ cancelLabel }}</v-btn>
        <v-btn :color="tone" variant="flat" :loading="loading" @click="$emit('confirm')">
          {{ confirmLabel }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
