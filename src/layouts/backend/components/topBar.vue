<template>
    <div class="system-top-bar">
        <!-- 左侧：Logo + 系统名称 -->
        <div class="top-bar-left">
            <div class="system-logo">
                <img src="/@/assets/images/process_icon.png" alt="logo" />
            </div>
            <div class="system-info">
                <h1 class="system-name">业务流程运行管理平台</h1>
                <!-- <span class="system-subtitle">巡察监督管理系统</span> -->
            </div>
        </div>

        <div class="top-bar-spacer"></div>

        <input
            v-model.trim="state.keyword"
            class="top-bar-search"
            placeholder="搜索待办任务 / 业务ID"
            @keyup.enter="onSearchTodo"
        />

        <div class="top-bar-divider"></div>

        <!-- 右侧：管理员信息 -->
        <div class="top-bar-right">
            <el-popover
                @show="onCurrentNavMenu(true)"
                @hide="onCurrentNavMenu(false)"
                placement="bottom-end"
                :hide-after="0"
                :width="260"
                trigger="click"
                popper-class="admin-info-popover"
                v-model:visible="state.showAdminInfoPopover"
            >
                <template #reference>
                    <div class="admin-info" :class="state.isHover ? 'hover' : ''">
                        <el-avatar :size="32" :src="adminAvatar"></el-avatar>
                        <div class="admin-name">{{ adminDisplayName }}</div>
                    </div>
                </template>
                <div>
                    <div class="admin-info-content">
                        <el-avatar :size="60" :src="adminAvatar"></el-avatar>
                        <div class="admin-details">
                            <div class="admin-name-large">{{ adminDisplayName }}</div>
                            <div class="admin-lasttime">{{ adminSubtitle }}</div>
                        </div>
                    </div>
                    <div class="admin-info-actions">
                        <el-button @click="onAdminInfo" type="primary" plain>个人资料</el-button>
                        <el-button @click="onLogout" plain>退出登录</el-button>
                    </div>
                </div>
            </el-popover>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useAdminInfo } from '/@/stores/adminInfo'
import { fullUrl } from '/@/utils/common'
import { routePush } from '/@/utils/router'
import router from '/@/router'
import { useNavTabs } from '/@/stores/navTabs'
import type { RouteLocationRaw, RouteRecordName } from 'vue-router'
import { logoutWithKeycloak } from '/@/utils/keycloak'

const adminInfo = useAdminInfo()
const navTabs = useNavTabs()

const state = reactive({
    isHover: false,
    showAdminInfoPopover: false,
    keyword: '',
})

const adminDisplayName = computed(() => adminInfo.nickname || adminInfo.username || adminInfo.userid || '管理员')
const adminAvatar = computed(() => fullUrl(adminInfo.avatar || ''))
const adminSubtitle = computed(() => [adminInfo.userid, adminInfo.project].filter(Boolean).join(' · '))

interface TopBarMenuRoute {
    path: string
    name?: RouteRecordName | null
    component?: unknown
    children?: TopBarMenuRoute[]
}

const onCurrentNavMenu = (status: boolean) => {
    state.isHover = status
}

const onAdminInfo = () => {
    state.showAdminInfoPopover = false
    routePush({ name: 'routine/adminInfo' })
}

const findMenuRouteByComponent = (componentSuffix: string, routeNameFallback: string) => {
    const stack: TopBarMenuRoute[] = [...(navTabs.state.tabsViewRoutes as unknown as TopBarMenuRoute[])]
    while (stack.length) {
        const item = stack.shift()!
        const component = typeof item.component === 'string' ? item.component : ''
        if (component.endsWith(componentSuffix)) return item
        if (item.children?.length) stack.push(...item.children)
    }

    if (router.hasRoute(routeNameFallback)) return { path: '', name: routeNameFallback } as TopBarMenuRoute
    return undefined
}

