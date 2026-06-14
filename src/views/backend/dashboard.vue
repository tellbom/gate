<template>
    <main class="pc-page">
        <section class="dash-head">
            <div>
                <div class="t-cap-strong today">{{ todayText }}</div>
                <h1 class="t-hero">统一权限中心</h1>
                <p class="t-lead">全局视图（<span class="t-mono">__global__</span>）</p>
            </div>
            <el-button :icon="Refresh" circle @click="loadDashboard" />
        </section>

        <section class="card stat-ribbon">
            <div v-for="item in stats" :key="item.label" class="stat-item">
                <div class="t-display">{{ item.value }}</div>
                <div class="t-cap">{{ item.label }}</div>
            </div>
        </section>

        <section class="project-grid">
            <article v-for="(project, index) in projectCards" :key="project.code" class="project-tile" :class="{ dark: index % 3 === 1 }">
                <div class="project-top">
                    <div>
                        <div class="t-cap-strong"><span class="t-mono">{{ project.code }}</span></div>
                        <h2 class="t-title">{{ project.label }}</h2>
                        <p class="t-body">Project code · 后端未提供显示名时使用 code</p>
                    </div>
                    <div class="project-glyph">{{ project.code.slice(0, 1).toUpperCase() }}</div>
                </div>
                <div class="project-metrics">
                    <div><strong>{{ project.users }}</strong><span>用户</span></div>
                    <div><strong>{{ project.supers }}</strong><span>超管</span></div>
                    <div><strong>{{ project.groups }}</strong><span>权限组</span></div>
                    <el-button round @click="go('/users', project.code)">授权</el-button>
                </div>
            </article>
            <div v-if="!loading && projectCards.length === 0" class="card empty">暂无 project 数据</div>
        </section>

        <section class="card activity-card">
            <div class="section-title">
                <h2 class="t-section">近期活动</h2>
                <el-button link type="primary" @click="go('/audit')">审计中心</el-button>
            </div>
            <div v-if="auditRows.length === 0" class="empty-line">暂无审计日志</div>
            <div v-for="item in auditRows.slice(0, 8)" :key="item.auditId" class="activity-row">
                <div class="avatar">{{ (item.username || item.userid || '?').slice(0, 1) }}</div>
                <div class="activity-main">
                    <div>
                        <strong>{{ item.username || item.userid }}</strong>
                        <span class="t-cap">{{ item.userid }}</span>
                    </div>
                    <p><b>{{ item.httpMethod || '-' }}</b> {{ item.route || item.permissionCode }}</p>
                </div>
                <span class="badge" :class="item.result.toLowerCase()">{{ resultLabel(item.result) }}</span>
            </div>
        </section>
    </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import router from '/@/router'
import { adminBaseRoutePath } from '/@/router/static/adminBase'
import {
    getGlobalGroups,
    getGlobalMenus,
    getGlobalProjects,
    getGlobalUsers,
    searchAuditLogs,
    type AdminItem,
    type AuditLogItem,
    type GroupItem,
    type RuleItem,
} from '/@/api/backend/rbac'

defineOptions({ name: 'dashboard' })

const loading = ref(false)
const projects = ref<string[]>([])
const users = ref<AdminItem[]>([])
const groups = ref<GroupItem[]>([])
const menus = ref<RuleItem[]>([])
const auditRows = ref<AuditLogItem[]>([])
const totals = ref({ users: 0, groups: 0, menus: 0 })

const todayText = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })

const stats = computed(() => [
    { label: '接入系统', value: projects.value.length },
    { label: '管理员账号', value: totals.value.users || users.value.length },
    { label: '权限组', value: totals.value.groups || groups.value.length },
    { label: '菜单与路由', value: totals.value.menus || menus.value.length },
])

const projectCards = computed(() =>
    projects.value.map((code) => ({
        code,
        label: code,
        users: users.value.filter((user) => user.projectCodes?.includes(code)).length,
        supers: users.value.filter((user) => user.superProjects?.includes(code)).length,
        groups: groups.value.filter((group) => group.project === code).length,
    }))
)

onMounted(loadDashboard)

async function loadDashboard() {
    loading.value = true
    try {
        const [projectRes, userRes, groupRes, menuRes, auditRes] = await Promise.all([
            getGlobalProjects(),
            getGlobalUsers({ page: 1, pageSize: 100 }),
            getGlobalGroups({ page: 1, pageSize: 100 }),
            getGlobalMenus({ page: 1, pageSize: 100 }),
            searchAuditLogs({ page: 1, pageSize: 20 }),
        ])
        projects.value = projectRes.list || []
        users.value = userRes.list || []
        groups.value = groupRes.list || []
        menus.value = menuRes.list || []
        auditRows.value = auditRes.list || []
        totals.value = { users: userRes.total || 0, groups: groupRes.total || 0, menus: menuRes.total || 0 }
    } finally {
        loading.value = false
    }
}

