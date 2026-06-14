<template>
  <div class="flow-graph-wrap">

    <!-- ── 概览条 ── -->
    <div class="overview-bar">
      <div class="ov-item" v-for="s in overviewStats" :key="s.label">
        <span class="ov-dot" :style="{ background: s.color }"></span>
        <span class="ov-label">{{ s.label }}</span>
        <span class="ov-val" :style="{ color: s.color }">{{ s.val }}</span>
      </div>
      <div class="ov-divider" v-if="data?.hasRejectHistory"></div>
      <div class="ov-item ov-reject" v-if="data?.hasRejectHistory">
        <el-icon color="#f59e0b" :size="13"><Warning /></el-icon>
        <span>驳回回退 {{ data.rejectHistory?.length || 0 }} 次</span>
      </div>
      <!-- 图例 -->
      <div class="legend-group">
        <div class="legend-item" v-for="l in legend" :key="l.label">
          <span class="legend-badge"
            :style="{ background: l.fill, border: `1.5px solid ${l.stroke}`, color: l.text }"
          >A</span>
          <span class="legend-label">{{ l.label }}</span>
        </div>
      </div>
    </div>

    <!-- ── X6 画布区域 ── -->
    <div class="canvas-shell">
      <!-- Loading 骨架 -->
      <div v-if="loading" class="canvas-loading">
        <div class="loader-ring"></div>
        <span class="loader-text">正在加载流程图…</span>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="canvas-error">
        <el-icon :size="32" color="#e5e7eb"><CircleClose /></el-icon>
        <span>{{ error }}</span>
      </div>

      <!-- X6 容器 -->
      <div v-else ref="graphEl" class="graph-container"></div>

      <!-- 右下角工具栏 -->
      <div class="graph-toolbar" v-if="!loading && !error">
        <button class="tb-btn" title="放大" @click="zoomIn">
          <el-icon><ZoomIn /></el-icon>
        </button>
        <button class="tb-btn" title="缩小" @click="zoomOut">
          <el-icon><ZoomOut /></el-icon>
        </button>
        <button class="tb-btn" title="适应画布" @click="fitView">
          <el-icon><FullScreen /></el-icon>
        </button>
        <div class="tb-zoom-val">{{ Math.round(currentZoom * 100) }}%</div>
      </div>
    </div>

    <!-- ── 节点悬浮卡（Portal 挂在 body）── -->
    <Teleport to="body">
      <Transition name="node-card-fade">
        <div
          v-if="hoveredNode && nodeCard.visible"
          class="node-hover-card"
          :style="{ left: nodeCard.x + 'px', top: nodeCard.y + 'px' }"
          @mouseenter="keepCard"
          @mouseleave="hideCard"
        >
          <!-- 卡头：节点名 + 状态 -->
          <div class="nc-header" :style="{ borderTopColor: nodeCard.stateColor }">
            <div class="nc-title">{{ hoveredNode.label }}</div>
            <span class="nc-state-badge" :style="{ background: nodeCard.stateBg, color: nodeCard.stateColor }">
              {{ stateLabel(hoveredNode.state) }}
            </span>
          </div>

          <!-- 当前活动任务（active 节点）-->
          <template v-if="hoveredNode.state === 'active'">
            <div class="nc-section-title"><el-icon><Clock /></el-icon>当前处理人</div>
            <div
              v-for="t in getActiveTasks(hoveredNode.id)"
              :key="t.taskId"
              class="nc-assignee-row"
            >
              <div class="nc-avatar">{{ t.assignee?.[0] || '?' }}</div>
              <div class="nc-info">
                <div class="nc-name">{{ t.assignee }}</div>
                <div class="nc-meta">等待 {{ fmtWait(t.waitingSeconds) }}</div>
              </div>
              <div class="nc-status-dot nc-dot-pulse"></div>
            </div>
          </template>

          <!-- 已完成历史记录（completed / rejected）-->
          <template v-if="['completed', 'rejected'].includes(hoveredNode.state)">
            <div class="nc-section-title"><el-icon><Finished /></el-icon>审批记录</div>
            <div
              v-for="r in getNodeRecords(hoveredNode.id)"
              :key="r.taskId"
              class="nc-record-row"
            >
              <div class="nc-avatar" :style="{ background: outcomeAvatarBg(r.outcome) }">
                {{ r.assignee?.[0] || '?' }}
              </div>
              <div class="nc-info">
                <div class="nc-name">
                  {{ r.assignee }}
                  <span v-if="r.round > 1" class="nc-round-badge">第{{ r.round }}次</span>
                </div>
                <div class="nc-meta">{{ fmtDate(r.endTime) }} · {{ fmtDuration(r.durationSeconds) }}</div>
                <div v-if="r.rejectReason" class="nc-reject-reason">
                  <el-icon color="#f59e0b"><Warning /></el-icon>
                  {{ r.rejectReason }}
                </div>
              </div>
              <div class="nc-outcome-tag" :class="`outcome-${r.outcome}`">
                {{ outcomeLabel(r.outcome) }}
              </div>
            </div>
          </template>

          <!-- pending 节点 -->
          <template v-if="hoveredNode.state === 'pending'">
            <div class="nc-pending-hint">
              <el-icon color="#d1d5db"><Clock /></el-icon>
              <span>等待前序节点完成后流转</span>
            </div>
          </template>

          <!-- 会签标记 -->
          <div v-if="hoveredNode.isMultiInstance" class="nc-multi-badge">
            <el-icon><User /></el-icon> 会签节点
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── 驳回轨迹（有驳回时展示）── -->
    <template v-if="data?.hasRejectHistory">
      <div class="reject-track-header">
        <el-icon color="#f59e0b"><Warning /></el-icon>
        <span>驳回轨迹</span>
      </div>
      <div class="reject-track-list">
        <div
          v-for="rj in data.rejectHistory"
          :key="rj.rejectId"
          class="rj-row"
        >
          <div class="rj-from">
            <span class="rj-node-dot rj-dot-reject"></span>
            {{ rj.rejectNodeName }}
          </div>
          <div class="rj-arrow">
            <el-icon><ArrowLeft /></el-icon>
            <span class="rj-by">{{ rj.rejectBy }}</span>
          </div>
          <div class="rj-to">
            <span class="rj-node-dot rj-dot-target"></span>
            {{ rj.targetNodeName }}
          </div>
          <div class="rj-time">{{ fmtDate(rj.rejectTime) }}</div>
          <div class="rj-reason">{{ rj.rejectReason }}</div>
        </div>
      </div>
    </template>

  </div>
