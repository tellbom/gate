<template>
    <main class="users-page">
        <div class="page-head">
            <div>
                <h1>用户</h1>
                <p>跨 project 管理员账号</p>
            </div>
            <el-button type="primary" round :disabled="!selectedUser" @click="grantOpen = true">授权用户</el-button>
        </div>
        <div class="toolbar">
            <el-input v-model="query.keyword" clearable placeholder="搜索姓名或 userid" @keyup.enter="loadUsers" />
            <el-segmented v-model="query.status" :options="statusOptions" @change="loadUsers" />
            <el-select v-model="query.project" clearable placeholder="全部系统" @change="loadUsers">
                <el-option v-for="project in projects" :key="project" :label="project" :value="project" />
            </el-select>
            <el-button @click="loadUsers">筛选</el-button>
        </div>
        <div class="card table-card">
            <el-table v-loading="loading" :data="users" row-key="userid" @row-click="openDetail" highlight-current-row>
                <el-table-column label="用户" min-width="220">
                    <template #default="{ row }">
                        <div class="user-cell"><span>{{ row.username.slice(0, 1) }}</span><div><strong>{{ row.username }}</strong><code>{{ row.userid }}</code></div></div>
                    </template>
                </el-table-column>
                <el-table-column label="状态" width="120">
                    <template #default="{ row }">
                        <el-switch :model-value="row.status === 'Active'" :active-color="'#0066cc'" @change="(value) => setStatus(row, value === true)" />
                    </template>
                </el-table-column>
                <el-table-column label="所属系统" min-width="260">
                    <template #default="{ row }"><div class="chips"><code v-for="project in (row.projectCodes || []).slice(0, 4)" :key="project">{{ project }}</code><span v-if="!row.projectCodes?.length">-</span></div></template>
                </el-table-column>
                <el-table-column label="权限组" min-width="180">
                    <template #default="{ row }">{{ (row.groupNames || []).slice(0, 2).join('、') || '-' }}</template>
                </el-table-column>
                <el-table-column label="超管" width="100" align="center">
                    <template #default="{ row }"><el-tag v-if="row.superProjects?.length" type="warning" round>{{ row.superProjects.length }}</el-tag><span v-else>-</span></template>
                </el-table-column>
            </el-table>
        </div>
        <UserDetailDrawer
            v-model="detailOpen"
            :user="selectedUser"
            @grant="grantOpen = true"
            @revoke="revoke"
            @toggle-super="toggleSuper"
        />
        <UserGrantDialog v-model="grantOpen" :user="selectedUser" :projects="projects" @success="loadUsers" />
    </main>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import UserDetailDrawer from './UserDetailDrawer.vue'
import UserGrantDialog from './UserGrantDialog.vue'
import {
    getGlobalProjects,
    getGlobalUsers,
    revokeGlobalUserProject,
    rbacClient,
    updateGlobalUserStatus,
    type AdminItem,
} from '/@/api/backend/rbac'

defineOptions({ name: 'backend/users' })

const statusOptions = [
    { label: '全部', value: '' },
    { label: '启用', value: 'Active' },
    { label: '禁用', value: 'Disabled' },
]
const loading = ref(false)
const users = ref<AdminItem[]>([])
const projects = ref<string[]>([])
const selectedUser = ref<AdminItem | null>(null)
const detailOpen = ref(false)
const grantOpen = ref(false)
const query = reactive({ page: 1, pageSize: 20, keyword: '', status: '', project: '' })

onMounted(async () => {
    const result = await getGlobalProjects()
    projects.value = result.list || []
    await loadUsers()
})

async function loadUsers() {
    loading.value = true
    try {
        const result = await getGlobalUsers({ ...query, status: query.status as any })
        users.value = result.list || []
    } finally {
        loading.value = false
    }
}

function openDetail(row: AdminItem) {
    selectedUser.value = row
    detailOpen.value = true
}

async function setStatus(row: AdminItem, active: boolean) {
    await updateGlobalUserStatus(row.userid, active ? 'Active' : 'Disabled')
    ElMessage.success(active ? '已启用账号' : '已禁用账号')
    await loadUsers()
}

async function revoke(row: AdminItem, project: string) {
    await ElMessageBox.confirm(`确定撤销 ${row.username} 在 ${project} 的授权？`, '撤销授权', { type: 'warning' })
    await revokeGlobalUserProject(row.userid, project)
    ElMessage.success('已撤销授权')
    await loadUsers()
}

async function toggleSuper(row: AdminItem, project: string, value: boolean) {
    await rbacClient.put(`/api/project-grant/${encodeURIComponent(row.userid)}/super`, { isSuper: value }, { headers: { 'X-Project': project } })
    ElMessage.success(value ? '已提升为超管' : '已降级为普通管理员')
    await loadUsers()
}
</script>

<style scoped>
.users-page { color: #1d1d1f; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif; }
.page-head { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; }
.page-head h1 { margin: 0; font-size: 40px; font-weight: 600; letter-spacing: -0.02em; }
.page-head p { margin: 6px 0 0; color: #5c5c60; font-size: 19px; }
.toolbar { display: flex; gap: 12px; margin-bottom: 18px; align-items: center; }
.toolbar .el-input { width: 240px; }
.toolbar .el-select { width: 180px; margin-left: auto; }
.card { background: #fff; border: 1px solid #e0e0e0; border-radius: 18px; }
.table-card { overflow: hidden; }
.table-card :deep(th) { background: #fafafc !important; color: #1d1d1f; font-size: 12px; font-weight: 600; }
.user-cell { display: flex; align-items: center; gap: 11px; }
.user-cell > span { width: 34px; height: 34px; border-radius: 50%; background: #1d1d1f; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 600; }
.user-cell strong, .user-cell code { display: block; }
.user-cell code { color: #7a7a7a; font-size: 12px; }
.chips { display: flex; gap: 6px; flex-wrap: wrap; }
.chips code { padding: 4px 8px; border-radius: 7px; background: #f3f3f5; font-size: 12px; }
</style>
