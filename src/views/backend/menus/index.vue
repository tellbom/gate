<template>
    <main class="menus-page">
        <div class="page-head">
            <div><h1>菜单与路由</h1><p>规则树与按钮权限</p></div>
            <el-select v-model="project" clearable placeholder="选择 project" @change="loadProjectTree"><el-option v-for="p in projects" :key="p" :label="p" :value="p" /></el-select>
        </div>
        <div class="toolbar">
            <el-input v-model="query.keyword" clearable placeholder="搜索标题 / ruleCode" @keyup.enter="loadMenus" />
            <el-select v-model="query.type" clearable placeholder="类型" @change="loadMenus">
                <el-option label="目录" value="MenuDir" /><el-option label="菜单" value="Menu" /><el-option label="按钮" value="Button" />
            </el-select>
            <el-button @click="loadMenus">筛选</el-button>
        </div>
        <div class="split">
            <section class="card tree-card">
                <div class="card-head">
                    <div>
                        <h2>Project 规则树</h2>
                        <p>{{ project ? `${project} /api/rule/tree` : '选择单一 project 后读取和写入规则' }}</p>
                    </div>
                    <el-button :disabled="!project" :loading="treeLoading" @click="loadProjectTree">刷新</el-button>
                </div>
                <el-table
                    v-loading="treeLoading"
                    :data="ruleTree"
                    row-key="ruleCode"
                    default-expand-all
                    :tree-props="{ children: 'children' }"
                    empty-text="请选择 project 查看规则树"
                >
                    <el-table-column label="规则" min-width="240">
                        <template #default="{ row }">
                            <strong>{{ row.title }}</strong>
                            <code>{{ row.ruleCode }}</code>
                        </template>
                    </el-table-column>
                    <el-table-column label="类型" width="96">
                        <template #default="{ row }"><el-tag effect="plain">{{ typeLabel(row.type) }}</el-tag></template>
                    </el-table-column>
                    <el-table-column label="状态" width="116">
                        <template #default="{ row }">
                            <el-switch
                                :model-value="normalizeStatus(row.status) === 'Active'"
                                :disabled="!project"
                                @change="(value) => changeRuleStatus(row, value)"
                            />
                        </template>
                    </el-table-column>
                    <el-table-column label="权重" width="150">
                        <template #default="{ row }">
                            <el-input-number
                                :model-value="Number(row.weigh || 0)"
                                :disabled="!project"
                                size="small"
                                :controls="false"
                                @change="(value) => changeRuleWeigh(row, value)"
                            />
                        </template>
                    </el-table-column>
                </el-table>
            </section>
        </div>
        <div class="card">
            <div class="card-head">
                <div>
                    <h2>全局菜单索引</h2>
                    <p>跨 project 查询来自 /api/global/menu/list，只做聚合展示</p>
                </div>
            </div>
            <el-table v-loading="loading" :data="menus" row-key="ruleCode">
                <el-table-column label="菜单/规则" min-width="260"><template #default="{ row }"><strong>{{ row.title }}</strong><code>{{ row.ruleCode }}</code></template></el-table-column>
                <el-table-column label="类型" width="110"><template #default="{ row }"><el-tag effect="plain">{{ typeLabel(row.type) }}</el-tag></template></el-table-column>
                <el-table-column label="权限码" min-width="220"><template #default="{ row }"><code>{{ row.permissionCode }}</code></template></el-table-column>
                <el-table-column label="路由" min-width="180"><template #default="{ row }"><code>{{ row.path || row.url || '-' }}</code></template></el-table-column>
                <el-table-column label="状态" width="100"><template #default="{ row }"><el-tag :type="row.status === 'Active' ? 'success' : 'info'">{{ row.status === 'Active' ? '启用' : '禁用' }}</el-tag></template></el-table-column>
            </el-table>
        </div>
        <p class="gap">跨 project 写规则接口未在文档中提供；状态和权重写入仅在选中单一 project 后走 /api/rule/*，并通过 X-Project 指定上下文。</p>
    </main>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
    getGlobalMenus,
    getGlobalProjects,
    rbacClient,
    type RecordStatus,
    type RuleItem,
    type RuleTreeNode,
} from '/@/api/backend/rbac'

defineOptions({ name: 'backend/menus' })
const loading = ref(false)
const treeLoading = ref(false)
const projects = ref<string[]>([])
const project = ref('')
const menus = ref<RuleItem[]>([])
const ruleTree = ref<UiRuleTreeNode[]>([])
const query = reactive({ page: 1, pageSize: 50, keyword: '', type: '' })

type UiRuleTreeNode = RuleTreeNode & {
    status?: RecordStatus | string
    weigh?: number
    children?: UiRuleTreeNode[]
}

onMounted(async () => {
    projects.value = (await getGlobalProjects()).list || []
    project.value = projects.value[0] || ''
    await loadProjectTree()
    await loadMenus()
})
async function loadMenus() {
    loading.value = true
    try { menus.value = (await getGlobalMenus({ ...query, project: project.value || undefined })).list || [] } finally { loading.value = false }
}
async function loadProjectTree() {
    if (!project.value) {
        ruleTree.value = []
        await loadMenus()
        return
    }
    treeLoading.value = true
    try {
        ruleTree.value = await rbacClient.get<any, UiRuleTreeNode[]>('/api/rule/tree', {
            headers: { 'X-Project': project.value },
        })
        await loadMenus()
    } finally {
        treeLoading.value = false
    }
}
async function changeRuleStatus(row: UiRuleTreeNode, active: string | number | boolean) {
    if (!project.value) {
        ElMessage.warning('请先选择一个 project')
        return
    }
    const status: RecordStatus = Boolean(active) ? 'Active' : 'Disabled'
    await rbacClient.put<any, void>(
        `/api/rule/${encodeURIComponent(row.ruleCode)}/status`,
        { status },
        { headers: { 'X-Project': project.value } }
    )
    row.status = status
    ElMessage.success('规则状态已更新')
}
async function changeRuleWeigh(row: UiRuleTreeNode, value?: string | number) {
    if (!project.value) {
        ElMessage.warning('请先选择一个 project')
        return
    }
    const weigh = Number(value || 0)
    await rbacClient.put<any, void>(
        `/api/rule/${encodeURIComponent(row.ruleCode)}/weigh`,
        { weigh },
        { headers: { 'X-Project': project.value } }
    )
    row.weigh = weigh
    ElMessage.success('规则权重已更新')
}
function normalizeStatus(status?: string) {
    return status === 'Active' || status === 'active' || status === '1' ? 'Active' : 'Disabled'
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
.split { margin-bottom: 18px; }
.card { background: #fff; border: 1px solid #e0e0e0; border-radius: 18px; overflow: hidden; }
.tree-card { min-height: 260px; }
.card-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 16px 18px; border-bottom: 1px solid #eeeeef; }
.card-head h2 { margin: 0; font-size: 17px; font-weight: 600; }
.card-head p { margin: 4px 0 0; color: #7a7a7a; font-size: 13px; }
:deep(th) { background: #fafafc !important; color: #1d1d1f; font-size: 12px; font-weight: 600; }
strong, code { display: block; }
code { color: #7a7a7a; font-size: 12px; }
:deep(.el-input-number) { width: 96px; }
.gap { padding: 13px 16px; border-radius: 12px; background: #f6efdc; color: #7a5500; }
</style>