</template>

<script setup>
import {
  ref, computed, watch, onMounted, onBeforeUnmount, nextTick
} from 'vue'
import {
  Warning, CircleClose, ZoomIn, ZoomOut, FullScreen,
  Clock, Finished, User, ArrowLeft
} from '@element-plus/icons-vue'

// ── Props ──────────────────────────────────────────────────────────────
const props = defineProps({
  /** ProcessFlowRenderDto  */
  data: { type: Object, default: null },
  /** 是否正在加载（父组件控制）*/
  loading: { type: Boolean, default: false },
  /** 错误信息 */
  error:   { type: String,  default: '' },
})

// ── X6 实例 ────────────────────────────────────────────────────────────
const graphEl      = ref(null)
let   graph        = null
const currentZoom  = ref(1)

// ── 节点悬浮卡状态 ─────────────────────────────────────────────────────
const hoveredNode  = ref(null)
let   hideTimer    = null
const nodeCard     = ref({ visible: false, x: 0, y: 0, stateColor: '', stateBg: '' })

// ── 图例 ───────────────────────────────────────────────────────────────
const legend = [
  { label: '已完成', fill: '#d1fae5', stroke: '#34c759', text: '#065f46' },
  { label: '审批中', fill: '#dbeafe', stroke: '#007aff', text: '#1e40af' },
  { label: '有驳回', fill: '#fef3c7', stroke: '#f59e0b', text: '#92400e' },
  { label: '待流转', fill: '#f3f4f6', stroke: '#d1d5db', text: '#9ca3af' },
]

