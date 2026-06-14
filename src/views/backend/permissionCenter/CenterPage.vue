<template>
    <div class="pc-page">
        <section class="pc-hero">
            <div>
                <p class="pc-kicker">{{ todayText }}</p>
                <h1>{{ title }}</h1>
                <p>{{ subtitle }}</p>
            </div>
            <div class="pc-hero-actions">
                <el-select v-model="selectedProject" placeholder="全部系统" clearable filterable @change="reloadSection">
                    <el-option label="全部系统" value="" />
                    <el-option v-for="p in projects" :key="p.code" :label="p.label" :value="p.code" />
                </el-select>
                <el-button :icon="Refresh" circle @click="reloadAll" />
            </div>
        </section>

        <section v-if="section === 'dashboard'" class="pc-stack">
            <div class="pc-ribbon">
                <div v-for="item in stats" :key="item.label" class="pc-ribbon-item">
                    <strong>{{ item.value }}</strong>
                    <span>{{ item.label }}</span>
                </div>
            </div>
            <div class="pc-grid pc-grid-2">
                <article v-for="(p, index) in projectCards" :key="p.code" class="pc-project" :class="{ dark: index % 3 === 1 }">
                    <div>
                        <span class="pc-code">{{ p.code }}</span>
                        <h2>{{ p.label }}</h2>
                    </div>
                    <div class="pc-project-metrics">
                        <span><strong>{{ p.users }}</strong>用户</span>
                        <span><strong>{{ p.supers }}</strong>超管</span>
                        <span><strong>{{ p.groups }}</strong>权限组</span>
                        <el-button round size="small" @click="jumpToAuth(p.code)">授权</el-button>
                    </div>
                </article>
            </div>
            <ActivityList title="近期活动" :items="auditRows.slice(0, 8)" />
        </section>

        <section v-else-if="section === 'users'" class="pc-stack">
            <ToolbarSearch v-model:keyword="filters.keyword" v-model:status="filters.status" @search="loadUsers" />
            <div class="pc-card pc-table-card">
                <el-table v-loading="loading.users" :data="users" row-key="userid" @row-click="openUser">
                    <el-table-column label="用户" min-width="220">
                        <template #default="{ row }"><UserCell :user="row" /></template>
                    </el-table-column>
                    <el-table-column label="状态" width="110">
                        <template #default="{ row }">
                            <el-switch
                                :model-value="row.status === 'Active'"
                                :active-color="'#0066cc'"
                                @change="(val) => setUserStatus(row, val === true)"
                            />
                        </template>
                    </el-table-column>
                    <el-table-column label="所属系统" min-width="240">
                        <template #default="{ row }"><ProjectChips :codes="row.projectCodes || []" /></template>
                    </el-table-column>
                    <el-table-column label="权限组" min-width="160">
                        <template #default="{ row }">{{ (row.groupNames || []).slice(0, 2).join('、') || '-' }}</template>
                    </el-table-column>
                    <el-table-column label="超管" width="100" align="center">
                        <template #default="{ row }"><el-tag v-if="row.superProjects?.length" type="warning" round>{{ row.superProjects.length }}</el-tag><span v-else>-</span></template>
                    </el-table-column>
                </el-table>
                <PaginationBar :total="totals.users" v-model:page="pages.users" v-model:page-size="pageSizes.users" @change="loadUsers" />
            </div>
        </section>

        <section v-else-if="section === 'authorization'" class="pc-stack">
            <div class="pc-card pc-split">
                <div>
                    <h2>用户授权</h2>
                    <p>选择用户和目标系统，提交到 documented global grant 接口。</p>
                    <el-select v-model="grant.userid" filterable placeholder="选择用户">
                        <el-option v-for="u in users" :key="u.userid" :label="`${u.username} · ${u.userid}`" :value="u.userid" />
                    </el-select>
                    <el-select v-model="grant.targetProjects" multiple filterable placeholder="目标系统">
                        <el-option v-for="p in projects" :key="p.code" :label="p.label" :value="p.code" />
                    </el-select>
                    <el-checkbox v-model="grant.isSuper">同时授予超管</el-checkbox>
                    <el-button type="primary" :disabled="!grant.userid || !grant.targetProjects.length" @click="submitGrant">授权</el-button>
                </div>
                <div>
                    <h2>逐 project 结果</h2>
                    <div v-if="!grantResults.length" class="pc-empty">提交授权后显示 best-effort 结果。</div>
                    <div v-for="r in grantResults" :key="r.project" class="pc-result">
                        <span class="pc-code">{{ r.project }}</span>
                        <el-tag :type="r.success ? 'success' : 'danger'">{{ r.skipped ? 'skipped' : r.success ? 'success' : 'failed' }}</el-tag>
                    </div>
                </div>
            </div>
            <div class="pc-card pc-table-card">
                <el-table :data="users" row-key="userid">
                    <el-table-column label="用户" min-width="220"><template #default="{ row }"><UserCell :user="row" /></template></el-table-column>
                    <el-table-column label="授权系统" min-width="260"><template #default="{ row }"><ProjectChips :codes="row.projectCodes || []" /></template></el-table-column>
                    <el-table-column label="超管系统" min-width="220"><template #default="{ row }"><ProjectChips :codes="row.superProjects || []" /></template></el-table-column>
                    <el-table-column label="操作" width="160" fixed="right">
                        <template #default="{ row }">
                            <el-button v-if="selectedProject && row.projectCodes?.includes(selectedProject)" link type="danger" @click="revokeGrant(row)">撤销当前系统</el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </div>
        </section>

        <section v-else-if="section === 'groups'" class="pc-stack">
            <ToolbarSearch v-model:keyword="filters.keyword" v-model:status="filters.status" @search="loadGroups" />
            <div class="pc-card pc-table-card">
                <el-table v-loading="loading.groups" :data="groups" row-key="groupCode">
                    <el-table-column label="权限组" min-width="230">
                        <template #default="{ row }"><strong>{{ row.groupName || row.groupCode }}</strong><code>{{ row.groupCode }}</code></template>
                    </el-table-column>
                    <el-table-column label="Project" width="140"><template #default="{ row }"><span class="pc-code">{{ row.project }}</span></template></el-table-column>
                    <el-table-column label="状态" width="100"><template #default="{ row }"><StatusTag :status="row.status" /></template></el-table-column>
                    <el-table-column label="权限码" min-width="320"><template #default="{ row }"><CodeChips :codes="row.permissionCodes || []" /></template></el-table-column>
                </el-table>
                <PaginationBar :total="totals.groups" v-model:page="pages.groups" v-model:page-size="pageSizes.groups" @change="loadGroups" />
            </div>
        </section>

        <section v-else-if="section === 'menus'" class="pc-stack">
            <ToolbarSearch v-model:keyword="filters.keyword" v-model:status="filters.status" @search="loadMenus" />
            <div class="pc-card pc-table-card">
                <el-table v-loading="loading.menus" :data="menus" row-key="ruleCode">
                    <el-table-column label="菜单/规则" min-width="260">
                        <template #default="{ row }"><strong>{{ row.title }}</strong><code>{{ row.ruleCode }}</code></template>
                    </el-table-column>
                    <el-table-column label="Project" width="140"><template #default="{ row }"><span class="pc-code">{{ row.project || selectedProject || '-' }}</span></template></el-table-column>
                    <el-table-column label="类型" width="110"><template #default="{ row }"><el-tag effect="plain">{{ typeLabel(row.type) }}</el-tag></template></el-table-column>
                    <el-table-column label="权限码" min-width="220"><template #default="{ row }"><code>{{ row.permissionCode }}</code></template></el-table-column>
                    <el-table-column label="路由" min-width="180"><template #default="{ row }"><code>{{ row.path || row.url || '-' }}</code></template></el-table-column>
                    <el-table-column label="状态" width="100"><template #default="{ row }"><StatusTag :status="row.status" /></template></el-table-column>
                </el-table>
                <PaginationBar :total="totals.menus" v-model:page="pages.menus" v-model:page-size="pageSizes.menus" @change="loadMenus" />
            </div>
        </section>

        <section v-else-if="section === 'apiMap'" class="pc-stack">
            <ToolbarSearch v-model:keyword="filters.keyword" v-model:status="filters.status" @search="loadApiMaps" />
            <div class="pc-card pc-table-card">
                <el-table v-loading="loading.apiMaps" :data="apiMaps" row-key="id">
                    <el-table-column label="方法" width="90"><template #default="{ row }"><el-tag>{{ row.httpMethod }}</el-tag></template></el-table-column>
                    <el-table-column label="路由模板" min-width="260"><template #default="{ row }"><code>{{ row.routePattern }}</code></template></el-table-column>
                    <el-table-column label="权限码" min-width="220"><template #default="{ row }"><code>{{ row.permissionCode }}</code></template></el-table-column>
                    <el-table-column label="Action" width="120"><template #default="{ row }"><el-tag effect="plain">{{ row.action }}</el-tag></template></el-table-column>
                    <el-table-column label="状态" width="100"><template #default="{ row }"><StatusTag :status="row.status" /></template></el-table-column>
                </el-table>
                <PaginationBar :total="totals.apiMaps" v-model:page="pages.apiMaps" v-model:page-size="pageSizes.apiMaps" @change="loadApiMaps" />
            </div>
        </section>

        <section v-else class="pc-stack">
            <ActivityList title="审计 / 活动记录" :items="auditRows" />
            <div class="pc-card pc-table-card">
                <el-table v-loading="loading.permissions" :data="permissions" row-key="permissionCode">
                    <el-table-column label="权限码" min-width="260"><template #default="{ row }"><code>{{ row.permissionCode }}</code></template></el-table-column>
                    <el-table-column label="Action" width="130"><template #default="{ row }"><el-tag effect="plain">{{ row.action }}</el-tag></template></el-table-column>
                    <el-table-column label="资源" width="150" prop="resourceType" />
                    <el-table-column label="标题" min-width="180" prop="title" />
                </el-table>
            </div>
        </section>

        <el-drawer v-model="detailOpen" size="460px" :with-header="false">
            <div v-if="currentUser" class="pc-drawer">
                <UserCell :user="currentUser" large />
                <div class="pc-detail-block">
                    <h3>项目授权</h3>
                    <ProjectChips :codes="currentUser.projectCodes || []" :max="20" />
                </div>
                <div class="pc-detail-block">
                    <h3>权限组</h3>
                    <CodeChips :codes="currentUser.groupNames || currentUser.groupCodes || []" :max="20" />
                </div>
                <el-button type="primary" round @click="jumpToAuth()">打开授权工作区</el-button>
            </div>
        </el-drawer>
    </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, reactive, ref, resolveComponent, watch } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import router from '/@/router'
