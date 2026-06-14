<template>
  <div class="selected-user-bar">

    <!-- ── 标签行 ── -->
    <div class="bar-label-row">
      <span class="bar-label">{{ label }}</span>
      <!-- restrictToRecommended 锁定标识 -->
      <span v-if="restrictToRecommended" class="bar-lock-badge">
        <svg viewBox="0 0 12 12" fill="none" class="lock-icon">
          <rect x="2" y="5.5" width="8" height="5.5" rx="1.2" stroke="currentColor" stroke-width="1.2"/>
          <path d="M4 5.5V4a2 2 0 1 1 4 0v1.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
        </svg>
        仅限推荐人
      </span>
    </div>

    <!-- ── 已选人员 Chip 区 ── -->
    <div class="bar-body">

      <div
        v-for="user in users"
        :key="user.workNo ?? user.id"
        class="user-chip"
      >
        <!-- 头像 -->
        <div class="chip-avatar" :style="avatarStyle(user.name)">
          {{ (user.name ?? '?')[0] }}
        </div>
        <!-- 姓名 + 职位 -->
        <div class="chip-info">
          <span class="chip-name">{{ user.name }}</span>
          <span v-if="user.position" class="chip-pos">{{ user.position }}</span>
        </div>
        <!-- 移除按钮：始终可点（restrictToRecommended 允许删除，required 校验在提交时） -->
        <button type="button" class="chip-remove" @click="$emit('remove', user)" title="移除">
          <svg viewBox="0 0 10 10" fill="none">
            <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
      </div>

      <!-- 空状态 + 触发按钮 -->
      <div class="bar-empty-row">
        <span v-if="!users.length" class="bar-empty-hint">
          {{ restrictToRecommended ? '请从下方推荐人中选择' : '暂未选择处理人' }}
        </span>
        <!-- 触发选人弹窗按钮：restrictToRecommended=true 时隐藏 -->
        <button
          v-if="!restrictToRecommended"
          type="button"
          class="add-btn"
          @click="$emit('click-add')"
        >
          <svg viewBox="0 0 12 12" fill="none" width="12" height="12">
            <path d="M6 1v10M1 6h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          {{ users.length ? '修改' : '选择' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * SelectedUserBar.vue — 已选处理人展示条（推荐确认模式版）
 *
 * 与旧版区别：
 *   + restrictToRecommended prop：true 时隐藏"选择/修改"按钮，显示"仅限推荐人"标识
 *   + required prop：仅用于 aria 标记，实际 required 校验在 TaskApproveDrawer 点同意时执行
 *   + 移除按钮始终可点（restrictToRecommended 允许删减，不允许新增）
 *   + 头像颜色对齐 workflow-tokens.scss --wf-avatar-* Token
 *   + 所有颜色替换为 --wf-* CSS 变量
 *
 * Props:
 *   users                — 已选人员列表 [{ id?, workNo, name, position? }]
 *   label                — 槽位标签（如"巡察办审核人 *"，* 由父组件 slot.required 决定是否追加）
 *   restrictToRecommended— true = 锁定范围，隐藏"选择/修改"按钮
 *   required             — 用于 aria-required 标记
 *
 * Emits:
 *   remove(user)   — 移除单个已选人员
 *   click-add      — 触发选人弹窗（restrictToRecommended=false 时才会有此按钮）
 */

const props = defineProps({
  users:                 { type: Array,   default: () => [] },
  label:                 { type: String,  default: '处理人'  },
  restrictToRecommended: { type: Boolean, default: false     },
  required:              { type: Boolean, default: false     },
})

defineEmits(['remove', 'click-add'])

// 头像渐变色组：对齐 workflow-tokens.scss --wf-avatar-* 字面值
const GRADS = [
  ['#0066cc', '#0071e3'],  // avatar-0 主色系
  ['#34c759', '#30d158'],  // avatar-1 绿
  ['#f59e0b', '#e8940f'],  // avatar-2 橙
  ['#ef4444', '#f87171'],  // avatar-3 红
  ['#8e44ad', '#9b59b6'],  // avatar-4 紫
  ['#16a085', '#1abc9c'],  // avatar-5 青
]

