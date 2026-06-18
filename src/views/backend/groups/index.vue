<!--
  放置路径：src/views/backend/groups/index.vue
  完整替换。
  职责：
  - 列表：GET /api/global/group/list（分页 + keyword + project/status 过滤）
  - 卡片网格（3列）+ 详情抽屉
  - 抽屉内：状态 toggle / 成员列表 / ContactSelector 添加成员 / 移除成员 / permissionCodes 展示
  - 新建权限组 Dialog：groupName / groupCode / project / parentGroupCode / ruleCodes 树选 / extraPermissionCodes
  - 无 router.push
-->
<template>
  <main class="pc-page pc-anim-fade">

    <!-- 工具栏 -->
    <div class="groups-toolbar">
      <el-input
        v-model="query.keyword"
        placeholder="搜索组名或编码"
        clearable
        style="width:240px"
        @change="onSearch"
      >
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>

      <el-select v-model="query.project" placeholder="全部系统" clearable style="width:140px" @change="onSearch">
        <el-option label="全部系统" value="" />
        <el-option v-for="p in projects" :key="p" :label="p" :value="p" />
      </el-select>

      <el-select v-model="query.status" placeholder="全部状态" clearable style="width:130px" @change="onSearch">
        <el-option label="全部状态" value="" />
        <el-option label="启用" value="Active" />
        <el-option label="禁用" value="Disabled" />
      </el-select>

      <div style="margin-left:auto">
        <el-button type="primary" @click="openCreate">
          <el-icon><Plus /></el-icon> 新建权限组
        </el-button>
      </div>
    </div>

    <!-- 卡片网格 -->
    <div class="groups-grid" v-loading="loading">
      <RbacEmptyState v-if="!loading && rows.length === 0" title="暂无权限组" description="尝试调整搜索条件或新建权限组" style="grid-column:span 3" />

      <div
        v-for="g in rows" :key="g.groupCode"
        class="group-card"
        @click="openDetail(g)"
        @mouseenter="e => (e.currentTarget as HTMLElement).style.borderColor = '#cdcdd2'"
        @mouseleave="e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--pc-hairline)'"
      >
        <div class="group-card__top">
          <div class="group-card__icon">
            <el-icon :size="20"><Lock /></el-icon>
          </div>
          <RbacStatusBadge :status="g.status as 'Active'|'Disabled'" size="sm" />
        </div>
        <div class="group-card__body">
          <div class="group-card__name">{{ g.groupName }}</div>
          <div class="pc-t-mono pc-t-cap" style="font-size:11.5px;margin-top:2px">{{ g.groupCode }}</div>
        </div>
        <hr class="pc-hr" />
        <div class="group-card__foot">
          <span class="group-card__proj">
            <RbacProjectGlyph :code="g.project" :name="g.project" :size="20" />
            <span class="pc-t-cap" style="font-weight:500">{{ g.project }}</span>
          </span>
          <span class="pc-t-cap">
            <b style="color:var(--pc-ink)">{{ g.memberCount ?? 0 }}</b> 成员 ·
            <b style="color:var(--pc-ink)">{{ (g.permissionCodes||[]).length }}</b> 权限码
          </span>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div class="groups-pagination">
      <span class="pc-t-cap">显示 {{ rows.length }} 个 · 共 {{ total }} 个权限组</span>
      <el-pagination
        v-model:current-page="query.page"
        v-model:page-size="query.pageSize"
        :page-sizes="[20, 50]"
        :total="total"
        layout="sizes, prev, pager, next"
        small
        @size-change="loadGroups"
        @current-change="loadGroups"
      />
    </div>

    <!-- 接口来源 -->
    <div style="margin-top:24px">
      <RbacApiSource :endpoints="[
        { m: 'GET',    p: '/api/global/group/list',                          d: '跨 project 权限组列表（分页）' },
        { m: 'POST',   p: '/api/global/group',                               d: '新建权限组（body 含 targetProject）' },
        { m: 'PUT',    p: '/api/global/group/{groupCode}',                   d: '编辑权限组 / 规则授权 / 状态切换' },
        { m: 'POST',   p: '/api/global/group/{groupCode}/members',           d: '添加成员（body 含 targetProject）' },
        { m: 'DELETE', p: '/api/global/group/{groupCode}/members/{userid}',  d: '移除成员（query targetProject）' },
        { m: 'GET',    p: '/api/rule/tree',                                  d: '新建时规则授权选择器' },
        { m: 'GET',    p: '/api/api-map/list',                               d: '新建时 extraPermissionCodes 选择器' },
      ]" note="组层级仅用于展示，实际访问由 permissionCodes 决定。全局写接口通过 targetProject 指定真实业务系统。" />
    </div>

    <!-- ══ 详情抽屉 ══ -->
    <el-drawer v-model="drawerVisible" direction="rtl" :size="480" :with-header="false" append-to-body>
      <div v-if="selectedGroup" class="detail-drawer">
        <!-- 头部 -->
        <div class="detail-header">
          <span class="pc-t-cap-strong">权限组详情</span>
          <div style="display:flex;align-items:center;gap:8px">
            <el-button text @click="drawerVisible = false"><el-icon><Close /></el-icon></el-button>
          </div>
        </div>

        <!-- 组信息 -->
        <div class="detail-hero">
          <div class="detail-hero__icon"><el-icon :size="24"><Lock /></el-icon></div>
          <div style="flex:1">
            <div style="display:flex;align-items:center;gap:9px">
              <span class="pc-t-section" style="font-size:21px">{{ selectedGroup.groupName }}</span>
              <RbacStatusBadge :status="selectedGroup.status as 'Active'|'Disabled'" />
            </div>
            <div class="pc-t-mono pc-t-cap" style="margin-top:2px">{{ selectedGroup.groupCode }}</div>
          </div>
        </div>

        <!-- Meta cards -->
        <div class="detail-meta-row">
          <div class="detail-meta-card">
            <div class="pc-t-cap" style="font-size:11px">所属系统</div>
            <div style="display:flex;align-items:center;gap:7px;margin-top:4px">
              <RbacProjectGlyph :code="selectedGroup.project" :name="selectedGroup.project" :size="22" />
              <span class="pc-t-body-strong" style="font-size:13px">{{ selectedGroup.project }}</span>
            </div>
          </div>
          <div class="detail-meta-card">
            <div class="pc-t-cap" style="font-size:11px">父权限组</div>
            <div class="pc-t-body-strong" style="font-size:13px;margin-top:4px">{{ selectedGroup.parent_group_code || '根组' }}</div>
          </div>
        </div>

        <div class="detail-body">
          <!-- 状态 toggle -->
          <div class="detail-section-card">
            <div>
              <div class="pc-t-body-strong" style="font-size:14px">启用状态</div>
              <div class="pc-t-cap">PUT /api/group/&#123;groupCode&#125;/status</div>
            </div>
            <el-switch
              :model-value="selectedGroup.status === 'Active'"
              :loading="statusLoading"
              @change="(v) => toggleStatus(Boolean(v))"
            />
          </div>

          <!-- 成员 -->
          <div class="detail-section-head">
            <span class="pc-t-section">成员（{{ memberTotal }}）</span>
            <el-button text type="primary" size="small" @click="memberDialogVisible = true">
              <el-icon><Plus /></el-icon> 添加成员
            </el-button>
          </div>

          <div class="member-list">
            <div v-if="detailMembers.length === 0 && !membersLoading" class="pc-t-cap" style="padding:6px 0">暂无成员</div>
            <div v-loading="membersLoading">
              <div
                v-for="u in detailMembers" :key="u.userid"
                class="member-row"
              >
                <RbacAvatar :name="u.username || u.userid" :size="30" :dim="u.status === 'Disabled'" />
                <div style="flex:1;min-width:0">
                  <div class="pc-t-body-strong" style="font-size:13.5px">{{ u.username || u.userid }}</div>
                  <div class="pc-t-mono pc-t-cap" style="font-size:11px">{{ u.userid }}</div>
                </div>
                <el-button
                  text size="small"
                  style="color:var(--pc-deny);width:28px;height:28px;background:var(--pc-deny-wash);border-radius:8px"
                  @click="removeMember(u.userid)"
                >
                  <el-icon><Close /></el-icon>
                </el-button>
              </div>
            </div>
          </div>
          <div v-if="memberTotal > memberQuery.pageSize" class="member-pagination">
            <el-pagination
              v-model:current-page="memberQuery.page"
              v-model:page-size="memberQuery.pageSize"
              :page-sizes="[10, 20, 50]"
              :total="memberTotal"
              layout="sizes, prev, pager, next"
              small
              @size-change="loadDetailMembers"
              @current-change="loadDetailMembers"
            />
          </div>

          <!-- 权限码 -->
          <div class="detail-section-head" style="margin-top:8px">
            <span class="pc-t-section">授权权限码（{{ (selectedGroup.permissionCodes||[]).length }}）</span>
              <el-button text type="primary" @click="openEditGroup">
                <el-icon><Edit /></el-icon> 编辑权限
              </el-button>
          </div>
          <div class="pc-t-cap" style="margin-bottom:12px">permissionCodes = ruleCodes 推导值 ∪ extraPermissionCodes</div>
          <div class="perm-chips">
            <span
              v-for="pc in (selectedGroup.permissionCodes||[])" :key="pc"
              class="perm-chip"
              :style="{ background: pc.startsWith('menu:') ? '#eef4fb' : '#f3eefb', color: pc.startsWith('menu:') ? 'var(--pc-blue)' : 'var(--pc-super)' }"
            >{{ pc }}</span>
            <span v-if="(selectedGroup.permissionCodes||[]).length === 0" class="pc-t-cap">暂无</span>
          </div>
        </div>
      </div>
    </el-drawer>

    <GroupFormDrawer
      v-model="formDrawerVisible"
      :mode="formMode"
      :model="editingGroup"
      :projects="projects"
      @submit="handleCreateSubmit"
    />

    <el-dialog
      v-model="memberDialogVisible"
      title="选择成员"
      width="980px"
      append-to-body
      destroy-on-close
      class="pc-member-dialog"
    >
      <ContactSelector
        :org-list="MOCK_ORGS"
        :user-list="MOCK_USERS"
        :multiple="true"
        @confirm="onMemberConfirm"
        @cancel="memberDialogVisible = false"
      />
    </el-dialog>

  </main>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { Search, Plus, Close, Lock, Edit } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ContactSelector  from '/@/components/ContactSelector.vue'
