<script setup lang="ts">
import { computed } from 'vue'

import type { StatusTone } from './status'

const props = withDefaults(
  defineProps<{
    tone?: StatusTone
    label: string
    /** Small filled circle before the label — reads faster in a dense table. */
    dot?: boolean
  }>(),
  { tone: 'neutral', dot: true },
)

/**
 * Each tone maps to the `*-subtle` token trio rather than a solid fill, so a
 * column of badges stays quiet next to the surrounding text in both themes.
 */
const toneVars = computed(() => {
  if (props.tone === 'neutral') {
    return {
      '--badge-bg': 'var(--ds-fill-subtle)',
      '--badge-fg': 'var(--ds-text-muted)',
      '--badge-border': 'var(--ds-border)',
      '--badge-dot': 'var(--ds-text-subtle)',
    }
  }
  return {
    '--badge-bg': `var(--ds-${props.tone}-subtle)`,
    '--badge-fg': `var(--ds-${props.tone}-subtle-fg)`,
    '--badge-border': `var(--ds-${props.tone}-border)`,
    '--badge-dot': `var(--ds-${props.tone})`,
  }
})
</script>

<template>
  <span class="ds-badge" :style="toneVars">
    <span v-if="dot" class="ds-badge__dot" aria-hidden="true" />
    {{ label }}
  </span>
</template>

<style scoped>
.ds-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--ds-space-1-5);
  padding: 2px var(--ds-space-2);
  border: 1px solid var(--badge-border);
  border-radius: var(--ds-radius-full);
  background-color: var(--badge-bg);
  color: var(--badge-fg);
  font-size: var(--ds-font-size-xs);
  line-height: var(--ds-line-height-xs);
  font-weight: var(--ds-font-weight-medium);
  white-space: nowrap;
}

.ds-badge__dot {
  width: 6px;
  height: 6px;
  border-radius: var(--ds-radius-full);
  background-color: var(--badge-dot);
}
</style>