// 节点状态样式表
const STATE = {
  completed: { fill: '#d1fae5', stroke: '#34c759', text: '#065f46', bg: '#f0fdf4', color: '#34c759' },
  active:    { fill: '#dbeafe', stroke: '#007aff', text: '#1e40af', bg: '#eff6ff', color: '#007aff' },
  rejected:  { fill: '#fef3c7', stroke: '#f59e0b', text: '#92400e', bg: '#fffbeb', color: '#f59e0b' },
  pending:   { fill: '#f3f4f6', stroke: '#d1d5db', text: '#9ca3af', bg: '#f9fafb', color: '#d1d5db' },
  skipped:   { fill: '#f9fafb', stroke: '#e5e7eb', text: '#d1d5db', bg: '#f9fafb', color: '#e5e7eb' },
}
const EDGE = {
  walked:   { stroke: '#34c759', dash: 0,   width: 2   },
  active:   { stroke: '#007aff', dash: '6 3', width: 2.5 },
  pending:  { stroke: '#d1d5db', dash: '4 4', width: 1.5 },
  rejected: { stroke: '#f59e0b', dash: '6 3', width: 2   },
}

// ── 概览统计 ───────────────────────────────────────────────────────────
const overviewStats = computed(() => {
  if (!props.data) return []
  const nodes = props.data.nodes || []
  return [
    { label: '全部节点', val: nodes.filter(n => n.nodeType === 'userTask').length, color: '#6b7280' },
    { label: '已完成',   val: nodes.filter(n => n.state === 'completed').length,  color: '#34c759' },
    { label: '进行中',   val: nodes.filter(n => n.state === 'active').length,     color: '#007aff' },
    { label: '待流转',   val: nodes.filter(n => n.state === 'pending' && n.nodeType === 'userTask').length, color: '#d1d5db' },
  ]
})

// ── 数据辅助 ───────────────────────────────────────────────────────────
const getActiveTasks = (nodeId) =>
  (props.data?.activeTasks || []).filter(t => t.nodeId === nodeId)

const getNodeRecords = (nodeId) =>
  (props.data?.completedRecords || []).filter(r => r.nodeId === nodeId)

// ── 节点默认尺寸（与后端 BuildNode 默认值对齐）─────────────────────────
const NODE_SIZE = {
  userTask:         { w: 120, h: 60  },
  serviceTask:      { w: 120, h: 60  },
  startEvent:       { w: 36,  h: 36  },
  endEvent:         { w: 36,  h: 36  },
  parallelGateway:  { w: 40,  h: 40  },
  exclusiveGateway: { w: 40,  h: 40  },
  inclusiveGateway: { w: 40,  h: 40  },
}
const nodeSize = (nodeType) => NODE_SIZE[nodeType] || { w: 120, h: 60 }

