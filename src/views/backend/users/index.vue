<!--
  放置路径：src/views/backend/users/index.vue
  完整替换。

  职责（已锁定）：
  - 账号列表：GET /api/global/user/list（分页 + 搜索 + project/status 过滤）
  - 详情抽屉：状态切换 / 升权降权 / 查看授权列表 / 撤销授权 / 删除账号 / 近期鉴权
  - 新增账号：el-dialog 内嵌 ContactSelector，选人后调用 POST /api/admin
  - 无 router.push，无跨页跳转
-->
<template>
  <main class="pc-page pc-anim-fade">

    <!-- ── 筛选栏 ── -->
    <div class="users-toolbar">
      <el-input
        v-model="query.keyword"
        placeholder="搜索姓名或 userid"
        clearable
        style="width:240px"
        @change="onSearch"
      >
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>

      <el-select v-model="query.status" placeholder="全部状态" clearable style="width:130px" @change="onSearch">
        <el-option label="全部状态" value="" />
        <el-option label="启用" value="Active" />
        <el-option label="禁用" value="Disabled" />
      </el-select>

      <el-select v-model="query.project" placeholder="全部系统" clearable style="width:140px" @change="onSearch">
        <el-option label="全部系统" value="" />
        <el-option v-for="p in projects" :key="p" :label="p" :value="p" />
      </el-select>

      <div style="margin-left:auto">
        <el-button type="primary" @click="openAddDialog">
          <el-icon><Plus /></el-icon> 新增账号
        </el-button>
      </div>
    </div>

    <!-- ── 用户表格 ── -->
    <div class="pc-card users-table-wrap" v-loading="loading">
      <!-- 表头 -->
      <div class="table-head">
        <span>用户</span>
        <span>状态</span>
        <span>所属系统</span>
        <span>权限组</span>
        <span>超管</span>
        <span></span>
      </div>

      <RbacEmptyState v-if="!loading && rows.length === 0" title="暂无用户数据" description="尝试调整搜索条件" />

      <div
        v-for="(u, i) in rows" :key="u.userid"
        class="table-row"
        :style="{ borderTop: i ? '1px solid var(--pc-divider)' : 'none' }"
        @click="openDetail(u)"
      >
        <!-- 用户 -->
        <div class="user-cell">
          <RbacAvatar :name="u.username || u.userid" :size="34" :dim="u.status === 'Disabled'" />
          <div>
            <div class="pc-t-body-strong" style="font-size:14px">{{ u.username || u.userid }}</div>
            <div class="pc-t-mono pc-t-cap" style="font-size:11.5px">{{ u.userid }}</div>
          </div>
        </div>
        <!-- 状态 -->
        <div><RbacStatusBadge :status="u.status as 'Active'|'Disabled'" /></div>
        <!-- 系统 -->
        <div class="project-chips">
          <template v-if="(u.projectCodes || []).length === 0">
            <span class="pc-t-cap">—</span>
          </template>
          <template v-else>
            <span v-for="pc in (u.projectCodes || []).slice(0, 3)" :key="pc" class="proj-chip">
              <RbacProjectGlyph :code="pc" :name="pc" :size="16" />
              <span>{{ pc }}</span>
            </span>
            <span v-if="(u.projectCodes || []).length > 3" class="pc-t-cap" style="font-weight:600">
              +{{ (u.projectCodes || []).length - 3 }}
            </span>
          </template>
        </div>
        <!-- 权限组 -->
        <div class="pc-t-cap" style="font-size:13.5px">
          {{ (u.groupCodes || []).length > 0 ? `${u.groupCodes.length} 个组` : '—' }}
        </div>
        <!-- 超管 -->
        <div>
          <RbacBadge v-if="(u.superProjects || []).length > 0" tone="super" dot size="sm">
            {{ u.superProjects.length }}
          </RbacBadge>
          <span v-else class="pc-t-cap">—</span>
        </div>
        <!-- 操作 -->
        <div style="text-align:right">
          <el-icon style="color:var(--pc-ink-48)"><ArrowRight /></el-icon>
        </div>
      </div>
    </div>

    <!-- ── 分页 ── -->
    <div class="users-pagination">
      <span class="pc-t-cap">共 {{ total }} 个管理员账号（跨 project 去重）</span>
      <el-pagination
        v-model:current-page="query.page"
        v-model:page-size="query.pageSize"
        :page-sizes="[20, 50, 100]"
        :total="total"
        layout="sizes, prev, pager, next"
        small
        @size-change="loadUsers"
        @current-change="loadUsers"
      />
    </div>

    <!-- ── 接口来源 ── -->
    <div style="margin-top:24px">
      <RbacApiSource :endpoints="[
        { m: 'GET',    p: '/api/global/user/list',                         d: '跨 project 用户列表' },
        { m: 'PUT',    p: '/api/global/user/{userid}/status',              d: '全局启用/禁用账号' },
        { m: 'PUT',    p: '/api/admin/{userid}',                           d: '编辑账号（username/groupArr）' },
        { m: 'DELETE', p: '/api/global/user/{userid}',                     d: '全局删除账号' },
        { m: 'DELETE', p: '/api/global/user/{userid}/project-grants/{project}', d: '撤销项目授权' },
        { m: 'PUT',    p: '/api/global/user/{userid}/project-grants/{project}/super', d: '全局切换项目超管' },
        { m: 'GET',    p: '/api/search/audit-logs',                        d: '用户近期鉴权（userId 过滤）' },
        { m: 'POST',   p: '/api/admin',                                    d: '新增管理员账号' },
      ]" />
    </div>

    <!-- ══════════════════════════════════════════
         详情抽屉
    ══════════════════════════════════════════ -->
    <el-drawer
      v-model="drawerVisible"
      direction="rtl"
      :size="480"
      :with-header="false"
    >
      <div v-if="selected" class="detail-drawer">
        <!-- 抽屉头部 -->
        <div class="detail-header">
          <span class="pc-t-cap-strong">用户详情</span>
          <el-button text @click="drawerVisible = false">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>

        <!-- 用户信息 -->
        <div class="detail-user-hero">
          <RbacAvatar :name="selected.username || selected.userid" :size="52" :dim="selected.status === 'Disabled'" />
          <div>
            <div style="display:flex;align-items:center;gap:9px">
              <span class="pc-t-section" style="font-size:22px">{{ selected.username }}</span>
              <RbacBadge v-if="selected.isSuper" tone="super" dot size="sm">全局超管</RbacBadge>
            </div>
            <div class="pc-t-cap pc-t-mono" style="margin-top:2px">{{ selected.userid }}</div>
          </div>
        </div>

        <div class="detail-body">
          <!-- 状态切换 -->
          <div class="detail-section-card">
            <div>
              <div class="pc-t-body-strong" style="font-size:14px">账号状态</div>
              <div class="pc-t-cap" style="margin-top:2px">全局启用/禁用 · rbac_administrator 单次写入</div>
            </div>
            <div style="display:flex;align-items:center;gap:10px">
              <RbacStatusBadge :status="selected.status as 'Active'|'Disabled'" size="md" />
              <el-switch
                :model-value="selected.status === 'Active'"
                @change="(v) => toggleStatus(Boolean(v))"
                :loading="actionLoading"
              />
            </div>
          </div>

          <!-- 项目授权列表 -->
          <div class="detail-section-title">项目授权</div>
          <div class="grant-list">
            <div v-if="(selected.projectCodes || []).length === 0" class="pc-t-cap" style="padding:8px 0">暂无项目授权</div>
            <div
              v-for="pc in (selected.projectCodes || [])" :key="pc"
              class="grant-row"
            >
              <RbacProjectGlyph :code="pc" :name="pc" :size="34" />
              <div style="flex:1;min-width:0">
                <div class="pc-t-body-strong" style="font-size:14px">{{ pc }}</div>
                <div class="pc-t-mono pc-t-cap">{{ pc }}</div>
              </div>
              <!-- 超管 toggle -->
              <div style="display:flex;align-items:center;gap:7px">
                <span class="pc-t-cap" :style="{ color: (selected.superProjects||[]).includes(pc) ? 'var(--pc-super)' : 'var(--pc-ink-48)', fontWeight: (selected.superProjects||[]).includes(pc) ? 600 : 400 }">超管</span>
                <el-switch
                  size="small"
                  :model-value="(selected.superProjects||[]).includes(pc)"
                  @change="(v) => handleSuperChange(pc, Boolean(v))"
                  :loading="superLoading === pc"
                />
              </div>
              <!-- 撤销 -->
              <el-button
                text
                size="small"
                style="color:var(--pc-deny)"
                @click.stop="revokeGrant(pc)"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>

          <!-- 权限组 -->
          <div class="detail-section-title">权限组</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:24px">
            <div v-if="(selected.groupNames || []).length === 0" class="pc-t-cap">未加入任何权限组</div>
            <span
              v-for="gn in (selected.groupNames || [])" :key="gn"
              class="group-chip"
            >
              <el-icon style="font-size:13px"><Lock /></el-icon>
              {{ gn }}
            </span>
          </div>

          <!-- 近期鉴权 -->
          <div class="detail-section-title">近期鉴权</div>
          <div class="pc-t-cap" style="margin-bottom:8px">GET /api/search/audit-logs?userid={{ selected.userid }}</div>
          <div v-loading="auditLoading">
            <div v-if="userAudit.length === 0 && !auditLoading" class="pc-t-cap" style="padding:12px 0">暂无记录</div>
            <div
              v-for="a in userAudit" :key="a.auditId"
              class="audit-row"
            >
              <RbacBadge :tone="resultTone(a.result)" dot size="sm">
                {{ resultLabel(a.result) }}
              </RbacBadge>
              <span class="pc-t-mono" style="flex:1;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                {{ a.permissionCode }}
              </span>
              <span class="pc-t-cap" style="font-size:11.5px;flex-shrink:0">{{ timeAgo(a.createdAt) }}</span>
            </div>
          </div>

          <!-- 危险操作 -->
          <div class="detail-danger-zone">
            <el-button
              type="danger"
              plain
              size="small"
              @click="deleteAccount"
              :loading="actionLoading"
            >
              删除账号
            </el-button>
          </div>
        </div>
      </div>
    </el-drawer>

    <!-- ══════════════════════════════════════════
         新增账号 Dialog（ContactSelector）
    ══════════════════════════════════════════ -->
    <el-dialog
      v-model="addDialogVisible"
      title="选择人员"
      width="900px"
      top="4vh"
      append-to-body
      class="pc-contact-dialog"
      custom-class="pc-contact-dialog"
      :close-on-click-modal="false"
    >
      <div class="add-grant-panel">
        <div>
          <div class="pc-t-body-strong" style="font-size:14px">选择授权项目</div>
          <div class="pc-t-cap" style="margin-top:2px">必须选择一个或多个 project，人员确认后只授权到这些项目。</div>
        </div>
        <el-select
          v-model="addGrantProjects"
          multiple
          filterable
          placeholder="请选择授权 project"
          style="width:100%"
        >
          <el-option v-for="p in projects" :key="p" :label="p" :value="p" />
        </el-select>
        <label class="add-grant-super">
          <el-switch v-model="addGrantAsSuper" />
          <span>以超管身份授权</span>
        </label>
      </div>
      <ContactSelector
        class="pc-contact-selector-fit"
        :org-list="MOCK_ORGS"
        :user-list="MOCK_USERS"
        :multiple="true"
        @confirm="onContactConfirm"
        @cancel="addDialogVisible = false"
      />
    </el-dialog>

    <!-- 超管确认 Dialog -->
    <el-dialog v-model="superConfirmVisible" title="" width="440px" append-to-body :show-close="false">
      <div v-if="superConfirmData" style="padding:4px 0">
        <div class="confirm-icon" :style="{ background: superConfirmData.val ? 'var(--pc-super-wash)' : 'var(--pc-warn-wash)', color: superConfirmData.val ? 'var(--pc-super)' : 'var(--pc-warn)' }">
          <el-icon :size="24"><Star /></el-icon>
        </div>
        <div class="pc-t-section" style="font-size:21px;margin-bottom:8px">
          {{ superConfirmData.val ? '提升为项目超管？' : '降级为普通管理员？' }}
        </div>
        <div class="pc-t-body" style="color:var(--pc-ink-60);margin-bottom:18px">
          该操作通过 <code>PUT /api/global/user/{{ superConfirmData.userid }}/project-grants/{{ superConfirmData.project }}/super</code> 执行。
        </div>
        <div class="confirm-summary">
          <div v-for="[k,v] in superConfirmRows" :key="k" class="confirm-row">
            <span class="pc-t-cap-strong">{{ k }}</span>
            <span style="font-size:13.5px;font-weight:500;text-align:right">{{ v }}</span>
          </div>
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px">
          <el-button @click="superConfirmVisible = false">取消</el-button>
          <el-button
            :style="{ background: superConfirmData.val ? 'var(--pc-super)' : 'var(--pc-warn)', color: '#fff', border: 'none' }"
            :loading="superLoading === superConfirmData.project"
            @click="doSuperToggle"
          >
            {{ superConfirmData.val ? '确认提升' : '确认降级' }}
          </el-button>
        </div>
      </div>
    </el-dialog>

  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import {
  Search, Plus, ArrowRight, Close, Delete, Lock, Star,
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ContactSelector from '/@/components/ContactSelector.vue'
import RbacAvatar       from '/@/components/rbac/RbacAvatar.vue'
import RbacBadge        from '/@/components/rbac/RbacBadge.vue'
import RbacStatusBadge  from '/@/components/rbac/RbacStatusBadge.vue'
import RbacProjectGlyph from '/@/components/rbac/RbacProjectGlyph.vue'
import RbacEmptyState   from '/@/components/rbac/RbacEmptyState.vue'
import RbacApiSource    from '/@/components/rbac/RbacApiSource.vue'
import {
  getGlobalUsers, getGlobalProjects, updateGlobalUserStatus,
  grantGlobalUserProjects, revokeGlobalUserProject, toggleGlobalUserProjectSuper, deleteGlobalUser,
  searchAuditLogs,
  type AdminItem, type AuditLogItem,
} from '/@/api/backend/rbac'

/* ──────────────────────────────────────────────────────
   Mock 组织架构 & 人员（待替换为真实人员中心 API）
   ContactSelector 需要 orgList 和 userList（或 fetchUsers）
   workNo → userid（RBAC 业务工号即 userid）
────────────────────────────────────────────────────── */
const MOCK_ORGS = [
  { id: 'root', pid: null, name: '总公司' },
  { id: 'tech', pid: 'root', name: '技术中心' },
  { id: 'product', pid: 'root', name: '产品中心' },
  { id: 'ops', pid: 'root', name: '运营中心' },
]
const MOCK_USERS = [
  { id: '1', name: '张三', workNo: 'u001', phone: '13800000001', position: '高级工程师', orgId: 'tech' },
  { id: '2', name: '李四', workNo: 'u002', phone: '13800000002', position: '产品经理', orgId: 'product' },
  { id: '3', name: '王五', workNo: 'u003', phone: '13800000003', position: '运营专员', orgId: 'ops' },
  { id: '4', name: '赵六', workNo: 'u004', phone: '13800000004', position: '前端工程师', orgId: 'tech' },
  { id: '5', name: '陈七', workNo: 'u005', phone: '13800000005', position: '后端工程师', orgId: 'tech' },
]

defineOptions({ name: 'backend/users' })

/* ── 查询状态 ── */
const query = reactive({
  keyword: '',
  status: '' as '' | 'Active' | 'Disabled',
  project: '',
  page: 1,
  pageSize: 20,
})

const loading      = ref(false)
const rows         = ref<AdminItem[]>([])
const total        = ref(0)
const projects     = ref<string[]>([])

/* ── 详情抽屉 ── */
const drawerVisible = ref(false)
const selected      = ref<AdminItem | null>(null)
const actionLoading = ref(false)
const superLoading  = ref<string | null>(null)
const userAudit     = ref<AuditLogItem[]>([])
const auditLoading  = ref(false)

/* ── 新增 dialog ── */
const addDialogVisible = ref(false)
const addGrantProjects = ref<string[]>([])
const addGrantAsSuper  = ref(false)

/* ── 超管确认 dialog ── */
const superConfirmVisible = ref(false)
const superConfirmData    = ref<{ userid: string; project: string; val: boolean; username: string } | null>(null)
const superConfirmRows    = computed(() => {
  if (!superConfirmData.value) return []
  const d = superConfirmData.value
  return [
    ['用户', `${d.username} · ${d.userid}`],
    ['目标系统', d.project],
    ['变更', d.val ? '普通管理员 → 超级管理员' : '超级管理员 → 普通管理员'],
    ['影响范围', `仅 ${d.project} 内的全部菜单与按钮权限`],
  ]
})

/* ── 加载 ── */
onMounted(async () => {
  const [, pRes] = await Promise.all([loadUsers(), getGlobalProjects()])
  projects.value = pRes.list || []
})

async function loadUsers() {
  loading.value = true
  try {
    const res = await getGlobalUsers({
      keyword:  query.keyword  || undefined,
      status:   query.status   || undefined,
      project:  query.project  || undefined,
      page:     query.page,
      pageSize: query.pageSize,
    })
    rows.value  = res.list  || []
    total.value = res.total || 0
  } finally {
    loading.value = false
  }
}

function onSearch() {
  query.page = 1
  loadUsers()
}

/* ── 详情抽屉 ── */
async function openDetail(u: AdminItem) {
  selected.value  = u
  drawerVisible.value = true
  auditLoading.value  = true
  try {
    const res = await searchAuditLogs({ userid: u.userid, page: 1, pageSize: 5 })
    userAudit.value = res.list || []
  } finally {
    auditLoading.value = false
  }
}

async function toggleStatus(active: boolean) {
  if (!selected.value) return
  actionLoading.value = true
  try {
    await updateGlobalUserStatus(selected.value.userid, active ? 'Active' : 'Disabled')
    selected.value = { ...selected.value, status: active ? 'Active' : 'Disabled' }
    await loadUsers()
    ElMessage.success(`账号已${active ? '启用' : '禁用'}`)
  } catch {
    ElMessage.error('操作失败')
  } finally {
    actionLoading.value = false
  }
}

async function revokeGrant(project: string) {
  if (!selected.value) return
  await ElMessageBox.confirm(`确认撤销 ${selected.value.username} 在 ${project} 的授权？`, '撤销授权', {
    confirmButtonText: '撤销', cancelButtonText: '取消', type: 'warning',
  })
  try {
    await revokeGlobalUserProject(selected.value.userid, project)
    selected.value = {
      ...selected.value,
      projectCodes:  (selected.value.projectCodes  || []).filter(p => p !== project),
      superProjects: (selected.value.superProjects || []).filter(p => p !== project),
    }
    await loadUsers()
    ElMessage.success('已撤销授权')
  } catch {
    ElMessage.error('操作失败')
  }
}

function handleSuperChange(project: string, val: boolean) {
  if (!selected.value) return
  superConfirmData.value = {
    userid:   selected.value.userid,
    username: selected.value.username,
    project,
    val,
  }
  superConfirmVisible.value = true
}

async function doSuperToggle() {
  if (!superConfirmData.value) return
  const { userid, project, val } = superConfirmData.value
  superLoading.value = project
  try {
    await toggleGlobalUserProjectSuper(userid, project, val)
    if (selected.value && selected.value.userid === userid) {
      const supers = [...(selected.value.superProjects || [])]
      if (val && !supers.includes(project)) supers.push(project)
      if (!val) supers.splice(supers.indexOf(project), 1)
      selected.value = { ...selected.value, superProjects: supers }
    }
    await loadUsers()
    ElMessage.success(val ? '已提升为超管' : '已降级为普通管理员')
  } catch {
    ElMessage.error('操作失败')
  } finally {
    superLoading.value = null
    superConfirmVisible.value = false
    superConfirmData.value = null
  }
}

async function deleteAccount() {
  if (!selected.value) return
  await ElMessageBox.confirm(`确认删除账号 ${selected.value.username}（${selected.value.userid}）？此操作不可恢复。`, '删除账号', {
    confirmButtonText: '删除', cancelButtonText: '取消', type: 'error',
  })
  actionLoading.value = true
  try {
    await deleteGlobalUser(selected.value.userid)
    ElMessage.success('账号已删除')
    drawerVisible.value = false
    selected.value = null
    await loadUsers()
  } catch {
    ElMessage.error('操作失败')
  } finally {
    actionLoading.value = false
  }
}

/* ── 新增账号 ── */
function openAddDialog() {
  addGrantProjects.value = []
  addGrantAsSuper.value = false
  addDialogVisible.value = true
}

async function onContactConfirm(users: Array<{ workNo: string; name: string }>) {
  if (!users.length) return
  if (addGrantProjects.value.length === 0) {
    ElMessage.warning('请先选择要授权的 project')
    return
  }
  const targetProjects = [...addGrantProjects.value]
  addDialogVisible.value = false
  let successCount = 0
  for (const u of users) {
    try {
      // POST /api/admin — 仅当前 X-Project（__global__），新增管理员到全局
      await grantGlobalUserProjects(u.workNo, {
        username: u.name,
        targetProjects,
        isSuper: addGrantAsSuper.value ? true : undefined,
      })
      successCount++
    } catch {
      ElMessage.warning(`${u.name}（${u.workNo}）创建失败，可能已存在`)
    }
  }
  if (successCount > 0) {
    ElMessage.success(`已新增 ${successCount} 个账号`)
    await loadUsers()
  }
}

/* ── 工具 ── */
function resultLabel(r: string) { return r === 'Allow' ? '通过' : r === 'Deny' ? '拒绝' : '异常' }
function resultTone(r: string): 'ok'|'deny'|'warn' { return r === 'Allow' ? 'ok' : r === 'Deny' ? 'deny' : 'warn' }
function timeAgo(iso: string) {
  if (!iso) return ''
  const diff = (Date.now() - new Date(iso).getTime()) / 60000
  if (diff < 1)    return '刚刚'
  if (diff < 60)   return `${Math.floor(diff)} 分钟前`
  if (diff < 1440) return `${Math.floor(diff / 60)} 小时前`
  return `${Math.floor(diff / 1440)} 天前`
}
</script>

<style scoped lang="scss">
:global(.pc-contact-dialog) {
  max-width: calc(100vw - 48px);
}
:global(.pc-contact-dialog .el-dialog__body) {
  padding-top: 16px;
  max-height: calc(92vh - 72px);
  overflow: hidden;
}
.pc-contact-selector-fit {
  height: calc(92vh - 230px) !important;
  min-height: 360px;
  max-height: 600px;
}
.add-grant-panel {
  display: grid;
  grid-template-columns: minmax(180px, 260px) 1fr auto;
  align-items: center;
  gap: 14px;
  padding: 0 0 14px;
  margin-bottom: 14px;
  border-bottom: 1px solid var(--pc-divider);
}
.add-grant-super {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  font-size: 14px;
  color: var(--pc-ink);
  cursor: pointer;
}

.pc-page {
  max-width: 1240px;
  margin: 0 auto;
  padding: 30px 32px 80px;
  font-family: var(--pc-font-text);
  color: var(--pc-ink);
  min-height: 100%;
  box-sizing: border-box;
  overflow: visible;
}

/* ── 筛选栏 ── */
.users-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
  flex-wrap: wrap;
}

