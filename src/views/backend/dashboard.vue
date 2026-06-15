<!--
  放置路径：src/views/backend/dashboard.vue
  完整替换 — 严格复刻原型 dashboard.jsx 的三视图结构。

  三个视图：
  1. gallery  项目画廊（默认，推荐）— 统计带 + 项目卡片网格（PROJ_TINT 背景色）+ 近期活动双列
  2. console  操作控制台 — 6 个快捷操作卡 + 需要关注 + 实时鉴权流
  3. metrics  指标视图 — 4 统计卡 + 系统总览列表 + 最近鉴权

  父组件（本文件）负责所有 API 调用，子视图只接收 props。
-->
<template>
  <main class="dash-page pc-anim-fade">

    <!-- ── 页头 ── -->
    <div class="dash-head">
      <div>
        <div class="dash-head__date">{{ todayText }}</div>
        <div class="dash-head__hero">{{ greeting }}，{{ adminInfo.username || '管理员' }}</div>
        <div class="dash-head__lead">
          统一权限中心 · 全局视图（<span class="dash-head__mono">__global__</span>）
        </div>
      </div>
      <div class="dash-head__right">
        <div class="dash-head__dir-label">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"/></svg>
          仪表盘方向
        </div>
        <!-- Segmented control -->
        <div class="segmented">
          <button
            v-for="d in DIRS" :key="d.value"
            class="segmented__btn"
            :class="{ 'segmented__btn--active': dir === d.value }"
            @click="dir = d.value"
          >{{ d.label }}</button>
        </div>
      </div>
    </div>

    <!-- 推荐提示（gallery 视图时显示） -->
    <div v-if="dir === 'gallery'" class="dash-tip">
      <span class="pc-badge pc-badge--blue pc-badge--sm">推荐方向</span>
      <span class="pc-t-cap" style="margin-left:10px">
        卡片优先、画廊式呈现 —— 最贴合 Apple 设计语言与"运营中心"定位。可在右上角切换对比其他方向。
      </span>
    </div>

    <!-- ── 视图切换区（key 触发 fade 动画） ── -->
    <div :key="dir" class="pc-anim-fade">

      <!-- ======== 视图 1：项目画廊 ======== -->
      <template v-if="dir === 'gallery'">
        <!-- 统计带 -->
        <div class="pc-card stat-ribbon">
          <div v-for="(r, i) in ribbonStats" :key="r.label" class="stat-ribbon__item" :style="i ? 'border-left:1px solid var(--pc-divider)' : ''">
            <div class="stat-ribbon__num">{{ r.value }}</div>
            <div class="pc-t-cap" style="margin-top:7px">{{ r.label }}</div>
          </div>
        </div>

        <!-- 项目卡片网格 -->
        <div class="project-grid">
          <RbacSpinner v-if="loading && !projectCards.length" style="grid-column:span 2" />
          <div
            v-for="(p, i) in projectCards" :key="p.code"
            class="gallery-tile"
            :style="galleryTileStyle(p.code, i)"
          >
            <div class="gallery-tile__top">
              <div>
                <div class="gallery-tile__code" :style="isGalleryTileDark(p.code, i) ? 'color:#aaa' : 'color:var(--pc-ink-60)'">
                  <span style="font-family:var(--pc-font-mono);font-size:12px">{{ p.code }}</span>
                </div>
                <div class="gallery-tile__name" :style="isGalleryTileDark(p.code, i) ? 'color:#fff' : 'color:var(--pc-ink)'">{{ p.label }}</div>
                <div class="gallery-tile__sub" :style="isGalleryTileDark(p.code, i) ? 'color:#bbb' : 'color:var(--pc-ink-60)'">{{ p.cn }}</div>
              </div>
              <RbacProjectGlyph :code="p.code" :name="p.label" :size="44" />
            </div>
            <div class="gallery-tile__metrics">
              <div class="gm">
                <div class="gm__num" :style="isGalleryTileDark(p.code, i) ? 'color:#fff' : 'color:var(--pc-ink)'">{{ p.users }}</div>
                <div class="gm__label" :style="isGalleryTileDark(p.code, i) ? 'color:#999' : 'color:var(--pc-ink-48)'">用户</div>
              </div>
              <div class="gm">
                <div class="gm__num" style="color:var(--pc-super)">{{ p.supers }}</div>
                <div class="gm__label" :style="isGalleryTileDark(p.code, i) ? 'color:#999' : 'color:var(--pc-ink-48)'">超管</div>
              </div>
              <div class="gm">
                <div class="gm__num" :style="isGalleryTileDark(p.code, i) ? 'color:#fff' : 'color:var(--pc-ink)'">{{ p.groups }}</div>
                <div class="gm__label" :style="isGalleryTileDark(p.code, i) ? 'color:#999' : 'color:var(--pc-ink-48)'">权限组</div>
              </div>
              <div style="margin-left:auto;align-self:flex-end">
                <button
                  class="gallery-tile__btn"
                  :style="isGalleryTileDark(p.code, i)
                    ? 'background:rgba(255,255,255,0.14);color:#fff'
                    : 'background:#fff;color:var(--pc-blue)'"
                  @click="go('/users', p.code)"
                >
                  授权
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                </button>
              </div>
            </div>
          </div>
          <el-empty
            v-if="!loading && projectCards.length === 0"
            class="pc-card pc-empty-state project-grid__empty"
            description="暂无 project 数据"
            :image-size="86"
          />
        </div>

        <!-- 近期活动双列 -->
        <div class="pc-card activity-card">
          <div class="section-head">
            <span class="pc-t-section">近期活动</span>
            <button class="btn-text-link" @click="go('/audit')">审计中心 →</button>
          </div>
          <hr class="pc-hr" />
          <div class="activity-grid">
            <el-empty
              v-if="!loading && auditRows.length === 0"
              class="pc-empty-state activity-grid__empty"
              description="暂无近期鉴权活动"
              :image-size="72"
            />
            <template v-else>
              <div
                v-for="(item, i) in auditRows.slice(0, 8)" :key="item.auditId"
                class="activity-row"
                :style="{ borderTop: '1px solid var(--pc-divider)' }"
              >
                <RbacAvatar :name="item.username || item.userid || '?'" :size="30" />
                <div class="activity-row__main">
                  <div class="activity-row__user">
                    <span style="font-size:13.5px;font-weight:600">{{ item.username || item.userid }}</span>
                    <span class="pc-t-cap" style="font-size:12px">{{ item.userid }}</span>
                  </div>
                  <div class="activity-row__route">
                    <b>{{ item.httpMethod || '-' }}</b> {{ item.route || item.permissionCode }}
                  </div>
                </div>
                <div class="activity-row__right">
                  <RbacBadge :tone="resultTone(item.result)" dot size="sm">{{ resultLabel(item.result) }}</RbacBadge>
                  <span class="pc-t-cap" style="font-size:11.5px">{{ timeAgo(item.createdAt) }}</span>
                </div>
              </div>
            </template>
          </div>
        </div>
      </template>

      <!-- ======== 视图 2：操作控制台 ======== -->
      <template v-else-if="dir === 'console'">
        <!-- 快捷操作 6 宫格 -->
        <div class="pc-t-cap-strong" style="margin-bottom:14px">快捷操作</div>
        <div class="scenario-grid">
          <button
            v-for="s in SCENARIOS" :key="s.key"
            class="scenario-card"
            @click="goScenario(s.key)"
          >
            <div class="scenario-card__top">
              <span class="scenario-card__icon" :style="{ background: s.bg, color: s.tone }">
                <component :is="s.iconComp" style="width:20px;height:20px" />
              </span>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--pc-ink-48)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </div>
            <div class="scenario-card__body">
              <div class="scenario-card__title">{{ s.title }}</div>
              <div class="scenario-card__desc">{{ s.desc }}</div>
            </div>
          </button>
        </div>

        <!-- 需要关注 + 实时鉴权流 -->
        <div class="console-bottom">
          <div class="pc-card" style="padding:18px 22px">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--pc-deny)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/></svg>
              <span class="pc-t-section">需要关注</span>
            </div>
            <div class="pc-t-cap" style="margin-bottom:10px">近期被拒绝或异常的鉴权请求</div>
            <hr class="pc-hr" />
            <el-empty
              v-if="!loading && attentionRows.length === 0"
              class="pc-empty-state pc-empty-state--compact"
              description="暂无异常鉴权"
              :image-size="64"
            />
            <template v-else>
              <div
                v-for="item in attentionRows" :key="item.auditId"
                class="activity-row" style="border-top:1px solid var(--pc-divider)"
              >
                <RbacAvatar :name="item.username || item.userid || '?'" :size="28" />
                <div class="activity-row__main">
                  <div class="activity-row__user">
                    <span style="font-size:13px;font-weight:600">{{ item.username || item.userid }}</span>
                  </div>
                  <div class="activity-row__route">
                    <b>{{ item.httpMethod || '-' }}</b> {{ item.permissionCode }}
                  </div>
                </div>
                <RbacBadge :tone="resultTone(item.result)" dot size="sm">{{ resultLabel(item.result) }}</RbacBadge>
              </div>
            </template>
            <button class="btn-neutral-full" @click="go('/audit')">打开审计中心</button>
          </div>

          <div class="pc-card" style="padding:18px 22px">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
              <span class="pc-t-section">实时鉴权流</span>
              <span class="pc-badge pc-badge--ok pc-badge--sm"><span class="pc-badge__dot"></span>实时</span>
            </div>
            <div class="pc-t-cap" style="margin-bottom:6px">GET /api/search/audit-logs</div>
            <hr class="pc-hr" />
            <el-empty
              v-if="!loading && auditRows.length === 0"
              class="pc-empty-state pc-empty-state--compact"
              description="暂无实时鉴权记录"
              :image-size="64"
            />
            <template v-else>
              <div
                v-for="item in auditRows.slice(0, 8)" :key="item.auditId"
                class="activity-row" style="border-top:1px solid var(--pc-divider)"
              >
                <RbacAvatar :name="item.username || item.userid || '?'" :size="28" />
                <div class="activity-row__main">
                  <div class="activity-row__user">
                    <span style="font-size:13px;font-weight:600">{{ item.username || item.userid }}</span>
                    <span class="pc-t-cap" style="font-size:11.5px">{{ item.userid }}</span>
                  </div>
                  <div class="activity-row__route">
                    <b>{{ item.httpMethod || '-' }}</b> {{ item.route || item.permissionCode }}
                  </div>
                </div>
                <div class="activity-row__right">
                  <RbacBadge :tone="resultTone(item.result)" dot size="sm">{{ resultLabel(item.result) }}</RbacBadge>
                  <span class="pc-t-cap" style="font-size:11.5px">{{ timeAgo(item.createdAt) }}</span>
                </div>
              </div>
            </template>
          </div>
        </div>
      </template>

      <!-- ======== 视图 3：指标视图 ======== -->
      <template v-else-if="dir === 'metrics'">
        <!-- 4 统计卡 -->
        <div class="metrics-stat-row">
          <div v-for="s in metricsStats" :key="s.label" class="pc-card metrics-stat-card">
            <div class="metrics-stat-card__head">
              <span class="pc-t-cap-strong">{{ s.label }}</span>
              <span :style="{ color: s.accent, display: 'flex' }">
                <component :is="s.iconComp" style="width:18px;height:18px" />
              </span>
            </div>
            <div class="metrics-stat-card__num">{{ s.value }}</div>
            <div class="pc-t-cap" style="margin-top:8px">{{ s.sub }}</div>
          </div>
        </div>

        <!-- 系统总览 + 最近鉴权 -->
        <div class="metrics-bottom">
          <div class="pc-card" style="padding:0;overflow:hidden">
            <div class="section-head" style="padding:18px 22px 14px">
              <span class="pc-t-section">系统总览</span>
              <button class="btn-text-link" @click="go('/projects')">授权管理 →</button>
            </div>
            <hr class="pc-hr" />
            <el-empty
              v-if="!loading && projectCards.length === 0"
              class="pc-empty-state pc-empty-state--compact"
              description="暂无系统数据"
              :image-size="72"
            />
            <template v-else>
              <div
                v-for="(p, i) in projectCards" :key="p.code"
                class="metrics-project-row"
                :style="{ borderTop: i ? '1px solid var(--pc-divider)' : 'none' }"
              >
                <RbacProjectGlyph :code="p.code" :name="p.label" :size="38" />
                <div style="flex:1;min-width:0">
                  <div style="font-weight:600;font-size:14.5px">{{ p.label }}</div>
                  <div class="pc-t-cap" style="margin-top:1px">
                    {{ p.cn }} · <span style="font-family:var(--pc-font-mono);font-size:12px">{{ p.code }}</span>
                  </div>
                </div>
                <div class="metrics-project-row__nums">
                  <div><div style="font-weight:600">{{ p.users }}</div><div class="pc-t-cap">用户</div></div>
                  <div><div style="font-weight:600;color:var(--pc-super)">{{ p.supers }}</div><div class="pc-t-cap">超管</div></div>
                  <div><div style="font-weight:600">{{ p.groups }}</div><div class="pc-t-cap">权限组</div></div>
                </div>
              </div>
            </template>
          </div>

          <div class="pc-card" style="padding:18px 22px">
            <div class="section-head" style="margin-bottom:6px">
              <span class="pc-t-section">最近鉴权</span>
              <button class="btn-text-link" @click="go('/audit')">全部</button>
            </div>
            <div class="pc-t-cap" style="margin-bottom:6px">来自审计日志的运行时鉴权结果</div>
            <hr class="pc-hr" />
            <el-empty
              v-if="!loading && auditRows.length === 0"
              class="pc-empty-state pc-empty-state--compact"
              description="暂无最近鉴权记录"
              :image-size="64"
            />
            <template v-else>
              <div
                v-for="item in auditRows.slice(0, 7)" :key="item.auditId"
                class="activity-row" style="border-top:1px solid var(--pc-divider)"
              >
                <RbacAvatar :name="item.username || item.userid || '?'" :size="28" />
                <div class="activity-row__main">
                  <div class="activity-row__user">
                    <span style="font-size:13px;font-weight:600">{{ item.username || item.userid }}</span>
                    <span class="pc-t-cap" style="font-size:11.5px">{{ item.userid }}</span>
                  </div>
                  <div class="activity-row__route">
                    <b>{{ item.httpMethod || '-' }}</b> {{ item.route || item.permissionCode }}
                  </div>
                </div>
                <div class="activity-row__right">
                  <RbacBadge :tone="resultTone(item.result)" dot size="sm">{{ resultLabel(item.result) }}</RbacBadge>
                  <span class="pc-t-cap" style="font-size:11.5px">{{ timeAgo(item.createdAt) }}</span>
                </div>
              </div>
            </template>
          </div>
        </div>
      </template>

    </div><!-- end view switch -->

    <!-- ── 接口来源脚注 ── -->
    <div style="margin-top:24px">
      <RbacApiSource
        :endpoints="[
          { m: 'GET', p: '/api/admin/index',           d: '当前管理员信息与可见菜单' },
          { m: 'GET', p: '/api/global/project/list',   d: '接入系统列表与计数' },
          { m: 'GET', p: '/api/global/user/list',      d: '管理员总数（total）' },
          { m: 'GET', p: '/api/global/group/list',     d: '权限组总数（total）' },
          { m: 'GET', p: '/api/global/menu/list',      d: '菜单与路由总数（total）' },
          { m: 'GET', p: '/api/search/audit-logs',     d: '近期鉴权活动与关注项' },
        ]"
        note="每个 project 的细分计数通过对各 list 接口传入 project 参数聚合得到。单一汇总统计接口为建议的未来扩展。"
      />
    </div>

  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  Grid, User, Key, Menu, OfficeBuilding, Star, Lock,
} from '@element-plus/icons-vue'
import router from '/@/router'
import { adminBaseRoutePath } from '/@/router/static/adminBase'
import { useAdminInfo } from '/@/stores/adminInfo'
import {
  getGlobalGroups, getGlobalMenus, getGlobalProjects,
  getGlobalUsers, searchAuditLogs,
  type AdminItem, type AuditLogItem, type GroupItem, type RuleItem,
} from '/@/api/backend/rbac'
import RbacAvatar       from '/@/components/rbac/RbacAvatar.vue'
import RbacBadge        from '/@/components/rbac/RbacBadge.vue'
import RbacProjectGlyph from '/@/components/rbac/RbacProjectGlyph.vue'
import RbacApiSource    from '/@/components/rbac/RbacApiSource.vue'
import RbacSpinner      from '/@/components/rbac/RbacSpinner.vue'

