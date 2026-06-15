<!-- 放置路径：src/components/rbac/RbacMethodPill.vue -->
<template>
  <span :class="['pc-method', `pc-method--${method}`]" :style="mini ? { padding: '2px 8px 2px 6px' } : {}">
    <span class="pc-method__verb">{{ method }}</span>
    <span class="pc-method__path" :style="mini ? { fontSize: '11px' } : {}">{{ path }}</span>
  </span>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  path:   string
  mini?:  boolean
}>(), { mini: false })
</script>