// ── dagre 自动布局（X/Y 全为 null 时启用）────────────────────────────
//
// @antv/layout 1.x 已验证用法（Node.js 实测确认）：
//   1. 输入：@antv/graphlib 的 Graph 实例
//   2. nodeSize：函数返回「单个数字」(宽高最大值)，不接受数组/对象
//   3. 方法：execute(graph) → Promise<{ nodes[], edges[] }>
//   4. 坐标在 result.nodes[i].data.x / .data.y（中心点，需转左上角给 X6）
//   5. 驳回回退边（state=rejected）是反向边会产生环，布局前必须过滤掉
//
const applyDagreLayout = async (nodes, edges) => {
  const [{ DagreLayout }, { Graph }] = await Promise.all([
    import('@antv/layout'),
    import('@antv/graphlib'),
  ])

  // 驳回回退边是反向边 → dagre 遇到环会输出 NaN
  // 布局只传正向边；驳回边由 renderGraph 里的 addEdge 阶段正常渲染
  const forwardEdges = edges.filter(e => e.state !== 'rejected')

  // 预计算每个节点的尺寸（布局 + 后续渲染共用）
  const sizeMap = {}
  nodes.forEach(n => {
    const s = nodeSize(n.nodeType)
    const w = n.width  ?? s.w
    const h = n.height ?? s.h
    sizeMap[n.id] = { w, h, maxSide: Math.max(w, h) }
  })

  // 建图
  const g = new Graph({ nodes: [], edges: [] })
  nodes.forEach(n => g.addNode({ id: n.id, data: {} }))
  forwardEdges.forEach((e, i) => {
    try { g.addEdge({ id: e.id || `e_${i}`, source: e.source, target: e.target, data: {} }) }
    catch (_) { /* 忽略重复边或节点不存在的边 */ }
  })

  const layout = new DagreLayout({
    rankdir:  'LR',
    nodesep:  28,
    ranksep:  60,
    nodeSize: (node) => sizeMap[node.id]?.maxSide ?? 120,
  })

  const result = await layout.execute(g)

  // 建立 id → 坐标映射（中心点）
  const posMap = {}
  ;(result.nodes || []).forEach(n => { posMap[n.id] = n.data })

  // 转换为 X6 需要的左上角坐标
  return nodes.map(n => {
    const pos    = posMap[n.id]
    const { w, h } = sizeMap[n.id] || { w: 120, h: 60 }
    const cx = (pos?.x != null && !isNaN(pos.x)) ? pos.x : 0
    const cy = (pos?.y != null && !isNaN(pos.y)) ? pos.y : 0
    return { ...n, x: cx - w / 2, y: cy - h / 2, width: w, height: h }
  })
}

