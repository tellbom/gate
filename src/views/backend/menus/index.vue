<template>
    <main class="menus-page">
        <div class="page-head">
            <div><h1>菜单与路由</h1><p>规则树与按钮权限</p></div>
            <el-select v-model="project" placeholder="选择 project" @change="loadMenus"><el-option v-for="p in projects" :key="p" :label="p" :value="p" /></el-select>
        </div>
        <div class="toolbar">
            <el-input v-model="query.keyword" clearable placeholder="搜索标题 / ruleCode" @keyup.enter="loadMenus" />
            <el-select v-model="query.type" clearable placeholder="类型" @change="loadMenus">
                <el-option label="目录" value="MenuDir" /><el-option label="菜单" value="Menu" /><el-option label="按钮" value="Button" />
            </el-select>
            <el-button @click="loadMenus">筛选</el-button>
        </div>
        <div class="card">
            <el-table v-loading="loading" :data="menus" row-key="ruleCode">
                <el-table-column label="菜单/规则" min-width="260"><template #default="{ row }"><strong>{{ row.title }}</strong><code>{{ row.ruleCode }}</code></template></el-table-column>
                <el-table-column label="类型" width="110"><template #default="{ row }"><el-tag effect="plain">{{ typeLabel(row.type) }}</el-tag></template></el-table-column>
                <el-table-column label="权限码" min-width="220"><template #default="{ row }"><code>{{ row.permissionCode }}</code></template></el-table-column>
                <el-table-column label="路由" min-width="180"><template #default="{ row }"><code>{{ row.path || row.url || '-' }}</code></template></el-table-column>
                <el-table-column label="状态" width="100"><template #default="{ row }"><el-tag :type="row.status === 'Active' ? 'success' : 'info'">{{ row.status === 'Active' ? '启用' : '禁用' }}</el-tag></template></el-table-column>
            </el-table>
        </div>
        <p class="gap">跨 project 写规则接口未在文档中提供；规则新增/编辑/排序必须选择单一 project 并走 /api/rule/*。</p>
    </main>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { getGlobalMenus, getGlobalProjects, type RuleItem } from '/@/api/backend/rbac'

defineOptions({ name: 'backend/menus' })
const loading = ref(false)
const projects = ref<string[]>([])
const project = ref('')
const menus = ref<RuleItem[]>([])
const query = reactive({ page: 1, pageSize: 50, keyword: '', type: '' })

onMounted(async () => {
    projects.value = (await getGlobalProjects()).list || []
    await loadMenus()
})
async function loadMenus() {
    loading.value = true
    try { menus.value = (await getGlobalMenus({ ...query, project: project.value || undefined })).list || [] } finally { loading.value = false }
}
function typeLabel(type: string) {
    return ({ MenuDir: '目录', Menu: '菜单', Button: '按钮', menu_dir: '目录', menu: '菜单', button: '按钮' } as Record<string, string>)[type] || type
}
</script>

<style scoped>
.menus-page { color: #1d1d1f; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif; }
.page-head { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; }
h1 { margin: 0; font-size: 40px; font-weight: 600; letter-spacing: -0.02em; }
.page-head p { margin: 6px 0 0; color: #5c5c60; font-size: 19px; }
.page-head .el-select { width: 200px; }
.toolbar { display: flex; gap: 12px; margin-bottom: 18px; }
.toolbar .el-input { width: 260px; }
.toolbar .el-select { width: 140px; }
.card { background: #fff; border: 1px solid #e0e0e0; border-radius: 18px; overflow: hidden; }
:deep(th) { background: #fafafc !important; color: #1d1d1f; font-size: 12px; font-weight: 600; }
strong, code { display: block; }
code { color: #7a7a7a; font-size: 12px; }
.gap { padding: 13px 16px; border-radius: 12px; background: #f6efdc; color: #7a5500; }
</style>
