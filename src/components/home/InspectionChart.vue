<template>
  <div class="ipc-wrapper">

    <!-- ══════ 左卡：巡察计划完成情况 ══════ -->
    <div class="ipc-card">

      <!-- 头部：标题 + 指标 -->
      <div class="ipc-card-hd">
        <div class="ipc-card-hd-left">
          <span class="ipc-card-accent" />
          <div>
            <div class="ipc-card-title">巡察计划完成情况</div>
            <div class="ipc-card-sub">2023 年至今，各年度计划 & 完成对比</div>
          </div>
        </div>
        <div class="ipc-stat-row">
          <div class="ipc-stat-item">
            <span class="ipc-stat-num ipc-stat-num--red">{{ planStats.totalPlanned }}</span>
            <span class="ipc-stat-lbl">总计划</span>
          </div>
          <div class="ipc-stat-div" />
          <div class="ipc-stat-item">
            <span class="ipc-stat-num ipc-stat-num--orange">{{ planStats.totalCompleted }}</span>
            <span class="ipc-stat-lbl">已完成</span>
          </div>
          <div class="ipc-stat-div" />
          <div class="ipc-stat-item">
            <span class="ipc-stat-num ipc-stat-num--blue">{{ planStats.avgRate }}%</span>
            <span class="ipc-stat-lbl">平均完成率</span>
          </div>
        </div>
      </div>

      <!-- 搜索栏：按单位筛选 -->
      <div class="ipc-toolbar">
        <span class="ipc-tb-lbl">单位</span>
        <el-select
          v-model="planUnit"
          size="small"
          class="ipc-sel"
          clearable
          placeholder="全部单位"
          @change="renderPlanChart"
        >
          <el-option v-for="u in planUnitOptions" :key="u" :label="u" :value="u" />
        </el-select>
        <div class="ipc-tb-spacer" />
        <!-- 图例 -->
        <span class="ipc-legend-item">
          <span class="ipc-legend-dot" style="background:#c62f2f" />计划数
        </span>
        <span class="ipc-legend-item">
          <span class="ipc-legend-dot" style="background:#f5a623" />完成数
        </span>
      </div>

      <!-- 图表 -->
      <div class="ipc-chart-wrap" ref="planChartEl" />
    </div>


    <!-- ══════ 右卡：巡察问题整改情况 ══════ -->
    <div class="ipc-card">

      <!-- 头部：标题 + 指标 -->
      <div class="ipc-card-hd">
        <div class="ipc-card-hd-left">
          <span class="ipc-card-accent ipc-card-accent--blue" />
          <div>
            <div class="ipc-card-title">巡察问题整改情况</div>
            <div class="ipc-card-sub">各部门问题整改进度与完成率</div>
          </div>
        </div>
        <!-- 右上角：指标数据 -->
        <div class="ipc-stat-row">
          <div class="ipc-stat-item">
            <span class="ipc-stat-num ipc-stat-num--red">{{ rectifyStats.total }}</span>
            <span class="ipc-stat-lbl">问题总数</span>
          </div>
          <div class="ipc-stat-div" />
          <div class="ipc-stat-item">
            <span class="ipc-stat-num ipc-stat-num--green">{{ rectifyStats.rectified }}</span>
            <span class="ipc-stat-lbl">已整改</span>
          </div>
          <div class="ipc-stat-div" />
          <div class="ipc-stat-item">
            <span class="ipc-stat-num ipc-stat-num--orange">{{ rectifyStats.pending }}</span>
            <span class="ipc-stat-lbl">待整改</span>
          </div>
          <div class="ipc-stat-div" />
          <div class="ipc-stat-item">
            <span class="ipc-stat-num ipc-stat-num--blue">{{ rectifyStats.avgRate }}%</span>
            <span class="ipc-stat-lbl">整改率</span>
          </div>
        </div>
      </div>

      <!-- 搜索栏（图表上方）：年份 + 部门关键词 -->
      <div class="ipc-toolbar">
        <span class="ipc-tb-lbl">年份</span>
        <el-select
          v-model="rectifyYear"
          size="small"
          class="ipc-sel ipc-sel--year"
          @change="renderRectifyChart"
        >
          <el-option v-for="y in rectifyYearOptions" :key="y" :label="y + ' 年'" :value="y" />
        </el-select>
        <span class="ipc-tb-lbl">部门</span>
        <el-input
          v-model="rectifyDeptKw"
          size="small"
          clearable
          placeholder="搜索部门"
          class="ipc-input-dept"
          @input="renderRectifyChart"
          @clear="renderRectifyChart"
        />
        <div class="ipc-tb-spacer" />
        <!-- 图例 -->
        <span class="ipc-legend-item">
          <span class="ipc-legend-bar" style="background:#c62f2f" />问题数
        </span>
        <span class="ipc-legend-item">
          <span class="ipc-legend-bar" style="background:#34c759" />已整改
        </span>
        <span class="ipc-legend-item">
          <span class="ipc-legend-line" />整改率
        </span>
      </div>

      <!-- 图表 -->
      <div class="ipc-chart-wrap" ref="rectifyChartEl" />
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick, shallowRef } from 'vue'
import * as echarts from 'echarts/core'
import { BarChart, LineChart } from 'echarts/charts'
import {
  GridComponent, TooltipComponent, LegendComponent, DataZoomComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([BarChart, LineChart, GridComponent, TooltipComponent, LegendComponent, DataZoomComponent, CanvasRenderer])

// ─── Props ────────────────────────────────────────────────────────
const props = defineProps({
  /**
   * 巡察计划数据（按年份）：
   * [{
   *   year: '2023',
   *   planned: 12,
   *   completed: 10,
   *   rate: 83.3,
   *   // 鼠标悬停时展示的当年巡察对象列表（可选）
   *   objects: [{ name: '长飞公司', planned: 3, completed: 3 }, ...]
   * }]
   */
  planData: { type: Array, default: () => [] },

  /**
   * 整改情况数据（按年份+部门）：
   * {
   *   '2025': [{
   *     dept: '党委办公室',
   *     total: 8,
   *     rectified: 6,
   *     rate: 75
   *   }, ...]
   * }
   */
  rectifyData: { type: Object, default: () => ({}) },
})

// ─── 颜色常量 ─────────────────────────────────────────────────────
const C_RED    = '#c62f2f'
const C_ORANGE = '#f5a623'
const C_GREEN  = '#34c759'
const C_BLUE   = '#007aff'

// ═══════════════════════════════════════════════════
//  左卡：巡察计划完成情况
// ═══════════════════════════════════════════════════
const planChartEl  = ref(null)
const planInstance = shallowRef(null)

// 左卡搜索：按单位筛选
const planUnit = ref('')

const planUnitOptions = computed(() => {
  const units = new Set()
  props.planData.forEach(row =>
    (row.objects ?? []).forEach(o => o.name && units.add(o.name))
  )
  return [...units]
})

/** 按单位过滤后的计划数据：无选择时直接用全量；有选择时过滤每年 objects 并重新汇总 */
const filteredPlanData = computed(() => {
  if (!planUnit.value) return props.planData
  return props.planData.map(row => {
    const objs = (row.objects ?? []).filter(o => o.name === planUnit.value)
    if (!objs.length) return null
    const planned   = objs.reduce((s, o) => s + (o.planned   || 0), 0)
    const completed = objs.reduce((s, o) => s + (o.completed || 0), 0)
    const rate      = planned > 0 ? parseFloat(((completed / planned) * 100).toFixed(1)) : 0
    return { ...row, planned, completed, rate, objects: objs }
  }).filter(Boolean)
})

const planStats = computed(() => {
  const rows = filteredPlanData.value
  if (!rows.length) return { totalPlanned: 0, totalCompleted: 0, avgRate: '0.0' }
  const totalPlanned   = rows.reduce((s, d) => s + (d.planned   || 0), 0)
  const totalCompleted = rows.reduce((s, d) => s + (d.completed || 0), 0)
  const avgRate = (rows.reduce((s, d) => s + (d.rate || 0), 0) / rows.length).toFixed(1)
  return { totalPlanned, totalCompleted, avgRate }
})

function buildPlanOption() {
  const rows  = filteredPlanData.value
  const years = rows.map(d => d.year)
  // 每次可见柱组数（固定显示 4 组，多余横向滚动）
  const VISIBLE = 4
  const endVal  = Math.min(VISIBLE - 1, years.length - 1)

  return {
    animation: true,
    animationDuration: 500,
    animationEasing: 'cubicOut',
    backgroundColor: 'transparent',
    grid: { top: 16, bottom: 46, left: 8, right: 16, containLabel: true },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: '#fff',
      borderColor: '#f0f0f0',
      borderWidth: 1,
      borderRadius: 14,
      padding: [12, 16],
      extraCssText: 'box-shadow:0 8px 28px rgba(0,0,0,.12);',
      formatter(params) {
        const row = rows[params[0]?.dataIndex]
        if (!row) return ''
        let html = `<div style="font-weight:700;color:#1a1a1a;margin-bottom:8px;font-size:13px">${row.year} 年</div>`
        params.forEach(p => {
          html += `<div style="display:flex;align-items:center;gap:8px;margin:3px 0">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};flex-shrink:0"></span>
            <span style="color:#888;font-size:12px">${p.seriesName}</span>
            <span style="font-weight:700;color:#1a1a1a;margin-left:auto;padding-left:16px;font-size:13px">${p.value} 项</span>
          </div>`
        })
        const rateVal = row.rate != null ? row.rate.toFixed(1) + '%' : '—'
        html += `<div style="display:flex;align-items:center;gap:8px;margin:3px 0">
          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${C_BLUE};flex-shrink:0"></span>
          <span style="color:#888;font-size:12px">完成率</span>
          <span style="font-weight:700;color:${C_BLUE};margin-left:auto;padding-left:16px;font-size:13px">${rateVal}</span>
        </div>`
        if (row.objects?.length) {
          html += `<div style="margin-top:9px;padding-top:8px;border-top:1px solid #f0f0f0">
            <div style="font-size:11px;color:#bbb;font-weight:600;margin-bottom:5px">本年巡察对象</div>`
          row.objects.forEach(o => {
            const done = o.planned > 0 ? ((o.completed / o.planned) * 100).toFixed(0) : 0
            html += `<div style="display:flex;align-items:center;gap:6px;margin:3px 0;font-size:11px">
              <span style="color:#555;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:120px">${o.name}</span>
              <span style="color:#aaa">${o.completed}/${o.planned}</span>
              <span style="color:${done >= 100 ? C_GREEN : C_ORANGE};font-weight:600;min-width:36px;text-align:right">${done}%</span>
            </div>`
          })
          html += '</div>'
        }
        return html
      },
    },
    xAxis: {
      type: 'category',
      data: years,
      axisLine:  { lineStyle: { color: '#f0f0f0' } },
      axisTick:  { show: false },
      axisLabel: { color: '#aaa', fontSize: 12, formatter: v => v + '年' },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      name: '项',
      nameTextStyle: { color: '#ddd', fontSize: 10 },
      axisLine:  { show: false },
      axisTick:  { show: false },
      axisLabel: { color: '#ccc', fontSize: 11 },
      splitLine: { lineStyle: { color: '#f5f5f5', type: 'dashed' } },
    },
    dataZoom: [
      {
        // 内置滚动（鼠标滚轮 / 触屏拖拽）
        type: 'inside',
        orient: 'horizontal',
        startValue: 0,
        endValue: endVal,
        zoomLock: true,
      },
      {
        // 底部滑动条
        type: 'slider',
        orient: 'horizontal',
        bottom: 4,
        height: 16,
        borderColor: 'transparent',
        backgroundColor: '#f4f4f6',
        fillerColor: 'rgba(198,47,47,.15)',
        handleStyle: { color: '#c62f2f', borderColor: '#c62f2f' },
        handleSize: '80%',
        textStyle: { color: '#ccc', fontSize: 9 },
        startValue: 0,
        endValue: endVal,
        zoomLock: true,
      },
    ],
    series: [
      {
        name: '计划数',
        type: 'bar',
        data: rows.map(d => d.planned),
        barMaxWidth: 44,
        barGap: '16%',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#c62f2f' },
            { offset: 1, color: 'rgba(198,47,47,.35)' },
          ]),
          borderRadius: [6, 6, 0, 0],
        },
        emphasis: {
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#e04545' },
              { offset: 1, color: 'rgba(224,69,69,.45)' },
            ]),
          },
        },
        label: { show: true, position: 'top', fontSize: 11, color: '#888', formatter: '{c}' },
      },
      {
        name: '完成数',
        type: 'bar',
        data: rows.map(d => d.completed),
        barMaxWidth: 44,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#f5a623' },
            { offset: 1, color: 'rgba(245,166,35,.35)' },
          ]),
          borderRadius: [6, 6, 0, 0],
        },
        emphasis: {
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#ffb84d' },
              { offset: 1, color: 'rgba(255,184,77,.45)' },
            ]),
          },
        },
        label: { show: true, position: 'top', fontSize: 11, color: '#888', formatter: '{c}' },
      },
    ],
  }
}

