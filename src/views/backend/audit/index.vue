<!--
  放置路径：src/views/backend/audit/index.vue
  完整替换。
  职责：
  - 两个 Tab：鉴权日志 / 权限视图
  - 鉴权日志：3 个结果统计卡（可点击过滤）+ 筛选栏 + 分页表格
  - 权限视图：GET /api/search/permission-view 分页列表
  - 只读，无写操作
-->
<template>
  <main class="pc-page pc-anim-fade">

    <!-- Tab 切换 + 只读标注 -->
    <div class="audit-head">
      <div class="segmented">
        <button
          v-for="t in TABS" :key="t.value"
          class="segmented__btn"
          :class="{ 'segmented__btn--active': tab === t.value }"
          @click="tab = t.value"
        >{{ t.label }}</button>
      </div>
      <span class="pc-t-cap" style="margin-left:auto">只读查询 · 不产生写操作与 Outbox 事件</span>
    </div>

    <!-- ════════════════ 鉴权日志 ════════════════ -->
    <template v-if="tab === 'logs'">

      <!-- 范围说明 banner -->
      <div class="scope-banner">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--pc-warn)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        <div class="pc-t-cap" style="color:#7a5500;line-height:1.5">
          本页记录的是<b>运行时鉴权结果</b>（Allow / Deny / Error），来自 GET /api/search/audit-logs。
          它<b>不是</b>授权变更历史（谁授予/撤销了什么）—— 写操作审计追踪为建议的未来 API 扩展。
        </div>
      </div>

      <!-- 统计卡（可点击过滤） -->
      <div class="stat-cards" v-loading="statsLoading">
        <button
          v-for="s in RESULT_STATS" :key="s.key"
          class="stat-card"
          :class="{ 'stat-card--active': resultFilter === s.key }"
          :style="resultFilter === s.key ? { borderColor: `var(--pc-${s.tone})`, borderWidth: '2px' } : {}"
          @click="toggleResultFilter(s.key)"
        >
          <div style="display:flex;align-items:center;gap:8px;width:100%;margin-bottom:10px">
            <RbacBadge :tone="s.tone" dot size="sm">{{ s.label }}</RbacBadge>
            <el-icon style="margin-left:auto;color:var(--pc-ink-48)" :style="resultFilter === s.key ? { color: `var(--pc-${s.tone})` } : {}"><Filter /></el-icon>
          </div>
          <div class="pc-t-display" style="font-size:30px;font-weight:600;letter-spacing:-0.018em">{{ statCounts[s.key] ?? '—' }}</div>
        </button>
      </div>

      <!-- 筛选栏 -->
      <div class="filter-bar">
        <el-input
          v-model="logQuery.keyword"
          placeholder="搜索用户或权限码"
          clearable
          style="width:240px"
          @change="onLogSearch"
        >
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>

        <div class="segmented" style="transform:scale(0.9);transform-origin:left">
          <button v-for="r in RESULT_OPTIONS" :key="r.value" class="segmented__btn" :class="{ 'segmented__btn--active': resultFilter === r.value }" @click="setResultFilter(r.value)">{{ r.label }}</button>
        </div>

        <el-select v-model="logQuery.httpMethod" clearable placeholder="全部方法" style="width:120px" @change="onLogSearch">
          <el-option v-for="m in ['GET','POST','PUT','DELETE','PATCH']" :key="m" :label="m" :value="m" />
        </el-select>

        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          size="default"
          style="width:260px"
          @change="onLogSearch"
        />

        <el-input v-model="logQuery.userid" placeholder="userid 精确" clearable style="width:140px" @change="onLogSearch" />
      </div>

      <!-- 日志表格 -->
      <div class="pc-card log-table-wrap" v-loading="logLoading">
        <div class="log-table-head">
          <span>时间</span>
          <span>用户</span>
          <span>请求</span>
          <span>权限码</span>
          <span>结果</span>
        </div>
        <RbacEmptyState v-if="!logLoading && logRows.length === 0" title="暂无鉴权日志" description="调整搜索条件或时间范围" />
        <div
          v-for="(a, i) in logRows" :key="a.auditId"
          class="log-row"
          :style="{ borderTop: i ? '1px solid var(--pc-divider)' : 'none' }"
        >
          <!-- 时间 -->
          <div>
            <div style="font-size:13px">{{ fmtTime(a.createdAt) }}</div>
            <div class="pc-t-cap" style="font-size:11px">{{ timeAgo(a.createdAt) }}</div>
          </div>
          <!-- 用户 -->
          <div style="display:flex;align-items:center;gap:9px">
            <RbacAvatar :name="a.username || a.userid || '?'" :size="28" />
            <div>
              <div style="font-size:13px;font-weight:600">{{ a.username || a.userid }}</div>
              <div class="pc-t-mono pc-t-cap" style="font-size:11px">{{ a.userid }} · {{ a.project }}</div>
            </div>
          </div>
          <!-- 请求 -->
          <div>
            <span :style="{ fontFamily: 'var(--pc-font-mono)', fontSize: '11px', fontWeight: 700, color: methodColor(a.httpMethod) }">{{ a.httpMethod }}</span>
            <span class="pc-t-mono" style="font-size:12px;margin-left:6px">{{ a.route }}</span>
          </div>
          <!-- 权限码 -->
          <div class="pc-t-mono" :style="{ fontSize: '12px', color: permColor(a.permissionCode) }">{{ a.permissionCode }}</div>
          <!-- 结果 -->
          <div><RbacBadge :tone="resultTone(a.result)" dot size="sm">{{ resultLabel(a.result) }}</RbacBadge></div>
        </div>
      </div>

      <!-- 分页 + 说明 -->
      <div class="log-footer">
        <span class="pc-t-cap">显示 {{ logRows.length }} 条 · 共 {{ logTotal }} 条</span>
        <el-pagination
          v-model:current-page="logQuery.page"
          v-model:page-size="logQuery.pageSize"
          :page-sizes="[20, 50, 100]"
          :total="logTotal"
          layout="sizes, prev, pager, next"
          small
          @size-change="loadLogs"
          @current-change="loadLogs"
        />
      </div>

      <div style="margin-top:22px">
        <RbacApiSource :endpoints="[
          { m: 'GET', p: '/api/search/audit-logs', d: 'userid / permissionCode / result / httpMethod / createdAtFrom~To 过滤' },
        ]" note="返回字段：auditId、userid、project、permissionCode、result、reason、createdAt。" />
      </div>
    </template>

    <!-- ════════════════ 权限视图 ════════════════ -->
    <template v-else>
      <div class="pc-t-cap" style="margin-bottom:14px">API 到权限码的权限视图 · GET /api/search/permission-view</div>

      <!-- 筛选 -->
      <div class="filter-bar" style="margin-bottom:16px">
        <el-input v-model="permQuery.keyword" placeholder="权限码 / 标题" clearable style="width:220px" @change="onPermSearch">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-input v-model="permQuery.action" placeholder="动作" clearable style="width:120px" @change="onPermSearch" />
      </div>

      <div class="pc-card" style="padding:0;overflow:hidden" v-loading="permLoading">
        <div class="perm-table-head">
          <span>权限码</span>
          <span>动作</span>
          <span>资源类型</span>
          <span>标题</span>
        </div>
        <RbacEmptyState v-if="!permLoading && permRows.length === 0" title="暂无权限视图数据" description="" />
        <div
          v-for="(pv, i) in permRows" :key="pv.permissionCode"
          class="perm-row"
          :style="{ borderTop: i ? '1px solid var(--pc-divider)' : 'none' }"
        >
          <span class="pc-t-mono" :style="{ fontSize: '12.5px', color: permColor(pv.permissionCode) }">{{ pv.permissionCode }}</span>
          <span><RbacBadge tone="neutral" size="sm">{{ pv.action }}</RbacBadge></span>
          <span style="font-size:13px">{{ pv.resourceType }}</span>
          <span style="font-size:13px">{{ pv.title }}</span>
        </div>
      </div>

      <!-- 分页 -->
      <div class="log-footer">
        <span class="pc-t-cap">共 {{ permTotal }} 条</span>
        <el-pagination
          v-model:current-page="permQuery.page"
          v-model:page-size="permQuery.pageSize"
          :total="permTotal"
          layout="prev, pager, next"
          small
          @current-change="loadPermView"
        />
      </div>

      <div style="margin-top:22px">
        <RbacApiSource :endpoints="[
          { m: 'GET', p: '/api/search/permission-view', d: 'permissionCode / action / resourceType / keyword 过滤' },
        ]" />
      </div>
    </template>

  </main>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { Search, Filter } from '@element-plus/icons-vue'
