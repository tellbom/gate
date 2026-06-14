<template>
  <el-drawer
    v-model="drawerVisible"
    size="900px"
    direction="rtl"
    destroy-on-close
    class="avd-drawer"
  >
    <!-- ══ Header ══ -->
    <template #header>
      <div class="avd-header">
        <div class="avd-header-left">
          <div class="avd-icon"><el-icon><Document /></el-icon></div>
          <div class="avd-header-text">
            <div class="avd-title">{{ appInfo?.title || '申请详情' }}</div>
            <div class="avd-meta">
              <span>{{ appInfo?.applicant }}</span>
              <span v-if="appInfo?.department" class="avd-sep">·</span>
              <span v-if="appInfo?.department">{{ appInfo?.department }}</span>
              <span class="avd-sep">·</span>
              <span>{{ appInfo?.createdTime }}</span>
            </div>
          </div>
        </div>
        <el-tag
          :type="statusTagType(appInfo?.status)"
          size="large" round effect="plain"
          class="avd-status-tag"
        >
          <span class="avd-status-dot" :class="`dot-${appInfo?.status}`" />
          {{ statusLabel(appInfo?.status) }}
        </el-tag>
      </div>
    </template>

    <!-- ══ Body ══ -->
    <div class="avd-body">

      <!-- ── 流程图 ── -->
      <div class="avd-section-card">
        <div class="avd-section-title"><el-icon><Share /></el-icon>流程进度</div>
        <div class="avd-flow-wrap">
          <div v-if="flowLoading" class="avd-loading">
            <el-icon class="spin"><Loading /></el-icon>加载流程图…
          </div>
          <FlowGraph v-else-if="flowData" :data="flowData" class="avd-flow-graph" />
          <div v-else class="avd-empty-sm">暂无流程数据</div>
        </div>
      </div>

      <!-- ── 节点 Tabs ── -->
      <div class="avd-section-card avd-section-card--tabs">
        <div class="avd-section-title"><el-icon><List /></el-icon>各节点填写情况</div>

        <div v-if="nodesLoading || auditLoading" class="avd-loading">
          <el-icon class="spin"><Loading /></el-icon>加载节点信息…
        </div>

        <div v-else-if="!resolvedNodes.length" class="avd-empty">
          <el-icon><Tickets /></el-icon>
          <span>暂无节点数据</span>
        </div>

        <el-tabs v-else v-model="activeTab" class="avd-tabs" type="card">
          <el-tab-pane
            v-for="node in resolvedNodes"
            :key="node.nodeKey"
            :name="node.nodeKey"
          >
            <!-- ── Tab 标签 ── -->
            <template #label>
              <div class="tab-label">
                <span class="tab-dot" :class="node.completedAt ? 'dot-done' : 'dot-pending'" />
                <span>{{ node.nodeName }}</span>
                <span v-if="node.operator" class="tab-operator">{{ node.operator }}</span>
              </div>
            </template>

            <!-- ── Tab 内容 ── -->
            <div class="tab-content">

              <!-- 未完成：占位 -->
              <div v-if="!node.completedAt" class="snap-pending">
                <div class="sp-icon-wrap"><el-icon><Clock /></el-icon></div>
                <div class="sp-text">该节点尚未完成</div>
                <div class="sp-hint">流程当前正在此节点处理中</div>
              </div>

              <!-- 已完成 -->
              <template v-else>

                <!-- 信息条：操作人 + 时间 + 审批意见 -->
                <div class="snap-info-bar">
                  <div class="sib-item">
                    <el-icon><User /></el-icon>
                    <span>{{ node.operator }}</span>
                  </div>
                  <div class="sib-sep" />
                  <div class="sib-item">
                    <el-icon><Clock /></el-icon>
                    <span>{{ formatDate(node.completedAt) }}</span>
                  </div>
                  <template v-if="node.outcome">
                    <div class="sib-sep" />
                    <el-tag
                      :type="outcomeTagType(node.outcome)"
                      size="small" round effect="plain"
                    >{{ outcomeLabel(node.outcome) }}</el-tag>
                  </template>
                  <template v-if="node.approveComment">
                    <div class="sib-sep" />
                    <div class="sib-item sib-comment">
                      <el-icon><ChatDotRound /></el-icon>
                      <span>{{ node.approveComment }}</span>
                    </div>
                  </template>
                </div>

                <!-- 选人快照条（有 slotSelections 时展示） -->
                <div v-if="node.slotSelections?.length" class="slot-snapshot-bar">
                  <div
                    v-for="s in node.slotSelections"
                    :key="s.slotKey"
                    class="slot-snapshot-row"
                  >
                    <span class="slot-label">{{ s.label || s.slotKey }}</span>
                    <span class="slot-users">{{ s.users.join('、') }}</span>
                  </div>
                </div>

                <!-- iframe 区域 -->
                <div class="node-iframe-wrap">
                  <!-- 加载中遮罩 -->
                  <div
                    v-if="iframeLoadingMap[node.nodeKey]"
                    class="node-iframe-loading"
                  >
                    <el-icon class="spin"><Loading /></el-icon>
                    <span>加载历史表单…</span>
                  </div>

                  <!-- 有只读 URL：渲染 iframe -->
                  <iframe
                    v-if="buildReadonlyUrl(node)"
                    :key="`${node.nodeKey}-${iframeRetryMap[node.nodeKey] ?? 0}`"
                    :src="buildReadonlyUrl(node)"
                    class="node-iframe"
                    :class="{ 'iframe-hidden': iframeLoadingMap[node.nodeKey] }"
                    frameborder="0"
                    @load="onIframeLoad(node.nodeKey)"
                    @error="onIframeError(node.nodeKey)"
                  />

                  <!-- 无 URL（pageCode 非 http）：纯信息展示，不渲染 iframe -->
                  <IframeErrorFallback
                    v-else-if="iframeErrorMap[node.nodeKey]"
                    title="历史表单加载失败"
                    desc="该节点历史表单暂时无法加载"
                    :show-retry="true"
                    @retry="retryIframe(node)"
                  />

                  <!-- pageCode 非 URL：不展示 iframe，信息条已足够 -->
                  <div
                    v-else-if="!buildReadonlyUrl(node)"
                    class="avd-empty-sm"
                  >
                    该节点无历史业务表单
                  </div>
                </div>

              </template>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>

    </div>
  </el-drawer>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import {
  Document, Share, List, Loading, Tickets,
  User, Clock, ChatDotRound,
} from '@element-plus/icons-vue'
import FlowGraph           from './Flowgraph.vue'
import IframeErrorFallback from './IframeErrorFallback.vue'
import { getAuditHistory } from '/@/api/workflow/processApi'
import {
  statusTagType, statusLabel,
  outcomeTagType, outcomeLabel,
  formatDate,
} from '/@/workflow-shared/workflowUtils.js'