import { adminBaseRoutePath } from '/@/router/static/adminBase'
import {
    getApiMapRecords,
    getGlobalGroups,
    getGlobalMenus,
    getGlobalProjects,
    getGlobalUsers,
    grantGlobalUserProjects,
    revokeGlobalUserProject,
    searchAuditLogs,
    searchPermissionView,
    updateGlobalUserStatus,
    type AdminItem,
    type ApiMapRecordItem,
    type AuditLogItem,
    type GroupItem,
    type PermissionViewItem,
    type ProjectWriteResultItem,
    type RuleItem,
} from '/@/api/backend/rbac'

const props = withDefaults(defineProps<{ section?: 'dashboard' | 'users' | 'authorization' | 'groups' | 'menus' | 'apiMap' | 'audit' }>(), {
    section: 'dashboard',
})

const selectedProject = ref('')
const projects = ref<{ code: string; label: string }[]>([])
const users = ref<AdminItem[]>([])
const groups = ref<GroupItem[]>([])
const menus = ref<RuleItem[]>([])
const apiMaps = ref<ApiMapRecordItem[]>([])
const auditRows = ref<AuditLogItem[]>([])
const permissions = ref<PermissionViewItem[]>([])
const grantResults = ref<ProjectWriteResultItem[]>([])
const detailOpen = ref(false)
const currentUser = ref<AdminItem | null>(null)