import RbacAvatar    from '/@/components/rbac/RbacAvatar.vue'
import RbacBadge     from '/@/components/rbac/RbacBadge.vue'
import RbacEmptyState from '/@/components/rbac/RbacEmptyState.vue'
import RbacApiSource  from '/@/components/rbac/RbacApiSource.vue'
import { searchAuditLogs, searchPermissionView, type AuditLogItem } from '/@/api/backend/rbac'

defineOptions({ name: 'backend/audit' })

type AuditTab = 'logs' | 'perm'
type AuditResultFilter = 'all' | 'Allow' | 'Deny' | 'Error'

const TABS: Array<{ value: AuditTab; label: string }> = [{ value: 'logs', label: '鉴权日志' }, { value: 'perm', label: '权限视图' }]
const tab  = ref<AuditTab>('logs')

const RESULT_OPTIONS: Array<{ value: AuditResultFilter; label: string }> = [
  { value: 'all',   label: '全部' },
  { value: 'Allow', label: '通过' },
  { value: 'Deny',  label: '拒绝' },
  { value: 'Error', label: '异常' },
]
const RESULT_STATS: Array<{ key: Exclude<AuditResultFilter, 'all'>; label: string; tone: 'ok' | 'deny' | 'warn' }> = [
  { key: 'Allow', label: '通过', tone: 'ok' as const },
  { key: 'Deny',  label: '拒绝', tone: 'deny' as const },
  { key: 'Error', label: '异常', tone: 'warn' as const },
]

