<!-- 放置路径：src/components/rbac/RbacSpinner.vue -->
<!-- 用于页面级加载占位，局部 loading 直接用 v-loading 指令 -->
<template>
  <div class="pc-spinner">
    <div class="pc-spinner__ring" />
  </div>
</template>

<style scoped>
.pc-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
}
.pc-spinner__ring {
  width: 28px;
  height: 28px;
  border: 2.5px solid var(--pc-hairline);
  border-top-color: var(--pc-blue);
  border-radius: 50%;
  animation: pc-spin 0.7s linear infinite;
}
@keyframes pc-spin {
  to { transform: rotate(360deg); }
}
</style>