const filters = reactive({ keyword: '', status: '' })
const pages = reactive({ users: 1, groups: 1, menus: 1, apiMaps: 1 })
const pageSizes = reactive({ users: 20, groups: 20, menus: 20, apiMaps: 20 })
const totals = reactive({ users: 0, groups: 0, menus: 0, apiMaps: 0 })
const loading = reactive({ users: false, groups: false, menus: false, apiMaps: false, audit: false, permissions: false })
const grant = reactive<{ userid: string; targetProjects: string[]; isSuper: boolean }>({ userid: '', targetProjects: [], isSuper: false })

const section = computed(() => props.section)
const todayText = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
const titleMap = {
    dashboard: ['统一权限中心', '全局 RBAC 运营视图'],
    users: ['用户管理', '跨 project 管理员账号'],
    authorization: ['用户授权', 'Project 访问与超管管理'],
    groups: ['权限组管理', '成员与权限码聚合视图'],
    menus: ['菜单路由管理', '规则树与按钮权限'],
    apiMap: ['API 权限管理', 'HTTP route 到 permissionCode 映射'],
    audit: ['审计 / 活动记录', '运行时鉴权与权限视图'],
} as const
const title = computed(() => titleMap[section.value][0])
const subtitle = computed(() => titleMap[section.value][1])