// ── Props ──────────────────────────────────────────────────────
const props = defineProps({
  modelValue:   { type: Boolean, default: false  },
  /**
   * appInfo — 申请基本信息
   *   { businessId, title, applicant, department?, createdTime, status }
   */
  appInfo:      { type: Object,  default: null   },
  flowData:     { type: Object,  default: null   },
  flowLoading:  { type: Boolean, default: false  },
  /**
   * nodes — 由父组件（MyApplication.openViewDrawer）传入
   * 结构：{
   *   nodeKey:       string       taskDefinitionKey（含 __round{n} 后缀区分多轮）
   *   nodeName:      string
   *   nodeSemantic:  string
   *   operator:      string       工号
   *   completedAt:   string|null  ISO 时间，null=未完成
   *   approveComment:string|null
   *   pageCode:      string|null  AuditRecordDto.PageCode 快照
   *   slotSelections: SlotSelectionRecordDto[]
   *   outcome:       string       'approved'|'rejected_return'|'rejected_terminate'
   *   round:         number
   * }
   */
  nodes:        { type: Array,   default: () => [] },
  nodesLoading: { type: Boolean, default: false  },
})

const emit = defineEmits(['update:modelValue'])

const drawerVisible = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v),
})

// ══════════════════════════════════════════════════════════════
//  审批历史补全
//  progress 接口的 auditHistory 已包含 pageCode / slotSelections，
//  但 nodeName 仅为 taskDefinitionKey。
//  audit-history 接口返回的也是同一结构，
//  此处懒加载用于补全 nodes 中父组件未映射的字段。
// ══════════════════════════════════════════════════════════════

