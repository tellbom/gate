<!--
  放置路径：src/views/backend/menus/index.vue
  基于附件 index.vue 直接封装，追加：
  1. 顶部 project 选择 tab（全局视图下多 project 切换）
  2. 右侧 API 映射面板（el-drawer/split），从 GET /api/api-map/records 加载
  3. pc-page wrapper + RbacApiSource 脚注
  4. 原有树形表格逻辑 100% 保留（attachedgetRule/updateRule/deleteRule）
  5. RuleFormDrawer / RuleIconSelector 路径修正为 ./components/
-->
<template>
  <main class="pc-page pc-anim-fade">

    <!-- Project 选择 Tab（全局视图多 project 切换） -->
    <div class="menus-proj-bar">
      <div class="proj-tabs">
        <button
          v-for="p in projectTabs" :key="p"
          class="proj-tab"
          :class="{ 'proj-tab--active': currentProject === p }"
          @click="switchProject(p)"
        >
          <RbacProjectGlyph :code="p" :name="p" :size="18" />
          <span>{{ p }}</span>
        </button>
      </div>
      <div style="margin-left:auto;display:flex;align-items:center;gap:10px">
        <el-button size="small" :icon="ApiIcon" @click="apiPanelVisible = true">API 映射</el-button>
      </div>
    </div>

    <!-- 当前 project 标签 -->
    <div class="menus-context" v-if="currentProject">
      <span class="pc-t-cap">当前 project：</span>
      <span class="pc-t-mono" style="font-size:13px;font-weight:600">{{ currentProject }}</span>
      <span class="pc-badge pc-badge--blue pc-badge--sm" style="margin-left:8px">X-Project: {{ currentProject }}</span>
    </div>

    <!-- 原始树形表格（完整复用附件代码） -->
    <div class="rbac-rule-page">
      <Commonsearch :fields="searchFields" @search="handleSearch" @reset="handleReset" />

      <div class="rule-table-wrapper">
        <div class="table-toolbar">
          <div class="toolbar-left">
            <el-button v-if="canCreate" type="primary" :icon="Plus" @click="openCreate(null)">新增规则</el-button>
            <el-button :icon="Refresh" @click="loadTree" title="刷新" />
            <el-button :icon="isAllExpanded ? FolderOpened : Folder" @click="toggleExpandAll">
              {{ isAllExpanded ? '全部收起' : '全部展开' }}
            </el-button>
          </div>
          <span class="table-summary">共 {{ flatCount }} 项</span>
        </div>

        <el-table
          v-loading="loading"
          :data="treeData"
          row-key="ruleCode"
          :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
          :indent="32"
          style="width:100%"
          :key="tableRenderKey"
          :default-expand-all="isAllExpanded"
          :header-cell-style="headerCellStyle"
        >
          <el-table-column label="标题" min-width="260">
            <template #default="{ row }">
              <div class="title-cell">
                <span class="node-title">{{ row.title }}</span>
                <code class="node-code">{{ row.ruleCode }}</code>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="图标" width="72" align="center">
            <template #default="{ row }">
              <i v-if="row.icon" :class="row.icon" class="rule-icon" />
              <span v-else class="nil">—</span>
            </template>
          </el-table-column>
          <el-table-column label="名称" min-width="180" show-overflow-tooltip>
            <template #default="{ row }">
              <code v-if="row.name" class="code-text">{{ row.name }}</code>
              <span v-else class="nil">—</span>
            </template>
          </el-table-column>
          <el-table-column label="类型" width="90" align="center">
            <template #default="{ row }">
              <el-tag size="small" effect="plain">{{ getTypeLabel(row.type) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="缓存" width="80" align="center">
            <template #default="{ row }">
              <el-switch :model-value="row.keepalive === true" size="small" disabled />
            </template>
          </el-table-column>
          <el-table-column label="权限码" min-width="200" show-overflow-tooltip>
            <template #default="{ row }">
              <code v-if="row.permissionCode" class="code-text">{{ row.permissionCode }}</code>
              <span v-else class="nil">—</span>
            </template>
          </el-table-column>
          <el-table-column label="路由路径" min-width="150" show-overflow-tooltip>
            <template #default="{ row }">
              <span v-if="row.type === 'button'" class="nil">—</span>
              <code v-else-if="row.path" class="code-text">{{ row.path }}</code>
              <code v-else-if="row.url" class="code-text">{{ row.url }}</code>
              <span v-else class="nil">—</span>
            </template>
          </el-table-column>
          <el-table-column label="排序" width="96" align="center">
            <template #default="{ row }">
              <el-input-number
                v-if="canEdit"
                :model-value="row.weigh ?? 0"
                :min="0" :max="9999" :step="10"
                size="small"
                controls-position="right"
                class="weigh-input"
                @change="(val) => handleWeighChange(row, val)"
              />
              <span v-else class="nil">{{ row.weigh ?? 0 }}</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="80" align="center">
            <template #default="{ row }">
              <el-switch
                v-if="canEdit"
                :model-value="row.status === 'Active'"
                size="small"
                :active-color="'#0066cc'"
                @change="(val) => handleStatusToggle(row, val)"
              />
              <el-tag v-else :type="row.status === 'Active' ? 'success' : 'danger'" size="small">
                {{ row.status === 'Active' ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="185" align="center" fixed="right">
            <template #default="{ row }">
              <el-button v-if="canCreate && row.type !== 'button'" type="primary" link size="small" :icon="Plus" @click="openCreate(row)">子项</el-button>
              <el-button v-if="canEdit" type="primary" link size="small" :icon="Edit" @click="openEdit(row)">编辑</el-button>
              <el-button v-if="canDelete" type="danger" link size="small" :icon="Delete" @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <RuleFormDrawer
        v-model="formDrawerVisible"
        :mode="formMode"
        :model="currentRow"
        :parent-row="parentRow"
        :rule-tree="treeData"
        @submit="handleFormSubmit"
      />
    </div>

    <!-- 接口来源 -->
    <div style="margin-top:24px">
      <RbacApiSource :endpoints="[
        { m: 'GET',  p: '/api/rule/list',          d: '规则列表（全量分页加载构建树）' },
        { m: 'GET',  p: '/api/rule/tree',           d: '规则树（用于新建/编辑父级选择）' },
        { m: 'POST', p: '/api/rule',                d: '新建规则' },
        { m: 'PUT',  p: '/api/rule/{ruleCode}',     d: '编辑规则' },
        { m: 'PUT',  p: '/api/rule/{ruleCode}/status', d: '启用/禁用规则' },
        { m: 'PUT',  p: '/api/rule/{ruleCode}/weigh',  d: '更新排序权重' },
        { m: 'DELETE', p: '/api/rule/{ruleCode}',   d: '删除规则（父节点存在子节点时阻止）' },
        { m: 'GET',  p: '/api/api-map/records',     d: 'API 映射记录列表' },
        { m: 'POST', p: '/api/api-map',             d: '新增 API 映射' },
        { m: 'PUT',  p: '/api/api-map/{id}',        d: '更新 API 映射' },
        { m: 'DELETE', p: '/api/api-map/{id}',      d: '删除 API 映射' },
      ]" />
    </div>

    <!-- ══ API 映射面板 Drawer ══ -->
    <el-drawer
      v-model="apiPanelVisible"
      title="API 权限映射"
      direction="rtl"
      size="640px"
      append-to-body
    >
      <div class="api-panel">
        <!-- 筛选 -->
        <div class="api-panel__toolbar">
          <el-input
            v-model="apiQuery.keyword"
            placeholder="routePattern 或 permissionCode"
            clearable
            size="small"
            style="width:220px"
            @change="loadApiRecords"
          />
          <el-select v-model="apiQuery.status" clearable placeholder="全部状态" size="small" style="width:120px" @change="loadApiRecords">
            <el-option label="启用" value="Active" />
            <el-option label="禁用" value="Disabled" />
          </el-select>
          <el-button type="primary" size="small" @click="openApiCreate">
            <el-icon><Plus /></el-icon> 新增
          </el-button>
        </div>

        <!-- 列表 -->
        <div v-loading="apiLoading">
          <RbacEmptyState v-if="!apiLoading && apiRecords.length === 0" title="暂无映射记录" description="" />
          <div
            v-for="(r, i) in apiRecords" :key="r.id"
            class="api-record-row"
            :style="{ borderTop: i ? '1px solid var(--pc-divider)' : 'none' }"
          >
            <RbacMethodPill :method="r.httpMethod" :path="r.routePattern" mini />
            <div style="flex:1;min-width:0">
              <div class="pc-t-mono" style="font-size:12px;color:var(--pc-blue)">{{ r.permissionCode }}</div>
              <div class="pc-t-cap" style="font-size:11.5px">{{ r.action }}</div>
            </div>
            <RbacStatusBadge :status="r.status as 'Active'|'Disabled'" size="sm" />
            <div style="display:flex;gap:6px">
              <el-button text size="small" @click="openApiEdit(r)"><el-icon><Edit /></el-icon></el-button>
              <el-button text size="small" style="color:var(--pc-deny)" @click="deleteApiRecord(r.id)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <div style="padding-top:12px;display:flex;justify-content:flex-end">
          <el-pagination
            v-model:current-page="apiQuery.page"
            :page-size="apiQuery.pageSize"
            :total="apiTotal"
            layout="prev, pager, next"
            small
            @current-change="loadApiRecords"
          />
        </div>

        <!-- 新增/编辑 表单 -->
        <div v-if="apiFormVisible" class="api-form pc-anim-scale">
          <div class="api-form__title">{{ apiFormMode === 'create' ? '新增 API 映射' : '编辑 API 映射' }}</div>
          <div class="api-form__grid">
            <div class="form-field" v-if="apiFormMode === 'create'">
              <label>HTTP 方法</label>
              <el-select v-model="apiForm.httpMethod" style="width:100%">
                <el-option v-for="m in ['GET','POST','PUT','DELETE','PATCH']" :key="m" :label="m" :value="m" />
              </el-select>
            </div>
            <div class="form-field" v-if="apiFormMode === 'create'">
              <label>路由模板</label>
              <el-input v-model="apiForm.routePattern" placeholder="/api/admin/{userid}" style="font-family:var(--pc-font-mono)" />
            </div>
            <div class="form-field">
              <label>权限码</label>
              <el-input v-model="apiForm.permissionCode" placeholder="menu:system.user" style="font-family:var(--pc-font-mono)" />
            </div>
            <div class="form-field">
              <label>动作</label>
              <el-select v-model="apiForm.action" style="width:100%">
                <el-option v-for="a in ['read','create','update','delete','execute','access']" :key="a" :label="a" :value="a" />
              </el-select>
            </div>
          </div>
          <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px">
            <el-button size="small" @click="apiFormVisible = false">取消</el-button>
            <el-button type="primary" size="small" :loading="apiFormLoading" @click="submitApiForm">
              {{ apiFormMode === 'create' ? '新增' : '保存' }}
            </el-button>
          </div>
        </div>
      </div>
    </el-drawer>

  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Plus, Delete, Edit, Refresh, Folder, FolderOpened, Connection as ApiIcon } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import Commonsearch   from '/@/components/claudetable/Commonsearch.vue'
import RuleFormDrawer from './components/RuleFormDrawer.vue'
import RbacProjectGlyph from '/@/components/rbac/RbacProjectGlyph.vue'
import RbacMethodPill   from '/@/components/rbac/RbacMethodPill.vue'
import RbacStatusBadge  from '/@/components/rbac/RbacStatusBadge.vue'
import RbacEmptyState   from '/@/components/rbac/RbacEmptyState.vue'
import RbacApiSource    from '/@/components/rbac/RbacApiSource.vue'
import {
  getRuleList, updateRuleStatus, updateRuleWeigh, deleteRule,
  getGlobalProjects, getApiMapRecords, createApiMap, updateApiMap, deleteApiMap,
  type RuleItem, type RuleTreeNode, type ApiAction, type HttpMethod, type RecordStatus,
} from '/@/api/backend/rbac'
import { useAdminInfo } from '/@/stores/adminInfo'

defineOptions({ name: 'backend/menus' })

/* ── Project 切换 ── */
const projectTabs    = ref<string[]>([])
const currentProject = ref('')

async function loadProjects() {
  const res = await getGlobalProjects()
  projectTabs.value = res.list || []
  if (projectTabs.value.length) currentProject.value = projectTabs.value[0]
}
function switchProject(p: string) {
  currentProject.value = p
  loadTree()
}

/* ── 树形表格（原附件逻辑完整复制） ── */
type RuleTableNode = RuleTreeNode & { parentRuleCode?: string | null; status?: string; weigh?: number; children?: RuleTableNode[] }

const adminInfo = useAdminInfo()
const canCreate = computed(() => adminInfo.super || false)
const canEdit   = computed(() => adminInfo.super || false)
const canDelete = computed(() => adminInfo.super || false)

const headerCellStyle = { background: '#fafafc', color: '#1d1d1f', fontSize: '12px', fontWeight: '600', letterSpacing: '-0.12px', borderBottom: '1px solid #e0e0e0' }

const searchFields = [
  { prop: 'keyword', label: '关键字', type: 'input', placeholder: '标题 / ruleCode', width: '200px' },
  { prop: 'type', label: '类型', type: 'select', width: '140px', options: [{ label: '目录', value: 'menu_dir' }, { label: '菜单', value: 'menu' }, { label: '按钮', value: 'button' }] },
  { prop: 'status', label: '状态', type: 'select', width: '120px', options: [{ label: '启用', value: 'Active' }, { label: '禁用', value: 'Disabled' }] },
]

const treeData       = ref<RuleTableNode[]>([])
const loading        = ref(false)
const isAllExpanded  = ref(false)
const tableRenderKey = ref(0)
const filterParams   = ref<Record<string, any>>({})
const flatCount      = computed(() => countNodes(treeData.value))
function countNodes(nodes: RuleTableNode[]): number { return nodes.reduce((s, n) => s + 1 + countNodes(n.children ?? []), 0) }

async function loadTree() {
  loading.value = true
  try { treeData.value = applyFilter(buildRuleTree(await loadAllRules()), filterParams.value) }
  finally { loading.value = false }
}

async function loadAllRules(): Promise<RuleItem[]> {
  let page = 1; let total = 0; const list: RuleItem[] = []
  do { const r = await getRuleList({ page, pageSize: 100 }); list.push(...r.list); total = r.total; page++ } while (list.length < total)
  return list
}

function buildRuleTree(items: RuleItem[]): RuleTableNode[] {
  const map = new Map<string, RuleTableNode>()
  const roots: RuleTableNode[] = []
  for (const item of items) map.set(item.ruleCode, toNode(item))
  for (const node of map.values()) {
    const pc = node.parentRuleCode || inferParent(node.ruleCode, map)
    node.parentRuleCode = pc; node.pid = pc
    const parent = pc ? map.get(pc) : null
    if (parent) { parent.children = parent.children ?? []; parent.children.push(node) }
    else roots.push(node)
  }
  sortNodes(roots); return roots
}

function toNode(item: RuleItem): RuleTableNode {
  const pc = String(item.parentRuleCode ?? item.parent_rule_code ?? item.pid ?? '').trim()
  const parentRuleCode = pc && pc !== '0' ? pc : ''
  return { id: item.ruleCode, pid: parentRuleCode, title: item.title, name: item.name ?? item.ruleCode, path: item.path ?? '', icon: item.icon ?? '', type: normalizeType(item.type), menu_type: item.menu_type ?? '', url: item.url ?? '', component: item.component ?? '', extend: item.extend ?? '', remark: item.remark ?? '', keepalive: item.keepalive ?? false, permissionCode: item.permissionCode, ruleCode: item.ruleCode, parentRuleCode, status: item.status, weigh: item.weigh ?? 0, children: [] }
}
function normalizeType(t: any): 'menu_dir'|'menu'|'button' { return ({ MenuDir: 'menu_dir', Menu: 'menu', Button: 'button', menu_dir: 'menu_dir', menu: 'menu', button: 'button' } as any)[t] ?? 'menu' }
function inferParent(rc: string, map: Map<string, RuleTableNode>): string {
  let best = ''
  for (const code of map.keys()) { if (code !== rc && (rc.startsWith(`${code}/`) || rc.startsWith(`${code}.`)) && code.length > best.length) best = code }
  return best
}
function sortNodes(nodes: RuleTableNode[]) {
  nodes.sort((a, b) => (a.weigh ?? 0) - (b.weigh ?? 0))
  for (const n of nodes) n.children?.length ? sortNodes(n.children) : delete n.children
}
function applyFilter(nodes: RuleTableNode[], params: Record<string, any>): RuleTableNode[] {
  if (!params.keyword && !params.type && !params.status) return nodes
  return nodes.reduce<RuleTableNode[]>((acc, node) => {
    const kids = applyFilter(node.children ?? [], params)
    const hit = (!params.keyword || node.title.includes(params.keyword) || node.ruleCode.includes(params.keyword)) && (!params.type || node.type === params.type) && (!params.status || node.status === params.status)
    if (hit || kids.length) acc.push({ ...node, children: kids.length ? kids : node.children ?? [] })
    return acc
  }, [])
}

function handleSearch(p: Record<string, any>) { filterParams.value = p; loadTree() }
function handleReset() { filterParams.value = {}; loadTree() }
function toggleExpandAll() { isAllExpanded.value = !isAllExpanded.value; tableRenderKey.value++ }
function getTypeLabel(t: string) { return ({ menu_dir: '目录', menu: '菜单', button: '按钮' } as any)[t] ?? t }

const formDrawerVisible = ref(false)
const formMode = ref<'create'|'edit'>('create')
const currentRow = ref<RuleTreeNode | null>(null)
const parentRow  = ref<RuleTreeNode | null>(null)
function openCreate(parent: RuleTreeNode | null) { formMode.value = 'create'; currentRow.value = null; parentRow.value = parent; formDrawerVisible.value = true }
function openEdit(row: RuleTreeNode) { formMode.value = 'edit'; currentRow.value = { ...row }; parentRow.value = null; formDrawerVisible.value = true }
function handleFormSubmit() { formDrawerVisible.value = false; loadTree() }

async function handleStatusToggle(row: RuleTableNode, active: any) {
  const status = active === true ? 'Active' : 'Disabled'
  try { await updateRuleStatus(row.ruleCode, { status }); row.status = status; ElMessage.success(`已${active ? '启用' : '禁用'}「${row.title}」`) } catch {}
}
async function handleWeighChange(row: RuleTableNode, val: number | undefined) {
  try { await updateRuleWeigh(row.ruleCode, { weigh: val ?? 0 }); row.weigh = val ?? 0 } catch {}
}
async function handleDelete(row: RuleTreeNode) {
  const hasKids = (row.children ?? []).length > 0
  try {
    await ElMessageBox.confirm(hasKids ? `「${row.title}」下还有子规则，请先删除子规则。` : `确定删除规则「${row.title}」？`, '删除确认', { confirmButtonText: '确定删除', type: 'warning' })
    await deleteRule(row.ruleCode); ElMessage.success('规则已删除'); loadTree()
  } catch (e: any) { if (e === 'cancel' || e?.message === 'cancel') return }
}

/* ── API 映射面板 ── */
const apiPanelVisible = ref(false)
const apiLoading = ref(false)
const apiRecords = ref<any[]>([])
const apiTotal   = ref(0)
const apiQuery   = reactive<{ keyword: string; status: '' | RecordStatus; page: number; pageSize: number }>({ keyword: '', status: '', page: 1, pageSize: 20 })
const apiFormVisible = ref(false)
const apiFormMode    = ref<'create'|'edit'>('create')
const apiFormLoading = ref(false)
const apiEditId = ref('')
const apiForm = reactive<{ httpMethod: HttpMethod; routePattern: string; permissionCode: string; action: ApiAction }>({ httpMethod: 'GET', routePattern: '', permissionCode: '', action: 'read' })

async function loadApiRecords() {
  apiLoading.value = true
  try {
    const res = await getApiMapRecords({ keyword: apiQuery.keyword || undefined, status: apiQuery.status || undefined, page: apiQuery.page, pageSize: apiQuery.pageSize })
    apiRecords.value = res.list || []; apiTotal.value = res.total || 0
  } finally { apiLoading.value = false }
}
function openApiCreate() { Object.assign(apiForm, { httpMethod: 'GET', routePattern: '', permissionCode: '', action: 'read' }); apiFormMode.value = 'create'; apiEditId.value = ''; apiFormVisible.value = true }
function openApiEdit(r: any) { Object.assign(apiForm, { permissionCode: r.permissionCode, action: r.action }); apiFormMode.value = 'edit'; apiEditId.value = r.id; apiFormVisible.value = true }
async function submitApiForm() {
  apiFormLoading.value = true
  try {
    if (apiFormMode.value === 'create') { await createApiMap({ httpMethod: apiForm.httpMethod, routePattern: apiForm.routePattern, permissionCode: apiForm.permissionCode, action: apiForm.action }); ElMessage.success('映射已新增') }
    else { await updateApiMap(apiEditId.value, { permissionCode: apiForm.permissionCode, action: apiForm.action }); ElMessage.success('已更新') }
    apiFormVisible.value = false; await loadApiRecords()
  } catch { ElMessage.error('操作失败') } finally { apiFormLoading.value = false }
}
async function deleteApiRecord(id: string) {
  await ElMessageBox.confirm('确认删除该 API 映射？', '删除', { type: 'warning' })
  try { await deleteApiMap(id); ElMessage.success('已删除'); await loadApiRecords() } catch { ElMessage.error('删除失败') }
}

onMounted(async () => { await loadProjects(); await Promise.all([loadTree(), loadApiRecords()]) })
</script>

<style scoped lang="scss">
.pc-page {
  max-width: 1440px;
  min-height: calc(100vh - 60px);
  margin: 0 auto;
  padding: 20px 32px 80px;
  font-family: var(--pc-font-text);
  box-sizing: border-box;
}

/* Project tabs */
.menus-proj-bar { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; flex-wrap: wrap; }
.proj-tabs { display: flex; gap: 6px; flex-wrap: wrap; }
.proj-tab {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 6px 14px; border-radius: 9999px; font-size: 13px;
  border: 1px solid var(--pc-hairline); background: #fff; cursor: pointer; font-family: var(--pc-font-text);
  transition: all 0.12s;
  &--active { border-color: var(--pc-blue); background: var(--pc-blue-wash); color: var(--pc-blue); font-weight: 600; }
  &:hover:not(&--active) { border-color: #cdcdd2; }
}
.menus-context { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }

/* ── 原附件样式（完整复制） ── */
.rbac-rule-page { font-family: 'SF Pro Text', system-ui, -apple-system, sans-serif; }
.rule-table-wrapper { background: #fff; border-radius: 8px; overflow: hidden; border: 1px solid #e0e0e0; }
.table-toolbar { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: #fafafc; border-bottom: 1px solid #e0e0e0; }
.toolbar-left { display: flex; align-items: center; gap: 8px; }
.table-summary { color: #7a7a7a; font-size: 12px; }
.title-cell { display: inline-flex; flex-direction: column; justify-content: center; gap: 2px; min-width: 0; vertical-align: middle; }
.node-title { color: #1d1d1f; font-size: 14px; font-weight: 600; letter-spacing: -0.224px; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.node-code, .code-text { color: #333; font-family: 'SF Mono', Menlo, Consolas, monospace; font-size: 12px; line-height: 1.4; }
.node-code { color: #7a7a7a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.nil { color: #b8b8be; font-size: 13px; }
.weigh-input { width: 78px; }
.rule-icon { color: #333; font-size: 18px; }
:deep(.el-button--primary) { --el-button-bg-color: #0066cc; --el-button-border-color: #0066cc; --el-button-hover-bg-color: #0071e3; --el-button-hover-border-color: #0071e3; }
:deep(.el-button--primary.is-link) { --el-button-text-color: #0066cc; --el-button-hover-text-color: #0071e3; }
:deep(.el-switch.is-checked .el-switch__core) { background-color: #0066cc; border-color: #0066cc; }
:deep(.el-table__inner-wrapper::before) { display: none; }

/* API 面板 */
.api-panel { display: flex; flex-direction: column; gap: 16px; }
.api-panel__toolbar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.api-record-row { display: flex; align-items: center; gap: 12px; padding: 11px 0; flex-wrap: wrap; }
.api-form { margin-top: 8px; padding: 18px; background: var(--pc-parchment); border-radius: 12px; }
.api-form__title { font-size: 15px; font-weight: 600; margin-bottom: 14px; }
.api-form__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form-field > label { display: block; font-size: 12px; font-weight: 600; color: var(--pc-ink-60); margin-bottom: 7px; }
</style>