const stats = computed(() => [
    { label: '接入系统', value: projects.value.length },
    { label: '管理员账号', value: totals.users || users.value.length },
    { label: '权限组', value: totals.groups || groups.value.length },
    { label: '菜单与路由', value: totals.menus || menus.value.length },
])

const projectCards = computed(() =>
    projects.value.map((p) => ({
        ...p,
        users: users.value.filter((u) => u.projectCodes?.includes(p.code)).length,
        supers: users.value.filter((u) => u.superProjects?.includes(p.code)).length,
        groups: groups.value.filter((g) => g.project === p.code).length,
    }))
)

watch(section, () => {
    filters.keyword = ''
    filters.status = ''
    reloadSection()
})

onMounted(async () => {
    await reloadAll()
})

async function reloadAll() {
    await loadProjects()
    await Promise.all([loadUsers(), loadGroups(), loadMenus(), loadAudit()])
    if (section.value === 'apiMap') await loadApiMaps()
    if (section.value === 'audit') await loadPermissions()
}

async function reloadSection() {
    if (section.value === 'dashboard') return reloadAll()
    if (section.value === 'users' || section.value === 'authorization') return loadUsers()
    if (section.value === 'groups') return loadGroups()
    if (section.value === 'menus') return loadMenus()
    if (section.value === 'apiMap') return loadApiMaps()
    return Promise.all([loadAudit(), loadPermissions()])
}

async function loadProjects() {
    const result = await getGlobalProjects()
    projects.value = (result.list || []).map((code) => ({ code, label: code }))
}

function queryBase(pageKey?: keyof typeof pages) {
    const query: Record<string, any> = {}
    if (selectedProject.value) query.project = selectedProject.value
    if (filters.keyword) query.keyword = filters.keyword
    if (filters.status) query.status = filters.status
    if (pageKey) {
        query.page = pages[pageKey]
        query.pageSize = pageSizes[pageKey]
    }
    return query
}

async function loadUsers() {
    loading.users = true
    try {
        const result = await getGlobalUsers(queryBase('users'))
        users.value = result.list || []
        totals.users = result.total || 0
    } finally {
        loading.users = false
    }
}

