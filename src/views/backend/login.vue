<!--
 * @Author: fzq
 * @Date: 2026-05-27 11:44:01
 * @LastEditors: fzq
 * @LastEditTime: 2026-06-10 15:19:12
 * @Description:
 * @FilePath: \web\src\views\backend\login.vue
-->
<template>
    <div class="lp-bg">

        <!-- 背景装饰圆 -->
        <div class="lp-orb lp-orb-1"></div>
        <div class="lp-orb lp-orb-2"></div>

        <div class="lp-card">

            <!-- Logo / 图标区 -->
            <div class="lp-icon-wrap" :class="state">
                <!-- loading：旋转圆环 -->
                <svg v-if="state === 'loading'" class="lp-spinner" viewBox="0 0 50 50">
                    <circle cx="25" cy="25" r="20" fill="none" stroke-width="4"/>
                </svg>
                <!-- success：勾（短暂停留，随即跳转） -->
                <svg v-else-if="state === 'success'" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M5 12l5 5L20 7"/>
                </svg>
                <!-- error：叉 -->
                <svg v-else viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M6 6l12 12M18 6 6 18"/>
                </svg>
            </div>

            <!-- 标题 -->
            <div class="lp-title">
                <template v-if="state === 'loading'">正在验证身份</template>
                <template v-else-if="state === 'success'">认证成功</template>
                <template v-else>访问受限</template>
            </div>

            <!-- 副标题 / 错误信息 -->
            <div class="lp-sub">
                <template v-if="state === 'loading'">
                    {{ loadingText }}
                </template>
                <template v-else-if="state === 'success'">
                    正在跳转，请稍候…
                </template>
                <template v-else>
                    {{ errorText }}
                </template>
            </div>

            <!-- 进度点（loading 状态） -->
            <div v-if="state === 'loading'" class="lp-dots">
                <span></span><span></span><span></span>
            </div>

            <!-- 错误状态操作区 -->
            <div v-if="state === 'error'" class="lp-actions">
                <button class="lp-btn lp-btn-ghost" @click="handleRetry">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
                        <path d="M1 4v6h6M23 20v-6h-6"/>
                        <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"/>
                    </svg>
                    重新登录
                </button>
                <button class="lp-btn lp-btn-danger" @click="handleLogout">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                        <polyline points="16 17 21 12 16 7"/>
                        <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    注销当前账号
                </button>
            </div>

            <!-- 底部品牌 -->
            <div class="lp-brand">统一认证平台 · Keycloak SSO</div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import router from '/@/router'
import { adminBaseRoutePath } from '/@/router/static/adminBase'
import { useAdminInfo } from '/@/stores/adminInfo'
import { initRbacBridge } from '/@/api/backend/rbac/bridge'
import { loginWithKeycloak, logoutWithKeycloak } from '/@/utils/keycloak'

type State = 'loading' | 'success' | 'error'

const state      = ref<State>('loading')
const loadingText = ref('即将跳转到统一认证页面…')
const errorText   = ref('')
const adminInfo  = useAdminInfo()

onMounted(async () => {
    try {
        loadingText.value = '正在连接认证服务器…'
        const authenticated = await loginWithKeycloak()
        if (!authenticated) return

        loadingText.value = '正在获取权限信息…'
        const bridge = await initRbacBridge()

        if (!bridge.success) {
            state.value     = 'error'
            errorText.value = bridge.reason || '您没有访问本系统的权限，请联系管理员'
            adminInfo.removeToken()
            return
        }

        state.value = 'success'
        // 短暂展示成功状态后跳转，避免闪烁
        setTimeout(() => {
            router.replace({ path: `${adminBaseRoutePath}/${bridge.routePath}` })
        }, 600)

    } catch (error) {
        console.error('[login] Keycloak login failed:', error)
        state.value     = 'error'
        errorText.value = '统一认证连接失败，请检查网络后重试'
        adminInfo.removeToken()
    }
})

function handleRetry() {
    state.value = 'loading'
    loadingText.value = '正在重新连接…'
    window.location.reload()
}

async function handleLogout() {
    await logoutWithKeycloak()
}
</script>

