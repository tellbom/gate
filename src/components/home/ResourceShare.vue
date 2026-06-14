<template>
  <div class="resource-card">
    <!-- 头 -->
    <div class="card-head">
      <span class="card-title">资源共享</span>
      <button class="more-btn" @click="$emit('more')">
        <el-icon><More /></el-icon>
      </button>
    </div>

    <!-- 标签页 -->
    <div class="tabs-row">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        class="tab-btn"
        :class="{ active: activeTab === tab.value }"
        @click="activeTab = tab.value"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- 列表 -->
    <div class="res-list">
      <div
        v-for="(item, i) in currentList"
        :key="item.id"
        class="res-item"
        :style="{ animationDelay: i * 40 + 'ms' }"
        @click="$emit('item-click', item)"
      >
        <div class="res-index">{{ String(i + 1).padStart(2, "0") }}</div>
        <div class="res-body">
          <div class="res-title">{{ item.title }}</div>
          <div class="res-meta">
            <span class="res-dept">{{ item.department }}</span>
            <span class="res-sep">·</span>
            <span class="res-date">{{ item.date }}</span>
          </div>
        </div>
        <el-icon class="res-arrow"><ArrowRight /></el-icon>
      </div>

      <div v-if="currentList.length === 0" class="empty-tip">暂无内容</div>
    </div>

    <!-- 底部 -->
    <div class="card-footer">
      <button class="view-all-btn" @click="$emit('more')">
        查看更多 <el-icon><ArrowRight /></el-icon>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { ArrowRight, More } from "@element-plus/icons-vue";

const props = defineProps({
  resourceData: { type: Object, default: () => ({}) },
});

defineEmits(["item-click", "more"]);

const tabs = [
  { label: "领导讲话", value: "speech" },
  { label: "上报精神", value: "report" },
  { label: "制度规范", value: "regulation" },
  { label: "培训资料", value: "training" },
  { label: "信息公告", value: "notice" },
  { label: "专项通知", value: "special" },
];
const activeTab = ref("speech");

const currentList = computed(() =>
  (props.resourceData[activeTab.value] || []).slice(0, 6)
);
</script>

<style scoped>
.resource-card {
  background: #fff;
  border-radius: 18px;
  padding: 22px 20px 16px;
  box-shadow: 0 2px 14px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04);
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
  letter-spacing: -0.2px;
}

.more-btn {
  border: none;
  background: none;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #bbb;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.15s, color 0.15s;
}
.more-btn:hover {
  background: #f5f5f5;
  color: #666;
}

/* 标签 */
.tabs-row {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.tab-btn {
  padding: 5px 12px;
  border: 1px solid #ebebeb;
  border-radius: 100px;
  font-size: 12px;
  color: #888;
  background: transparent;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.15s;
  white-space: nowrap;
}
.tab-btn.active {
  background: #c62f2f;
  border-color: #c62f2f;
  color: #fff;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(198, 47, 47, 0.25);
}

/* 列表 */
.res-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}
.res-list::-webkit-scrollbar {
  width: 3px;
}
.res-list::-webkit-scrollbar-thumb {
  background: #eee;
  border-radius: 10px;
}

.res-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 6px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s;
  border-bottom: 1px solid #f8f8f8;
  animation: fadeSlide 0.25s ease both;
}
@keyframes fadeSlide {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.res-item:last-child {
  border-bottom: none;
}
.res-item:hover {
  background: #fafafa;
}

.res-index {
  font-size: 12px;
  font-weight: 800;
  color: #e0e0e0;
  width: 22px;
  flex-shrink: 0;
  text-align: center;
  line-height: 1;
}
.res-item:nth-child(1) .res-index {
  color: #c62f2f;
}
.res-item:nth-child(2) .res-index {
  color: #e05050;
}
.res-item:nth-child(3) .res-index {
  color: #f08080;
}

.res-body {
  flex: 1;
  min-width: 0;
}

.res-title {
  font-size: 13px;
  font-weight: 500;
  color: #1a1a1a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 3px;
  line-height: 1.4;
}

.res-meta {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  color: #bbb;
}
.res-sep {
  color: #ddd;
}

.res-arrow {
  color: #ddd;
  font-size: 12px;
  flex-shrink: 0;
}

.empty-tip {
  text-align: center;
  color: #ccc;
  font-size: 13px;
  padding: 32px 0;
}

/* 底部 */
.card-footer {
  border-top: 1px solid #f5f5f5;
  margin-top: 10px;
  padding-top: 10px;
}
.view-all-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background: none;
  border: none;
  font-size: 13px;
  color: #c62f2f;
  font-weight: 600;
  cursor: pointer;
  padding: 6px 0;
  border-radius: 8px;
  transition: background 0.15s;
}
.view-all-btn:hover {
  background: rgba(198, 47, 47, 0.06);
}
</style>
