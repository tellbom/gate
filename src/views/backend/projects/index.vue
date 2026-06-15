<!--
  放置路径：src/views/backend/projects/index.vue（原 authorization 页面）
  完整替换。

  职责：
  - 两种授权视图切换：按用户 / 按系统
  - 按用户视图：左侧用户列表（分页 + 搜索）→ 右侧该用户的授权详情 + 新增授权 + 撤销 + 超管 toggle
  - 按系统视图：左侧 project 列表 → 右侧该 project 已授权用户（分页）+ 新增授权 + 撤销 + 超管 toggle
  - 新增授权均通过 ContactSelector 选人，workNo = userid
  - 无 router.push 跨页跳转

  后端说明：
  1. PUT /api/global/user/{userid}/project-grants/{project}/super 已用于全局切换 project 超管。
  2. GET /api/global/user/list 按 project 过滤时返回该 project 内的用户（已确认 README）。
-->
<template>
  <main class="pc-page pc-anim-fade">

    <!-- ── 视图切换（嵌入页面内，非 TopBar） ── -->
    <div class="auth-head">
      <div>
        <h2 class="auth-head__title">Project 授权管理</h2>
        <p class="auth-head__sub">管理用户与业务系统之间的访问授权关系</p>
      </div>
      <div class="segmented">
        <button
          v-for="d in MODES" :key="d.value"
          class="segmented__btn"
          :class="{ 'segmented__btn--active': mode === d.value }"
          @click="switchMode(d.value)"
        >{{ d.label }}</button>
      </div>
    </div>

    <!-- ══════════════════════════════════════════
         视图布局（左侧选择列 + 右侧详情）
    ══════════════════════════════════════════ -->
    <div class="auth-layout">

      <!-- ── 左侧选择列 ── -->
      <div class="pc-card auth-rail">
        <!-- 按用户：搜索 + 分页用户列表 -->
        <template v-if="mode === 'user'">
          <div class="rail-search">
            <el-input
              v-model="railKeyword"
              placeholder="搜索用户"
              clearable
              size="small"
              @change="onRailSearch"
            >
              <template #prefix><el-icon><Search /></el-icon></template>
            </el-input>
          </div>
          <div class="rail-list" v-loading="railLoading">
            <RbacEmptyState v-if="!railLoading && railUsers.length === 0" title="暂无用户" description="" style="padding:24px" />
            <button
              v-for="u in railUsers" :key="u.userid"
              class="rail-item"
              :class="{ 'rail-item--active': selectedUserId === u.userid }"
              @click="selectUser(u)"
            >
              <RbacAvatar :name="u.username || u.userid" :size="30" :dim="u.status === 'Disabled'" />
              <div class="rail-item__info">
                <div class="rail-item__name" :style="{ color: selectedUserId === u.userid ? 'var(--pc-blue)' : 'var(--pc-ink)' }">
                  {{ u.username || u.userid }}
                </div>
                <div class="pc-t-cap" style="font-size:11.5px">
                  {{ (u.projectCodes||[]).length }} 系统 · {{ (u.superProjects||[]).length }} 超管
                </div>
              </div>
              <RbacStatusBadge v-if="u.status === 'Disabled'" status="Disabled" size="sm" />
            </button>
          </div>
          <div class="rail-pagination">
            <el-pagination
              v-model:current-page="railPage"
              :page-size="railPageSize"
              :total="railTotal"
              layout="prev, pager, next"
              small
              @current-change="loadRailUsers"
            />
          </div>
        </template>

        <!-- 按系统：project 列表 -->
        <template v-else>
          <div class="rail-section-title pc-t-cap-strong" style="padding:14px 14px 10px">选择系统</div>
          <div class="rail-list" v-loading="projectsLoading">
            <button
              v-for="p in projects" :key="p"
              class="rail-item"
              :class="{ 'rail-item--active': selectedProject === p }"
              @click="selectProject(p)"
            >
              <RbacProjectGlyph :code="p" :name="p" :size="32" />
              <div class="rail-item__info">
                <div class="rail-item__name" :style="{ color: selectedProject === p ? 'var(--pc-blue)' : 'var(--pc-ink)' }">
                  {{ p }}
                </div>
                <div class="pc-t-mono pc-t-cap" style="font-size:11.5px">{{ p }}</div>
              </div>
            </button>
            <RbacEmptyState v-if="!projectsLoading && projects.length === 0" title="暂无系统" description="" style="padding:24px" />
          </div>
        </template>
      </div>

      <!-- ── 右侧详情区 ── -->
      <div class="auth-detail">

        <!-- ===== 按用户视图：选中用户的授权详情 ===== -->
        <template v-if="mode === 'user'">
          <div v-if="!selectedUser" class="pc-card" style="padding:60px;text-align:center">
            <div class="pc-t-cap">← 请从左侧选择一个用户</div>
          </div>
          <div v-else>
            <!-- 用户头部 -->
            <div class="pc-card detail-user-card">
              <div style="display:flex;align-items:center;gap:13px;margin-bottom:18px">
                <RbacAvatar :name="selectedUser.username || selectedUser.userid" :size="46" :dim="selectedUser.status === 'Disabled'" />
                <div style="flex:1">
                  <div style="display:flex;align-items:center;gap:9px">
                    <span class="pc-t-section" style="font-size:21px">{{ selectedUser.username }}</span>
                    <RbacStatusBadge :status="selectedUser.status as 'Active'|'Disabled'" />
                    <RbacBadge v-if="selectedUser.isSuper" tone="super" dot size="sm">全局超管</RbacBadge>
                  </div>
                  <div class="pc-t-mono pc-t-cap" style="margin-top:2px">
                    {{ selectedUser.userid }} · 已授权 {{ (selectedUser.projectCodes||[]).length }} 个系统
                  </div>
                </div>
              </div>

              <!-- 当前授权列表 -->
              <div class="pc-t-cap-strong" style="margin-bottom:10px">当前授权</div>
              <div class="grant-list">
                <div v-if="(selectedUser.projectCodes||[]).length === 0" class="pc-t-cap" style="padding:6px 0">该用户暂无任何项目授权</div>
                <div
                  v-for="pc in (selectedUser.projectCodes||[])" :key="pc"
                  class="grant-row"
                >
                  <RbacProjectGlyph :code="pc" :name="pc" :size="32" />
                  <div style="flex:1;min-width:0">
                    <div class="pc-t-body-strong" style="font-size:14px">{{ pc }}</div>
                    <div class="pc-t-mono pc-t-cap">{{ pc }}</div>
                  </div>
                  <RbacBadge v-if="(selectedUser.superProjects||[]).includes(pc)" tone="super" dot size="sm">超管</RbacBadge>
                  <div style="display:flex;align-items:center;gap:7px">
                    <span class="pc-t-cap" :style="{ color: (selectedUser.superProjects||[]).includes(pc) ? 'var(--pc-super)' : 'var(--pc-ink-48)' }">超管</span>
                    <el-switch
                      size="small"
                      :model-value="(selectedUser.superProjects||[]).includes(pc)"
                      @change="(v) => openSuperConfirm(selectedUser!, pc, Boolean(v))"
                      :loading="superLoading === pc"
                    />
                  </div>
                  <el-button text size="small" style="color:var(--pc-deny)" @click="revokeUserGrant(selectedUser!.userid, pc)">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>

              <!-- 新增授权区 -->
              <div class="new-grant-section">
                <div class="pc-t-section" style="margin-bottom:4px">新增项目授权</div>
                <div class="pc-t-cap" style="margin-bottom:16px">选择一个或多个系统，一次性提交 · POST /api/global/user/&#123;userid&#125;/project-grants</div>
                <div v-if="availableProjects.length === 0" class="pc-t-cap">已授权全部系统</div>
                <div v-else class="available-grid">
                  <button
                    v-for="p in availableProjects" :key="p"
                    class="avail-tile"
                    :class="{ 'avail-tile--on': pickedProjects.includes(p) }"
                    @click="togglePick(p)"
                  >
                    <RbacProjectGlyph :code="p" :name="p" :size="30" />
                    <div style="text-align:left;flex:1;min-width:0">
                      <div class="pc-t-body-strong" style="font-size:13.5px">{{ p }}</div>
                      <div class="pc-t-mono pc-t-cap" style="font-size:11.5px">{{ p }}</div>
                    </div>
                    <el-icon v-if="pickedProjects.includes(p)" style="color:var(--pc-blue)"><Check /></el-icon>
                  </button>
                </div>
                <div v-if="availableProjects.length > 0" style="display:flex;align-items:center;gap:14px;margin-top:16px">
                  <label style="display:flex;align-items:center;gap:8px;font-size:14px;cursor:pointer">
                    <el-switch v-model="grantAsSuper" />
                    <span>以超管身份授权</span>
                  </label>
                  <el-button
                    type="primary"
                    :disabled="pickedProjects.length === 0"
                    :loading="grantLoading"
                    @click="submitGrant"
                  >
                    授权 {{ pickedProjects.length > 0 ? `(${pickedProjects.length})` : '' }}
                  </el-button>
                </div>
              </div>
            </div>

            <!-- 结果报告 -->
            <div v-if="grantReport" class="pc-card" style="margin-top:16px;padding:22px">
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
                <div class="report-icon" :style="{ background: grantReport.failureCount ? 'var(--pc-warn-wash)' : 'var(--pc-ok-wash)', color: grantReport.failureCount ? 'var(--pc-warn)' : 'var(--pc-ok)' }">
                  <el-icon :size="22"><Check /></el-icon>
                </div>
                <div>
                  <div class="pc-t-section" style="font-size:18px">授权完成</div>
                  <div class="pc-t-cap">成功 {{ grantReport.successCount }} · 失败 {{ grantReport.failureCount }}</div>
                </div>
              </div>
              <div class="report-list">
                <div v-for="(r, i) in grantReport.results" :key="r.project" class="report-row" :style="{ borderTop: i ? '1px solid var(--pc-divider)' : 'none' }">
                  <RbacProjectGlyph :code="r.project" :name="r.project" :size="30" />
                  <div style="flex:1">
                    <div class="pc-t-body-strong" style="font-size:13.5px">{{ r.project }}</div>
                  </div>
                  <RbacBadge :tone="r.skipped ? 'neutral' : r.success ? 'ok' : 'deny'" dot size="sm">
                    {{ r.skipped ? '已存在' : r.success ? 'success' : 'failed' }}
                  </RbacBadge>
                </div>
              </div>
              <el-button style="margin-top:14px;width:100%" @click="grantReport = null">关闭</el-button>
            </div>
          </div>
        </template>

        <!-- ===== 按系统视图：选中 project 的已授权用户 ===== -->
        <template v-else>
          <div v-if="!selectedProject" class="pc-card" style="padding:60px;text-align:center">
            <div class="pc-t-cap">← 请从左侧选择一个系统</div>
          </div>
          <div v-else>
            <div class="pc-card" style="padding:0;overflow:hidden">
              <!-- 表头 + 操作 -->
              <div style="display:flex;align-items:center;justify-content:space-between;padding:18px 22px 14px">
                <div>
                  <span class="pc-t-section">{{ selectedProject }}</span>
                  <span class="pc-t-cap" style="margin-left:10px">共 {{ projUserTotal }} 个授权用户</span>
                </div>
                <el-button type="primary" size="small" @click="openProjAddDialog">
                  <el-icon><Plus /></el-icon> 添加用户
                </el-button>
              </div>

              <!-- 表头行 -->
              <div class="proj-table-head">
                <span>用户</span>
                <span>权限组</span>
                <span>超管</span>
                <span></span>
              </div>

              <div v-loading="projUsersLoading">
                <RbacEmptyState v-if="!projUsersLoading && projUsers.length === 0" title="暂无授权用户" description="点击上方「添加用户」按钮授权" />
                <div
                  v-for="(u, i) in projUsers" :key="u.userid"
                  class="proj-table-row"
                  :style="{ borderTop: i ? '1px solid var(--pc-divider)' : 'none' }"
                >
                  <div style="display:flex;align-items:center;gap:11px">
                    <RbacAvatar :name="u.username || u.userid" :size="32" :dim="u.status === 'Disabled'" />
                    <div>
                      <div class="pc-t-body-strong" style="font-size:14px">{{ u.username || u.userid }}</div>
                      <div class="pc-t-mono pc-t-cap" style="font-size:11.5px">{{ u.userid }}</div>
                    </div>
                  </div>
                  <div class="pc-t-cap" style="font-size:13px">
                    {{ (u.groupCodes||[]).length > 0 ? (u.groupNames||u.groupCodes).join('、') : '—' }}
                  </div>
                  <div style="display:flex;align-items:center;gap:7px">
                    <el-switch
                      size="small"
                      :model-value="(u.superProjects||[]).includes(selectedProject)"
                      @change="(v) => openSuperConfirm(u, selectedProject || '', Boolean(v))"
                      :loading="superLoading === u.userid + selectedProject"
                    />
                  </div>
                  <div style="text-align:right">
                    <el-button text size="small" style="color:var(--pc-deny)" @click="revokeUserGrant(u.userid, selectedProject || '')">
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </div>
                </div>
              </div>

              <!-- 分页 -->
              <div style="padding:12px 22px;display:flex;justify-content:flex-end" v-if="projUserTotal > projPageSize">
                <el-pagination
                  v-model:current-page="projPage"
                  :page-size="projPageSize"
                  :total="projUserTotal"
                  layout="prev, pager, next"
                  small
                  @current-change="loadProjUsers"
                />
              </div>
            </div>
          </div>
        </template>

      </div>
    </div>

    <!-- ── 接口来源 ── -->
    <div style="margin-top:24px">
      <RbacApiSource :endpoints="[
        { m: 'GET',    p: '/api/global/user/list',                              d: '用户列表（可按 project 过滤）' },
        { m: 'GET',    p: '/api/global/project/list',                           d: '全部业务 project' },
        { m: 'POST',   p: '/api/global/user/{userid}/project-grants',           d: '授权到多个 project（含 isSuper、自动建账号）' },
        { m: 'DELETE', p: '/api/global/user/{userid}/project-grants/{project}', d: '撤销单个 project 授权（幂等）' },
        { m: 'PUT',    p: '/api/global/user/{userid}/project-grants/{project}/super', d: '全局切换单个 project 超管标记' },
      ]" note="按用户与按系统两种视图共用同一组写接口，仅聚合方向不同。超管切换通过全局接口执行，目标 project 来自 path。" />
    </div>

    <!-- ══ ContactSelector Dialog（按用户：新增授权不需要，直接在右侧卡片里选） ══ -->
    <!-- 按系统：添加用户 -->
    <el-dialog
      v-model="projAddDialogVisible"
      title="选择人员"
      width="900px"
      top="4vh"
      append-to-body
      class="pc-contact-dialog"
      custom-class="pc-contact-dialog"
      :close-on-click-modal="false"
    >
      <ContactSelector
        class="pc-contact-selector-fit"
        :org-list="MOCK_ORGS"
        :user-list="MOCK_USERS"
        :multiple="true"
        @confirm="onProjContactConfirm"
        @cancel="projAddDialogVisible = false"
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
        <div class="confirm-summary">
          <div v-for="[k,v] in superConfirmSummary" :key="k" class="confirm-row">
            <span class="pc-t-cap-strong">{{ k }}</span>
            <span style="font-size:13.5px;font-weight:500;text-align:right">{{ v }}</span>
          </div>
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px">
          <el-button @click="superConfirmVisible = false">取消</el-button>
          <el-button
            :style="{ background: superConfirmData.val ? 'var(--pc-super)' : 'var(--pc-warn)', color: '#fff', border: 'none' }"
            :loading="!!superLoading"
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
import { computed, onMounted, ref, watch } from 'vue'
import { Search, Plus, Delete, Check, Star } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ContactSelector from '/@/components/ContactSelector.vue'
import RbacAvatar       from '/@/components/rbac/RbacAvatar.vue'
import RbacBadge        from '/@/components/rbac/RbacBadge.vue'
import RbacStatusBadge  from '/@/components/rbac/RbacStatusBadge.vue'
import RbacProjectGlyph from '/@/components/rbac/RbacProjectGlyph.vue'
import RbacEmptyState   from '/@/components/rbac/RbacEmptyState.vue'
import RbacApiSource    from '/@/components/rbac/RbacApiSource.vue'
import {
  getGlobalUsers, getGlobalProjects,
  grantGlobalUserProjects, revokeGlobalUserProject, toggleGlobalUserProjectSuper,
  type AdminItem,
} from '/@/api/backend/rbac'