const auditHistoryMap = ref({})   // taskDefinitionKey → AuditRecordDto（最新轮）
const auditLoading    = ref(false)

async function loadAuditHistory(businessId) {
  if (!businessId) return
  auditLoading.value = true
  try {
    const items = await getAuditHistory(businessId)
    const map = {}
    ;(items ?? []).forEach(item => {
      const key = item.taskDefinitionKey
      // 同一节点多轮取操作时间最新的一条
      if (!map[key] || item.operatedAt > map[key].operatedAt) {
        map[key] = item
      }
    })
    auditHistoryMap.value = map
  } catch { /* 失败不影响基础展示 */ } finally {
    auditLoading.value = false
  }
}

// ══════════════════════════════════════════════════════════════
//  resolvedNodes — 合并 props.nodes + auditHistoryMap
// ══════════════════════════════════════════════════════════════

const resolvedNodes = computed(() => {
  return (props.nodes ?? []).map(node => {
    // 去掉 __round{n} 后缀还原基础 key，用于查 auditHistoryMap
    const baseKey = node.nodeKey.split('__round')[0]
    const hist    = auditHistoryMap.value[baseKey]

    return {
      ...node,
      // pageCode 优先用父组件传入，audit-history 补全
      pageCode:      node.pageCode      ?? hist?.pageCode      ?? null,
      // slotSelections 同上
      slotSelections: node.slotSelections?.length
        ? node.slotSelections
        : (hist?.slotSelections ?? []),
      // outcome / approveComment 同上
      outcome: node.outcome ?? (
        hist?.action === 'approve'
          ? 'approved'
          : hist?.action === 'reject'
            ? 'rejected_terminate'
            : ''
      ),
      approveComment: node.approveComment ?? hist?.comment ?? null,
    }
  })
})

// ══════════════════════════════════════════════════════════════
//  历史节点只读 iframe URL 构造
//  规则：
//    pageCode 是 http/https URL → 追加上下文参数
//    pageCode 不是 URL          → 返回 null（不渲染 iframe）
// ══════════════════════════════════════════════════════════════

function buildReadonlyUrl(node) {
  const pageCode = node.pageCode
  if (!pageCode?.startsWith('http')) return null

  try {
    const url = new URL(pageCode)
    // 基础上下文参数
    url.searchParams.set('businessId',        props.appInfo?.businessId ?? '')
    url.searchParams.set('taskDefinitionKey', node.nodeKey.split('__round')[0])
    url.searchParams.set('mode',              'readonly')
    // 可选补充：操作轮次、操作人，业务系统可用于定位历史快照
    if (node.round > 1) url.searchParams.set('round', String(node.round))
    if (node.operator)  url.searchParams.set('operatorId', node.operator)
    return url.toString()
  } catch {
    return null   // URL 格式异常时降级
  }
}

// ══════════════════════════════════════════════════════════════
//  iframe 加载状态管理（按 nodeKey 独立跟踪）
// ══════════════════════════════════════════════════════════════

const iframeLoadingMap = ref({})  // nodeKey → boolean（加载中）
const iframeErrorMap   = ref({})  // nodeKey → boolean（加载失败）
const iframeRetryMap   = ref({})  // nodeKey → number（重试计数，触发 URL 重算）
const activeTab        = ref('')