defineOptions({ name: 'dashboard' })

/* ── Admin info ── */
const adminInfo = useAdminInfo()

/* ── 视图切换 ── */
type DashboardDir = 'gallery' | 'console' | 'metrics'

const dir = ref<DashboardDir>('gallery')
const DIRS: Array<{ value: DashboardDir; label: string }> = [
  { value: 'gallery', label: '项目画廊' },
  { value: 'console', label: '操作控制台' },
  { value: 'metrics', label: '指标视图' },
]

/* ── 数据状态 ── */
const loading   = ref(false)
const projects  = ref<string[]>([])
const users     = ref<AdminItem[]>([])
const groups    = ref<GroupItem[]>([])
const menus     = ref<RuleItem[]>([])
const auditRows = ref<AuditLogItem[]>([])
const totals    = ref({ users: 0, groups: 0, menus: 0 })

/* ── 今日 & 问候 ── */
const todayText = new Date().toLocaleDateString('zh-CN', {
  year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
})
const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6)  return '凌晨好'
  if (h < 12) return '上午好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})

/* ── Project tint（对应 RbacProjectGlyph 内部色，用于 gallery tile 背景） ── */
const PROJ_BG: Record<string, string> = {
  portal:   '#e9f0fb',
  workflow: '#272729', // dark tile
  message:  '#eaf3ee',
  news:     '#f6efdc',
  quality:  '#efeaf7',
  rbac:     '#fbeae9',
}

