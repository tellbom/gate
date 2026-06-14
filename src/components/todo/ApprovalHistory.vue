<!-- ApprovalHistory.vue — 历史审批记录时间线 -->
<template>
  <div class="approval-history">
    <div v-if="!records.length" class="empty">
      <el-empty description="暂无审批记录" :image-size="60" />
    </div>
    <el-timeline v-else>
      <el-timeline-item
        v-for="r in records"
        :key="r.taskId"
        :type="outcomeTagType(r.outcome)"
        :timestamp="formatDate(r.endTime)"
        placement="top"
        size="large"
      >
        <div class="record-card">
          <div class="record-top">
            <span class="record-node">{{ r.nodeName }}</span>
            <el-tag :type="outcomeTagType(r.outcome)" size="small" round>
              {{ outcomeLabel(r.outcome) }}
            </el-tag>
            <el-tag v-if="r.round > 1" type="warning" size="small" round>
              第{{ r.round }}次
            </el-tag>
          </div>
          <div class="record-meta">
            <span><el-icon><User /></el-icon>{{ r.assignee }}</span>
            <span><el-icon><Timer /></el-icon>{{ formatDuration(r.durationSeconds) }}</span>
          </div>
          <div v-if="r.rejectReason" class="record-reason">
            <el-icon class="reason-icon"><Warning /></el-icon>
            {{ r.rejectReason }}
          </div>
        </div>
      </el-timeline-item>
    </el-timeline>
  </div>
</template>

<script setup>
import { User, Timer, Warning } from '@element-plus/icons-vue'
import {
  outcomeTagType,
  outcomeLabel,
  formatDate,
  formatDuration,
} from '/@/workflow-shared/workflowUtils.js'

defineProps({ records: { type: Array, default: () => [] } })
</script>

<style scoped>
.record-card {
  background: var(--wf-bg-card);
  border-radius: var(--wf-radius-md);
  padding: 10px 14px;
  border: 1px solid var(--wf-divider);
}

.record-top {
  display: flex;
  align-items: center;
  gap: var(--wf-space-8);
  margin-bottom: var(--wf-space-6);
  flex-wrap: wrap;
}

.record-node {
  font-size: var(--wf-font-md);
  font-weight: var(--wf-font-weight-semibold);
  color: var(--wf-ink);
}

.record-meta {
  display: flex;
  gap: var(--wf-space-16);
  font-size: var(--wf-font-sm);
  color: var(--wf-ink-3);
  margin-bottom: var(--wf-space-4);
}

.record-meta span {
  display: flex;
  align-items: center;
  gap: var(--wf-space-4);
}

.record-reason {
  font-size: var(--wf-font-sm);
  color: var(--wf-warning-text);
  background: var(--wf-warning-bg);
  border-radius: var(--wf-radius-sm);
  padding: var(--wf-space-6) 10px;
  margin-top: var(--wf-space-6);
  display: flex;
  align-items: flex-start;
  gap: var(--wf-space-6);
  line-height: var(--wf-line-height-base);
}

.reason-icon {
  color: var(--wf-warning);
  flex-shrink: 0;
  margin-top: 1px;
}
</style>
