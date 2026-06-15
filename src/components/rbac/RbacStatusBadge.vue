<!-- 放置路径：src/components/rbac/RbacStatusBadge.vue -->
<!-- 快捷封装：直接传 'Active' | 'Disabled' 自动选色 -->
<template>
  <RbacBadge :tone="tone" dot :size="size">{{ label }}</RbacBadge>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import RbacBadge from './RbacBadge.vue'

const props = withDefaults(defineProps<{
  status: 'Active' | 'Disabled'
  size?:  'sm' | 'md'
}>(), { size: 'sm' })

const tone  = computed(() => props.status === 'Active' ? 'ok' : 'neutral')
const label = computed(() => props.status === 'Active' ? '启用' : '禁用')
</script>