import GroupFormDrawer  from './components/GroupFormDrawer.vue'
import RbacAvatar       from '/@/components/rbac/RbacAvatar.vue'
import RbacStatusBadge  from '/@/components/rbac/RbacStatusBadge.vue'
import RbacProjectGlyph from '/@/components/rbac/RbacProjectGlyph.vue'
import RbacEmptyState   from '/@/components/rbac/RbacEmptyState.vue'
import RbacApiSource    from '/@/components/rbac/RbacApiSource.vue'
import {
  getGlobalGroups, getGlobalProjects, getGlobalUsers,
  updateGlobalGroup,
  addGlobalGroupMember, removeGlobalGroupMember,
  type GroupItem, type AdminItem,
} from '/@/api/backend/rbac'

/* ── Mock 人员（待替换） ── */
const MOCK_ORGS = [
  { id: 'root', pid: null, name: '总公司' },
  { id: 'tech', pid: 'root', name: '技术中心' },
]
const MOCK_USERS = [
  { id: '1', name: '张三', workNo: 'u001', phone: '13800000001', position: '工程师', orgId: 'tech' },
  { id: '2', name: '李四', workNo: 'u002', phone: '13800000002', position: '经理', orgId: 'tech' },
  { id: '3', name: '王五', workNo: 'u003', phone: '13800000003', position: '专员', orgId: 'tech' },
]