function renderPlanChart() {
  if (!planInstance.value) return
  planInstance.value.setOption(buildPlanOption(), { notMerge: true })
}

// ═══════════════════════════════════════════════════
//  右卡：巡察问题整改情况
// ═══════════════════════════════════════════════════
const rectifyChartEl  = ref(null)
const rectifyInstance = shallowRef(null)

// 默认选当前年，fallback 到最新有数据的年份
const currentYear = String(new Date().getFullYear())

const rectifyYearOptions = computed(() => {
  const keys = Object.keys(props.rectifyData).sort().reverse()
  return keys.length ? keys : [currentYear]
})

const rectifyYear = ref(currentYear)

// 当 options 变化时，如果当前选择不在列表中则切换到第一项
watch(rectifyYearOptions, opts => {
  if (opts.length && !opts.includes(rectifyYear.value)) {
    rectifyYear.value = opts[0]
  }
}, { immediate: true })

// 右卡搜索：年份 + 部门关键词
const rectifyDeptKw = ref('')

const rectifyRows = computed(() => {
  const rows = props.rectifyData[rectifyYear.value] ?? []
  if (!rectifyDeptKw.value.trim()) return rows
  return rows.filter(d => d.dept?.includes(rectifyDeptKw.value.trim()))
})

const rectifyStats = computed(() => {
  const rows = rectifyRows.value
  if (!rows.length) return { total: 0, rectified: 0, pending: 0, avgRate: '0.0' }
  const total     = rows.reduce((s, d) => s + (d.total     || 0), 0)
  const rectified = rows.reduce((s, d) => s + (d.rectified || 0), 0)
  const pending   = Math.max(0, total - rectified)
  const avgRate   = rows.length
    ? (rows.reduce((s, d) => s + (d.rate || 0), 0) / rows.length).toFixed(1)
    : '0.0'
  return { total, rectified, pending, avgRate }
})

