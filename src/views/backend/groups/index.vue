<template>
    <main class="groups-page">
        <div class="page-head">
            <div><h1>权限组</h1><p>成员与权限码管理</p></div>
            <el-button @click="loadGroups">刷新</el-button>
        </div>
        <div class="toolbar">
            <el-input v-model="query.keyword" clearable placeholder="搜索组名 / groupCode" @keyup.enter="loadGroups" />
            <el-select v-model="query.project" clearable placeholder="全部系统" @change="loadGroups"><el-option v-for="p in projects" :key="p" :label="p" :value="p" /></el-select>
            <el-button @click="loadGroups">筛选</el-button>
        </div>
        <div class="card">
            <el-table v-loading="loading" :data="groups" row-key="groupCode" @row-click="openDetail">
                <el-table-column label="权限组" min-width="230"><template #default="{ row }"><strong>{{ row.groupName || row.groupCode }}</strong><code>{{ row.groupCode }}</code></template></el-table-column>
                <el-table-column label="Project" width="140"><template #default="{ row }"><code>{{ row.project }}</code></template></el-table-column>
                <el-table-column label="状态" width="100"><template #default="{ row }"><el-tag :type="row.status === 'Active' ? 'success' : 'info'">{{ row.status === 'Active' ? '启用' : '禁用' }}</el-tag></template></el-table-column>
                <el-table-column label="权限码" min-width="320"><template #default="{ row }"><div class="chips"><code v-for="code in (row.permissionCodes || []).slice(0, 4)" :key="code">{{ code }}</code><span v-if="(row.permissionCodes || []).length > 4">+{{ row.permissionCodes.length - 4 }}</span></div></template></el-table-column>
            </el-table>
        </div>
        <GroupDetailDrawer v-model="drawerOpen" :group="selectedGroup" />
    </main>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import GroupDetailDrawer from './GroupDetailDrawer.vue'
import { getGlobalGroups, getGlobalProjects, type GroupItem } from '/@/api/backend/rbac'

defineOptions({ name: 'backend/groups' })
const loading = ref(false)
const projects = ref<string[]>([])
const groups = ref<GroupItem[]>([])
const selectedGroup = ref<GroupItem | null>(null)
const drawerOpen = ref(false)
const query = reactive({ page: 1, pageSize: 20, keyword: '', project: '' })

onMounted(async () => {
    projects.value = (await getGlobalProjects()).list || []
    await loadGroups()
})
async function loadGroups() {
    loading.value = true
    try { groups.value = (await getGlobalGroups(query)).list || [] } finally { loading.value = false }
}
function openDetail(row: GroupItem) { selectedGroup.value = row; drawerOpen.value = true }
</script>

<style scoped>
.groups-page { color: #1d1d1f; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif; }
.page-head { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; }
h1 { margin: 0; font-size: 40px; font-weight: 600; letter-spacing: -0.02em; }
.page-head p { margin: 6px 0 0; color: #5c5c60; font-size: 19px; }
.toolbar { display: flex; gap: 12px; margin-bottom: 18px; }
.toolbar .el-input { width: 260px; }
.toolbar .el-select { width: 180px; margin-left: auto; }
.card { background: #fff; border: 1px solid #e0e0e0; border-radius: 18px; overflow: hidden; }
:deep(th) { background: #fafafc !important; color: #1d1d1f; font-size: 12px; font-weight: 600; }
strong, td code { display: block; }
td code { color: #7a7a7a; font-size: 12px; }
.chips { display: flex; gap: 6px; flex-wrap: wrap; }
.chips code { padding: 4px 8px; border-radius: 7px; background: #f3f3f5; color: #0066cc; }
</style>