const PROJECT_TILE_PALETTE = [
  { bg: '#e9f0fb', dark: false },
  { bg: '#eaf3ee', dark: false },
  { bg: '#f6efdc', dark: false },
  { bg: '#efeaf7', dark: false },
  { bg: '#fbeae9', dark: false },
  { bg: '#f5f5f7', dark: false },
  { bg: '#fafafc', dark: false },
  { bg: '#272729', dark: true },
  { bg: '#2a2a2c', dark: true },
  { bg: '#252527', dark: true },
]

/* ── Computed ── */
const ribbonStats = computed(() => [
  { label: '接入系统',   value: projects.value.length },
  { label: '管理员账号', value: fmtNum(totals.value.users || users.value.length) },
  { label: '权限组',     value: totals.value.groups || groups.value.length },
  { label: '菜单与路由', value: fmtNum(totals.value.menus || menus.value.length) },
])

const projectCards = computed(() =>
  projects.value.map((code) => ({
    code,
    label:  code,
    cn:     '',           // GlobalProjectListResult 只返回 code，无 cn；按需扩展
    users:  users.value.filter(u => u.projectCodes?.includes(code)).length,
    supers: users.value.filter(u => u.superProjects?.includes(code)).length,
    groups: groups.value.filter(g => g.project === code).length,
  }))
)

