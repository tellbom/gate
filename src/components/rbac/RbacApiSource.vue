<!-- 放置路径：src/components/rbac/RbacApiSource.vue -->
<!--
  用法：
  <RbacApiSource
    :endpoints="[
      { m: 'GET',  p: '/api/global/user/list', d: '跨 project 用户列表' },
      { m: 'POST', p: '/api/group/{groupCode}/members' },
    ]"
    note="可选补充说明"
  />
-->
<template>
  <div class="pc-api-source">
    <button class="pc-api-source__toggle" @click="open = !open">
      <span class="pc-api-source__label">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>
        </svg>
        本页数据来源 · {{ endpoints.length }} 个接口
      </span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"
           :style="{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }">
        <path d="M6 9l6 6 6-6"/>
      </svg>
    </button>

    <div v-if="open" class="pc-api-source__body pc-anim-fade">
      <div v-for="(e, i) in endpoints" :key="i" class="pc-api-source__row">
        <RbacMethodPill :method="e.m" :path="e.p" mini />
        <span v-if="e.d" class="pc-t-cap">{{ e.d }}</span>
      </div>
      <div v-if="note" class="pc-t-cap" style="margin-top:4px;color:var(--pc-ink-60)">{{ note }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import RbacMethodPill from './RbacMethodPill.vue'

defineProps<{
  endpoints: Array<{ m: 'GET'|'POST'|'PUT'|'DELETE'|'PATCH', p: string, d?: string }>
  note?: string
}>()

const open = ref(false)
</script>

<style scoped>
.pc-api-source {
  background: var(--pc-blue-wash);
  border: 1px solid var(--pc-blue-wash-strong);
  border-radius: 12px;
  padding: 11px 14px;
}
.pc-api-source__toggle {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
}
.pc-api-source__label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--pc-blue);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: -0.006em;
}
.pc-api-source__body {
  margin-top: 11px;
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.pc-api-source__row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
</style>