function buildRectifyOption() {
  const rows = rectifyRows.value
  if (!rows.length) return {}

  const truncate = (s, n = 5) => s.length > n ? s.slice(0, n) + '…' : s
  const depts    = rows.map(d => d.dept)
  // 每次可见柱组数（固定显示 6 组，多余横向滚动）
  const VISIBLE = 6
  const endVal  = Math.min(VISIBLE - 1, depts.length - 1)

  return {
    animation: true,
    animationDuration: 500,
    animationEasing: 'cubicOut',
    backgroundColor: 'transparent',
    grid: { top: 16, bottom: 46, left: 8, right: 16, containLabel: true },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: '#fff',
      borderColor: '#f0f0f0',
      borderWidth: 1,
      borderRadius: 14,
      padding: [12, 16],
      extraCssText: 'box-shadow:0 8px 28px rgba(0,0,0,.12);',
      formatter(params) {
        const idx = params[0]?.dataIndex
        const row = rows[idx]
        if (!row) return ''
        // tooltip 显示完整部门名
        let html = `<div style="font-weight:700;color:#1a1a1a;margin-bottom:8px;font-size:13px">${row.dept}</div>`
        params.forEach(p => {
          const isRate = p.seriesName === '整改率'
          const suffix = isRate ? '%' : ' 项'
          html += `<div style="display:flex;align-items:center;gap:8px;margin:3px 0">
            <span style="display:inline-block;width:8px;height:8px;border-radius:${isRate ? '50%' : '2px'};background:${p.color};flex-shrink:0"></span>
            <span style="color:#888;font-size:12px">${p.seriesName}</span>
            <span style="font-weight:700;color:${isRate ? C_BLUE : '#1a1a1a'};margin-left:auto;padding-left:16px;font-size:13px">${p.value}${suffix}</span>
          </div>`
        })
        return html
      },
    },
    xAxis: {
      type: 'category',
      data: depts,
      axisLine:  { lineStyle: { color: '#f0f0f0' } },
      axisTick:  { show: false },
      axisLabel: {
        color: '#aaa',
        fontSize: 11,
        interval: 0,
        rotate: 0,                          // 横向滚动，不旋转
        formatter: v => truncate(v, 5),     // X 轴截断，完整名在 tooltip
      },
      splitLine: { show: false },
    },
    yAxis: [
      {
        type: 'value',
        name: '项',
        nameTextStyle: { color: '#ddd', fontSize: 10 },
        axisLine:  { show: false },
        axisTick:  { show: false },
        axisLabel: { color: '#ccc', fontSize: 11 },
        splitLine: { lineStyle: { color: '#f5f5f5', type: 'dashed' } },
      },
      {
        type: 'value',
        name: '%',
        min: 0, max: 100,
        nameTextStyle: { color: '#ddd', fontSize: 10 },
        axisLine:  { show: false },
        axisTick:  { show: false },
        axisLabel: { color: '#ccc', fontSize: 11, formatter: v => v + '%' },
        splitLine: { show: false },
      },
    ],
    dataZoom: [
      {
        type: 'inside',
        orient: 'horizontal',
        startValue: 0,
        endValue: endVal,
        zoomLock: true,
      },
      {
        type: 'slider',
        orient: 'horizontal',
        bottom: 4,
        height: 16,
        borderColor: 'transparent',
        backgroundColor: '#f4f4f6',
        fillerColor: 'rgba(0,122,255,.15)',
        handleStyle: { color: C_BLUE, borderColor: C_BLUE },
        handleSize: '80%',
        textStyle: { color: '#ccc', fontSize: 9 },
        startValue: 0,
        endValue: endVal,
        zoomLock: true,
      },
    ],
    series: [
      {
        name: '问题数',
        type: 'bar',
        yAxisIndex: 0,
        data: rows.map(d => d.total),
        barMaxWidth: 30,
        barGap: '16%',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#c62f2f' },
            { offset: 1, color: 'rgba(198,47,47,.3)' },
          ]),
          borderRadius: [5, 5, 0, 0],
        },
        emphasis: { focus: 'series' },
      },
      {
        name: '已整改',
        type: 'bar',
        yAxisIndex: 0,
        data: rows.map(d => d.rectified),
        barMaxWidth: 30,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#34c759' },
            { offset: 1, color: 'rgba(52,199,89,.3)' },
          ]),
          borderRadius: [5, 5, 0, 0],
        },
        emphasis: { focus: 'series' },
      },
      {
        name: '整改率',
        type: 'line',
        yAxisIndex: 1,
        data: rows.map(d => d.rate),
        smooth: true,
        symbol: 'circle',
        symbolSize: 7,
        lineStyle: { color: C_BLUE, width: 2.5 },
        itemStyle: { color: C_BLUE, borderColor: '#fff', borderWidth: 2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(0,122,255,.12)' },
            { offset: 1, color: 'rgba(0,122,255,0)' },
          ]),
        },
        emphasis: { focus: 'series' },
      },
    ],
  }
}