/* ── 表格 ── */
.users-table-wrap {
  padding: 0;
  overflow-x: auto;
  overflow-y: visible;
}

.table-head {
  display: grid;
  grid-template-columns: 2fr 1fr 2.4fr 1.4fr 1fr 60px;
  min-width: 920px;
  padding: 12px 22px;
  background: var(--pc-pearl);
  border-bottom: 1px solid var(--pc-hairline);
  font-size: 12px;
  font-weight: 600;
  color: var(--pc-ink-60);
}

.table-row {
  display: grid;
  grid-template-columns: 2fr 1fr 2.4fr 1.4fr 1fr 60px;
  min-width: 920px;
  padding: 13px 22px;
  align-items: center;
  cursor: pointer;
  transition: background 0.12s;
  &:hover { background: var(--pc-pearl); }
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 11px;
}

.project-chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  align-items: center;
}
.proj-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px 3px 6px;
  background: #f3f3f5;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 500;
}

/* ── 分页 ── */
.users-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 14px;
  flex-wrap: wrap;
  gap: 8px;
}

/* ── 详情抽屉 ── */
.detail-drawer {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22px 24px 18px;
  border-bottom: 1px solid var(--pc-divider);
  flex-shrink: 0;
}
.detail-user-hero {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px 24px 18px;
  border-bottom: 1px solid var(--pc-divider);
  flex-shrink: 0;
}
.detail-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}
.detail-section-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: var(--pc-parchment);
  border-radius: 12px;
  margin-bottom: 22px;
}
.detail-section-title {
  font-size: 19px;
  font-weight: 600;
  letter-spacing: -0.01em;
  margin-bottom: 12px;
}
.grant-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;
}
.grant-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid var(--pc-hairline);
  border-radius: 12px;
}
.group-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--pc-blue-wash);
  color: var(--pc-blue);
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 500;
}
.audit-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-top: 1px solid var(--pc-divider);
}
.detail-danger-zone {
  margin-top: 32px;
  padding-top: 16px;
  border-top: 1px solid var(--pc-divider);
}

/* ── 超管确认 dialog ── */
.confirm-icon {
  width: 46px; height: 46px;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 16px;
}
.confirm-summary {
  background: var(--pc-parchment);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.confirm-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}
</style>
