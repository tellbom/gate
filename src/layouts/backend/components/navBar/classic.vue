<!--
  放置路径：src/layouts/backend/components/navBar/classic.vue
  变更：
  1. TopBar 高度改为 60px，磨砂玻璃背景，hairline 下边框
  2. 左侧新增页面标题双行区（读取 navTabs 当前激活路由的 meta.title / meta.subTitle）
  3. NavTabs 改为隐藏（权限中心为单页应用，无需多标签）
  4. NavMenus 保留（右侧用户 popover 不变）
  5. 折叠展开按钮保留
-->
<template>
  <div class="pc-topbar">

    <!-- 左：折叠按钮（小屏） -->
    <div v-if="config.layout.shrink && config.layout.menuCollapse" class="pc-topbar__unfold">
      <Icon
        @click="onMenuCollapse"
        name="fa fa-indent"
        :color="config.getColorVal('menuActiveColor')"
        size="18"
      />
    </div>

    <!-- 左：页面标题 -->
    <div v-if="activeTitle" class="pc-topbar__title-wrap">
      <div class="pc-topbar__title">{{ activeTitle }}</div>
      <div v-if="activeSub" class="pc-topbar__sub">{{ activeSub }}</div>
    </div>

    <!-- 右：用户菜单（NavMenus 保留） -->
    <NavMenus />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useConfig } from '/@/stores/config'
import { useNavTabs } from '/@/stores/navTabs'
import NavMenus from '../navMenus.vue'
import { showShade } from '/@/utils/pageShade'

const config  = useConfig()
const navTabs = useNavTabs()
const route   = useRoute()

const titleFallbacks: Array<[RegExp, { title: string; subTitle?: string }]> = [
  [/\/dashboard$/, { title: '全局视图', subTitle: '统一权限中心' }],
  [/\/global\/project|\/projects$/, { title: '项目授权', subTitle: 'Project 授权管理' }],
  [/\/global\/user|\/users$/, { title: '用户授权', subTitle: '跨 Project 用户权限' }],
  [/\/global\/group|\/groups$/, { title: 'Cross-Project Groups', subTitle: '跨 Project 权限组' }],
  [/\/global\/rule|\/menus$/, { title: 'Cross-Project Rules', subTitle: '菜单与规则管理' }],
  [/\/apiMap$/, { title: 'API 权限', subTitle: '接口映射与鉴权' }],
  [/\/audit$/, { title: '审计中心', subTitle: '近期鉴权活动' }],
]

const fallbackMeta = computed(() => {
  const fullPath = route.fullPath || route.path
  return titleFallbacks.find(([pattern]) => pattern.test(fullPath))?.[1]
})

/* 读取当前激活路由 meta */
const activeTitle = computed(() => {
  return (
    (route.meta?.title as string) ||
    (navTabs.state.activeRoute?.meta?.title as string) ||
    fallbackMeta.value?.title ||
    ''
  )
})
const activeSub = computed(() => {
  return (
    (route.meta?.subTitle as string) ||
    (navTabs.state.activeRoute?.meta?.subTitle as string) ||
    fallbackMeta.value?.subTitle ||
    ''
  )
})

const onMenuCollapse = () => {
  showShade('ba-aside-menu-shade', () => {
    config.setLayout('menuCollapse', true)
  })
  config.setLayout('menuCollapse', false)
}
</script>

<style scoped lang="scss">
/* ── TopBar 容器 ── */
.pc-topbar {
  display: flex;
  align-items: center;
  gap: 16px;
  height: 60px;
  width: 100%;
  padding: 0 28px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border-bottom: 1px solid var(--pc-hairline);
  position: sticky;
  top: 0;
  z-index: 20;
  box-sizing: border-box;
}

/* ── 折叠按钮 ── */
.pc-topbar__unfold {
  flex-shrink: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
}

/* ── 页面标题双行 ── */
.pc-topbar__title-wrap {
  min-width: 0;
  flex-shrink: 0;
}

.pc-topbar__title {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.012em;
  color: var(--pc-ink);
  line-height: 1.3;
  white-space: nowrap;
}

.pc-topbar__sub {
  font-size: 12px;
  color: var(--pc-ink-48);
  margin-top: 1px;
  white-space: nowrap;
}

/* NavMenus 自动推到右侧（margin-left: auto 由 navMenus.vue 内部 .nav-menus 的 margin-left:auto 承担） */
/* 若 NavMenus 未自动靠右，在此追加：:deep(.nav-menus) { margin-left: auto; } */
:deep(.nav-menus) {
  background: transparent !important;
  margin-left: auto;
}
</style>