const attentionRows = computed(() =>
  auditRows.value.filter(a => a.result !== 'Allow').slice(0, 4)
)

const metricsStats = computed(() => [
  { label: '接入系统',   value: projects.value.length,                            sub: '全部业务 project',  accent: 'var(--pc-blue)',  iconComp: OfficeBuilding },
  { label: '管理员账号', value: fmtNum(totals.value.users || users.value.length), sub: '跨 project 去重',    accent: 'var(--pc-ok)',    iconComp: User     },
  { label: '权限组',     value: totals.value.groups || groups.value.length,       sub: '全部 project 合计',  accent: 'var(--pc-super)', iconComp: Key      },
  { label: '菜单与路由', value: fmtNum(totals.value.menus || menus.value.length), sub: '含按钮级规则',       accent: 'var(--pc-warn)',  iconComp: Menu     },
])

/* ── Console scenarios ── */
const SCENARIOS = [
  { key: 'grant',     title: '授权用户到多个系统', desc: '选择用户，一次性授予多个 project 访问', tone: 'var(--pc-blue)',  bg: 'var(--pc-blue-wash)',  iconComp: Key     },
  { key: 'super',     title: '提升 / 降级超管',    desc: '管理用户在 project 内的 super 标记',   tone: 'var(--pc-super)', bg: 'var(--pc-super-wash)', iconComp: Star    },
  { key: 'members',   title: '分配用户到权限组',    desc: '在指定 project 内增删权限组成员',      tone: 'var(--pc-ok)',    bg: 'var(--pc-ok-wash)',    iconComp: User    },
  { key: 'review',    title: '审查近期鉴权',        desc: '按结果筛选 Allow / Deny / Error',      tone: 'var(--pc-warn)',  bg: 'var(--pc-warn-wash)',  iconComp: Lock  },
  { key: 'crossview', title: '查看跨系统权限',      desc: '聚合用户在所有 project 的授权',        tone: 'var(--pc-ink-80)','bg': '#f0f0f2',            iconComp: Grid    },
  { key: 'menus',     title: '管理菜单与 API 权限', desc: '维护规则树与 API 映射',                tone: 'var(--pc-deny)',  bg: 'var(--pc-deny-wash)',  iconComp: Menu    },
]