// Tab 切换时初始化该节点 iframe 状态
watch(activeTab, (nodeKey) => {
  if (!nodeKey) return
  const node = resolvedNodes.value.find(n => n.nodeKey === nodeKey)
  if (!node?.completedAt || !buildReadonlyUrl(node)) return
  // 仅在首次激活时设置 loading，避免重复切换闪烁
  if (iframeLoadingMap.value[nodeKey] === undefined) {
    iframeLoadingMap.value = { ...iframeLoadingMap.value, [nodeKey]: true }
    iframeErrorMap.value   = { ...iframeErrorMap.value,   [nodeKey]: false }
  }
})

function onIframeLoad(nodeKey) {
  iframeLoadingMap.value = { ...iframeLoadingMap.value, [nodeKey]: false }
  iframeErrorMap.value   = { ...iframeErrorMap.value,   [nodeKey]: false }
}

function onIframeError(nodeKey) {
  iframeLoadingMap.value = { ...iframeLoadingMap.value, [nodeKey]: false }
  iframeErrorMap.value   = { ...iframeErrorMap.value,   [nodeKey]: true  }
}

function retryIframe(node) {
  const key = node.nodeKey
  iframeErrorMap.value   = { ...iframeErrorMap.value,   [key]: false }
  iframeLoadingMap.value = { ...iframeLoadingMap.value, [key]: true  }
  iframeRetryMap.value   = { ...iframeRetryMap.value,   [key]: (iframeRetryMap.value[key] ?? 0) + 1 }
}

// ══════════════════════════════════════════════════════════════
//  默认激活第一个已完成节点
// ══════════════════════════════════════════════════════════════

watch(
  () => [props.modelValue, resolvedNodes.value],
  ([visible, list]) => {
    if (!visible || !list?.length) return
    const first = list.find(n => n.completedAt) ?? list[0]
    if (first) activeTab.value = first.nodeKey
  },
  { immediate: true, deep: true }
)

// ══════════════════════════════════════════════════════════════
//  监听抽屉打开：加载 auditHistory
// ══════════════════════════════════════════════════════════════

watch(
  () => [props.modelValue, props.appInfo?.businessId],
  ([visible, businessId]) => {
    if (visible && businessId) {
      auditHistoryMap.value = {}
      loadAuditHistory(businessId)
    }
  },
  { immediate: true }
)

// ══════════════════════════════════════════════════════════════
//  抽屉关闭：重置所有状态
// ══════════════════════════════════════════════════════════════

watch(() => props.modelValue, (visible) => {
  if (!visible) {
    activeTab.value       = ''
    auditHistoryMap.value = {}
    iframeLoadingMap.value = {}
    iframeErrorMap.value   = {}
    iframeRetryMap.value   = {}
  }
})
</script>

<!-- ── 全局：Drawer 布局约束 ── -->
<style>
.avd-drawer {
  top: 48px !important;
  height: calc(100% - 48px) !important;
}
</style>

<style scoped>
/* ── Drawer 结构 ── */
:deep(.avd-drawer .el-drawer__header) {
  padding: 0; margin: 0;
  border-bottom: 1px solid var(--wf-divider);
}
:deep(.avd-drawer .el-drawer__body) {
  padding: 0;
  background: var(--wf-bg);
  overflow-y: auto;
}