function renderRectifyChart() {
  if (!rectifyInstance.value) return
  rectifyInstance.value.setOption(buildRectifyOption(), { notMerge: true })
}

// ─── 响应式监听 ───────────────────────────────────────────────────
watch(() => filteredPlanData.value, () => nextTick(renderPlanChart),    { deep: true })
watch(() => rectifyRows.value,      () => nextTick(renderRectifyChart), { deep: true })

// ─── 生命周期 ─────────────────────────────────────────────────────
let roList = []

onMounted(async () => {
  await nextTick()
  if (planChartEl.value) {
    planInstance.value = echarts.init(planChartEl.value, null, { renderer: 'canvas' })
    renderPlanChart()
    const ro1 = new ResizeObserver(() => planInstance.value?.resize())
    ro1.observe(planChartEl.value)
    roList.push(ro1)
  }
  if (rectifyChartEl.value) {
    rectifyInstance.value = echarts.init(rectifyChartEl.value, null, { renderer: 'canvas' })
    renderRectifyChart()
    const ro2 = new ResizeObserver(() => rectifyInstance.value?.resize())
    ro2.observe(rectifyChartEl.value)
    roList.push(ro2)
  }
})

onBeforeUnmount(() => {
  roList.forEach(r => r.disconnect())
  planInstance.value?.dispose()
  rectifyInstance.value?.dispose()
})

