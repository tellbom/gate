<template>
  <el-aside
    v-if="!navTabs.state.tabFullScreen"
    :class="'layout-aside-' + config.layout.layoutMode + ' ' + (config.layout.shrink ? 'shrink' : '')"
    style="display: flex; flex-direction: column;"
  >
    <Logo v-if="config.layout.menuShowTopBar" />
    <MenuVerticalChildren v-if="config.layout.layoutMode === 'Double'" />
    <MenuVertical v-else />

    <el-popover placement="right-end" :width="220" trigger="click" popper-class="pc-user-popover">
      <template #reference>
        <div v-if="!config.layout.menuCollapse" class="pc-user-row">
          <RbacAvatar :name="displayName" :size="34" />
          <div class="pc-user-row__info">
            <div class="pc-user-row__name">{{ displayName }}</div>
            <div class="pc-user-row__sub">{{ adminInfo.userid }} · {{ adminInfo.super ? '超管' : '管理员' }}</div>
          </div>
          <RbacBadge v-if="adminInfo.super" tone="super" dot size="sm">super</RbacBadge>
        </div>
        <div v-else class="pc-user-row pc-user-row--collapsed">
          <RbacAvatar :name="displayName" :size="30" />
        </div>
      </template>

      <div class="pc-user-card">
        <RbacAvatar :name="displayName" :size="62" />
        <div class="pc-user-card__name">{{ displayName }}</div>
        <div v-if="adminInfo.userid" class="pc-user-card__id">{{ adminInfo.userid }}</div>
        <el-button class="pc-user-card__logout" type="danger" plain @click="onLogout">注销</el-button>
      </div>
    </el-popover>
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
import { logoutWithKeycloak } from '/@/utils/keycloak'

const config = useConfig()
const navTabs = useNavTabs()
const adminInfo = useAdminInfo()

const menuWidth = computed(() => config.menuWidth())
const displayName = computed(() => adminInfo.username || adminInfo.userid || '?')

const onLogout = () => {
  logoutWithKeycloak()
}
</script>

<style scoped lang="scss">
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

.pc-user-row {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-top: 1px solid var(--pc-divider);
  margin-top: auto;
  cursor: pointer;
  user-select: none;
  transition: background 0.15s ease;
}
.pc-user-row:hover {
  background: var(--pc-blue-wash);
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

.pc-user-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 4px 4px;
  text-align: center;
}
.pc-user-card__name {
  max-width: 180px;
  margin-top: 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--pc-ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pc-user-card__id {
  max-width: 180px;
  margin-top: 3px;
  font-family: var(--pc-font-mono);
  font-size: 11px;
  color: var(--pc-ink-48);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pc-user-card__logout {
  width: 100%;
  margin-top: 14px;
}
</style>