defineOptions({ name: 'backend/groups' })

/* ── 查询状态 ── */
const query = reactive({ keyword: '', project: '', status: '' as ''|'Active'|'Disabled', page: 1, pageSize: 20 })
const loading = ref(false)
const rows    = ref<GroupItem[]>([])
const total   = ref(0)
const projects = ref<string[]>([])
let groupsRequestSeq = 0

/* ── 详情 ── */
const drawerVisible   = ref(false)
const selectedGroup   = ref<GroupItem | null>(null)
const statusLoading   = ref(false)
const detailMembers   = ref<AdminItem[]>([])
const membersLoading  = ref(false)
const memberTotal = ref(0)
const memberDialogVisible = ref(false)
const memberQuery = reactive({ page: 1, pageSize: 10 })
let membersRequestSeq = 0

/* ── 新建 ── */
const formDrawerVisible = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const editingGroup = ref<GroupItem | null>(null)

/* ── 初始化 ── */
onMounted(async () => {
  const [, pRes] = await Promise.all([loadGroups(), getGlobalProjects()])
  projects.value = pRes.list || []
})

async function loadGroups() {
  const requestSeq = ++groupsRequestSeq
  loading.value = true
  try {
    const res = await getGlobalGroups({
      keyword:  query.keyword  || undefined,
      project:  query.project  || undefined,
      status:   query.status   || undefined,
      page:     query.page,
      pageSize: query.pageSize,
    })
    if (requestSeq !== groupsRequestSeq) return
    const list = res.list || []
    rows.value = list
    total.value = res.total || 0
    rows.value = await loadCurrentPageMemberCounts(list, requestSeq)
  } finally {
    if (requestSeq === groupsRequestSeq) loading.value = false
  }
}
function onSearch() { query.page = 1; loadGroups() }