// ─── 父组件所需 Mock 数据（父组件传入，此处仅作说明）─────────────
/*
  父组件数据格式示例：

  planData: [
    {
      year: '2023', planned: 18, completed: 14, rate: 77.8,
      objects: [
        { name: '长飞公司',   planned: 4, completed: 3 },
        { name: '航飞公司',   planned: 3, completed: 3 },
        { name: '无人机公司', planned: 4, completed: 3 },
        { name: '民航产业',   planned: 4, completed: 3 },
        { name: '通航公司',   planned: 3, completed: 2 },
      ],
    },
    {
      year: '2024', planned: 22, completed: 20, rate: 90.9,
      objects: [
        { name: '长飞公司',   planned: 5, completed: 5 },
        { name: '航飞公司',   planned: 4, completed: 4 },
        { name: '无人机公司', planned: 5, completed: 4 },
        { name: '民航产业',   planned: 5, completed: 4 },
        { name: '通航公司',   planned: 3, completed: 3 },
      ],
    },
    {
      year: '2025', planned: 28, completed: 23, rate: 82.1,
      objects: [
        { name: '长飞公司',   planned: 6, completed: 5 },
        { name: '航飞公司',   planned: 5, completed: 5 },
        { name: '无人机公司', planned: 6, completed: 5 },
        { name: '民航产业',   planned: 6, completed: 4 },
        { name: '通航公司',   planned: 5, completed: 4 },
      ],
    },
  ],

  rectifyData: {
    '2023': [
      { dept: '党委办公室',   total: 5,  rectified: 5,  rate: 100 },
      { dept: '纪检监察室',   total: 8,  rectified: 7,  rate: 87.5 },
      { dept: '财务部',       total: 6,  rectified: 4,  rate: 66.7 },
      { dept: '人力资源部',   total: 4,  rectified: 3,  rate: 75  },
      { dept: '工程管理部',   total: 7,  rectified: 6,  rate: 85.7 },
      { dept: '安全生产部',   total: 9,  rectified: 8,  rate: 88.9 },
    ],
    '2024': [
      { dept: '党委办公室',   total: 6,  rectified: 6,  rate: 100 },
      { dept: '纪检监察室',   total: 10, rectified: 9,  rate: 90  },
      { dept: '财务部',       total: 8,  rectified: 6,  rate: 75  },
      { dept: '人力资源部',   total: 5,  rectified: 4,  rate: 80  },
      { dept: '工程管理部',   total: 9,  rectified: 8,  rate: 88.9 },
      { dept: '安全生产部',   total: 11, rectified: 10, rate: 90.9 },
      { dept: '业务发展部',   total: 7,  rectified: 5,  rate: 71.4 },
    ],
    '2025': [
      { dept: '党委办公室',   total: 8,  rectified: 6,  rate: 75  },
      { dept: '纪检监察室',   total: 12, rectified: 10, rate: 83.3 },
      { dept: '财务部',       total: 10, rectified: 7,  rate: 70  },
      { dept: '人力资源部',   total: 6,  rectified: 5,  rate: 83.3 },
      { dept: '工程管理部',   total: 11, rectified: 9,  rate: 81.8 },
      { dept: '安全生产部',   total: 13, rectified: 11, rate: 84.6 },
      { dept: '业务发展部',   total: 8,  rectified: 6,  rate: 75  },
      { dept: '审计部',       total: 5,  rectified: 4,  rate: 80  },
    ],
  },
*/
</script>