/* ── Gallery tile 背景 ── */
function stablePaletteIndex(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

function galleryTileVisual(code: string, i: number) {
  const fixedBg = PROJ_BG[code]
  if (fixedBg) {
    return { bg: fixedBg, dark: fixedBg === '#272729' || fixedBg === '#2a2a2c' || fixedBg === '#252527' }
  }
  return PROJECT_TILE_PALETTE[stablePaletteIndex(`${code}:${i}`) % PROJECT_TILE_PALETTE.length]
}

function isGalleryTileDark(code: string, i: number) {
  return galleryTileVisual(code, i).dark
}

function galleryTileStyle(code: string, i: number) {
  const visual = galleryTileVisual(code, i)
  return {
    background: visual.bg,
    border: visual.dark ? '1px solid transparent' : '1px solid var(--pc-hairline)',
  }
}

/* ── Load ── */
onMounted(loadDashboard)

async function loadDashboard() {
  loading.value = true
  try {
    const [projectRes, userRes, groupRes, menuRes, auditRes] = await Promise.all([
      getGlobalProjects(),
      getGlobalUsers({ page: 1, pageSize: 100 }),
      getGlobalGroups({ page: 1, pageSize: 100 }),
      getGlobalMenus({ page: 1, pageSize: 100 }),
      searchAuditLogs({ page: 1, pageSize: 20 }),
    ])
    projects.value  = projectRes.list  || []
    users.value     = userRes.list     || []
    groups.value    = groupRes.list    || []
    menus.value     = menuRes.list     || []
    auditRows.value = auditRes.list    || []
    totals.value    = { users: userRes.total || 0, groups: groupRes.total || 0, menus: menuRes.total || 0 }
  } finally {
    loading.value = false
  }
}

/* ── Navigation ── */
function go(path: string, project?: string) {
  router.push({ path: `${adminBaseRoutePath}${path}`, query: project ? { project } : undefined })
}

function goScenario(key: string) {
  const map: Record<string, string> = {
    grant: '/projects', super: '/projects', members: '/groups',
    review: '/audit', crossview: '/users', menus: '/menus',
  }
  go(map[key] || '/')
}

/* ── Helpers ── */
function resultLabel(r: string) { return r === 'Allow' ? '通过' : r === 'Deny' ? '拒绝' : '异常' }
function resultTone(r: string): 'ok'|'deny'|'warn' { return r === 'Allow' ? 'ok' : r === 'Deny' ? 'deny' : 'warn' }
function fmtNum(n: number) { return (n || 0).toLocaleString('en-US') }
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
.dash-page {
  margin: 0 auto;
  padding: 30px 32px 80px;
  font-family: var(--pc-font-text);
  color: var(--pc-ink);
  letter-spacing: -0.01em;
}

/* ── 页头 ── */
.dash-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
}
.dash-head__date {
  font-size: 13px;
  font-weight: 600;
  color: var(--pc-blue);
  letter-spacing: 0.02em;
  text-transform: uppercase;
  margin-bottom: 8px;
}
.dash-head__hero {
  font-family: var(--pc-font-display);
  font-size: 40px;
  font-weight: 600;
  line-height: 1.07;
  letter-spacing: -0.02em;
}
.dash-head__lead {
  font-size: 19px;
  color: var(--pc-ink-60);
  margin-top: 6px;
}
.dash-head__mono {
  font-family: var(--pc-font-mono);
  font-size: 15px;
}
.dash-head__right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}
.dash-head__dir-label {
  font-size: 12px;
  color: var(--pc-ink-48);
  display: flex;
  align-items: center;
  gap: 6px;
}