async function loadCurrentPageMemberCounts(groups: GroupItem[], requestSeq: number): Promise<GroupItem[]> {
  const groupsWithCounts = await Promise.all(
    groups.map(async (group) => {
      try {
        const res = await getGlobalUsers({
          project: group.project,
          groupCode: group.groupCode,
          page: 1,
          pageSize: 1,
        })
        return { ...group, memberCount: res.total || 0 }
      } catch {
        return group
      }
    })
  )
  return requestSeq === groupsRequestSeq ? groupsWithCounts : rows.value
}

/* ── 详情抽屉 ── */
async function openDetail(g: GroupItem) {
  selectedGroup.value   = g
  drawerVisible.value   = true
  memberDialogVisible.value = false
  memberQuery.page = 1
  await loadDetailMembers()
}

async function loadDetailMembers() {
  if (!selectedGroup.value) return
  const group = selectedGroup.value
  const requestSeq = ++membersRequestSeq
  membersLoading.value = true
  try {
    const res = await getGlobalUsers({
      project: group.project,
      groupCode: group.groupCode,
      page: memberQuery.page,
      pageSize: memberQuery.pageSize,
    })
    if (requestSeq !== membersRequestSeq || selectedGroup.value?.groupCode !== group.groupCode || selectedGroup.value?.project !== group.project) return
    detailMembers.value = res.list || []
    memberTotal.value = res.total || 0
  } finally {
    if (requestSeq === membersRequestSeq) membersLoading.value = false
  }
}

async function toggleStatus(active: boolean) {
  if (!selectedGroup.value) return
  statusLoading.value = true
  try {
    await updateGlobalGroup(selectedGroup.value.groupCode, {
      targetProject: selectedGroup.value.project,
      status: active ? 'Active' : 'Disabled',
    })
    selectedGroup.value = { ...selectedGroup.value, status: active ? 'Active' : 'Disabled' }
    await loadGroups()
    ElMessage.success(`权限组已${active ? '启用' : '禁用'}`)
  } catch { ElMessage.error('操作失败') }
  finally { statusLoading.value = false }
}

async function onMemberConfirm(users: Array<{ workNo: string; name: string }>) {
  memberDialogVisible.value = false
  if (!selectedGroup.value || !users.length) return
  for (const u of users) {
    try {
      await addGlobalGroupMember(selectedGroup.value.groupCode, {
        userid: u.workNo,
        targetProject: selectedGroup.value.project,
      })
    } catch { ElMessage.warning(`${u.name} 添加失败`) }
  }
  ElMessage.success(`已添加 ${users.length} 名成员`)
  await loadDetailMembers()
  await loadGroups()
}

async function removeMember(userid: string) {
  if (!selectedGroup.value) return
  await ElMessageBox.confirm('确认移除该成员？', '移除成员', { type: 'warning' })
  try {
    await removeGlobalGroupMember(selectedGroup.value.groupCode, userid, selectedGroup.value.project)
    await loadDetailMembers()
    await loadGroups()
    ElMessage.success('已移除')
  } catch { ElMessage.error('操作失败') }
}

/* ── 新建 ── */
function openCreate() {
  formMode.value = 'create'
  editingGroup.value = null
  formDrawerVisible.value = true
}

function openEditGroup() {
  if (!selectedGroup.value) return
  formMode.value = 'edit'
  editingGroup.value = { ...selectedGroup.value }
  formDrawerVisible.value = true
}

async function handleCreateSubmit() {
  formDrawerVisible.value = false
  await loadGroups()
  if (selectedGroup.value) {
    const fresh = rows.value.find(g => g.project === selectedGroup.value?.project && g.groupCode === selectedGroup.value?.groupCode)
    if (fresh) selectedGroup.value = fresh
  }
}
</script>

