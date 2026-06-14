<template>
  <div class="duty-card">

    <!-- 头部：标题左，Tab 右 -->
    <div class="card-head">
      <div class="card-head-left">
        <span class="card-title">履职情况</span>
        <span class="card-subtitle">领导架构 · 会议精神</span>
      </div>
      <div class="head-right">
        <div class="seg-row">
          <button
            v-for="seg in segments"
            :key="seg.value"
            class="seg-btn"
            :class="{ active: activeSegment === seg.value }"
            @click="activeSegment = seg.value"
          >
            {{ seg.label }}
          </button>
        </div>
        <button class="more-btn" @click="$emit('more')">
          <el-icon><More /></el-icon>
        </button>
      </div>
    </div>

    <!-- ── 领导架构：仅公示列表 ── -->
    <div v-if="activeSegment === 'leaders'" class="panel">
      <div class="list-section-title">
        <span class="section-dot"></span>长期公示
      </div>
      <div
        v-for="(item, i) in pinnedNotices"
        :key="item.id"
        class="list-item"
        :style="{ animationDelay: i * 40 + 'ms' }"
        @click="$emit('notice-click', item)"
      >
        <div class="list-icon">
          <el-icon><Paperclip /></el-icon>
        </div>
        <div class="list-body">
          <div class="list-title">{{ item.title }}</div>
          <div class="list-meta">
            <span v-if="item.dept" class="list-dept">{{ item.dept }}</span>
            <span v-if="item.dept" class="meta-sep">·</span>
            <span class="list-date">{{ item.date }}</span>
          </div>
        </div>
        <!-- 长期有效 badge 在最右 -->
        <span v-if="item.permanent" class="permanent-tag">长期有效</span>
        <el-icon class="list-arrow"><ArrowRight /></el-icon>
      </div>
      <div v-if="!pinnedNotices.length" class="empty-tip">暂无公示信息</div>
    </div>

    <!-- ── 会议精神 ── -->
    <div v-if="activeSegment === 'meetings'" class="panel">

      <!-- 置顶通知 -->
      <template v-if="pinnedMeetings.length">
        <div class="list-section-title">
          <span class="section-dot red"></span>置顶通知
        </div>
        <div
          v-for="(item, i) in pinnedMeetings"
          :key="'pin-' + item.id"
          class="list-item list-item--red"
          :style="{ animationDelay: i * 40 + 'ms' }"
          @click="$emit('notice-click', item)"
        >
          <div class="list-icon list-icon--red">
            <el-icon><Bell /></el-icon>
          </div>
          <div class="list-body">
            <div class="list-title">{{ item.title }}</div>
            <div class="list-meta">
              <span v-if="item.dept" class="list-dept">{{ item.dept }}</span>
              <span v-if="item.dept" class="meta-sep">·</span>
              <span class="list-date">{{ item.date }}</span>
            </div>
          </div>
          <span v-if="item.permanent" class="permanent-tag">长期有效</span>
          <el-icon class="list-arrow"><ArrowRight /></el-icon>
        </div>
        <div class="section-divider"></div>
      </template>

      <!-- 普通会议列表 -->
      <div
        v-for="(item, i) in meetingList"
        :key="item.id"
        class="meeting-item"
        :style="{ animationDelay: i * 45 + 'ms' }"
        @click="$emit('meeting-click', item)"
      >
        <div class="meeting-date-block">
          <span class="meeting-day">{{ item.day }}</span>
          <span class="meeting-month">{{ item.month }}</span>
        </div>
        <div class="list-body">
          <div class="list-title">{{ item.title }}</div>
          <div class="list-meta">
            <span class="meeting-type-tag" :class="'type-' + item.type">{{ item.typeLabel }}</span>
            <span class="list-dept">{{ item.dept }}</span>
          </div>
        </div>
        <el-icon class="list-arrow"><ArrowRight /></el-icon>
      </div>
      <div v-if="!meetingList.length" class="empty-tip">暂无会议记录</div>
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
import { ref } from 'vue'
import { ArrowRight, More, Bell, Paperclip } from '@element-plus/icons-vue'

defineProps({
  /**
   * 领导架构公示列表
   * { id, title, dept?, date, permanent? }
   * TODO: 父组件后续通过接口动态传入
   */
  pinnedNotices:  { type: Array, default: () => [] },
  /**
   * 会议精神置顶通知
   * { id, title, dept?, date, permanent? }
   * TODO: 父组件后续通过接口动态传入
   */
  pinnedMeetings: { type: Array, default: () => [] },
  /**
   * 会议精神普通列表
   * { id, title, dept, day, month, type, typeLabel }
   */
  meetingList:    { type: Array, default: () => [] },
})

defineEmits(['notice-click', 'meeting-click', 'more'])

const segments = [
  { label: '领导架构', value: 'leaders' },
  { label: '会议精神', value: 'meetings' },
]
const activeSegment = ref('leaders')
</script>

<style scoped>
/* ── 卡片容器 ─────────────────────────────────────────────── */
.duty-card {
  background: #fff;
  border-radius: 18px;
  padding: 22px 20px 16px;
  box-shadow: 0 2px 14px rgba(0,0,0,.06), 0 1px 3px rgba(0,0,0,.04);
  display: flex;
  flex-direction: column;
  height: 100%;
  box-sizing: border-box;
}

/* ── 头部 ────────────────────────────────────────────────── */
.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  gap: 12px;
}
.card-head-left {
  display: flex; align-items: baseline; gap: 8px;
  flex-shrink: 0;
}
.card-title {
  font-size: 15px; font-weight: 700;
  color: #1a1a1a; letter-spacing: -0.2px;
}
.card-subtitle {
  font-size: 11.5px; color: #bbb;
  font-weight: 400; letter-spacing: 0.2px;
}