/* ── Mock 人员数据（待替换为真实人员中心 API） ── */
const MOCK_ORGS = [
  { id: 'root', pid: null, name: '总公司' },
  { id: 'tech', pid: 'root', name: '技术中心' },
  { id: 'product', pid: 'root', name: '产品中心' },
]
const MOCK_USERS = [
  { id: '1', name: '张三', workNo: 'u001', phone: '13800000001', position: '高级工程师', orgId: 'tech' },
  { id: '2', name: '李四', workNo: 'u002', phone: '13800000002', position: '产品经理', orgId: 'product' },
  { id: '3', name: '王五', workNo: 'u003', phone: '13800000003', position: '工程师', orgId: 'tech' },
]

defineOptions({ name: 'backend/authorization' })

type AuthMode = 'user' | 'project'

const MODES: Array<{ value: AuthMode; label: string }> = [
  { value: 'user',    label: '按用户授权' },
  { value: 'project', label: '按系统授权' },
]

/* ── 视图模式 ── */
const mode = ref<AuthMode>('user')

/* ── Projects ── */
const projects        = ref<string[]>([])
const projectsLoading = ref(false)

/* ── 左侧用户列表（按用户模式） ── */
const railKeyword  = ref('')
const railUsers    = ref<AdminItem[]>([])
const railLoading  = ref(false)
const railPage     = ref(1)
const railPageSize = 20
const railTotal    = ref(0)