/* ── Segmented control ── */
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
  font-family: var(--pc-font-text);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 400;
  background: transparent;
  color: var(--pc-ink-60);
  transition: all 0.15s ease;
  &--active {
    background: #fff;
    color: var(--pc-ink);
    font-weight: 600;
    box-shadow: 0 1px 3px rgba(0,0,0,0.12);
  }
}

/* ── 推荐提示 ── */
.dash-tip {
  display: flex;
  align-items: center;
  margin-bottom: 18px;
}

/* ── 统计带 ── */
.stat-ribbon {
  display: flex;
  padding: 20px 0;
  margin-bottom: 22px;
}
.stat-ribbon__item {
  flex: 1;
  padding: 0 26px;
}
.stat-ribbon__num {
  font-family: var(--pc-font-display);
  font-size: 32px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.018em;
}

/* ── 项目画廊网格 ── */
.project-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 22px;
}
.gallery-tile {
  border-radius: 22px;
  padding: 30px 32px;
  display: flex;
  flex-direction: column;
  gap: 22px;
  min-height: 220px;
  position: relative;
  overflow: hidden;
  transition: transform 0.12s ease;
  &:hover { transform: translateY(-2px); }
}
.gallery-tile__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}
.gallery-tile__code { margin-bottom: 8px; }
.gallery-tile__name {
  font-family: var(--pc-font-display);
  font-size: 27px;
  font-weight: 600;
  letter-spacing: -0.015em;
  line-height: 1.16;
}
.gallery-tile__sub { font-size: 15px; margin-top: 3px; }
.gallery-tile__metrics {
  display: flex;
  gap: 30px;
  margin-top: auto;
  align-items: flex-end;
}
.gallery-tile__btn {
  border: none;
  border-radius: 9999px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  transition: opacity 0.1s;
  &:hover { opacity: 0.85; }
}
.gm__num   { font-size: 26px; font-weight: 600; line-height: 1; }
.gm__label { font-size: 13px; margin-top: 5px; }

