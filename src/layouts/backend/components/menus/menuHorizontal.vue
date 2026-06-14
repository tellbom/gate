<template>
    <div class="layouts-menu-horizontal">
        <el-scrollbar ref="layoutMenuScrollbarRef" class="horizontal-menus-scrollbar">
            <el-menu
                ref="layoutMenuRef"
                class="menu-horizontal"
                mode="horizontal"
                :default-active="state.defaultActive"
                popper-class="streamline-custom-popup"
            >
                <MenuTree :extends="{ position: 'horizontal', level: 1 }" :menus="navTabs.state.tabsViewRoutes" />
            </el-menu>
        </el-scrollbar>
    </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, reactive } from 'vue'
import MenuTree from '/@/layouts/backend/components/menus/menuTree.vue'
import { useRoute, onBeforeRouteUpdate, type RouteLocationNormalizedLoaded } from 'vue-router'
import { useConfig } from '/@/stores/config'
import { useNavTabs } from '/@/stores/navTabs'
import { layoutMenuRef, layoutMenuScrollbarRef } from '/@/stores/refs'
import horizontalScroll from '/@/utils/horizontalScroll'

const config = useConfig()
const navTabs = useNavTabs()
const route = useRoute()

const state = reactive({
    defaultActive: '',
})

const currentRouteActive = (currentRoute: RouteLocationNormalizedLoaded) => {
    const tabView = navTabs.getTabsViewDataByRoute(currentRoute)
    if (tabView) {
        state.defaultActive = tabView.meta!.matched as string
    }
}

const verticalMenusScroll = () => {
    nextTick(() => {
        let activeMenu: HTMLElement | null = document.querySelector('.el-menu.menu-horizontal li.is-active')
        if (!activeMenu) return false
        layoutMenuScrollbarRef.value?.setScrollLeft(activeMenu.offsetLeft)
    })
}

onMounted(() => {
    currentRouteActive(route)
    verticalMenusScroll()
    new horizontalScroll(layoutMenuScrollbarRef.value!.wrapRef!)
})

onBeforeRouteUpdate((to) => {
    currentRouteActive(to)
})
</script>

<style scoped lang="scss">
.layouts-menu-horizontal {
    --streamline-primary: #0066cc;
    --streamline-primary-focus: #0071e3;
    --streamline-ink: #1d1d1f;
    --streamline-muted: #7a7a7a;
    --streamline-canvas: #ffffff;
    --streamline-parchment: #f5f5f7;
    --streamline-hairline: #e0e0e0;
    display: flex;
    align-items: center;
    width: 100%;
    height: 56px;
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(20px) saturate(180%);
    border-bottom: 1px solid var(--streamline-hairline);
    box-sizing: border-box;
}

.horizontal-menus-scrollbar {
    flex: 1;
    height: 56px;

    /* 滚动条轨道：透明，不占空间感 */
    :deep(.el-scrollbar__bar.is-horizontal) {
        height: 3px;
        bottom: 0;
        border-radius: 0;
        background-color: transparent;
    }

    /* 滚动条滑块：低透明度白，hover 时略亮 */
    :deep(.el-scrollbar__thumb) {
        background-color: rgba(0, 102, 204, 0.28);
        border-radius: 0;
        transition: background-color 0.2s;

        &:hover {
            background-color: var(--streamline-primary);
        }
    }

    /* 隐藏竖向滚动条 */
    :deep(.el-scrollbar__bar.is-vertical) {
        display: none;
    }
}

/* ── 菜单整体 ─────────────────────────────────────────────── */
.menu-horizontal {
    height: 56px;
    border: none !important;
    background-color: transparent !important;
    /* 菜单内容不换行，超出后横向滚动 */
    white-space: nowrap;
    display: inline-flex !important;
    min-width: max-content;

    :deep(.el-menu-item) {
        height: 56px;
        line-height: 56px;
        color: var(--streamline-ink) !important;
        background-color: transparent !important;
        border-bottom: 3px solid transparent !important;
        transition: color 0.18s, background-color 0.18s;

        &:hover {
            background-color: var(--streamline-parchment) !important;
            color: var(--streamline-primary) !important;
            border-bottom-color: transparent !important;
        }

        &.is-active {
            background-color: rgba(0, 102, 204, 0.08) !important;
            color: var(--streamline-primary) !important;
            border-bottom-color: var(--streamline-primary) !important;

            .icon {
                display: none !important;
            }
        }
    }

    :deep(.el-sub-menu__title) {
        height: 56px;
        line-height: 56px;
        color: var(--streamline-ink) !important;
        background-color: transparent !important;
        border-bottom: 3px solid transparent !important;
        transition: color 0.18s, background-color 0.18s;

        &:hover {
            background-color: var(--streamline-parchment) !important;
            color: var(--streamline-primary) !important;
        }

        .el-sub-menu__icon-arrow {
            color: var(--streamline-muted) !important;
            font-size: 11px !important;
        }
    }

    :deep(.el-sub-menu.is-opened > .el-sub-menu__title) {
        background-color: rgba(0, 102, 204, 0.08) !important;
        color: var(--streamline-primary) !important;
    }

    :deep(.el-sub-menu.is-active > .el-sub-menu__title) {
        color: var(--streamline-primary) !important;
        border-bottom-color: var(--streamline-primary) !important;
    }
}
</style>

<style lang="scss">
.streamline-custom-popup.el-popper {
    padding: 5px !important;
    background-color: #ffffff !important;
    border: 1px solid #e0e0e0 !important;
    border-radius: 8px !important;
    box-shadow: none !important;

    .el-menu {
        background-color: transparent !important;
        border: none !important;
    }

    .el-menu-item {
        height: auto !important;
        line-height: 1.4 !important;
        padding: 7px 14px !important;
        border-radius: 5px !important;
        color: #1d1d1f !important;
        background-color: transparent !important;
        font-size: 13.5px !important;
        letter-spacing: 0.005em;
        transition: background-color 0.15s, color 0.15s;

        &:hover {
            background-color: #f5f5f7 !important;
            color: #0066cc !important;
        }

        &.is-active {
            background-color: rgba(0, 102, 204, 0.10) !important;
            color: #0066cc !important;

            &::before {
                content: '';
                display: inline-block;
                width: 4px;
                height: 4px;
                border-radius: 50%;
                background: #0066cc;
                margin-right: 8px;
                vertical-align: middle;
                position: relative;
                top: -1px;
            }
        }

        &.is-active:hover {
            background-color: rgba(0, 102, 204, 0.14) !important;
            color: #0066cc !important;
        }
    }
}

.streamline-custom-popup.el-menu--popup .el-menu-item:not(.is-disabled):hover {
    background-color: #f5f5f7 !important;
    color: #0066cc !important;
}

.streamline-custom-popup.el-menu--popup .el-menu-item.is-active:not(.is-disabled):hover {
    background-color: rgba(0, 102, 204, 0.14) !important;
    color: #0066cc !important;
}
</style>
