<template>
  <div class="dab-wrap" v-if="candidates.length">

    <!-- ── 头部 ── -->
    <div class="dab-header">
      <!-- 图标 -->
      <div class="dab-icon">
        <!-- 限制范围：锁形图标 -->
        <svg v-if="restrictToRecommended" viewBox="0 0 14 14" fill="none" class="dab-icon-svg">
          <rect x="2.5" y="6.5" width="9" height="6" rx="1.3" stroke="currentColor" stroke-width="1.3"/>
          <path d="M4.5 6.5V5a2.5 2.5 0 0 1 5 0v1.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
        </svg>
        <!-- 普通：推荐图标 -->
        <svg v-else viewBox="0 0 14 14" fill="none" class="dab-icon-svg">
          <path d="M7 1l1.8 3.6L13 5.3l-3 2.9.7 4.1L7 10.1l-3.7 2.2.7-4.1L1 5.3l4.2-.7L7 1Z"
                stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
        </svg>
      </div>

      <!-- 标题区 -->
      <div class="dab-title-block">
        <span class="dab-title">{{ label || '推荐处理人' }}</span>
        <span class="dab-hint">
          {{ restrictToRecommended
            ? '范围已锁定，只能从以下人员中选择'
            : '以下为推荐人，可直接使用或重新选择' }}
        </span>
      </div>

      <!-- 右侧操作 -->
      <button
        type="button"
        class="dab-use-all-btn"
        @click="emit('use-all')"
        :title="restrictToRecommended ? '全部确认使用' : '一键使用全部推荐人'"
      >
        {{ restrictToRecommended ? '全部确认' : '一键使用' }}
      </button>
    </div>

    <!-- ── 候选人列表 ── -->
    <div class="dab-list">
      <div
        v-for="u in candidates"
        :key="u.workNo ?? u.id"
        class="dab-card"
        :class="{ 'dab-card--used': isUsed(u) }"
      >
        <!-- 头像 -->
        <div class="dab-avatar" :style="avatarStyle(u.name ?? u.userName)">
          {{ (u.name ?? u.userName ?? '?')[0] }}
        </div>

        <!-- 信息 -->
        <div class="dab-info">
          <span class="dab-name">{{ u.name ?? u.userName }}</span>
          <span class="dab-pos">{{ u.position ?? u.currentPosition ?? '—' }}</span>
        </div>

        <!-- 操作 / 状态 -->
        <div class="dab-action">
          <!-- 已选状态 -->
          <span v-if="isUsed(u)" class="dab-used-tag">
            <svg viewBox="0 0 12 12" fill="none" width="12" height="12">
              <circle cx="6" cy="6" r="5" stroke="currentColor" stroke-width="1.3"/>
              <path d="M3.5 6l1.8 1.8L8.5 4.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            已选
          </span>
          <!-- 使用按钮 -->
          <button
            v-else
            type="button"
            class="dab-use-btn"
            @click="emit('use-one', u)"
          >使用</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
/**
 * DefaultAssigneeBar.vue — 推荐候选人展示条（推荐确认模式版）
 *
 * 职责：
 *   展示流程中心通过 recommendedUsers 返回的推荐人员，
 *   提供"使用"（单个）和"一键使用/全部确认"（全部）操作，
 *   已被选中的人员显示"已选"状态（不可重复添加）。
 *
 * 与旧版区别：
 *   + restrictToRecommended prop：
 *       true  — 头部图标换为锁形，标题换为"范围已锁定…"，按钮文字改为"全部确认"
 *       false — 头部图标为推荐星，标题为"以下为推荐人，可直接使用或重新选择"
 *   + label prop：展示槽位名称（如"巡察办审核人"），替代固定文字"表单推荐处理人"
 *   + 所有颜色替换为 --wf-* Token（移除 #3370ff / #c62f2f 硬编码）
 *   + 头像渐变对齐 workflow-tokens.scss --wf-avatar-* 字面值
 *
 * Props:
 *   candidates            — 推荐候选人列表 [{ id?, workNo, name, userName?, position?, currentPosition? }]
 *   usedIds               — 已选人员的 workNo/id 集合，用于标记已使用
 *   restrictToRecommended — true = 锁定范围模式，UI 呈现"仅限以下人员"语义
 *   label                 — 槽位展示标签（如"巡察办审核人"），为空时显示"推荐处理人"
 *
 * Emits:
 *   use-one(user) — 使用单个推荐人
 *   use-all       — 全部使用（restrictToRecommended=true 时文案为"全部确认"）
 */

const props = defineProps({
  candidates:            { type: Array,   default: () => [] },
  usedIds:               { type: Array,   default: () => [] },
  restrictToRecommended: { type: Boolean, default: false     },
  label:                 { type: String,  default: ''        },
})

const emit = defineEmits(['use-one', 'use-all'])

function isUsed(u) {
  const uid = u.workNo ?? u.id ?? u.userId
  return props.usedIds.includes(uid)
}