/* ── 日志 ── */
const logLoading    = ref(false)
const statsLoading  = ref(false)
const logRows       = ref<AuditLogItem[]>([])
const logTotal      = ref(0)
const statCounts    = ref<Record<string, number>>({})
const resultFilter  = ref<AuditResultFilter>('all')
const dateRange     = ref<[Date, Date]>()
const logQuery = reactive({ keyword: '', userid: '', httpMethod: '', page: 1, pageSize: 20 })

async function loadLogs() {
  logLoading.value = true
  try {
    const res = await searchAuditLogs({
      keyword:        logQuery.keyword     || undefined,
      userid:         logQuery.userid      || undefined,
      httpMethod:     logQuery.httpMethod  || undefined,
      result:         resultFilter.value !== 'all' ? resultFilter.value : undefined,
      createdAtFrom:  dateRange.value?.[0]?.toISOString(),
      createdAtTo:    dateRange.value?.[1]?.toISOString(),
      page:           logQuery.page,
      pageSize:       logQuery.pageSize,
    })
    logRows.value  = res.list  || []
    logTotal.value = res.total || 0
  } finally { logLoading.value = false }
}

async function loadStatCounts() {
  statsLoading.value = true
  try {
    const [allow, deny, error] = await Promise.all([
      searchAuditLogs({ result: 'Allow', page: 1, pageSize: 1 }),
      searchAuditLogs({ result: 'Deny',  page: 1, pageSize: 1 }),
      searchAuditLogs({ result: 'Error', page: 1, pageSize: 1 }),
    ])
    statCounts.value = { Allow: allow.total, Deny: deny.total, Error: error.total }
  } finally { statsLoading.value = false }
}

function toggleResultFilter(key: Exclude<AuditResultFilter, 'all'>) { resultFilter.value = resultFilter.value === key ? 'all' : key; onLogSearch() }
function setResultFilter(v: AuditResultFilter) { resultFilter.value = v; onLogSearch() }
function onLogSearch() { logQuery.page = 1; loadLogs() }

/* ── 权限视图 ── */
const permLoading = ref(false)
const permRows    = ref<any[]>([])
const permTotal   = ref(0)
const permQuery   = reactive({ keyword: '', action: '', page: 1, pageSize: 20 })

async function loadPermView() {
  permLoading.value = true
  try {
    const res = await searchPermissionView({
      keyword:  permQuery.keyword || undefined,
      action:   permQuery.action  || undefined,
      page:     permQuery.page,
      pageSize: permQuery.pageSize,
    })
    permRows.value  = res.list  || []
    permTotal.value = res.total || 0
  } finally { permLoading.value = false }
}
function onPermSearch() { permQuery.page = 1; loadPermView() }