/* ── 右侧：选中用户 ── */
const selectedUserId = ref<string | null>(null)
const selectedUser   = ref<AdminItem | null>(null)
const pickedProjects = ref<string[]>([])
const grantAsSuper   = ref(false)
const grantLoading   = ref(false)
const grantReport    = ref<any>(null)
const availableProjects = computed(() =>
  projects.value.filter(p => !(selectedUser.value?.projectCodes || []).includes(p))
)

/* ── 右侧：选中 project（按系统模式） ── */
const selectedProject    = ref<string | null>(null)
const projUsers          = ref<AdminItem[]>([])
const projUsersLoading   = ref(false)
const projPage           = ref(1)
const projPageSize       = 20
const projUserTotal      = ref(0)
const projAddDialogVisible = ref(false)
let projUsersRequestSeq = 0

/* ── 超管确认 ── */
const superConfirmVisible = ref(false)
const superConfirmData    = ref<{ user: AdminItem; project: string; val: boolean } | null>(null)
const superLoading        = ref<string | null>(null)
const superConfirmSummary = computed(() => {
  if (!superConfirmData.value) return []
  const { user, project, val } = superConfirmData.value
  return [
    ['用户', `${user.username} · ${user.userid}`],
    ['目标系统', project],
    ['变更', val ? '普通管理员 → 超级管理员' : '超级管理员 → 普通管理员'],
    ['影响范围', `仅 ${project} 内的全部菜单与按钮权限`],
  ]
})