// 头像渐变色组：字面值与 workflow-tokens.scss --wf-avatar-* 保持一致
const GRADS = [
  ['#0066cc', '#0071e3'],   // avatar-0 主色系
  ['#34c759', '#30d158'],   // avatar-1 绿
  ['#f59e0b', '#e8940f'],   // avatar-2 橙
  ['#ef4444', '#f87171'],   // avatar-3 红
  ['#8e44ad', '#9b59b6'],   // avatar-4 紫
  ['#16a085', '#1abc9c'],   // avatar-5 青
]

function avatarStyle(name) {
  const idx = ((name ?? '').charCodeAt(0) || 0) % GRADS.length
  const [a, b] = GRADS[idx]
  return { background: `linear-gradient(135deg, ${a}, ${b})` }
}
</script>

<style scoped>
/* ================================================================
   DefaultAssigneeBar.vue — PATCH-S03
   颜色全部使用 --wf-* Token
   restrictToRecommended=true：橙色警示语义（范围锁定）
   restrictToRecommended=false：主色语义（推荐可改）
   ================================================================ */

.dab-wrap {
  border-radius: var(--wf-radius-md);
  overflow: hidden;
  margin-top: var(--wf-space-6);
  /* 边框颜色根据 restrictToRecommended 由 CSS 变量控制，
     因 scoped 无法访问 prop，用 :deep 替代方案：
     父组件给 dab-wrap 加 class="is-restricted" 即可，
     但这里选择通过统一样式处理，border 始终用 primary-border */
  border: 1.5px dashed var(--wf-primary-border);
}

/* ── 头部 ── */
.dab-header {
  display: flex;
  align-items: center;
  gap: var(--wf-space-8);
  padding: var(--wf-space-8) 14px;
  background: var(--wf-primary-light);
  border-bottom: 1px solid var(--wf-primary-border);
}

/* 图标容器 */
.dab-icon {
  width: 24px;
  height: 24px;
  border-radius: var(--wf-radius-sm);
  background: var(--wf-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.dab-icon-svg {
  width: 13px;
  height: 13px;
  color: #fff;
}

/* 标题块 */
.dab-title-block {
  display: flex;
  flex-direction: column;
  gap: 1px;
  flex: 1;
  min-width: 0;
}

.dab-title {
  font-size: var(--wf-font-sm);
  font-weight: var(--wf-font-weight-bold);
  color: var(--wf-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dab-hint {
  font-size: var(--wf-font-xs);
  color: var(--wf-ink-3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 一键使用 / 全部确认 按钮 */
.dab-use-all-btn {
  flex-shrink: 0;
  padding: 3px 10px;
  border-radius: var(--wf-radius-pill);
  border: 1px solid var(--wf-primary);
  background: var(--wf-primary);
  color: #fff;
  font-size: var(--wf-font-xs);
  font-weight: var(--wf-font-weight-semibold);
  cursor: pointer;
  font-family: inherit;
  transition: opacity      var(--wf-transition-fast),
              transform    var(--wf-transition-fast);
}
.dab-use-all-btn:hover  { opacity: 0.85; }
.dab-use-all-btn:active { transform: scale(0.95); }

/* ── 候选人列表 ── */
.dab-list {
  display: flex;
  flex-direction: column;
  background: var(--wf-canvas);
}

.dab-card {
  display: flex;
  align-items: center;
  gap: var(--wf-space-8);
  padding: var(--wf-space-8) 14px;
  border-bottom: 1px solid var(--wf-divider);
  transition: background var(--wf-transition-fast);
}

.dab-card:last-child { border-bottom: none; }
.dab-card:hover      { background: var(--wf-primary-light); }

/* 已选整行降低透明度 */
.dab-card--used { opacity: 0.6; }

/* 头像 */
.dab-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  color: #fff;
  font-size: var(--wf-font-sm);
  font-weight: var(--wf-font-weight-bold);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
}

/* 信息 */
.dab-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.dab-name {
  font-size: var(--wf-font-base);
  font-weight: var(--wf-font-weight-semibold);
  color: var(--wf-ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dab-pos {
  font-size: var(--wf-font-xs);
  color: var(--wf-ink-3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 操作区 */
.dab-action { flex-shrink: 0; }

/* 已选标签 */
.dab-used-tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: var(--wf-font-xs);
  font-weight: var(--wf-font-weight-semibold);
  color: var(--wf-success);
}

/* 使用按钮 */
.dab-use-btn {
  padding: 3px 10px;
  border-radius: var(--wf-radius-pill);
  border: 1px solid var(--wf-primary);
  background: transparent;
  color: var(--wf-primary);
  font-size: var(--wf-font-xs);
  font-weight: var(--wf-font-weight-semibold);
  cursor: pointer;
  font-family: inherit;
  transition: background var(--wf-transition-fast),
              color      var(--wf-transition-fast),
              transform  var(--wf-transition-fast);
}

.dab-use-btn:hover  { background: var(--wf-primary); color: #fff; }
.dab-use-btn:active { transform: scale(0.95); }
</style>
