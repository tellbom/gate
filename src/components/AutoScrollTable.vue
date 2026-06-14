<template>
  <div class="ast" ref="wrapRef">
    <div v-if="!data || data.length === 0" class="ast-empty">
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
        <rect x="4" y="8" width="24" height="18" rx="2" stroke="#cbd5e1" stroke-width="1.5"/>
        <path d="M4 13h24" stroke="#cbd5e1" stroke-width="1.5"/>
        <path d="M10 19h12M10 23h8" stroke="#cbd5e1" stroke-width="1.2" stroke-linecap="round"/>
      </svg>
      <span>暂无数据</span>
    </div>

    <template v-else>
      <!-- 表头 -->
      <div class="ast-head">
        <span
          v-for="col in columns" :key="col.prop"
          class="ast-th" :style="colStyle(col)"
        >{{ col.label }}</span>
      </div>

      <!-- 滚动视口：固定高度 = 5行 -->
      <div
        class="ast-viewport"
        ref="viewportRef"
        :style="{ height: viewportHeight + 'px' }"
        @mouseenter="onEnter"
        @mouseleave="onLeave"
      >
        <div class="ast-track" ref="trackRef">
          <template v-for="pass in needLoop ? 2 : 1" :key="pass">
            <div
              v-for="(row, i) in data" :key="pass + '-' + i"
              class="ast-row"
              :class="i % 2 === 1 ? 'ast-row--alt' : ''"
              :style="{ height: rowHeight + 'px' }"
            >
              <span
                v-for="col in columns" :key="col.prop"
                class="ast-td" :style="colStyle(col)"
              >
                <slot :name="col.slot || col.prop" :row="row" :index="i">
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
  columns:       { type: Array,  required: true },
  data:          { type: Array,  default: () => [] },
  speed:         { type: Number, default: 36 },
  rowHeight:     { type: Number, default: 38 },
  visibleRows:   { type: Number, default: 5 },  // ← 固定显示行数
})

const wrapRef     = ref(null)
const viewportRef = ref(null)
const trackRef    = ref(null)

// 视口高度 = 固定 5 行
const viewportHeight = computed(() => props.rowHeight * props.visibleRows)

// 数据超过可视行数才需要滚动
const needLoop = computed(() => props.data.length > props.visibleRows)

let raf    = null
let offset = 0
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

function onEnter() {
  if (!needLoop.value) return
  paused = true
  lastTs = null
  if (raf) { cancelAnimationFrame(raf); raf = null }
  if (viewportRef.value && trackRef.value) {
    viewportRef.value.style.overflowY = 'auto'
    viewportRef.value.scrollTop = offset
    trackRef.value.style.transform = 'translateY(0)'
  }
}

function onLeave() {
  if (!needLoop.value) return
  if (viewportRef.value && trackRef.value) {
    offset = viewportRef.value.scrollTop % singleH()
    viewportRef.value.scrollTop = 0
    viewportRef.value.style.overflowY = 'hidden'
    trackRef.value.style.transform = `translateY(-${offset}px)`
  }
  paused = false
  lastTs = null
  if (!raf) raf = requestAnimationFrame(step)
}

function colStyle(col) {
  const base = { textAlign: col.align || 'left', paddingRight: '8px' }
  if (col.width) return { ...base, width: (typeof col.width === 'number' ? col.width + 'px' : col.width), flexShrink: '0' }
  return { ...base, flex: String(col.flex ?? 1), minWidth: '0' }
}

onMounted(() => { raf = requestAnimationFrame(step) })
onUnmounted(() => { if (raf) cancelAnimationFrame(raf) })

watch(() => props.data, async () => {
  offset = 0
  if (trackRef.value) trackRef.value.style.transform = 'translateY(0)'
  await nextTick()
}, { deep: false })
</script>

<style scoped>
.ast { display: flex; flex-direction: column; overflow: hidden; }

.ast-empty {
  height: 120px; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 8px; color: #94a3b8; font-size: 13px;
}

.ast-head {
  display: flex; align-items: center; flex-shrink: 0;
  height: 30px; padding: 0 12px;
  border-bottom: 1px solid rgba(15,23,42,0.06);
}
.ast-th {
  font-size: 11px; font-weight: 600; color: #94a3b8;
  text-transform: uppercase; letter-spacing: 0.05em;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.ast-viewport {
  overflow: hidden;
  flex-shrink: 0;
}
.ast-viewport::-webkit-scrollbar { width: 3px; }
.ast-viewport::-webkit-scrollbar-thumb { background: rgba(15,23,42,0.1); border-radius: 2px; }

.ast-track { will-change: transform; }

.ast-row {
  display: flex; align-items: center;
  padding: 0 12px;
  border-bottom: 1px solid rgba(15,23,42,0.04);
  transition: background .12s;
}
.ast-row:hover { background: #f5f6ff; }
.ast-row--alt  { background: rgba(15,23,42,0.015); }

.ast-td {
  font-size: 13px; color: #0f172a;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  display: flex; align-items: center;
}
</style>