async function loadGroups() {
    loading.groups = true
    try {
        const result = await getGlobalGroups(queryBase('groups'))
        groups.value = result.list || []
        totals.groups = result.total || 0
    } finally {
        loading.groups = false
    }
}

async function loadMenus() {
    loading.menus = true
    try {
        const result = await getGlobalMenus(queryBase('menus'))
        menus.value = result.list || []
        totals.menus = result.total || 0
    } finally {
        loading.menus = false
    }
}

async function loadApiMaps() {
    loading.apiMaps = true
    try {
        const result = await getApiMapRecords(queryBase('apiMaps'))
        apiMaps.value = result.list || []
        totals.apiMaps = result.total || 0
    } finally {
        loading.apiMaps = false
    }
}

async function loadAudit() {
    loading.audit = true
    try {
        const result = await searchAuditLogs({ page: 1, pageSize: 20 })
        auditRows.value = result.list || []
    } finally {
        loading.audit = false
    }
}

async function loadPermissions() {
    loading.permissions = true
    try {
        const result = await searchPermissionView({ page: 1, pageSize: 50 })
        permissions.value = result.list || []
    } finally {
        loading.permissions = false
    }
}

async function setUserStatus(row: AdminItem, active: boolean) {
    await updateGlobalUserStatus(row.userid, active ? 'Active' : 'Disabled')
    ElMessage.success(active ? '已启用账号' : '已禁用账号')
    await loadUsers()
}

async function submitGrant() {
    const user = users.value.find((item) => item.userid === grant.userid)
    const result = await grantGlobalUserProjects(grant.userid, {
        username: user?.username,
        targetProjects: grant.targetProjects,
        isSuper: grant.isSuper,
    })
    grantResults.value = result.results || []
    ElMessage.success('授权请求已提交')
    grant.targetProjects = []
    grant.isSuper = false
    await loadUsers()
}

async function revokeGrant(row: AdminItem) {
    if (!selectedProject.value) return
    await ElMessageBox.confirm(`确定撤销 ${row.username} 在 ${selectedProject.value} 的授权？`, '撤销授权', { type: 'warning' })
    const result = await revokeGlobalUserProject(row.userid, selectedProject.value)
    grantResults.value = result.results || []
    await loadUsers()
}

function openUser(row: AdminItem) {
    currentUser.value = row
    detailOpen.value = true
}

function jumpToAuth(project?: string) {
    if (project) selectedProject.value = project
    detailOpen.value = false
    router.push(`${adminBaseRoutePath}/auth/projectGrant`)
}

function typeLabel(type: string) {
    return ({ MenuDir: '目录', Menu: '菜单', Button: '按钮', menu_dir: '目录', menu: '菜单', button: '按钮' } as Record<string, string>)[type] || type
}

const StatusTag = defineComponent({
    props: { status: { type: String, default: '' } },
    setup(props) {
        return () => h('span', { class: ['pc-status', props.status === 'Active' ? 'ok' : 'off'] }, props.status === 'Active' ? '启用' : '禁用')
    },
})

const CodeChips = defineComponent({
    props: { codes: { type: Array as () => string[], default: () => [] }, max: { type: Number, default: 4 } },
    setup(props) {
        return () =>
            h('div', { class: 'pc-chips' }, [
                ...props.codes.slice(0, props.max).map((code) => h('code', code)),
                props.codes.length > props.max ? h('span', `+${props.codes.length - props.max}`) : null,
                props.codes.length === 0 ? h('span', '-') : null,
            ])
    },
})

const ProjectChips = defineComponent({
    props: { codes: { type: Array as () => string[], default: () => [] }, max: { type: Number, default: 4 } },
    setup(props) {
        return () =>
            h('div', { class: 'pc-chips project' }, [
                ...props.codes.slice(0, props.max).map((code) => h('code', code)),
                props.codes.length > props.max ? h('span', `+${props.codes.length - props.max}`) : null,
                props.codes.length === 0 ? h('span', '-') : null,
            ])
    },
})

