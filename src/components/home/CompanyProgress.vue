<template>
  <div class="company-card">
    <!-- 头 -->
    <div class="card-head">
      <span class="card-title">所属企业开展情况</span>
      <button class="more-btn" @click="$emit('more')">
        <el-icon><More /></el-icon>
      </button>
    </div>

    <!-- 企业 tabs -->
    <div class="company-tabs">
      <button
        v-for="co in companies"
        :key="co.id"
        class="co-tab"
        :class="{ active: activeCompany === co.id }"
        @click="activeCompany = co.id"
      >{{ co.name }}</button>
    </div>

    <!-- 当前企业指标 -->
    <div class="metric-row" v-if="current">
      <div v-for="(m, i) in current.metrics" :key="i" class="metric-card">
        <div class="metric-val" :style="{ color: m.color }">{{ m.value }}</div>
        <div class="metric-label">{{ m.label }}</div>
        <!-- 环形进度 -->
        <div class="ring-wrap">
          <svg viewBox="0 0 36 36" class="ring-svg">
            <circle cx="18" cy="18" r="14" fill="none" stroke="#f5f5f5" stroke-width="3.5"/>
            <circle
              cx="18" cy="18" r="14" fill="none"
              :stroke="m.color" stroke-width="3.5"
              stroke-linecap="round"
              :stroke-dasharray="`${(m.percent * 87.96 / 100).toFixed(1)} 87.96`"
              stroke-dashoffset="21.99"
              transform="rotate(-90 18 18)"
            />
          </svg>
          <span class="ring-pct">{{ m.percent }}%</span>
        </div>
      </div>
    </div>

    <!-- 新闻列表 -->
    <div class="news-list" v-if="current">
      <div
        v-for="(news, i) in current.newsList"
        :key="news.id"
        class="news-item"
        @click="$emit('news-click', news)"
      >
        <span class="news-bullet" :style="{ background: i < 2 ? '#c62f2f' : '#ddd' }"></span>
        <div class="news-body">
          <span class="news-title">{{ news.title }}</span>
        </div>
        <span class="news-date">{{ news.date }}</span>
      </div>
    </div>

    <!-- 底部 -->
    <div class="card-footer">
      <button class="view-all-btn" @click="$emit('more')">
        查看全部 <el-icon><ArrowRight /></el-icon>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ArrowRight, More } from '@element-plus/icons-vue'

const props = defineProps({
  companies: { type: Array, default: () => [] },
})

defineEmits(['news-click', 'more'])

const activeCompany = ref(props.companies[0]?.id ?? '')

const current = computed(() =>
  props.companies.find(c => c.id === activeCompany.value)
)
</script>

<style scoped>
.company-card {
  background: #fff;
  border-radius: 18px;
  padding: 22px 20px 16px;
  box-shadow: 0 2px 14px rgba(0,0,0,.06), 0 1px 3px rgba(0,0,0,.04);
  display: flex;
  flex-direction: column;
  height: 100%;
  box-sizing: border-box;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.card-title {
  font-size: 15px;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: -.2px;
}
.more-btn {
  border: none; background: none;
  width: 28px; height: 28px;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  color: #bbb; cursor: pointer; font-size: 16px;
  transition: background .15s, color .15s;
}
.more-btn:hover { background: #f5f5f5; color: #666; }

/* 企业 tabs */
.company-tabs {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}
.co-tab {
  padding: 5px 13px;
  border: 1px solid #ebebeb;
  border-radius: 100px;
  font-size: 12px; color: #888;
  background: transparent;
  cursor: pointer; font-weight: 500;
  transition: all .15s;
}
.co-tab.active {
  background: #c62f2f;
  border-color: #c62f2f;
  color: #fff;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(198,47,47,.25);
}

/* 指标卡片 */
.metric-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}

.metric-card {
  background: #fafafa;
  border-radius: 12px;
  padding: 12px 10px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  position: relative;
}

.metric-val {
  font-size: 18px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -.5px;
}
.metric-label {
  font-size: 11px;
  color: #aaa;
  font-weight: 500;
  text-align: center;
  margin-top: 2px;
}

.ring-wrap {
  margin-top: 6px;
  position: relative;
  width: 44px; height: 44px;
  display: flex; align-items: center; justify-content: center;
}
.ring-svg { width: 44px; height: 44px; }
.ring-pct {
  position: absolute;
  font-size: 9px;
  font-weight: 700;
  color: #666;
}

/* 新闻列表 */
.news-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}
.news-list::-webkit-scrollbar { width: 3px; }
.news-list::-webkit-scrollbar-thumb { background: #eee; border-radius: 10px; }

.news-item {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  padding: 9px 4px;
  border-radius: 8px;
  cursor: pointer;
  border-bottom: 1px solid #f8f8f8;
  transition: background .15s;
}
.news-item:last-child { border-bottom: none; }
.news-item:hover { background: #fafafa; }

.news-bullet {
  width: 6px; height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 5px;
}

.news-body { flex: 1; min-width: 0; }

.news-title {
  font-size: 13px;
  font-weight: 500;
  color: #1a1a1a;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
}

.news-date {
  font-size: 11px;
  color: #ccc;
  white-space: nowrap;
  flex-shrink: 0;
  margin-top: 2px;
}

/* 底部 */
.card-footer {
  border-top: 1px solid #f5f5f5;
  margin-top: 10px;
  padding-top: 10px;
}
.view-all-btn {
  width: 100%;
  display: flex; align-items: center; justify-content: center; gap: 4px;
  background: none; border: none;
  font-size: 13px; color: #c62f2f; font-weight: 600;
  cursor: pointer; padding: 6px 0;
  border-radius: 8px;
  transition: background .15s;
}
.view-all-btn:hover { background: rgba(198,47,47,.06); }
</style>