/* ── 初始化 ── */
onMounted(async () => {
  projectsLoading.value = true
  try {
    const res = await getGlobalProjects()
    projects.value = res.list || []
    if (projects.value.length) selectedProject.value = projects.value[0]
  } finally {
    projectsLoading.value = false
  }
  await loadRailUsers()
})

/* ── 模式切换 ── */
function switchMode(m: AuthMode) {
  mode.value = m
  grantReport.value = null
  if (m === 'project') {
    void loadProjUsers()
  }
}

/* ── 左侧用户列表 ── */
async function loadRailUsers() {
  railLoading.value = true
  try {
    const res = await getGlobalUsers({
      keyword:  railKeyword.value || undefined,
      page:     railPage.value,
      pageSize: railPageSize,
    })
    railUsers.value = res.list  || []
    railTotal.value = res.total || 0
    if (!selectedUserId.value && railUsers.value.length) {
      selectUser(railUsers.value[0])
    }
  } finally {
    railLoading.value = false
  }
}

function onRailSearch() {
  railPage.value = 1
  loadRailUsers()
}

function selectUser(u: AdminItem) {
  selectedUserId.value = u.userid
  selectedUser.value   = u
  pickedProjects.value = []
  grantReport.value    = null
}

/* ── 按系统：加载该 project 用户 ── */
async function loadProjUsers() {
  const project = selectedProject.value
  if (!project) return
  const requestSeq = ++projUsersRequestSeq
  projUsersLoading.value = true
  try {
    const res = await getGlobalUsers({
      project,
      page:     projPage.value,
      pageSize: projPageSize,
    })
    if (requestSeq !== projUsersRequestSeq || selectedProject.value !== project) return
    projUsers.value     = res.list  || []
    projUserTotal.value = res.total || 0
  } catch (error: any) {
    if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError' || error?.name === 'AbortError') return
    throw error
  } finally {
    if (requestSeq === projUsersRequestSeq) {
      projUsersLoading.value = false
    }
  }
}

