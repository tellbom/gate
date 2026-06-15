<!-- 放置路径：src/components/rbac/RbacProjectGlyph.vue -->
<template>
  <div :style="glyphStyle">{{ letter }}</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const TINT: Record<string, [string, string]> = {
  portal:   ['#e9f0fb', '#0066cc'],
  workflow: ['#eef0f4', '#3a3a3c'],
  message:  ['#eaf3ee', '#1a7f47'],
  news:     ['#f6efdc', '#9a6a00'],
  quality:  ['#efeaf7', '#6b4ea8'],
  rbac:     ['#fbeae9', '#b3261e'],
}

const props = withDefaults(defineProps<{
  code: string
  name?: string
  size?: number
}>(), { name: '', size: 36 })

const letter = computed(() => ((props.name || props.code || '?').trim()[0]).toUpperCase())

const glyphStyle = computed(() => {
  const [bg, fg] = TINT[props.code] ?? ['#eee', '#555']
  return {
    width:          `${props.size}px`,
    height:         `${props.size}px`,
    borderRadius:   '9px',
    background:     bg,
    color:          fg,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    fontFamily:     'var(--pc-font-display)',
    fontWeight:     '600',
    fontSize:       `${Math.round(props.size * 0.42)}px`,
    flexShrink:     '0',
    letterSpacing:  '-0.02em',
    userSelect:     'none' as const,
  }
})
</script>
