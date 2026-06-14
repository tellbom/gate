<template>
  <div class="todo-card">
    <!-- 头部 -->
    <div class="card-head">
      <div class="card-title-wrap">
        <span class="card-title">待办事项</span>
        <span class="badge">{{ urgentCount }}</span>
      </div>
      <div class="filter-wrap">
        <button
          v-for="f in filters"
          :key="f.value"
          class="filter-btn"
          :class="{ active: activeFilter === f.value }"
          @click="activeFilter = f.value"
        >{{ f.label }}</button>
      </div>
    </div>

    <!-- 列表 -->
    <div class="todo-list">
      <transition-group name="list" tag="div">
        <div
          v-for="item in filteredList"
          :key="item.id"
          class="todo-item"
          :class="`priority-${item.priority}`"
          @click="$emit('item-click', item)"
        >
          <!-- 优先级条 -->
          <div class="priority-bar" :style="{ background: priorityColor(item.priority) }"></div>

          <!-- 内容 -->
          <div class="todo-content">
            <div class="todo-top">
              <span class="todo-tag" :style="{ background: tagBg(item.type), color: tagColor(item.type) }">
                {{ item.type }}
              </span>
              <span class="todo-title">{{ item.title }}</span>
            </div>
            <div class="todo-bottom">
              <span class="todo-from">{{ item.from }}</span>
              <span class="todo-sep">·</span>
              <span class="todo-date" :class="{ overdue: isOverdue(item.deadline) }">
                {{ formatDate(item.deadline) }}
              </span>
            </div>
          </div>

          <!-- 右侧箭头 -->
          <el-icon class="todo-arrow"><ArrowRight /></el-icon>
        </div>
      </transition-group>

      <!-- 空状态 -->
      <div v-if="filteredList.length === 0" class="empty-state">
        <div class="empty-icon">✓</div>
        <p>暂无待办事项</p>
      </div>
    </div>

    <!-- 查看全部 -->
    <div class="card-footer">
      <button class="view-all-btn" @click="$emit('view-all')">
        查看全部 <el-icon><ArrowRight /></el-icon>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ArrowRight } from '@element-plus/icons-vue'

const props = defineProps({
  todoList: { type: Array, default: () => [] },
})

defineEmits(['item-click', 'view-all'])

const filters = [
  { label: '全部', value: 'all' },
  { label: '紧急', value: 'urgent' },
  { label: '今日', value: 'today' },
]
const activeFilter = ref('all')

const urgentCount = computed(
  () => props.todoList.filter(i => i.priority === 'urgent').length
)

const filteredList = computed(() => {
  if (activeFilter.value === 'all')    return props.todoList.slice(0, 8)
  if (activeFilter.value === 'urgent') return props.todoList.filter(i => i.priority === 'urgent')
  if (activeFilter.value === 'today') {
    const today = new Date().toDateString()
    return props.todoList.filter(i => new Date(i.deadline).toDateString() === today)
  }
  return props.todoList
})

const priorityColor = p => ({
  urgent: '#c62f2f',
  high:   '#ff9500',
  normal: '#34c759',
}[p] || '#bbb')

const tagBg = t => ({
  '巡察计划': 'rgba(198,47,47,.1)',
  '整改任务': 'rgba(255,149,0,.1)',
  '日常监督': 'rgba(52,199,89,.1)',
  '审批流程': 'rgba(0,122,255,.1)',
}[t] || 'rgba(0,0,0,.06)')

const tagColor = t => ({
  '巡察计划': '#c62f2f',
  '整改任务': '#d07800',
  '日常监督': '#25913c',
  '审批流程': '#0063cc',
}[t] || '#666')

const isOverdue = d => d && new Date(d) < new Date()

const formatDate = d => {
  if (!d) return '-'
  const dt = new Date(d)
  const now = new Date()
  const diff = Math.ceil((dt - now) / 86400000)
  if (diff === 0) return '今天到期'
  if (diff === 1) return '明天到期'
  if (diff < 0)  return `逾期 ${Math.abs(diff)} 天`
  return `${dt.getMonth()+1}/${dt.getDate()} 到期`
}
</script>

<style scoped>
.todo-card {
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
  gap: 12px;
}

.card-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-title {
  font-size: 15px;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: -.2px;
}

.badge {
  background: #c62f2f;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 100px;
  min-width: 18px;
  text-align: center;
  line-height: 16px;
}

.filter-wrap {
  display: flex;
  background: #f4f4f4;
  border-radius: 9px;
  padding: 3px;
  gap: 2px;
}

.filter-btn {
  padding: 3px 10px;
  border: none; background: transparent;
  border-radius: 7px;
  font-size: 12px; color: #999;
  cursor: pointer; font-weight: 500;
  transition: all .15s;
}
.filter-btn.active {
  background: #fff;
  color: #c62f2f;
  box-shadow: 0 1px 4px rgba(0,0,0,.1);
  font-weight: 600;
}

.todo-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 1px; }
.todo-list::-webkit-scrollbar { width: 3px; }
.todo-list::-webkit-scrollbar-thumb { background: #eee; border-radius: 10px; }

.todo-item {
  display: flex;
  align-items: center;
  gap: 0;
  padding: 10px 10px 10px 0;
  border-radius: 10px;
  cursor: pointer;
  transition: background .15s;
  overflow: hidden;
  position: relative;
}
.todo-item:hover { background: #fafafa; }

.priority-bar {
  width: 3px;
  height: 36px;
  border-radius: 0 3px 3px 0;
  flex-shrink: 0;
  margin-right: 12px;
}

.todo-content { flex: 1; min-width: 0; }

.todo-top {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 4px;
}

.todo-tag {
  font-size: 11px;
  font-weight: 600;
  padding: 1px 7px;
  border-radius: 100px;
  flex-shrink: 0;
}

.todo-title {
  font-size: 13px;
  font-weight: 500;
  color: #1a1a1a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.todo-bottom {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  color: #bbb;
}

.todo-from { color: #bbb; }
.todo-sep  { color: #ddd; }

.todo-date { color: #bbb; }
.todo-date.overdue { color: #c62f2f; font-weight: 600; }

.todo-arrow { color: #ddd; font-size: 13px; flex-shrink: 0; margin-left: 4px; }

/* 空状态 */
.empty-state {
  flex: 1;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 8px; color: #ccc; padding: 32px 0;
}
.empty-icon {
  font-size: 36px;
  width: 56px; height: 56px;
  background: #f5f5f5;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: #34c759;
}
.empty-state p { font-size: 13px; margin: 0; }

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
  cursor: pointer;
  padding: 6px 0;
  border-radius: 8px;
  transition: background .15s;
}
.view-all-btn:hover { background: rgba(198,47,47,.06); }

/* list 过渡 */
.list-enter-active, .list-leave-active { transition: all .2s ease; }
.list-enter-from { opacity:0; transform:translateX(-10px); }
.list-leave-to   { opacity:0; transform:translateX(10px); }
</style>