function selectProject(p: string) {
  if (selectedProject.value === p) return
  selectedProject.value = p
  projPage.value = 1
}

watch(selectedProject, () => { if (mode.value === 'project') void loadProjUsers() })

/* ── 新增授权（按用户） ── */
function togglePick(p: string) {
  const idx = pickedProjects.value.indexOf(p)
  if (idx >= 0) pickedProjects.value.splice(idx, 1)
  else pickedProjects.value.push(p)
}

async function submitGrant() {
  if (!selectedUser.value || pickedProjects.value.length === 0) return
  grantLoading.value = true
  try {
    const res = await grantGlobalUserProjects(selectedUser.value.userid, {
      username:       selectedUser.value.username,
      targetProjects: pickedProjects.value,
      isSuper:        grantAsSuper.value ? true : undefined,
    })
    grantReport.value = res
    // 刷新左侧用户数据
    const refreshed = await getGlobalUsers({ keyword: selectedUser.value.userid, page: 1, pageSize: 1 })
    if (refreshed.list[0]) {
      selectedUser.value   = refreshed.list[0]
      selectedUserId.value = refreshed.list[0].userid
    }
    pickedProjects.value = []
    grantAsSuper.value   = false
    await loadRailUsers()
  } catch {
    ElMessage.error('授权失败')
  } finally {
    grantLoading.value = false
  }
}