// ── X6 渲染 ────────────────────────────────────────────────────────────
const renderGraph = async () => {
  if (!graphEl.value || !props.data) return

  try {
    const { Graph } = await import('@antv/x6')

    // 销毁旧实例
    if (graph) { graph.dispose(); graph = null }

    const data  = props.data
    let   nodes = (data.nodes || []).map(n => ({ ...n }))  // 浅拷贝，避免污染 prop
    const edges = data.edges || []

    // ══ 双轨布局策略 ══════════════════════════════════════════════════
    //
    //  轨道 A：后端 DI 坐标有效（Flowable Modeler 画出的 BPMN）
    //    → 所有节点 X/Y 均有值，直接使用，100% 还原设计师排版
    //
    //  轨道 B：后端 DI 坐标缺失（纯代码部署的 BPMN，无 BPMNDiagram 段）
    //    → X/Y 全部为 null，调用 dagre 自动计算层次布局
    //
    //  判定：只要有任意一个用户任务节点 X == null，就走轨道 B
    //        （网关/事件节点可能在某些工具中也没有 DI，一并交给 dagre）
    // ══════════════════════════════════════════════════════════════════
    const needLayout = nodes.some(n => n.x == null)

    if (needLayout) {
      nodes = await applyDagreLayout(nodes, edges)
    } else {
      // 轨道 A：后端坐标已有值，补齐 width/height 以防万一
      nodes = nodes.map(n => {
        const s = nodeSize(n.nodeType)
        return {
          ...n,
          width:  n.width  ?? s.w,
          height: n.height ?? s.h,
        }
      })
    }

    // ── 计算画布尺寸（基于最终坐标）──────────────────────────────────
    const canvasW = Math.max(...nodes.map(n => (n.x || 0) + (n.width  || 120))) + 80
    const canvasH = Math.max(...nodes.map(n => (n.y || 0) + (n.height || 60)))  + 80

    graphEl.value.style.height = Math.max(canvasH, 240) + 'px'

    graph = new Graph({
      container:   graphEl.value,
      width:       Math.max(canvasW, 400),
      height:      Math.max(canvasH, 240),
      interacting: false,
      background:  { color: 'transparent' },
      grid:        { visible: false },
      panning:     { enabled: true },
      mousewheel:  { enabled: true, modifiers: ['ctrl', 'meta'] },
    })

    // ── 添加节点 ──────────────────────────────────────────────────────
    nodes.forEach(n => {
      const s         = STATE[n.state] || STATE.pending
      const isGateway = ['parallelGateway', 'exclusiveGateway', 'inclusiveGateway'].includes(n.nodeType)
      const isEvent   = n.nodeType === 'startEvent' || n.nodeType === 'endEvent'
      const w = n.width  || nodeSize(n.nodeType).w
      const h = n.height || nodeSize(n.nodeType).h
      const x = n.x || 0
      const y = n.y || 0

      graph.addNode({
        id:    n.id,
        x, y, width: w, height: h,
        shape: isEvent ? 'ellipse' : isGateway ? 'polygon' : 'rect',
        data:  n,   // 原始数据挂在 data，hover 时读取
        attrs: {
          body: {
            fill:        s.fill,
            stroke:      s.stroke,
            strokeWidth: n.state === 'active' ? 2.5 : 1.5,
            rx:          isEvent || isGateway ? 0 : 10,
            ry:          isEvent || isGateway ? 0 : 10,
            ...(isGateway ? {
              points: `${w/2},0 ${w},${h/2} ${w/2},${h} 0,${h/2}`,
            } : {}),
            ...(n.state === 'active' ? {
              filter: { name: 'dropShadow', args: { dx: 0, dy: 0, blur: 8, color: 'rgba(0,122,255,0.35)' } }
            } : {}),
          },
          label: {
            text:       isGateway ? (n.nodeType === 'exclusiveGateway' ? '×' : '+') : (n.label || ''),
            fill:       s.text,
            fontSize:   isGateway ? 14 : 12,
            fontWeight: n.state === 'active' ? 700 : 500,
            textWrap:   { width: w - 8, ellipsis: true },
          },
        },
      })

      // 会签角标
      if (n.isMultiInstance && !isGateway && !isEvent) {
        graph.addNode({
          id: n.id + '_mi_badge',
          x: x + w - 14, y: y - 8,
          width: 20, height: 16,
          shape: 'rect',
          attrs: {
            body:  { fill: '#fffbeb', stroke: '#f59e0b', strokeWidth: 1, rx: 4, ry: 4 },
            label: { text: '会签', fill: '#92400e', fontSize: 9, fontWeight: 700 },
          },
        })
      }
    })

    // ── 添加连线 ──────────────────────────────────────────────────────
    edges.forEach(e => {
      const s = EDGE[e.state] || EDGE.pending
      graph.addEdge({
        id:        e.id,
        source:    e.source,
        target:    e.target,
        router:    { name: 'manhattan', args: { padding: 12 } },
        connector: { name: 'rounded',   args: { radius: 8   } },
        attrs: {
          line: {
            stroke:          s.stroke,
            strokeWidth:     s.width,
            strokeDasharray: s.dash,
            targetMarker:    { name: 'block', size: 7, fill: s.stroke, stroke: 'none' },
          },
        },
        labels: e.label ? [{
          position: 0.5,
          attrs: {
            label: { text: e.label, fill: '#6b7280', fontSize: 11, fontWeight: 500 },
            rect:  { fill: '#fff', stroke: '#e5e7eb', strokeWidth: 1, rx: 4, ry: 4,
                     refWidth: 8, refHeight: 4, refX: -4, refY: -2 },
          }
        }] : [],
      })
    })

    // ── 适应视口 ──
    graph.centerContent()
    currentZoom.value = graph.zoom()

    // ── 绑定 hover 事件 ──
    graph.on('node:mouseenter', ({ node, e }) => {
      const d = node.getData()
      // 网关和事件节点不弹卡
      if (!d || d.nodeType === 'parallelGateway' || d.nodeType === 'exclusiveGateway'
          || d.nodeType === 'startEvent' || d.nodeType === 'endEvent'
          || d.id?.endsWith('_mi_badge')) return

      clearTimeout(hideTimer)
      hoveredNode.value = d

      // 计算卡片位置（鼠标右上方，自动避边）
      const vp     = graph.getGraphArea()
      const bbox   = node.getBBox()
      const pt     = graph.localToGraph(bbox.x + bbox.width, bbox.y)
      const rect   = graphEl.value.getBoundingClientRect()

      let cardX = rect.left + pt.x + 12
      let cardY = rect.top  + pt.y
      // 防止超出视口右边
      if (cardX + 300 > window.innerWidth) cardX = rect.left + pt.x - 300 - 12

      const st = STATE[d.state] || STATE.pending
      nodeCard.value = {
        visible:    true,
        x:          cardX,
        y:          cardY,
        stateColor: st.color,
        stateBg:    st.bg,
      }
    })

    graph.on('node:mouseleave', () => {
      startHideTimer()
    })

    graph.on('graph:mousewheel', () => {
      currentZoom.value = graph.zoom()
    })

  } catch (err) {
    console.error('[FlowGraph] X6 渲染失败', err)
  }
}

