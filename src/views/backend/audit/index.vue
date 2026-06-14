<template>
    <main class="audit-page">
        <div class="page-head"><div><h1>审计</h1><p>运行时鉴权与权限视图</p></div><el-button @click="loadData">刷新</el-button></div>
        <el-alert class="gap" type="warning" :closable="false" title="当前 API 提供运行时鉴权日志；授权变更历史不是现有接口能力，已标记为后端缺口。" />
        <div class="toolbar">
            <el-segmented v-model="tab" :options="[{ label: '鉴权日志', value: 'logs' }, { label: '权限视图', value: 'permissions' }]" />
            <el-select v-if="tab === 'logs'" v-model="query.result" clearable placeholder="结果" @change="loadData"><el-option label="通过" value="Allow" /><el-option label="拒绝" value="Deny" /><el-option label="异常" value="Error" /></el-select>
        </div>
        <div v-if="tab === 'logs'" class="card">
            <el-table v-loading="loading" :data="auditRows" row-key="auditId">
                <el-table-column label="时间" min-width="170" prop="createdAt" />
                <el-table-column label="用户" min-width="160"><template #default="{ row }"><strong>{{ row.username || row.userid }}</strong><code>{{ row.userid }}</code></template></el-table-column>
                <el-table-column label="请求" min-width="260"><template #default="{ row }"><code>{{ row.httpMethod || '-' }} {{ row.route || '-' }}</code></template></el-table-column>
                <el-table-column label="权限码" min-width="220"><template #default="{ row }"><code>{{ row.permissionCode }}</code></template></el-table-column>
                <el-table-column label="结果" width="110"><template #default="{ row }"><el-tag :type="row.result === 'Allow' ? 'success' : row.result === 'Deny' ? 'danger' : 'warning'">{{ row.result }}</el-tag></template></el-table-column>
            </el-table>
        </div>
        <div v-else class="card">
            <el-table v-loading="loading" :data="permissions" row-key="permissionCode">
                <el-table-column label="权限码" min-width="260"><template #default="{ row }"><code>{{ row.permissionCode }}</code></template></el-table-column>
                <el-table-column label="Action" width="130" prop="action" />
                <el-table-column label="资源" width="150" prop="resourceType" />
                <el-table-column label="标题" min-width="180" prop="title" />
            </el-table>
        </div>
    </main>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { searchAuditLogs, searchPermissionView, type AuditLogItem, type PermissionViewItem } from '/@/api/backend/rbac'

defineOptions({ name: 'backend/audit' })
const tab = ref<'logs' | 'permissions'>('logs')
const loading = ref(false)
const auditRows = ref<AuditLogItem[]>([])
const permissions = ref<PermissionViewItem[]>([])
const query = reactive({ page: 1, pageSize: 20, result: '' })
watch(tab, loadData)
onMounted(loadData)
async function loadData() {
    loading.value = true
    try {
        if (tab.value === 'logs') auditRows.value = (await searchAuditLogs({ ...query, result: query.result as any })).list || []
        else permissions.value = (await searchPermissionView({ page: 1, pageSize: 50 })).list || []
    } finally { loading.value = false }
}
</script>

<style scoped>
.audit-page { color: #1d1d1f; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif; }
.page-head { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 18px; }
h1 { margin: 0; font-size: 40px; font-weight: 600; letter-spacing: -0.02em; }
.page-head p { margin: 6px 0 0; color: #5c5c60; font-size: 19px; }
.gap { margin-bottom: 18px; }
.toolbar { display: flex; gap: 12px; margin-bottom: 18px; }
.toolbar .el-select { width: 140px; }
.card { background: #fff; border: 1px solid #e0e0e0; border-radius: 18px; overflow: hidden; }
:deep(th) { background: #fafafc !important; color: #1d1d1f; font-size: 12px; font-weight: 600; }
strong, code { display: block; }
code { color: #333; font-size: 12px; }
</style>