watch(tab, (t) => { if (t === 'perm' && permRows.value.length === 0) loadPermView() })

onMounted(() => Promise.all([loadLogs(), loadStatCounts()]))

/* ── 工具 ── */
function resultLabel(r: string) { return r === 'Allow' ? '通过' : r === 'Deny' ? '拒绝' : '异常' }
function resultTone(r: string): 'ok'|'deny'|'warn' { return r === 'Allow' ? 'ok' : r === 'Deny' ? 'deny' : 'warn' }
const METHOD_COLOR: Record<string, string> = { GET: 'var(--pc-ok)', POST: 'var(--pc-blue)', PUT: 'var(--pc-warn)', DELETE: 'var(--pc-deny)', PATCH: 'var(--pc-ink-60)' }
function methodColor(m?: string) { return METHOD_COLOR[m || ''] || 'var(--pc-ink-80)' }
function permColor(pc?: string) { return pc?.startsWith('menu:') ? 'var(--pc-blue)' : pc?.startsWith('button:') ? 'var(--pc-super)' : 'var(--pc-ink-80)' }
function fmtTime(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}
function timeAgo(iso: string) {
  if (!iso) return ''
  const diff = (Date.now() - new Date(iso).getTime()) / 60000
  if (diff < 1) return '刚刚'; if (diff < 60) return `${Math.floor(diff)} 分钟前`
  if (diff < 1440) return `${Math.floor(diff/60)} 小时前`; return `${Math.floor(diff/1440)} 天前`
}
</script>

<style scoped lang="scss">
.pc-page { max-width: 1240px; margin: 0 auto; padding: 30px 32px 80px; font-family: var(--pc-font-text); }

.audit-head { display: flex; align-items: center; gap: 16px; margin-bottom: 18px; flex-wrap: wrap; }

.segmented { display: inline-flex; background: #ececef; border-radius: 10px; padding: 3px; gap: 2px; }
.segmented__btn { padding: 7px 16px; font-size: 14px; border: none; border-radius: 8px; cursor: pointer; font-weight: 400; background: transparent; color: var(--pc-ink-60); font-family: var(--pc-font-text); transition: all 0.15s; &--active { background: #fff; color: var(--pc-ink); font-weight: 600; box-shadow: 0 1px 3px rgba(0,0,0,.12); } }

.scope-banner { display: flex; gap: 11px; align-items: flex-start; padding: 13px 16px; background: var(--pc-warn-wash); border: 1px solid #ecdcb0; border-radius: 12px; margin-bottom: 18px; }

.stat-cards { display: flex; gap: 14px; margin-bottom: 18px; }
.stat-card { flex: 1; padding: 16px 20px; display: flex; flex-direction: column; align-items: flex-start; gap: 8px; text-align: left; border: 1px solid var(--pc-hairline); border-radius: 16px; background: #fff; cursor: pointer; font-family: var(--pc-font-text); transition: border-color 0.15s, transform 0.08s; &:hover { transform: translateY(-1px); } &--active { background: var(--pc-parchment); } }

.filter-bar { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; flex-wrap: wrap; }

.log-table-wrap { padding: 0; overflow: hidden; }
.log-table-head { display: grid; grid-template-columns: 1.4fr 1.6fr 2fr 1.6fr 0.9fr; padding: 12px 22px; background: var(--pc-pearl); border-bottom: 1px solid var(--pc-hairline); font-size: 12px; font-weight: 600; color: var(--pc-ink-60); }
.log-row { display: grid; grid-template-columns: 1.4fr 1.6fr 2fr 1.6fr 0.9fr; padding: 12px 22px; align-items: center; }
.log-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 12px; flex-wrap: wrap; gap: 8px; }

.perm-table-head { display: grid; grid-template-columns: 2fr 1fr 1fr 2fr; padding: 12px 22px; background: var(--pc-pearl); border-bottom: 1px solid var(--pc-hairline); font-size: 12px; font-weight: 600; color: var(--pc-ink-60); }
.perm-row { display: grid; grid-template-columns: 2fr 1fr 1fr 2fr; padding: 13px 22px; align-items: center; }
</style>