<style scoped lang="scss">
.pc-page {
  max-width: 1240px;
  min-height: calc(100vh - 60px);
  margin: 0 auto;
  padding: 30px 32px 80px;
  font-family: var(--pc-font-text);
  box-sizing: border-box;
}

.groups-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
  flex-wrap: wrap;
}
.groups-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-bottom: 18px;
}
.group-card {
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px;
  border-radius: 18px;
  border: 1px solid var(--pc-hairline);
  background: #fff;
  cursor: pointer;
  transition: border-color 0.15s, transform 0.08s;
  &:hover { transform: translateY(-1px); }
}
.group-card__top  { display: flex; align-items: flex-start; justify-content: space-between; }
.group-card__icon { width: 38px; height: 38px; border-radius: 11px; background: var(--pc-blue-wash); color: var(--pc-blue); display: flex; align-items: center; justify-content: center; }
.group-card__name { font-size: 15.5px; font-weight: 600; letter-spacing: -0.01em; }
.group-card__foot { display: flex; align-items: center; justify-content: space-between; }
.group-card__proj { display: inline-flex; align-items: center; gap: 6px; }

.groups-pagination { display: flex; align-items: center; justify-content: space-between; margin-top: 14px; flex-wrap: wrap; gap: 8px; }

/* Drawer */
.detail-drawer { display: flex; flex-direction: column; height: 100%; }
.detail-header  { display: flex; align-items: center; justify-content: space-between; padding: 22px 24px 18px; border-bottom: 1px solid var(--pc-divider); flex-shrink: 0; }
.detail-hero    { display: flex; align-items: center; gap: 13px; padding: 20px 24px 16px; border-bottom: 1px solid var(--pc-divider); flex-shrink: 0; }
.detail-hero__icon { width: 48px; height: 48px; border-radius: 13px; background: var(--pc-blue-wash); color: var(--pc-blue); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.detail-meta-row { display: flex; gap: 10px; padding: 14px 24px; border-bottom: 1px solid var(--pc-divider); flex-shrink: 0; }
.detail-meta-card { flex: 1; padding: 10px 12px; background: var(--pc-parchment); border-radius: 10px; }
.detail-body    { flex: 1; overflow-y: auto; padding: 20px 24px; }
.detail-section-card { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; background: var(--pc-parchment); border-radius: 12px; margin-bottom: 22px; }
.detail-section-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.member-list { display: flex; flex-direction: column; gap: 7px; margin-bottom: 24px; }
.member-row  { display: flex; align-items: center; gap: 11px; padding: 9px 12px; border: 1px solid var(--pc-hairline); border-radius: 11px; }
.member-pagination { display: flex; justify-content: flex-end; margin: -12px 0 20px; }
.perm-chips  { display: flex; flex-wrap: wrap; gap: 7px; }
.perm-chip   { font-family: var(--pc-font-mono); font-size: 11.5px; padding: 5px 10px; border-radius: 7px; }

/* Create dialog */
.create-form { display: flex; flex-direction: column; gap: 18px; }
.create-form__grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.form-field > label { display: block; font-size: 12px; font-weight: 600; color: var(--pc-ink-60); margin-bottom: 7px; }
.rule-select-box { border: 1px solid var(--pc-hairline); border-radius: 12px; max-height: 200px; overflow-y: auto; padding: 6px; }
.rule-select-item { display: flex; align-items: center; gap: 10px; padding: 7px 8px; cursor: pointer; border-radius: 8px; &:hover { background: var(--pc-parchment); } }
.extra-perm-chips { display: flex; flex-wrap: wrap; gap: 7px; }
.extra-chip { padding: 6px 11px; border-radius: 9999px; font-size: 12px; cursor: pointer; border: 1px solid var(--pc-hairline); background: #fff; color: var(--pc-ink-80); transition: all 0.12s; &--on { border: 1.5px solid var(--pc-blue); background: var(--pc-blue-wash); color: var(--pc-blue); } }
.derived-preview { background: var(--pc-parchment); border-radius: 12px; padding: 14px; }
</style>

<style lang="scss">
.pc-member-dialog {
  .el-dialog__body {
    padding-top: 8px;
  }

  .contact-selector {
    height: min(640px, calc(92vh - 160px));
  }
}
</style>
