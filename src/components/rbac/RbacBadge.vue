<!-- 放置路径：src/components/rbac/RbacBadge.vue -->
<template>
  <span :class="['pc-badge', `pc-badge--${tone}`, `pc-badge--${size}`]">
    <span v-if="dot" class="pc-badge__dot" />
    <slot />
  </span>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  tone?: 'ok' | 'warn' | 'deny' | 'blue' | 'super' | 'neutral'
  dot?:  boolean
  size?: 'sm' | 'md'
}>(), { tone: 'neutral', dot: false, size: 'md' })
</script>
