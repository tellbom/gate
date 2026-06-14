<template>
    <main class="api-page">
        <div class="page-head">
            <div><h1>API 权限</h1><p>HTTP route → permissionCode / action</p></div>
            <el-button type="primary" round @click="openCreate">新增映射</el-button>
        </div>
        <div class="toolbar"><el-input v-model="query.keyword" clearable placeholder="搜索路由或权限码" @keyup.enter="loadData" /><el-button @click="loadData">筛选</el-button></div>
        <div class="card">
            <el-table v-loading="loading" :data="rows" row-key="id">
                <el-table-column label="方法" width="90"><template #default="{ row }"><el-tag>{{ row.httpMethod }}</el-tag></template></el-table-column>
                <el-table-column label="路由模板" min-width="260"><template #default="{ row }"><code>{{ row.routePattern }}</code></template></el-table-column>
                <el-table-column label="权限码" min-width="220"><template #default="{ row }"><code>{{ row.permissionCode }}</code></template></el-table-column>
                <el-table-column label="Action" width="120"><template #default="{ row }"><el-tag effect="plain">{{ row.action }}</el-tag></template></el-table-column>
                <el-table-column label="状态" width="100"><template #default="{ row }"><el-tag :type="row.status === 'Active' ? 'success' : 'info'">{{ row.status }}</el-tag></template></el-table-column>
                <el-table-column label="操作" width="130" fixed="right"><template #default="{ row }"><el-button link type="primary" @click="openEdit(row)">编辑</el-button><el-button link type="danger" @click="remove(row)">删除</el-button></template></el-table-column>
            </el-table>
        </div>
        <ApiMapEditor v-model="editorOpen" :model="current" @submit="save" />
    </main>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ApiMapEditor from './ApiMapEditor.vue'
import { createApiMap, deleteApiMap, getApiMapRecords, updateApiMap, type ApiMapRecordItem, type ApiAction, type HttpMethod } from '/@/api/backend/rbac'

defineOptions({ name: 'backend/apiMap' })
const loading = ref(false)
const rows = ref<ApiMapRecordItem[]>([])
const current = ref<ApiMapRecordItem | null>(null)
const editorOpen = ref(false)
const query = reactive({ page: 1, pageSize: 20, keyword: '' })
onMounted(loadData)
async function loadData() { loading.value = true; try { rows.value = (await getApiMapRecords(query)).list || [] } finally { loading.value = false } }
function openCreate() { current.value = null; editorOpen.value = true }
function openEdit(row: ApiMapRecordItem) { current.value = row; editorOpen.value = true }
async function save(form: { httpMethod: HttpMethod; routePattern: string; permissionCode: string; action: ApiAction }) {
    if (current.value) await updateApiMap(current.value.id, { permissionCode: form.permissionCode, action: form.action })
    else await createApiMap(form)
    editorOpen.value = false
    ElMessage.success('已保存 API 映射')
    await loadData()
}
async function remove(row: ApiMapRecordItem) {
    await ElMessageBox.confirm(`确定删除 ${row.httpMethod} ${row.routePattern}？`, '删除 API 映射', { type: 'warning' })
    await deleteApiMap(row.id)
    ElMessage.success('已删除')
    await loadData()
}
</script>

<style scoped>
.api-page { color: #1d1d1f; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif; }
.page-head { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; }
h1 { margin: 0; font-size: 40px; font-weight: 600; letter-spacing: -0.02em; }
.page-head p { margin: 6px 0 0; color: #5c5c60; font-size: 19px; }
.toolbar { display: flex; gap: 12px; margin-bottom: 18px; }
.toolbar .el-input { width: 280px; }
.card { background: #fff; border: 1px solid #e0e0e0; border-radius: 18px; overflow: hidden; }
:deep(th) { background: #fafafc !important; color: #1d1d1f; font-size: 12px; font-weight: 600; }
code { font-size: 12px; color: #333; }
</style>