// ── 悬浮卡延迟隐藏 ─────────────────────────────────────────────────────
const startHideTimer = () => {
  hideTimer = setTimeout(() => {
    nodeCard.value.visible = false
    hoveredNode.value      = null
  }, 150)
}
const keepCard = () => { clearTimeout(hideTimer) }
const hideCard = () => { startHideTimer() }

// ── 工具栏操作 ──────────────────────────────────────────────────────────
const zoomIn  = () => { graph?.zoom(0.15); currentZoom.value = graph?.zoom() ?? 1 }
const zoomOut = () => { graph?.zoom(-0.15); currentZoom.value = graph?.zoom() ?? 1 }
const fitView = () => { graph?.centerContent(); currentZoom.value = graph?.zoom() ?? 1 }

// ── 工具函数 ───────────────────────────────────────────────────────────
const stateLabel = (s) => ({ completed: '已完成', active: '审批中', rejected: '有驳回', pending: '待流转', skipped: '已跳过' }[s] || s)
const outcomeLabel = (o) => ({ approved: '通过', rejected_terminate: '驳回终止', rejected_return: '驳回回退' }[o] || o)
const outcomeAvatarBg = (o) => ({ approved: 'linear-gradient(135deg,#34c759,#30d158)', rejected_terminate: 'linear-gradient(135deg,#ef4444,#f87171)', rejected_return: 'linear-gradient(135deg,#f59e0b,#fbbf24)' }[o] || '#e5e7eb')

const fmtDate = (dt) => {
  if (!dt) return '-'
  const d = new Date(dt)
  return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}
const fmtWait = (s) => {
  if (!s || s < 60)    return `${s || 0}秒`
  if (s < 3600)  return `${Math.floor(s/60)}分钟`
  if (s < 86400) return `${Math.floor(s/3600)}小时`
  return `${Math.floor(s/86400)}天`
}
const fmtDuration = (s) => {
  if (!s)        return '-'
  if (s < 60)    return `${s}秒`
  if (s < 3600)  return `${Math.floor(s/60)}分钟`
  if (s < 86400) return `${Math.floor(s/3600)}小时`
  return `${Math.floor(s/86400)}天`
}

// ── 监听数据变化重渲 ───────────────────────────────────────────────────
watch(() => props.data, async (v) => {
  if (!v) return
  await nextTick()
  renderGraph()
}, { immediate: false })