/* ── Header ── */
.avd-header {
  display: flex; align-items: center; justify-content: space-between;
  gap: var(--wf-space-16); padding: 14px 20px; background: var(--wf-canvas);
}
.avd-header-left { display: flex; align-items: center; gap: var(--wf-space-12); min-width: 0; }
.avd-header-text { min-width: 0; }
.avd-icon {
  width: 40px; height: 40px; border-radius: var(--wf-radius-md);
  background: var(--wf-primary-light); display: flex; align-items: center;
  justify-content: center; flex-shrink: 0;
}
.avd-icon .el-icon        { font-size: 18px; color: var(--wf-primary); }
.avd-title                { font-size: var(--wf-font-lg); font-weight: var(--wf-font-weight-bold); color: var(--wf-ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.avd-meta                 { display: flex; align-items: center; flex-wrap: wrap; gap: var(--wf-space-4); font-size: var(--wf-font-sm); color: var(--wf-ink-3); margin-top: 2px; }
.avd-sep                  { color: var(--wf-border); }
.avd-status-tag           { flex-shrink: 0; }

/* 状态 / Tab 圆点 */
.avd-status-dot, .tab-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; margin-right: 5px; vertical-align: middle; }
.dot-running              { background: var(--wf-status-running); }
.dot-completed, .dot-done { background: var(--wf-success);  }
.dot-terminated, .dot-pending { background: var(--wf-neutral); }

/* ── Body ── */
.avd-body { display: flex; flex-direction: column; gap: var(--wf-space-12); padding: var(--wf-space-16); }

/* ── Section 卡片 ── */
.avd-section-card { background: var(--wf-canvas); border-radius: var(--wf-radius-lg); padding: var(--wf-space-16); box-shadow: var(--wf-shadow-card); }

/* 节点 Tab 卡片无底部 padding，让 iframe 能紧贴卡片底边 */
.avd-section-card--tabs { padding-bottom: 0; overflow: hidden; }

.avd-section-title { display: flex; align-items: center; gap: var(--wf-space-6); font-size: var(--wf-font-base); font-weight: var(--wf-font-weight-bold); color: var(--wf-ink-2); margin-bottom: 10px; }
.avd-section-title .el-icon { font-size: 14px; color: var(--wf-primary); }

/* ── 流程图 ── */
.avd-flow-wrap  { min-height: 120px; display: flex; align-items: center; justify-content: center; }
.avd-flow-graph { width: 100%; }

/* ── Tabs ── */
.avd-tabs { --el-color-primary: var(--wf-primary); }
:deep(.avd-tabs .el-tabs__header)               { margin-bottom: 0; overflow: hidden; }
:deep(.avd-tabs .el-tabs__nav-wrap)             { overflow: hidden; }
:deep(.avd-tabs .el-tabs__nav-wrap::after)      { display: none; }
:deep(.avd-tabs .el-tabs__nav-scroll)           { overflow-x: auto; overflow-y: hidden; scrollbar-width: thin; scrollbar-color: var(--wf-border) transparent; }
:deep(.avd-tabs .el-tabs__nav-scroll::-webkit-scrollbar)       { height: 3px; }
:deep(.avd-tabs .el-tabs__nav-scroll::-webkit-scrollbar-thumb) { background: var(--wf-border); border-radius: 2px; }
:deep(.avd-tabs.el-tabs--card .el-tabs__nav)   { border-color: var(--wf-border); border-radius: var(--wf-radius-sm) var(--wf-radius-sm) 0 0; white-space: nowrap; float: none; display: inline-flex; }
:deep(.avd-tabs.el-tabs--card .el-tabs__item)  { border-color: var(--wf-border); font-size: var(--wf-font-base); padding: 0 16px; height: 40px; line-height: 40px; color: var(--wf-ink-2); transition: background var(--wf-transition-fast), color var(--wf-transition-fast); flex-shrink: 0; }
:deep(.avd-tabs.el-tabs--card .el-tabs__item.is-active)        { background: var(--wf-primary-light); color: var(--wf-primary); border-bottom-color: var(--wf-primary-light); font-weight: var(--wf-font-weight-semibold); }
:deep(.avd-tabs.el-tabs--card .el-tabs__item:hover:not(.is-active)) { color: var(--wf-primary); background: var(--wf-bg); }

.tab-label    { display: flex; align-items: center; gap: 5px; white-space: nowrap; }
.tab-operator { font-size: var(--wf-font-xs); color: var(--wf-ink-3); background: var(--wf-bg-section); padding: 1px 6px; border-radius: var(--wf-radius-pill); }
:deep(.avd-tabs.el-tabs--card .el-tabs__item.is-active .tab-operator) { background: var(--wf-primary-light); color: var(--wf-primary); }

/* ── Tab 内容区 ── */
.tab-content { border: 1px solid var(--wf-border); border-top: none; border-radius: 0 0 var(--wf-radius-sm) var(--wf-radius-sm); background: var(--wf-canvas); overflow: hidden; }

/* ── 信息条 ── */
.snap-info-bar { display: flex; align-items: center; flex-wrap: wrap; gap: var(--wf-space-4); padding: 10px 16px; background: var(--wf-bg-section); border-bottom: 1px solid var(--wf-divider); font-size: var(--wf-font-sm); color: var(--wf-ink-2); }
.sib-item          { display: flex; align-items: center; gap: var(--wf-space-4); }
.sib-item .el-icon { font-size: 13px; color: var(--wf-ink-3); }
.sib-sep           { width: 1px; height: 12px; background: var(--wf-border); margin: 0 var(--wf-space-4); }
.sib-comment       { flex: 1; min-width: 0; font-style: italic; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* ── 选人快照条 ── */
.slot-snapshot-bar { display: flex; flex-wrap: wrap; gap: var(--wf-space-4) var(--wf-space-20); padding: 8px 16px; background: var(--wf-bg); border-bottom: 1px solid var(--wf-divider); }
.slot-snapshot-row { display: flex; align-items: center; gap: var(--wf-space-8); font-size: var(--wf-font-sm); }
.slot-label        { color: var(--wf-ink-3); white-space: nowrap; }
.slot-users        { color: var(--wf-ink); font-weight: var(--wf-font-weight-medium); }

/* ── 节点 iframe 容器 ── */
.node-iframe-wrap {
  position: relative;
  width: 100%;
  /* 高度：600px 覆盖绝大多数业务表单；
     如业务系统表单较长，可改为 min-height: 400px + resize: vertical 让用户自行调整 */
  height: 600px;
  background: var(--wf-bg);
}

.node-iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
  background: var(--wf-canvas);
}

.node-iframe.iframe-hidden {
  visibility: hidden;
  position: absolute;
}

.node-iframe-loading {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--wf-space-12);
  background: var(--wf-bg);
  font-size: var(--wf-font-base);
  color: var(--wf-ink-3);
  z-index: 10;
}