/* ── 近期活动 ── */
.activity-card { padding: 18px 22px; }
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.activity-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 40px;
  margin-top: 4px;
}
.activity-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 0;
}
.activity-row__main { flex: 1; min-width: 0; }
.activity-row__user { display: flex; align-items: center; gap: 7px; }
.activity-row__route {
  font-size: 13px;
  color: var(--pc-ink-48);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 2px;
  b { font-weight: 600; color: var(--pc-ink-60); margin-right: 3px; }
}
.activity-row__right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 3px;
  flex-shrink: 0;
}

/* ── Console ── */
.scenario-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-bottom: 22px;
}
.scenario-card {
  text-align: left;
  padding: 20px;
  border-radius: 18px;
  border: 1px solid var(--pc-hairline);
  background: #fff;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 14px;
  transition: border-color 0.15s, transform 0.08s;
  &:hover { border-color: #cdcdd2; transform: translateY(-1px); }
  &:active { transform: scale(0.98); }
}
.scenario-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.scenario-card__icon {
  width: 40px; height: 40px;
  border-radius: 11px;
  display: flex; align-items: center; justify-content: center;
}
.scenario-card__title {
  font-size: 15.5px;
  font-weight: 600;
  letter-spacing: -0.01em;
}
.scenario-card__desc {
  font-size: 13px;
  color: var(--pc-ink-48);
  margin-top: 4px;
  line-height: 1.4;
}
.console-bottom {
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 16px;
  align-items: start;
}
.btn-neutral-full {
  width: 100%;
  margin-top: 14px;
  padding: 8px 18px;
  border: 1px solid var(--pc-hairline);
  border-radius: var(--pc-r-pill);
  background: var(--pc-canvas);
  color: var(--pc-ink);
  font-size: 13px;
  cursor: pointer;
  font-family: var(--pc-font-text);
  &:hover { background: var(--pc-pearl); }
}

/* ── Metrics ── */
.metrics-stat-row {
  display: flex;
  gap: 16px;
  margin-bottom: 22px;
}
.metrics-stat-card {
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  flex: 1;
}
.metrics-stat-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.metrics-stat-card__num {
  font-family: var(--pc-font-display);
  font-size: 38px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.02em;
}
.metrics-bottom {
  display: grid;
  grid-template-columns: 1.55fr 1fr;
  gap: 16px;
  align-items: start;
}
.metrics-project-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 22px;
}
.metrics-project-row__nums {
  display: flex;
  gap: 26px;
  text-align: right;
}