<style scoped lang="scss">
// ── 背景 ────────────────────────────────────────────────────────
.lp-bg {
    min-height: 100vh;
    display: grid;
    place-items: center;
    background: linear-gradient(135deg, #e8f0fe 0%, #f0f4ff 50%, #f5f0ff 100%);
    position: relative;
    overflow: hidden;
    font-family: "PingFang SC", "Microsoft YaHei", system-ui, sans-serif;
}

// 装饰圆
.lp-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.35;
    pointer-events: none;
}
.lp-orb-1 {
    width: 480px; height: 480px;
    background: #a5b4fc;
    top: -120px; left: -120px;
}
.lp-orb-2 {
    width: 360px; height: 360px;
    background: #c4b5fd;
    bottom: -80px; right: -80px;
}

// ── 卡片 ─────────────────────────────────────────────────────────
.lp-card {
    position: relative;
    z-index: 1;
    width: 360px;
    padding: 40px 32px 32px;
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.6);
    border-radius: 20px;
    box-shadow:
        0 2px 4px rgba(0,0,0,0.04),
        0 8px 24px rgba(99, 102, 241, 0.10),
        0 24px 64px rgba(99, 102, 241, 0.08);
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
}

// ── 状态图标 ──────────────────────────────────────────────────────
.lp-icon-wrap {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    margin-bottom: 20px;
    flex-shrink: 0;

    svg { width: 28px; height: 28px; }

    &.loading {
        background: rgba(99, 102, 241, 0.10);
        color: #6366f1;
    }
    &.success {
        background: rgba(22, 163, 74, 0.10);
        color: #16a34a;
        animation: lp-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }
    &.error {
        background: rgba(220, 38, 38, 0.08);
        color: #dc2626;
        animation: lp-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }
}

// 旋转 spinner
.lp-spinner {
    animation: lp-spin 1s linear infinite;
    circle {
        stroke: #6366f1;
        stroke-dasharray: 80;
        stroke-dashoffset: 60;
        stroke-linecap: round;
    }
}

// ── 文字 ─────────────────────────────────────────────────────────
.lp-title {
    font-size: 20px;
    font-weight: 600;
    color: #1e1b4b;
    letter-spacing: -0.3px;
    margin-bottom: 8px;
}

.lp-sub {
    font-size: 14px;
    color: #6b7280;
    line-height: 1.6;
    min-height: 40px;
    padding: 0 4px;
}

// ── 加载点 ───────────────────────────────────────────────────────
.lp-dots {
    display: flex;
    gap: 6px;
    margin-top: 20px;

    span {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #a5b4fc;
        animation: lp-bounce 1.2s ease-in-out infinite;

        &:nth-child(2) { animation-delay: 0.2s; }
        &:nth-child(3) { animation-delay: 0.4s; }
    }
}

// ── 错误操作区 ────────────────────────────────────────────────────
.lp-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
    margin-top: 24px;
}

.lp-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    width: 100%;
    padding: 11px 0;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    border: none;
    transition: transform 0.12s ease, opacity 0.15s ease;
    font-family: inherit;

    &:active { transform: scale(0.97); }

    &.lp-btn-ghost {
        background: #f3f4f6;
        color: #374151;
        &:hover { background: #e5e7eb; }
    }

    &.lp-btn-danger {
        background: #fef2f2;
        color: #dc2626;
        border: 1px solid #fecaca;
        &:hover { background: #fee2e2; }
    }
}

// ── 底部品牌 ──────────────────────────────────────────────────────
.lp-brand {
    margin-top: 28px;
    font-size: 12px;
    color: #9ca3af;
    letter-spacing: 0.3px;
}

// ── 动画 ─────────────────────────────────────────────────────────
@keyframes lp-spin {
    to { transform: rotate(360deg); }
}
@keyframes lp-bounce {
    0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
    40%           { transform: scale(1.0); opacity: 1.0; }
}
@keyframes lp-pop {
    from { transform: scale(0.5); opacity: 0; }
    to   { transform: scale(1.0); opacity: 1; }
}
</style>
