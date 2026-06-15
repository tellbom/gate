<!-- 放置路径：src/components/rbac/RbacEmptyState.vue -->
<template>
  <div class="pc-empty">
    <div v-if="icon" class="pc-empty__icon">
      <el-icon :size="32" style="color:var(--pc-ink-48)">
        <component :is="icon" />
      </el-icon>
    </div>
    <div class="pc-t-body-strong pc-empty__title">{{ title }}</div>
    <div v-if="description" class="pc-t-cap pc-empty__desc">{{ description }}</div>
    <slot />
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
withDefaults(defineProps<{
  title:        string
  description?: string
  icon?:        Component
}>(), { description: '', icon: undefined })
</script>

<style scoped>
.pc-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 32px;
  gap: 10px;
  text-align: center;
}
.pc-empty__icon  { margin-bottom: 4px; }
.pc-empty__title { color: var(--pc-ink-60); }
.pc-empty__desc  { margin-top: 2px; }
</style>
