<!--
  放置路径：src/layouts/backend/components/aside.vue
  变更：在 <el-aside> 底部追加 pc-user-row，引入 RbacAvatar 和 RbacBadge。
  其余逻辑（Logo、MenuVertical、Double 模式）完全不变。
-->
<template>
  <el-aside
    v-if="!navTabs.state.tabFullScreen"
    :class="'layout-aside-' + config.layout.layoutMode + ' ' + (config.layout.shrink ? 'shrink' : '')"
    style="display: flex; flex-direction: column;"
  >
    <Logo v-if="config.layout.menuShowTopBar" />
    <MenuVerticalChildren v-if="config.layout.layoutMode === 'Double'" />
    <MenuVertical v-else />

    <!-- 底部用户行 -->
    <div v-if="!config.layout.menuCollapse" class="pc-user-row">
      <RbacAvatar :name="adminInfo.username || adminInfo.userid || '?'" :size="34" />
      <div class="pc-user-row__info">
        <div class="pc-user-row__name">{{ adminInfo.username || adminInfo.userid }}</div>
        <div class="pc-user-row__sub">{{ adminInfo.userid }} · {{ adminInfo.super ? '超管' : '管理员' }}</div>
      </div>
      <RbacBadge v-if="adminInfo.super" tone="super" dot size="sm">super</RbacBadge>
    </div>
    <!-- 折叠时仅显示头像 -->
    <div v-else class="pc-user-row pc-user-row--collapsed">
      <RbacAvatar :name="adminInfo.username || adminInfo.userid || '?'" :size="30" />
    </div>
  </el-aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Logo from '/@/layouts/backend/components/logo.vue'
import MenuVertical from '/@/layouts/backend/components/menus/menuVertical.vue'
import MenuVerticalChildren from '/@/layouts/backend/components/menus/menuVerticalChildren.vue'
import RbacAvatar from '/@/components/rbac/RbacAvatar.vue'
import RbacBadge from '/@/components/rbac/RbacBadge.vue'
import { useConfig } from '/@/stores/config'
import { useNavTabs } from '/@/stores/navTabs'
import { useAdminInfo } from '/@/stores/adminInfo'

const config   = useConfig()
const navTabs  = useNavTabs()
const adminInfo = useAdminInfo()

const menuWidth = computed(() => config.menuWidth())
</script>

<style scoped lang="scss">
/* 原有样式完全保留 */
.layout-aside-Default {
  background: var(--ba-bg-color-overlay);
  margin: 16px 0 16px 16px;
  height: calc(100vh - 32px);
  box-shadow: var(--el-box-shadow-light);
  border-radius: var(--el-border-radius-base);
  overflow: hidden;
  transition: width 0.3s ease;
  width: v-bind(menuWidth);
}
.layout-aside-Classic,
.layout-aside-Double {
  background: v-bind('config.getColorVal("menuBackground")');
  margin: 0;
  height: 100vh;
  overflow: hidden;
  transition: width 0.3s ease;
  width: v-bind(menuWidth);
}
.shrink {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9999999;
}

/* ── 底部用户行 ── */
.pc-user-row {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-top: 1px solid var(--pc-divider);
  margin-top: auto;
}
.pc-user-row--collapsed {
  justify-content: center;
  padding: 12px 8px;
}
.pc-user-row__info {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}
.pc-user-row__name {
  font-size: 13.5px;
  font-weight: 600;
  color: v-bind('config.getColorVal("menuColor")');
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pc-user-row__sub {
  font-size: 11px;
  color: v-bind('config.getColorVal("menuColor")');
  opacity: 0.55;
  margin-top: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