/* ── 撤销授权 ── */
async function revokeUserGrant(userid: string, project: string) {
  await ElMessageBox.confirm(`确认撤销该用户在 ${project} 的授权？`, '撤销授权', {
    confirmButtonText: '撤销', cancelButtonText: '取消', type: 'warning',
  })
  try {
    await revokeGlobalUserProject(userid, project)
    ElMessage.success('已撤销授权')
    if (mode.value === 'user' && selectedUser.value?.userid === userid) {
      selectedUser.value = {
        ...selectedUser.value,
        projectCodes:  (selectedUser.value.projectCodes  || []).filter(p => p !== project),
        superProjects: (selectedUser.value.superProjects || []).filter(p => p !== project),
      }
      await loadRailUsers()
    } else {
      await loadProjUsers()
    }
  } catch {
    ElMessage.error('操作失败')
  }
}

/* ── 超管 toggle ── */
function openSuperConfirm(user: AdminItem, project: string, val: boolean) {
  superConfirmData.value = { user, project, val }
  superConfirmVisible.value = true
}

async function doSuperToggle() {
  if (!superConfirmData.value) return
  const { user, project, val } = superConfirmData.value
  const key = user.userid + project
  superLoading.value = key
  try {
    await toggleGlobalUserProjectSuper(user.userid, project, val)
    ElMessage.success(val ? '已提升为超管' : '已降级')
    if (mode.value === 'user' && selectedUser.value?.userid === user.userid) {
      const supers = [...(selectedUser.value.superProjects || [])]
      if (val && !supers.includes(project)) supers.push(project)
      if (!val) supers.splice(supers.indexOf(project), 1)
      selectedUser.value = { ...selectedUser.value, superProjects: supers }
    }
    mode.value === 'project' ? await loadProjUsers() : await loadRailUsers()
  } catch {
    ElMessage.error('操作失败')
  } finally {
    superLoading.value = null
    superConfirmVisible.value = false
    superConfirmData.value = null
  }
}

/* ── 按系统新增 ContactSelector ── */
function openProjAddDialog() { projAddDialogVisible.value = true }