/* 右侧：Tab + more 按钮横排 */
.head-right {
  display: flex; align-items: center; gap: 6px;
  flex-shrink: 0;
}

/* ── 分区 Tab（靠右） ────────────────────────────────────── */
.seg-row {
  display: flex; gap: 0;
  background: #f5f5f7;
  border-radius: 8px;
  padding: 3px;
}
.seg-btn {
  padding: 5px 14px;
  border: none; border-radius: 6px;
  font-size: 12px; font-weight: 500;
  color: #888; background: transparent;
  cursor: pointer;
  transition: background .18s, color .18s, box-shadow .18s;
  white-space: nowrap;
}
.seg-btn.active {
  background: #c62f2f;
  color: #fff;
  font-weight: 600;
  box-shadow: 0 2px 6px rgba(198,47,47,.28);
}

.more-btn {
  border: none; background: none;
  width: 28px; height: 28px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  color: #bbb; cursor: pointer; font-size: 16px;
  transition: background .15s, color .15s;
}
.more-btn:hover { background: #f5f5f5; color: #666; }

/* ── 面板 ────────────────────────────────────────────────── */
.panel {
  flex: 1; min-height: 0;
  overflow-y: auto;
  display: flex; flex-direction: column;
}
.panel::-webkit-scrollbar { width: 3px; }
.panel::-webkit-scrollbar-thumb { background: #eee; border-radius: 10px; }

/* ── 分组标题 ─────────────────────────────────────────────── */
.list-section-title {
  display: flex; align-items: center; gap: 6px;
  font-size: 11.5px; font-weight: 600; color: #aaa;
  letter-spacing: 0.3px;
  padding: 0 2px 8px;
  border-bottom: 1px solid #f5f5f5;
  margin-bottom: 2px;
}
.section-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: #ccc; flex-shrink: 0;
}
.section-dot.red { background: #c62f2f; }

/* ── 通用列表行 ──────────────────────────────────────────── */
.list-item {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 4px;
  border-radius: 10px; cursor: pointer;
  transition: background .15s;
  border-bottom: 1px solid #f8f8f8;
  animation: fadeSlide .25s ease both;
}
.list-item:last-of-type { border-bottom: none; }
.list-item:hover { background: #fafafa; }
.list-item--red:hover { background: rgba(198,47,47,.03); }

@keyframes fadeSlide {
  from { opacity:0; transform:translateY(5px); }
  to   { opacity:1; transform:translateY(0); }
}

.list-icon {
  width: 28px; height: 28px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  background: #f5f5f7; color: #bbb; flex-shrink: 0;
  font-size: 13px;
}
.list-icon--red {
  background: rgba(198,47,47,.08);
  color: #c62f2f;
}

.list-body { flex: 1; min-width: 0; }
.list-title {
  font-size: 13px; font-weight: 500; color: #1a1a1a;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  margin-bottom: 3px; line-height: 1.4;
}
.list-meta {
  display: flex; align-items: center; gap: 5px;
  font-size: 11.5px; color: #bbb;
}
.meta-sep { color: #ddd; }
.list-dept { color: #bbb; }
.list-date { color: #bbb; }

/* 长期有效 — 最右侧，arrow 之前 */
.permanent-tag {
  flex-shrink: 0;
  font-size: 10px; font-weight: 600;
  color: #c62f2f;
  background: rgba(198,47,47,.08);
  border-radius: 4px;
  padding: 2px 6px;
  letter-spacing: 0.2px;
  white-space: nowrap;
}

.list-arrow { color: #ddd; font-size: 12px; flex-shrink: 0; }

/* ── 分割线 ──────────────────────────────────────────────── */
.section-divider {
  height: 1px; background: #f5f5f5;
  margin: 6px 0 8px;
}

/* ── 会议列表行 ──────────────────────────────────────────── */
.meeting-item {
  display: flex; align-items: center; gap: 12px;
  padding: 9px 4px;
  border-radius: 10px; cursor: pointer;
  transition: background .15s;
  border-bottom: 1px solid #f8f8f8;
  animation: fadeSlide .25s ease both;
}
.meeting-item:last-child { border-bottom: none; }
.meeting-item:hover { background: #fafafa; }

.meeting-date-block {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center;
  width: 36px; height: 36px; border-radius: 10px;
  background: #f5f5f7; flex-shrink: 0;
}
.meeting-day   { font-size: 14px; font-weight: 700; color: #1a1a1a; line-height: 1; }
.meeting-month { font-size: 10px; color: #aaa; font-weight: 400; line-height: 1.4; }

.meeting-type-tag {
  font-size: 10.5px; font-weight: 600; border-radius: 4px;
  padding: 1px 6px; flex-shrink: 0;
}
.type-important { background: rgba(198,47,47,.10); color: #c62f2f; }
.type-regular   { background: rgba(0,122,255,.08); color: #007aff; }
.type-special   { background: rgba(255,149,0,.10); color: #e08000; }

.empty-tip { text-align: center; color: #ccc; font-size: 13px; padding: 32px 0; }

/* ── 底部 ────────────────────────────────────────────────── */
.card-footer { border-top: 1px solid #f5f5f5; margin-top: 10px; padding-top: 10px; }
.view-all-btn {
  width: 100%; display: flex; align-items: center; justify-content: center; gap: 4px;
  background: none; border: none; font-size: 13px;
  color: #c62f2f; font-weight: 600; cursor: pointer;
  padding: 6px 0; border-radius: 8px;
  transition: background .15s;
}
.view-all-btn:hover { background: rgba(198,47,47,.06); }
</style>