/* ── 未完成占位 ── */
.snap-pending { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--wf-space-8); padding: var(--wf-space-48) var(--wf-space-20); }
.sp-icon-wrap { width: 52px; height: 52px; border-radius: 50%; background: var(--wf-bg-section); display: flex; align-items: center; justify-content: center; }
.sp-icon-wrap .el-icon { font-size: 24px; color: var(--wf-ink-disabled); }
.sp-text { font-size: var(--wf-font-md); font-weight: var(--wf-font-weight-semibold); color: var(--wf-ink-2); }
.sp-hint { font-size: var(--wf-font-sm); color: var(--wf-ink-3); }

/* ── 通用 ── */
.avd-loading  { display: flex; align-items: center; justify-content: center; gap: var(--wf-space-8); padding: var(--wf-space-32); font-size: var(--wf-font-base); color: var(--wf-ink-3); }
.avd-empty    { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: var(--wf-space-48); font-size: var(--wf-font-base); color: var(--wf-ink-disabled); }
.avd-empty .el-icon { font-size: 32px; }
.avd-empty-sm { font-size: var(--wf-font-base); color: var(--wf-ink-disabled); padding: var(--wf-space-20); text-align: center; }
.spin { animation: rotate 0.7s linear infinite; }
@keyframes rotate { to { transform: rotate(360deg); } }
</style>