const onSearchTodo = () => {
    const keyword = state.keyword.trim()
    if (!keyword) return

    const menuRoute = findMenuRouteByComponent('todo/MyTodo.vue', 'MyTodo')
    if (!menuRoute) return

    const target: RouteLocationRaw = menuRoute.name
        ? { name: menuRoute.name, query: { keyword } }
        : { path: menuRoute.path, query: { keyword } }

    routePush(target)
}

const onLogout = () => {
    logoutWithKeycloak()
}
</script>

<style scoped lang="scss">
.system-top-bar {
    --streamline-primary: #0066cc;
    --streamline-ink: #fff;
    --streamline-muted: #7a7a7a;
    --streamline-parchment: #f5f5f7;
    --streamline-hairline: #e0e0e0;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 64px;
    background: linear-gradient(180deg, #066bd1 0%, #0058b8 100%);
    border-bottom: 1px solid rgba(255, 255, 255, 0.18);
    display: flex;
    align-items: center;
    gap: 24px;
    padding: 0 40px;
    z-index: 1000;
}

/* 左侧区域 */
.top-bar-left {
    display: flex;
    align-items: center;
    gap: 14px;
    flex-shrink: 0;
}

.system-logo {
    width: 30px;
    height: 30px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.16);
    border: 1px solid rgba(255, 255, 255, 0.2);
    display: grid;
    place-items: center;
    
    img {
        width: 22px;
        height: 22px;
        object-fit: contain;
    }
}

.system-info {
   
    display: flex;
    align-items: baseline;
    gap: 8px;
}

.system-name {
    font-size: 19px;
    font-weight: 600;
    color: var(--streamline-ink);
    margin: 0;
    letter-spacing: 0.4px;
    white-space: nowrap;
}

.system-subtitle {
    font-size: 13px;
    font-weight: 400;
    color: var(--streamline-muted);
}

/* 右侧区域 */
.top-bar-spacer {
    flex: 1;
}

.top-bar-search {
    height: 36px;
    min-width: 280px;
    flex-shrink: 0;
    background: rgba(255, 255, 255, 0.14);
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-radius: 9999px;
    color: rgba(255, 255, 255, 0.88);
    font-size: 13px;
    padding: 0 14px 0 36px;
    outline: none;
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='white' stroke-opacity='0.7' stroke-width='2'><circle cx='11' cy='11' r='7'/><path d='m21 21-4.3-4.3'/></svg>");
    background-repeat: no-repeat;
    background-position: 12px center;
}

.top-bar-search::placeholder {
    color: rgba(255, 255, 255, 0.6);
}

.top-bar-divider {
    width: 1px;
    height: 22px;
    background: rgba(255, 255, 255, 0.18);
}

.top-bar-right {
    display: flex;
    align-items: center;
    flex-shrink: 0;
}

.admin-info {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 4px 10px 4px 4px;
    border-radius: 9999px;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    
    &:hover,
    &.hover {
        background-color: rgba(255, 255, 255, 0.1);
    }
}

.admin-name {
    font-size: 14px;
    font-weight: 400;
    color: var(--streamline-ink);
    letter-spacing: -0.1px;
    white-space: nowrap;
}

/* Popover 内容样式 */
.admin-info-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px 0;
    gap: 12px;
}

.admin-details {
    text-align: center;
}

.admin-name-large {
    font-size: 17px;
    font-weight: 600;
    color: #1d1d1f;
    margin-bottom: 4px;
}

.admin-lasttime {
    font-size: 13px;
    color: var(--streamline-muted);
}

.admin-info-actions {
    display: flex;
    gap: 10px;
    padding: 16px 0 0;
    border-top: 1px solid var(--streamline-hairline);
    justify-content: center;
}
</style>

<style lang="scss">
/* 全局 Popover 样式 */
.admin-info-popover.el-popover {
    border-radius: 8px;
    box-shadow: none;
    border: 1px solid #e0e0e0;
    background: #ffffff;
}
</style>