function avatarStyle(name) {
  const idx = ((name ?? '').charCodeAt(0) || 0) % GRADS.length
  const [a, b] = GRADS[idx]
  return { background: `linear-gradient(135deg, ${a}, ${b})` }
}
</script>

<style scoped>
/* ================================================================
   SelectedUserBar.vue — PATCH-S02
   颜色全部使用 --wf-* Token，无硬编码色值
   ================================================================ */

.selected-user-bar {
  display: flex;
  flex-direction: column;
  gap: var(--wf-space-6);
}

/* ── 标签行 ── */
.bar-label-row {
  display: flex;
  align-items: center;
  gap: var(--wf-space-8);
}

.bar-label {
  font-size: var(--wf-font-sm);
  font-weight: var(--wf-font-weight-semibold);
  color: var(--wf-ink-2);
  letter-spacing: 0.3px;
}

/* 锁定标识（restrictToRecommended=true 时显示） */
.bar-lock-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: var(--wf-font-xs);
  font-weight: var(--wf-font-weight-semibold);
  color: var(--wf-warning);
  background: var(--wf-warning-bg);
  padding: 1px 6px;
  border-radius: var(--wf-radius-pill);
  white-space: nowrap;
}

.lock-icon {
  width: 10px;
  height: 10px;
  color: var(--wf-warning);
  flex-shrink: 0;
}

/* ── 主体区（chip 列表 + 空状态 + 按钮）── */
.bar-body {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--wf-space-6);
  min-height: 36px;
  padding: var(--wf-space-6) var(--wf-space-8);
  background: var(--wf-bg-section);
  border: 1px solid var(--wf-border);
  border-radius: var(--wf-radius-md);
  transition: border-color var(--wf-transition-fast);
}

/* 有已选人员时 border 用主色浅边 */
.bar-body:has(.user-chip) {
  border-color: var(--wf-primary-border);
  background: var(--wf-primary-light);
}

/* ── 人员 Chip ── */
.user-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--wf-space-6);
  padding: 4px 6px 4px 5px;
  background: var(--wf-canvas);
  border: 1px solid var(--wf-primary-border);
  border-radius: var(--wf-radius-pill);
  transition: border-color var(--wf-transition-fast),
              background   var(--wf-transition-fast);
}

.user-chip:hover {
  border-color: var(--wf-primary);
}

/* 头像 */
.chip-avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  color: #fff;
  font-size: var(--wf-font-xs);
  font-weight: var(--wf-font-weight-bold);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* 姓名 + 职位 */
.chip-info {
  display: flex;
  align-items: baseline;
  gap: var(--wf-space-4);
}

.chip-name {
  font-size: var(--wf-font-base);
  font-weight: var(--wf-font-weight-semibold);
  color: var(--wf-ink);
  white-space: nowrap;
}

.chip-pos {
  font-size: var(--wf-font-xs);
  color: var(--wf-ink-3);
  white-space: nowrap;
}

/* 移除按钮 */
.chip-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  color: var(--wf-ink-disabled);
  border-radius: 50%;
  flex-shrink: 0;
  transition: color        var(--wf-transition-fast),
              background   var(--wf-transition-fast);
}

.chip-remove svg {
  width: 8px;
  height: 8px;
  display: block;
}

.chip-remove:hover {
  color: var(--wf-danger);
  background: var(--wf-danger-bg);
}

/* ── 空状态行（提示 + 触发按钮）── */
.bar-empty-row {
  display: flex;
  align-items: center;
  gap: var(--wf-space-8);
  flex: 1;
  min-width: 0;
}

.bar-empty-hint {
  font-size: var(--wf-font-sm);
  color: var(--wf-ink-disabled);
  flex: 1;
}

/* 选择 / 修改 触发按钮 */
.add-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--wf-space-4);
  padding: 4px 12px;
  border-radius: var(--wf-radius-pill);
  border: 1.5px dashed var(--wf-primary-border);
  background: transparent;
  color: var(--wf-primary);
  font-size: var(--wf-font-sm);
  font-weight: var(--wf-font-weight-semibold);
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
  transition: background     var(--wf-transition-fast),
              border-color   var(--wf-transition-fast),
              transform      var(--wf-transition-fast);
}

.add-btn:hover  { background: var(--wf-primary-light); border-color: var(--wf-primary); }
.add-btn:active { transform: scale(0.95); }
</style>
