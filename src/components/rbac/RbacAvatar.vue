<!-- 放置路径：src/components/rbac/RbacAvatar.vue -->
<template>
  <div :style="avatarStyle">{{ letter }}</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  name: string
  size?: number
  dim?: boolean
}>(), { size: 32, dim: false })

const letter = computed(() => (props.name || '?').trim()[0].toUpperCase())

const avatarStyle = computed(() => {
  const hue = ((props.name || '').charCodeAt(0) * 47) % 360
  return {
    width:          `${props.size}px`,
    height:         `${props.size}px`,
    borderRadius:   '50%',
    flexShrink:     '0',
    background:     props.dim ? '#ededf0' : `oklch(0.92 0.04 ${hue})`,
    color:          props.dim ? '#9a9aa0' : `oklch(0.42 0.09 ${hue})`,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    fontWeight:     '600',
    fontSize:       `${Math.round(props.size * 0.42)}px`,
    fontFamily:     'var(--pc-font-display)',
    userSelect:     'none' as const,
  }
})
</script>