const UserCell = defineComponent({
    props: { user: { type: Object as () => AdminItem, required: true }, large: { type: Boolean, default: false } },
    setup(props) {
        return () =>
            h('div', { class: ['pc-user', props.large ? 'large' : ''] }, [
                h('span', { class: 'pc-avatar' }, props.user.username?.slice(0, 1) || props.user.userid?.slice(0, 1)),
                h('span', [h('strong', props.user.username || props.user.userid), h('code', props.user.userid)]),
            ])
    },
})

const ActivityList = defineComponent({
    props: { title: { type: String, required: true }, items: { type: Array as () => AuditLogItem[], default: () => [] } },
    setup(props) {
        return () =>
            h('article', { class: 'pc-card' }, [
                h('h2', props.title),
                props.items.length
                    ? h(
                          'div',
                          { class: 'pc-activity' },
                          props.items.map((item) =>
                              h('div', { class: 'pc-activity-row', key: item.auditId }, [
                                  h('span', { class: ['pc-dot', item.result.toLowerCase()] }),
                                  h('div', [h('strong', item.username || item.userid), h('p', `${item.httpMethod || ''} ${item.route || item.permissionCode}`)]),
                                  h('em', item.result),
                              ])
                          )
                      )
                    : h('div', { class: 'pc-empty' }, '暂无活动记录'),
            ])
    },
})

const ToolbarSearch = defineComponent({
    props: { keyword: { type: String, default: '' }, status: { type: String, default: '' } },
    emits: ['update:keyword', 'update:status', 'search'],
    setup(props, { emit }) {
        return () =>
            h('div', { class: 'pc-toolbar' }, [
                h(resolveEl('ElInput'), {
                    modelValue: props.keyword,
                    'onUpdate:modelValue': (v: string) => emit('update:keyword', v),
                    placeholder: '搜索关键字',
                    clearable: true,
                }),
                h(resolveEl('ElSelect'), {
                    modelValue: props.status,
                    'onUpdate:modelValue': (v: string) => emit('update:status', v),
                    placeholder: '状态',
                    clearable: true,
                }, () => [h(resolveEl('ElOption'), { label: '启用', value: 'Active' }), h(resolveEl('ElOption'), { label: '禁用', value: 'Disabled' })]),
                h(resolveEl('ElButton'), { type: 'primary', onClick: () => emit('search') }, () => '筛选'),
            ])
    },
})

const PaginationBar = defineComponent({
    props: { total: { type: Number, default: 0 }, page: { type: Number, default: 1 }, pageSize: { type: Number, default: 20 } },
    emits: ['update:page', 'update:pageSize', 'change'],
    setup(props, { emit }) {
        return () =>
            h(resolveEl('ElPagination'), {
                class: 'pc-pagination',
                total: props.total,
                currentPage: props.page,
                pageSize: props.pageSize,
                layout: 'total, sizes, prev, pager, next',
                'onUpdate:currentPage': (v: number) => {
                    emit('update:page', v)
                    emit('change')
                },
                'onUpdate:pageSize': (v: number) => {
                    emit('update:pageSize', v)
                    emit('change')
                },
            })
    },
})

function resolveEl(name: string) {
    return resolveComponent(name)
}
</script>

