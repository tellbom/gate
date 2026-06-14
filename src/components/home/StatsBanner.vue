<template>
  <div class="stats-banner">
    <div class="banner-deco-circle c1"></div>
    <div class="banner-deco-circle c2"></div>

    <div class="banner-left">
      <h1 class="banner-greeting">{{ greeting }}，{{ userName }}</h1>
      <p class="banner-date">{{ dateText }}</p>
    </div>

    <div class="banner-right">
      <div class="kpi-wrapper">
        <div class="kpi-description">
          <span class="kpi-desc-dot"></span>
          <span class="kpi-desc-text">{{ kpiDescription }}</span>
        </div>

        <div class="kpi-grid">
          <div
            v-for="(item, i) in kpiList"
            :key="i"
            class="kpi-card"
            :style="{ animationDelay: i * 60 + 'ms' }"
          >
            <div class="kpi-icon-box" :style="{ background: item.iconBg }">
              <el-icon :size="18" style="color: #fff">
                <component :is="item.icon" />
              </el-icon>
            </div>

            <div class="kpi-info">
              <div class="kpi-row-top">
                <span class="kpi-val">{{ item.value }}</span>
                <span v-if="item.unit" class="kpi-unit">{{ item.unit }}</span>
                <span
                  v-if="item.delta !== undefined"
                  class="kpi-delta"
                  :class="item.delta >= 0 ? 'delta-up' : 'delta-down'"
                >
                  {{ item.delta >= 0 ? '↑' : '↓' }}{{ Math.abs(item.delta) }}%
                </span>
              </div>
              <div class="kpi-label">{{ item.label }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  userName: { type: String, default: '管理员' },
  kpiList: { type: Array, default: () => [] },
  kpiDescription: { type: String, default: '2023年至2027年巡察' },
})

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '夜深了'
  if (h < 12) return '早上好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})

const dateText = computed(() => {
  const d = new Date()
  const wks = ['日', '一', '二', '三', '四', '五', '六']
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日  星期${wks[d.getDay()]}`
})
</script>

<style scoped>
.stats-banner {
  position: relative;
  overflow: hidden;
  background: linear-gradient(130deg, #c62f2f 0%, #a82020 60%, #8c1515 100%);
  border-radius: 20px;
  padding: 32px 36px;
  display: flex;
  align-items: center;
  gap: 32px;
  box-shadow: 0 12px 40px rgba(198, 47, 47, 0.26), 0 2px 8px rgba(0, 0, 0, 0.06);
  min-height: 136px;
}

.banner-deco-circle {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

.c1 {
  width: 320px;
  height: 320px;
  top: -140px;
  right: 80px;
  background: radial-gradient(circle, rgba(252, 218, 80, 0.2) 0%, transparent 68%);
}

.c2 {
  width: 180px;
  height: 180px;
  bottom: -90px;
  left: 26%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, transparent 70%);
}

.banner-left {
  flex-shrink: 0;
  min-width: 220px;
  position: relative;
  z-index: 1;
}

.banner-greeting {
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 5px;
  letter-spacing: -0.3px;
  line-height: 1.2;
}

.banner-date {
  font-size: 12.5px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
  font-weight: 400;
  letter-spacing: 0.5px;
}

.banner-right {
  flex: 1;
  position: relative;
  z-index: 1;
  min-width: 0;
  display: flex;
  justify-content: flex-end;
}

.kpi-wrapper {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  max-width: 100%;
}

.kpi-description {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
}

.kpi-desc-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.55);
  flex-shrink: 0;
}

.kpi-desc-text {
  font-size: 15px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.72);
  letter-spacing: -0.12px;
  line-height: 1;
  white-space: nowrap;
}

.kpi-grid {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  justify-content: flex-start;
  width: auto;
  max-width: 100%;
}

.kpi-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 14px;
  padding: 14px 18px;
  min-width: 140px;
  cursor: default;
  transition: background 0.2s, transform 0.18s;
  animation: kpiIn 0.38s ease both;
}

@keyframes kpiIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.kpi-card:hover {
  background: rgba(255, 255, 255, 0.17);
  transform: translateY(-2px);
}

.kpi-icon-box {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.kpi-info {
  flex: 1;
  min-width: 0;
}

.kpi-row-top {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 3px;
}

.kpi-val {
  font-size: 26px;
  font-weight: 800;
  color: #fff;
  line-height: 1;
  letter-spacing: -0.5px;
}

.kpi-unit {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.65);
  font-weight: 500;
}

.kpi-delta {
  font-size: 11px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 100px;
}

.delta-up {
  background: rgba(52, 199, 89, 0.28);
  color: #7fffa0;
}

.delta-down {
  background: rgba(255, 149, 0, 0.28);
  color: #ffd06a;
}

.kpi-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.58);
  font-weight: 500;
  letter-spacing: 0.2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>