<style scoped>
/* ══ 外层两栏布局：高度跟随父容器 ══ */
.ipc-wrapper {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  width: 100%;
  height: 100%;          /* 继承父容器高度 */
  min-height: 360px;     /* 最小兜底高度 */
  box-sizing: border-box;
}

/* ══ 统一卡片：高度撑满，内部 flex 列 ══ */
.ipc-card {
  background: #fff;
  border-radius: 18px;
  padding: 16px 18px 12px;
  box-shadow: 0 2px 14px rgba(0,0,0,.06), 0 1px 3px rgba(0,0,0,.04);
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  height: 100%;
  overflow: hidden;       /* 防止内容撑出卡片 */
  box-sizing: border-box;
}

/* ── 卡片头部 ── */
.ipc-card-hd {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-shrink: 0;
}
.ipc-card-hd-left {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-width: 0;
  flex-shrink: 0;
}
.ipc-card-accent {
  width: 4px; height: 36px;
  border-radius: 2px;
  background: #c62f2f;
  flex-shrink: 0;
  margin-top: 1px;
}
.ipc-card-accent--blue { background: #007aff; }
.ipc-card-title {
  font-size: 15px; font-weight: 700; color: #1a1a1a;
  letter-spacing: -.2px; margin-bottom: 3px; white-space: nowrap;
}
.ipc-card-sub { font-size: 12px; color: #bbb; white-space: nowrap; }

/* ── 指标行（右上角）── */
.ipc-stat-row {
  display: flex;
  align-items: center;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  padding: 5px 0;
  flex-shrink: 0;
  gap: 0;
}
.ipc-stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  padding: 0 8px;
  min-width: 52px;
}
.ipc-stat-num {
  font-size: 17px; font-weight: 800;
  line-height: 1.1; letter-spacing: -.5px;
  white-space: nowrap;
}
.ipc-stat-num--red    { color: #c62f2f; }
.ipc-stat-num--green  { color: #34c759; }
.ipc-stat-num--orange { color: #f5a623; }
.ipc-stat-num--blue   { color: #007aff; }
.ipc-stat-lbl {
  font-size: 10px; color: #bbb;
  font-weight: 500; white-space: nowrap;
}
.ipc-stat-div {
  width: 1px; height: 26px;
  background: #ebebeb; flex-shrink: 0;
}

/* ── 搜索工具栏（图表上方）── */
.ipc-toolbar {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 6px 10px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 10px;
  flex-shrink: 0;
  flex-wrap: nowrap;
  min-width: 0;
}
.ipc-tb-lbl {
  font-size: 11px; font-weight: 600;
  color: #ccc; white-space: nowrap; flex-shrink: 0;
}
.ipc-tb-spacer { flex: 1; }

/* select / input 统一尺寸 */
.ipc-sel       { width: 110px; flex-shrink: 0; }
.ipc-sel--year { width: 86px;  }
.ipc-input-dept{ width: 100px; flex-shrink: 0; }

:deep(.ipc-sel .el-input__wrapper),
:deep(.ipc-input-dept .el-input__wrapper) {
  border-radius: 8px !important;
  box-shadow: 0 0 0 1px #e8e8e8 !important;
  background: #fff;
  height: 26px;
  padding: 0 8px;
}
:deep(.ipc-sel .el-input__wrapper:hover),
:deep(.ipc-input-dept .el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #d0d0d0 !important;
}
:deep(.ipc-sel .el-input__wrapper.is-focus),
:deep(.ipc-input-dept .el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1.5px #007aff !important;
}
:deep(.ipc-sel .el-input__inner),
:deep(.ipc-input-dept .el-input__inner) {
  font-size: 12px; color: #444; height: 26px;
}
:deep(.ipc-sel .el-select__caret),
:deep(.ipc-input-dept .el-input__suffix) {
  font-size: 11px; color: #ccc;
}

/* ── 图例 ── */
.ipc-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: #999;
  white-space: nowrap;
  flex-shrink: 0;
}
.ipc-legend-dot {
  width: 9px; height: 9px;
  border-radius: 50%; flex-shrink: 0;
}
.ipc-legend-bar {
  width: 9px; height: 9px;
  border-radius: 3px; flex-shrink: 0;
}
.ipc-legend-line {
  width: 16px; height: 3px;
  border-radius: 2px;
  background: #007aff;
  flex-shrink: 0;
  position: relative;
}
.ipc-legend-line::after {
  content: '';
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #007aff;
  border: 1.5px solid #fff;
  box-shadow: 0 0 0 1px #007aff;
}

/* ── 图表容器：flex:1 填满剩余空间，高度固定不溢出 ── */
.ipc-chart-wrap {
  flex: 1;
  min-height: 0;   /* 关键：让 flex 子项可以收缩 */
  width: 100%;
}
</style>