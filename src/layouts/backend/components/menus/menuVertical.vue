<!--
  放置路径：src/layouts/backend/components/menus/menuVertical.vue
  变更：仅修改 <style> 中的菜单样式，模板和 script 逻辑完全不变。
  - 菜单项高度 38px，margin 9px 14px，border-radius 9px，padding 0 12px
  - 激活态：pc-blue-wash 背景 + pc-blue 文字 + 600 字重
  - hover：pc-blue-wash 背景（替换原来的纯白）
  - 子菜单展开标题保持一致样式
-->
<template>
  <el-scrollbar ref="layoutMenuScrollbarRef" class="vertical-menus-scrollbar">
    <el-menu
      class="layouts-menu-vertical"
      :collapse-transition="false"
      :unique-opened="config.layout.menuUniqueOpened"
      :default-active="state.defaultActive"
      :collapse="config.layout.menuCollapse"
      ref="layoutMenuRef"
    >
      <MenuTree :menus="navTabs.state.tabsViewRoutes" />
    </el-menu>
  </el-scrollbar>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive } from 'vue'
import MenuTree from '/@/layouts/backend/components/menus/menuTree.vue'
import { useRoute, onBeforeRouteUpdate, type RouteLocationNormalizedLoaded } from 'vue-router'
import { layoutMenuRef, layoutMenuScrollbarRef } from '/@/stores/refs'
import { useConfig } from '/@/stores/config'
import { useNavTabs } from '/@/stores/navTabs'

const config  = useConfig()
const navTabs = useNavTabs()
const route   = useRoute()

const state = reactive({ defaultActive: '' })

const verticalMenusScrollbarHeight = computed(() => {
  const topBarH = config.layout.menuShowTopBar ? 50 : 0
  return config.layout.layoutMode === 'Default'
    ? `calc(100vh - ${32 + topBarH}px)`
    : `calc(100vh - ${topBarH}px)`
})

const currentRouteActive = (currentRoute: RouteLocationNormalizedLoaded) => {
  const tabView = navTabs.getTabsViewDataByRoute(currentRoute)
  if (tabView) state.defaultActive = tabView.meta!.matched as string
}

const verticalMenusScroll = () => {
  nextTick(() => {
    const activeMenu: HTMLElement | null = document.querySelector('.el-menu.layouts-menu-vertical li.is-active')
    if (!activeMenu) return
    layoutMenuScrollbarRef.value?.setScrollTop(activeMenu.offsetTop)
  })
}

onMounted(() => { currentRouteActive(route); verticalMenusScroll() })
onBeforeRouteUpdate((to) => { currentRouteActive(to) })
</script>

<style>
/* 滚动区高度（保持原有 v-bind 写法） */
.vertical-menus-scrollbar {
  height: v-bind(verticalMenusScrollbarHeight);
  background-color: v-bind('config.getColorVal("menuBackground")');
}

/* ── el-menu 基础变量覆盖 ── */
.layouts-menu-vertical {
  border: none;
  padding: 4px 0 80px; /* 底部留空给 user-row */
  font-family: var(--pc-font-text);

  --el-menu-bg-color:      transparent;
  --el-menu-text-color:    v-bind('config.getColorVal("menuColor")');
  --el-menu-active-color:  var(--pc-blue);
  --el-menu-hover-bg-color: var(--pc-blue-wash);
  --el-menu-item-height:   38px;
}

/* ── 菜单项 & 子菜单标题 ── */
.layouts-menu-vertical .el-menu-item,
.layouts-menu-vertical .el-sub-menu__title {
  height: 38px;
  line-height: 38px;
  margin: 1px 14px;
  border-radius: 9px;
  font-size: 14px;
  font-weight: 400;
  letter-spacing: -0.01em;
  padding: 0 12px !important;
  color: var(--el-menu-text-color);
  transition: background 0.12s ease, color 0.12s ease;
}

/* ── hover ── */
.layouts-menu-vertical .el-menu-item:hover,
.layouts-menu-vertical .el-sub-menu__title:hover {
  background-color: var(--pc-blue-wash);
  color: var(--pc-blue);
}

/* ── 激活态（菜单项） ── */
.layouts-menu-vertical .el-menu-item.is-active {
  background-color: var(--pc-blue-wash) !important;
  color: var(--pc-blue) !important;
  font-weight: 600;
}

/* ── 激活态（子菜单标题） ── */
.layouts-menu-vertical .el-sub-menu.is-active > .el-sub-menu__title {
  color: var(--pc-blue) !important;
  font-weight: 600;
}

/* ── 子菜单展开背景透明 ── */
.layouts-menu-vertical .el-sub-menu .el-menu {
  background: transparent !important;
}

/* ── 折叠状态 tooltip ── */
.layouts-menu-vertical.el-menu--collapse .el-menu-item.is-active {
  background-color: var(--pc-blue-wash) !important;
}

/* 折叠态：让图标独占并在 64px 侧栏内居中 */
.layouts-menu-vertical.el-menu--collapse {
  width: 64px;
}

.layouts-menu-vertical.el-menu--collapse .el-menu-item,
.layouts-menu-vertical.el-menu--collapse .el-sub-menu__title {
  width: 38px;
  height: 38px;
  line-height: 38px;
  margin: 1px auto;
  padding: 0 !important;
  display: flex;
  align-items: center;
  justify-content: center;
}

.layouts-menu-vertical.el-menu--collapse .el-menu-item > .icon,
.layouts-menu-vertical.el-menu--collapse .el-sub-menu__title > .icon {
  width: 20px !important;
  height: 20px;
  margin: 0 !important;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.layouts-menu-vertical.el-menu--collapse .menu-title,
.layouts-menu-vertical.el-menu--collapse .menu-unread-badge,
.layouts-menu-vertical.el-menu--collapse .el-sub-menu__icon-arrow {
  display: none !important;
}
</style>