async function onProjContactConfirm(users: Array<{ workNo: string; name: string }>) {
  projAddDialogVisible.value = false
  if (!selectedProject.value || !users.length) return
  let ok = 0
  for (const u of users) {
    try {
      await grantGlobalUserProjects(u.workNo, {
        username: u.name,
        targetProjects: [selectedProject.value],
        isSuper: undefined,
      })
      ok++
    } catch {
      ElMessage.warning(`${u.name} 授权失败`)
    }
  }
  if (ok > 0) {
    ElMessage.success(`已授权 ${ok} 人`)
    await loadProjUsers()
  }
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
  height: calc(92vh - 128px) !important;
  min-height: 420px;
  max-height: 600px;
}

.pc-page {
  max-width: 1340px;
  margin: 0 auto;
  padding: 30px 32px 80px;
  font-family: var(--pc-font-text);
  color: var(--pc-ink);
}

/* ── 页头 ── */
.auth-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 22px;
  flex-wrap: wrap;
}
.auth-head__title { font-size: 28px; font-weight: 600; margin: 0; letter-spacing: -0.015em; }
.auth-head__sub   { font-size: 15px; color: var(--pc-ink-60); margin: 4px 0 0; }

/* ── Segmented ── */
.segmented {
  display: inline-flex;
  background: #ececef;
  border-radius: 10px;
  padding: 3px;
  gap: 2px;
}
.segmented__btn {
  padding: 7px 16px;
  font-size: 14px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 400;
  background: transparent;
  color: var(--pc-ink-60);
  font-family: var(--pc-font-text);
  transition: all 0.15s;
  &--active { background: #fff; color: var(--pc-ink); font-weight: 600; box-shadow: 0 1px 3px rgba(0,0,0,0.12); }
}

/* ── 布局 ── */
.auth-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 20px;
  align-items: start;
}
.auth-rail {
  padding: 0;
  overflow: hidden;
  position: sticky;
  top: 80px;
}
.rail-search { padding: 14px; border-bottom: 1px solid var(--pc-divider); }
.rail-list {
  max-height: calc(100vh - 280px);
  overflow-y: auto;
}
.rail-section-title { color: var(--pc-ink-60); }
.rail-pagination { padding: 8px 14px; border-top: 1px solid var(--pc-divider); display: flex; justify-content: center; }
.rail-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 11px 14px;
  border: none;
  border-bottom: 1px solid var(--pc-divider);
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition: background 0.1s;
  &:hover { background: var(--pc-parchment); }
  &--active { background: var(--pc-blue-wash); }
}
.rail-item__info { flex: 1; min-width: 0; overflow: hidden; }
.rail-item__name { font-size: 13.5px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* ── 用户详情卡 ── */
.detail-user-card { padding: 22px; }
.grant-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 22px; }
.grant-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 14px;
  border: 1px solid var(--pc-hairline);
  border-radius: 12px;
}
.new-grant-section {
  border-top: 1px solid var(--pc-divider);
  padding-top: 20px;
  margin-top: 4px;
}
.available-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 4px;
}
.avail-tile {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--pc-hairline);
  background: #fff;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s;
  &--on { border: 2px solid var(--pc-blue); background: var(--pc-blue-wash); }
  &:hover { border-color: #cdcdd2; }
}

/* ── 按系统表格 ── */
.proj-table-head {
  display: grid;
  grid-template-columns: 2fr 2fr 1fr 80px;
  padding: 12px 22px;
  background: var(--pc-pearl);
  border-bottom: 1px solid var(--pc-hairline);
  font-size: 12px;
  font-weight: 600;
  color: var(--pc-ink-60);
  border-top: 1px solid var(--pc-divider);
}
.proj-table-row {
  display: grid;
  grid-template-columns: 2fr 2fr 1fr 80px;
  padding: 13px 22px;
  align-items: center;
}

/* ── 结果报告 ── */
.report-icon {
  width: 46px; height: 46px;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 14px;
}
.report-list { border: 1px solid var(--pc-hairline); border-radius: 12px; overflow: hidden; margin-bottom: 16px; }
.report-row { display: flex; align-items: center; gap: 12px; padding: 12px 14px; }

/* ── 超管确认 ── */
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