/* ── 链接按钮 ── */
.btn-text-link {
  background: transparent;
  border: none;
  color: var(--pc-blue);
  font-size: 13px;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: var(--pc-r-xs);
  font-family: var(--pc-font-text);
  &:hover { background: var(--pc-blue-wash); }
}

/* ── 空态 ── */
.pc-empty-state {
  padding: 46px 24px;
  color: var(--pc-ink-48);
  background: var(--pc-canvas);
  text-align: center;
  :deep(.el-empty__image) {
    opacity: 0.54;
    filter: grayscale(0.2);
  }
  :deep(.el-empty__description) {
    margin-top: 12px;
  }
  :deep(.el-empty__description p) {
    color: var(--pc-ink-48);
    font-family: var(--pc-font-text);
    font-size: 14px;
    line-height: 1.43;
    letter-spacing: 0;
  }
}
.pc-empty-state--compact {
  padding: 30px 18px;
  background: transparent;
}
.project-grid__empty,
.activity-grid__empty {
  grid-column: 1 / -1;
}

/* ── 响应式 ── */
@media (max-width: 900px) {
  .stat-ribbon    { flex-wrap: wrap; }
  .stat-ribbon__item { flex: 1 1 40%; }
  .project-grid   { grid-template-columns: 1fr; }
  .activity-grid  { grid-template-columns: 1fr; }
  .scenario-grid  { grid-template-columns: 1fr 1fr; }
  .console-bottom,
  .metrics-bottom { grid-template-columns: 1fr; }
  .metrics-stat-row { flex-wrap: wrap; }
  .dash-head      { flex-direction: column; align-items: flex-start; }
}
</style>
