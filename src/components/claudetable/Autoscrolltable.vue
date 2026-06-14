<template>
  <div class="ast" ref="wrapRef">
    <!-- 空状态 -->
    <div v-if="!data || data.length === 0" class="ast-empty">
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="4" y="8" width="24" height="18" rx="2" stroke="#c8cdd6" stroke-width="1.5"/>
        <path d="M4 13h24" stroke="#c8cdd6" stroke-width="1.5"/>
        <path d="M10 19h12M10 23h8" stroke="#c8cdd6" stroke-width="1.2" stroke-linecap="round"/>
      </svg>
      <span>暂无数据</span>
    </div>

    <template v-else>
      <!-- 表头 -->
      <div class="ast-head">
        <span
          v-for="col in columns"
          :key="col.prop"
          class="ast-th"
          :style="colStyle(col)"
        >{{ col.label }}</span>
      </div>

      <!--
        滚动容器
        - 自动模式：overflow:hidden，RAF 推进 translateY
        - 暂停模式：overflow:auto，用户自由滚动，RAF 停止
        鼠标进入/离开切换模式，离开时把 scrollTop 同步回 offset
      -->
      <div
        class="ast-viewport"
        ref="viewportRef"
        @mouseenter="onEnter"
        @mouseleave="onLeave"
      >
        <div class="ast-track" ref="trackRef">
          <!-- 渲染两份，首尾无缝衔接；数据少时只渲染一份（不需要滚动） -->
          <template v-for="pass in needLoop ? 2 : 1" :key="pass">
            <div
              v-for="(row, i) in data"
              :key="pass + '-' + i"
              class="ast-row"
              :class="i % 2 === 1 ? 'ast-row--alt' : ''"
              :style="{ height: rowHeight + 'px' }"
            >
              <span
                v-for="col in columns"
                :key="col.prop"
                class="ast-td"
                :style="colStyle(col)"
              >
                <slot :name="col.prop" :row="row" :index="i">
                  {{ row[col.prop] ?? '—' }}
                </slot>
              </span>
            </div>
          </template>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'

const props = defineProps({
  columns:   { type: Array,  required: true },
  data:      { type: Array,  default: () => [] },
  speed:     { type: Number, default: 40 },   // px/s
  rowHeight: { type: Number, default: 38 },   // px
})

const wrapRef     = ref(null)
const viewportRef = ref(null)
const trackRef    = ref(null)

// 数据行数足够多才需要循环（少于可视区行数时不滚动）
const needLoop = computed(() => {
  if (!wrapRef.value || props.data.length === 0) return false
  const viewH = wrapRef.value.clientHeight - 32 // 减去表头高度
  return props.data.length * props.rowHeight > viewH
})

// ── 滚动状态 ──────────────────────────────────────────────────
let raf    = null
let offset = 0      // 当前 translateY，px
let paused = false
let lastTs = null

const singleH = () => props.data.length * props.rowHeight

function step(ts) {
  if (!paused && trackRef.value && needLoop.value) {
    if (lastTs !== null) {
      const delta = (ts - lastTs) / 1000
      offset += props.speed * delta
      const sh = singleH()
      if (sh > 0 && offset >= sh) offset -= sh
      trackRef.value.style.transform = `translateY(-${offset}px)`
    }
    lastTs = ts
  } else {
    lastTs = null
  }
  raf = requestAnimationFrame(step)
}

// ── 鼠标进入：停 RAF，开放 viewport 滚动 ──────────────────────
function onEnter() {
  if (!needLoop.value) return
  paused = true
  lastTs = null
  // 取消当前动画帧，防止继续推进 translateY
  if (raf) { cancelAnimationFrame(raf); raf = null }
  if (viewportRef.value) {
    // 把 transform 偏移转换成 scrollTop，让用户手动滚动时位置连续
    viewportRef.value.style.overflowY = 'auto'
    viewportRef.value.scrollTop = offset
    trackRef.value.style.transform = 'translateY(0)'
  }
}

// ── 鼠标离开：同步位置，恢复 RAF ──────────────────────────────
function onLeave() {
  if (!needLoop.value) return
  if (viewportRef.value) {
    // 把用户手动滚动的位置同步回 offset
    offset = viewportRef.value.scrollTop % singleH()
    viewportRef.value.scrollTop = 0
    viewportRef.value.style.overflowY = 'hidden'
    if (trackRef.value) {
      trackRef.value.style.transform = `translateY(-${offset}px)`
    }
  }
  paused = false
  lastTs = null
  if (!raf) raf = requestAnimationFrame(step)
}

// ── 列宽 style ────────────────────────────────────────────────
function colStyle(col) {
  const base = { textAlign: col.align || 'left', paddingRight: '8px' }
  if (col.width) {
    return { ...base, width: typeof col.width === 'number' ? col.width + 'px' : col.width, flexShrink: '0' }
  }
  return { ...base, flex: String(col.flex ?? 1), minWidth: '0' }
}

// ── 生命周期 ──────────────────────────────────────────────────
onMounted(() => {
  raf = requestAnimationFrame(step)
})
onUnmounted(() => {
  if (raf) cancelAnimationFrame(raf)
})

// 数据变化重置
watch(() => props.data, async () => {
  offset = 0
  if (trackRef.value) trackRef.value.style.transform = 'translateY(0)'
  await nextTick()
}, { deep: false })
</script>

<style scoped>
.ast {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  min-height: 0;
}

/* 空状态 */
.ast-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #c0c4cc;
  font-size: 13px;
}

/* 表头 */
.ast-head {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  height: 34px;
  padding: 0 14px;
  background: #f7f8fa;
  border-bottom: 1px solid #ebedf0;
}
.ast-th {
  font-size: 12px;
  font-weight: 600;
  color: #86909c;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 滚动视口 */
.ast-viewport {
  flex: 1;
  min-height: 0;
  overflow: hidden;  /* 初始隐藏，onEnter 时切 auto */
}
/* 暂停时的滚动条样式 */
.ast-viewport::-webkit-scrollbar       { width: 4px; }
.ast-viewport::-webkit-scrollbar-thumb { background: #dde0e6; border-radius: 3px; }

/* 轨道：GPU 合成层 */
.ast-track { will-change: transform; }

/* 数据行 */
.ast-row {
  display: flex;
  align-items: center;
  padding: 0 14px;
  border-bottom: 1px solid #f4f5f7;
  transition: background 0.1s;
}
.ast-row:hover  { background: #f0f5ff; }
.ast-row--alt   { background: #fafbfc; }

.ast-td {
  font-size: 13px;
  color: #1d2129;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  align-items: center;
}
</style>