onMounted(async () => {
  if (props.data) {
    await nextTick()
    renderGraph()
  }
})

onBeforeUnmount(() => {
  clearTimeout(hideTimer)
  if (graph) { graph.dispose(); graph = null }
})
</script>

<style scoped>
/* ── 整体容器 ── */
.flow-graph-wrap {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ── 概览条 ── */
.overview-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px 20px;
  padding: 10px 16px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #f0f0f0;
  font-size: 13px;
}
.ov-item   { display: flex; align-items: center; gap: 6px; }
.ov-dot    { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.ov-label  { color: #888; white-space: nowrap; }
.ov-val    { font-weight: 700; font-size: 15px; line-height: 1; }
.ov-reject { color: #b45309; font-size: 12px; font-weight: 600; }
.ov-divider {
  width: 1px; height: 18px; background: #f0f0f0; margin: 0 4px;
}

/* 图例 */
.legend-group {
  display: flex; align-items: center; gap: 10px;
  margin-left: auto;
}
.legend-item  { display: flex; align-items: center; gap: 5px; font-size: 11px; color: #aaa; }
.legend-badge {
  display: inline-block;
  width: 22px; height: 16px;
  border-radius: 4px;
  font-size: 10px; font-weight: 700;
  text-align: center; line-height: 16px;
}

/* ── 画布外壳 ── */
.canvas-shell {
  position: relative;
  background: #fafafa;
  border-radius: 14px;
  border: 1px solid #ececec;
  overflow: hidden;
}

/* Loading */
.canvas-loading {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  height: 240px; gap: 16px;
}
.loader-ring {
  width: 36px; height: 36px;
  border: 3px solid #e5e7eb;
  border-top-color: #007aff;
  border-radius: 50%;
  animation: spin .8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.loader-text { font-size: 13px; color: #bbb; letter-spacing: .3px; }

/* Error */
.canvas-error {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  height: 240px; gap: 12px;
  font-size: 13px; color: #bbb;
}

/* X6 画布 */
.graph-container {
  min-height: 240px;
  width: 100%;
  cursor: grab;
}
.graph-container:active { cursor: grabbing; }

/* 右下角工具栏 */
.graph-toolbar {
  position: absolute;
  right: 14px; bottom: 14px;
  display: flex; align-items: center; gap: 4px;
  background: rgba(255,255,255,.92);
  backdrop-filter: blur(8px);
  border-radius: 10px;
  border: 1px solid #ececec;
  padding: 4px 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,.08);
}
.tb-btn {
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  border: none; background: transparent;
  cursor: pointer; border-radius: 6px;
  color: #555; font-size: 14px;
  transition: .15s;
}
.tb-btn:hover { background: #f0f0f0; color: #007aff; }
.tb-zoom-val {
  font-size: 11px; color: #888; min-width: 36px;
  text-align: center; font-family: 'SF Mono', Consolas, monospace;
}

/* ── 节点悬浮卡 ── */
.node-hover-card {
  position: fixed;
  z-index: 9999;
  width: 288px;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 8px 32px rgba(0,0,0,.14), 0 2px 8px rgba(0,0,0,.08);
  border: 1px solid #e8e8e8;
  overflow: hidden;
  pointer-events: auto;
}

.nc-header {
  padding: 12px 14px 10px;
  border-top: 3px solid #d1d5db;
  display: flex; align-items: flex-start; justify-content: space-between; gap: 8px;
}
.nc-title {
  font-size: 14px; font-weight: 700; color: #1a1a1a;
  line-height: 1.3; flex: 1;
}
.nc-state-badge {
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: 100px;
  font-size: 11px; font-weight: 600;
  white-space: nowrap;
}

.nc-section-title {
  display: flex; align-items: center; gap: 5px;
  padding: 6px 14px 4px;
  font-size: 11px; font-weight: 700; color: #999;
  letter-spacing: .4px; text-transform: uppercase;
  border-top: 1px solid #f5f5f5;
}

/* 活动任务处理人行 */
.nc-assignee-row {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 14px;
}
.nc-avatar {
  width: 32px; height: 32px; border-radius: 50%;
  background: linear-gradient(135deg, #007aff, #5b8fff);
  color: #fff; font-size: 13px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.nc-info { flex: 1; min-width: 0; }
.nc-name {
  font-size: 13px; font-weight: 600; color: #1a1a1a;
  display: flex; align-items: center; gap: 5px;
}
.nc-meta { font-size: 11px; color: #aaa; margin-top: 2px; }
.nc-round-badge {
  font-size: 10px; font-weight: 600; color: #f59e0b;
  background: #fffbeb; border: 1px solid #fde68a;
  border-radius: 4px; padding: 1px 4px; line-height: 1.4;
}
.nc-status-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: #007aff; flex-shrink: 0;
}
.nc-dot-pulse {
  animation: ncpulse 1.5s infinite;
}
@keyframes ncpulse {
  0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 0 rgba(0,122,255,.4); }
  50%       { opacity: .7; transform: scale(1.1); box-shadow: 0 0 0 4px rgba(0,122,255,0); }
}

/* 历史记录行 */
.nc-record-row {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 8px 14px;
  border-top: 1px solid #fafafa;
}
.nc-outcome-tag {
  flex-shrink: 0;
  align-self: flex-start;
  padding: 2px 7px;
  border-radius: 6px;
  font-size: 10px; font-weight: 700;
}
.outcome-approved          { background: #d1fae5; color: #065f46; }
.outcome-rejected_terminate { background: #fee2e2; color: #991b1b; }
.outcome-rejected_return    { background: #fef3c7; color: #92400e; }

.nc-reject-reason {
  display: flex; align-items: flex-start; gap: 4px;
  font-size: 11px; color: #b45309;
  background: #fffbeb; border-radius: 5px;
  padding: 4px 7px; margin-top: 4px;
  line-height: 1.5;
}

.nc-pending-hint {
  display: flex; align-items: center; gap: 6px;
  padding: 12px 14px;
  font-size: 12px; color: #bbb;
  border-top: 1px solid #f5f5f5;
}

.nc-multi-badge {
  display: flex; align-items: center; gap: 5px;
  padding: 6px 14px 10px;
  font-size: 11px; font-weight: 600; color: #b45309;
  border-top: 1px dashed #fde68a;
}

/* ── 过渡动画 ── */
.node-card-fade-enter-active { transition: opacity .15s, transform .15s; }
.node-card-fade-leave-active { transition: opacity .1s, transform .1s;  }
.node-card-fade-enter-from   { opacity: 0; transform: translateY(-4px) scale(.97); }
.node-card-fade-leave-to     { opacity: 0; transform: translateY(-4px) scale(.97); }

/* ── 驳回轨迹 ── */
.reject-track-header {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; font-weight: 700; color: #b45309;
  padding: 4px 2px;
}
.reject-track-list { display: flex; flex-direction: column; gap: 6px; }
.rj-row {
  display: flex; flex-wrap: wrap; align-items: center; gap: 6px 10px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 13px;
}
.rj-from, .rj-to {
  display: flex; align-items: center; gap: 6px;
  font-weight: 600;
}
.rj-node-dot {
  width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
}
.rj-dot-reject { background: #f59e0b; }
.rj-dot-target { background: #34c759; }
.rj-arrow {
  display: flex; align-items: center; gap: 4px;
  color: #f59e0b; font-size: 12px; font-weight: 600;
}
.rj-by {
  font-size: 11px;
  background: #fef3c7; border-radius: 4px;
  padding: 1px 6px; color: #92400e;
}
.rj-time  { font-size: 11px; color: #bbb; margin-left: auto; }
.rj-reason {
  width: 100%;
  font-size: 11px; color: #92400e;
  line-height: 1.5;
}
</style>