function go(path: string, project?: string) {
    router.push({ path: `${adminBaseRoutePath}${path}`, query: project ? { project } : undefined })
}

function resultLabel(result: string) {
    return result === 'Allow' ? '通过' : result === 'Deny' ? '拒绝' : '异常'
}
</script>

<style scoped>
.pc-page {
    --blue: #0066cc;
    --blue-wash: #eaf2fb;
    --ink: #1d1d1f;
    --ink-60: #5c5c60;
    --ink-48: #7a7a7a;
    --canvas: #ffffff;
    --parchment: #f5f5f7;
    --pearl: #fafafc;
    --tile-dark: #272729;
    --hairline: #e0e0e0;
    --divider: #f0f0f0;
    --ok: #1a7f47;
    --ok-wash: #e7f3ec;
    --warn: #9a6a00;
    --warn-wash: #f6efdc;
    --deny: #b3261e;
    --deny-wash: #fbeae9;
    color: var(--ink);
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", system-ui, "PingFang SC", sans-serif;
    letter-spacing: -0.01em;
}
.t-hero { margin: 0; font-size: 44px; font-weight: 600; line-height: 1.07; letter-spacing: -0.02em; }
.t-display { font-size: 32px; font-weight: 600; line-height: 1.1; }
.t-title { margin: 8px 0 0; font-size: 27px; font-weight: 600; line-height: 1.16; }
.t-section { margin: 0; font-size: 19px; font-weight: 600; }
.t-lead { margin: 6px 0 0; font-size: 21px; color: var(--ink-60); }
.t-body { margin: 3px 0 0; font-size: 15px; color: var(--ink-60); }
.t-cap { font-size: 13px; color: var(--ink-48); }
.t-cap-strong { font-size: 13px; font-weight: 600; color: var(--ink-60); }
.t-mono { font-family: "SF Mono", ui-monospace, Menlo, monospace; font-size: 12.5px; }
.today { color: var(--blue); margin-bottom: 8px; }
.dash-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; margin-bottom: 24px; }
.card { background: var(--canvas); border: 1px solid var(--hairline); border-radius: 18px; }
.stat-ribbon { display: grid; grid-template-columns: repeat(4, 1fr); padding: 20px 0; margin-bottom: 22px; }
.stat-item { padding: 0 26px; border-left: 1px solid var(--divider); }
.stat-item:first-child { border-left: 0; }
.project-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 22px; }
.project-tile { min-height: 220px; background: var(--parchment); border-radius: 22px; padding: 30px 32px; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; }
.project-tile.dark { background: var(--tile-dark); color: #fff; }
.project-tile.dark .t-body, .project-tile.dark .t-cap-strong, .project-tile.dark .project-metrics span { color: #bbb; }
.project-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; }
.project-glyph { width: 44px; height: 44px; border-radius: 12px; background: var(--blue-wash); color: var(--blue); display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 19px; }
.project-metrics { display: flex; align-items: flex-end; gap: 30px; margin-top: 28px; }
.project-metrics strong { display: block; font-size: 26px; line-height: 1; }
.project-metrics span { display: block; margin-top: 5px; font-size: 13px; color: var(--ink-48); }
.activity-card { padding: 18px 22px; }
.section-title { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
.activity-row { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-top: 1px solid var(--divider); }
.avatar { width: 30px; height: 30px; border-radius: 50%; background: #eef0f4; color: var(--ink-60); display: flex; align-items: center; justify-content: center; font-weight: 600; }
.activity-main { flex: 1; min-width: 0; }
.activity-main > div { display: flex; align-items: center; gap: 7px; }
.activity-main p { margin: 2px 0 0; color: var(--ink-48); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.badge { display: inline-flex; align-items: center; border-radius: 9999px; padding: 2px 8px; font-size: 11px; font-weight: 600; }
.badge.allow { color: var(--ok); background: var(--ok-wash); }
.badge.deny { color: var(--deny); background: var(--deny-wash); }
.badge.error { color: var(--warn); background: var(--warn-wash); }
.empty, .empty-line { padding: 40px; text-align: center; color: var(--ink-48); }
@media (max-width: 900px) {
    .stat-ribbon, .project-grid { grid-template-columns: 1fr; }
    .dash-head, .project-metrics { flex-direction: column; align-items: flex-start; }
}
</style>