<style scoped lang="scss">
.pc-page {
    --pc-blue: #0066cc;
    --pc-ink: #1d1d1f;
    --pc-muted: #7a7a7a;
    --pc-line: #e0e0e0;
    --pc-pearl: #fafafc;
    --pc-parchment: #f5f5f7;
    color: var(--pc-ink);
    font-family: 'SF Pro Text', system-ui, -apple-system, sans-serif;
}
.pc-hero {
    display: flex;
    justify-content: space-between;
    gap: 24px;
    align-items: flex-end;
    margin-bottom: 24px;
}
.pc-hero h1 {
    margin: 0;
    font-family: 'SF Pro Display', system-ui, -apple-system, sans-serif;
    font-size: 40px;
    line-height: 1.1;
    font-weight: 600;
}
.pc-hero p {
    margin: 6px 0 0;
    color: var(--pc-muted);
    font-size: 18px;
}
.pc-kicker {
    color: var(--pc-blue) !important;
    font-size: 13px !important;
    font-weight: 600;
}
.pc-hero-actions,
.pc-toolbar {
    display: flex;
    gap: 10px;
    align-items: center;
}
.pc-stack {
    display: flex;
    flex-direction: column;
    gap: 18px;
}
.pc-card,
.pc-project,
.pc-ribbon {
    background: #fff;
    border: 1px solid var(--pc-line);
    border-radius: 18px;
}
.pc-card {
    padding: 20px 22px;
}
.pc-card h2,
.pc-card h3 {
    margin: 0 0 10px;
    font-size: 18px;
}
.pc-ribbon {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    padding: 20px 0;
}
.pc-ribbon-item {
    padding: 0 26px;
    border-left: 1px solid #f0f0f0;
}
.pc-ribbon-item:first-child {
    border-left: 0;
}
.pc-ribbon strong {
    display: block;
    font-size: 32px;
    line-height: 1;
}
.pc-ribbon span,
.pc-project span,
.pc-empty {
    color: var(--pc-muted);
}
.pc-grid {
    display: grid;
    gap: 16px;
}
.pc-grid-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
}
.pc-project {
    min-height: 210px;
    padding: 30px 32px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background: var(--pc-parchment);
}
.pc-project.dark {
    background: #272729;
    color: #fff;
}
.pc-project h2 {
    margin: 8px 0 0;
    font-size: 27px;
}
.pc-project-metrics {
    display: flex;
    align-items: flex-end;
    gap: 26px;
}
.pc-project-metrics strong {
    display: block;
    font-size: 26px;
    color: inherit;
}
.pc-code,
code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 12px;
    color: #555;
}
.pc-table-card {
    padding: 0;
    overflow: hidden;
}
.pc-table-card :deep(.el-table__header th) {
    background: var(--pc-pearl);
    color: var(--pc-ink);
    font-size: 12px;
    font-weight: 600;
}
.pc-user {
    display: flex;
    align-items: center;
    gap: 11px;
}
.pc-user.large {
    align-items: flex-start;
}
.pc-user strong,
.pc-user code {
    display: block;
}
.pc-avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--pc-ink);
    color: #fff;
    font-weight: 600;
}
.pc-chips {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
}
.pc-chips code {
    padding: 4px 8px;
    border-radius: 7px;
    background: #f3f3f5;
}
.pc-status {
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    padding: 4px 10px;
    font-size: 12px;
    font-weight: 600;
}
.pc-status.ok {
    color: #147a3b;
    background: #e9f8ee;
}
.pc-status.off {
    color: #777;
    background: #f0f0f2;
}
.pc-split {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 28px;
}
.pc-split :deep(.el-select) {
    width: 100%;
    margin-bottom: 12px;
}
.pc-result,
.pc-activity-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 0;
    border-top: 1px solid #f0f0f0;
}
.pc-activity-row > div {
    flex: 1;
    min-width: 0;
}
.pc-activity-row p {
    margin: 2px 0 0;
    color: var(--pc-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.pc-activity-row em {
    font-style: normal;
    font-weight: 600;
}
.pc-dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: #34c759;
}
.pc-dot.deny {
    background: #ff3b30;
}
.pc-dot.error {
    background: #ff9f0a;
}
.pc-pagination {
    padding: 14px 18px;
    justify-content: flex-end;
}
.pc-drawer {
    padding: 24px;
}
.pc-detail-block {
    margin: 24px 0;
}
@media (max-width: 900px) {
    .pc-hero,
    .pc-project-metrics {
        align-items: flex-start;
        flex-direction: column;
    }
    .pc-grid-2,
    .pc-ribbon,
    .pc-split {
        grid-template-columns: 1fr;
    }
}
</style>
