<!-- IframeErrorFallback.vue — iframe 加载失败 / 无 URL 占位组件 -->
<template>
  <div class="iframe-fallback">
    <div class="ifb-inner">
      <!-- 图标区 -->
      <div class="ifb-icon-wrap">
        <svg class="ifb-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- 浏览器窗口轮廓 -->
          <rect x="4" y="10" width="56" height="44" rx="5" stroke="currentColor" stroke-width="2.5"/>
          <!-- 顶栏分隔线 -->
          <line x1="4" y1="22" x2="60" y2="22" stroke="currentColor" stroke-width="2"/>
          <!-- 三个顶栏圆点 -->
          <circle cx="13" cy="16" r="2.2" fill="currentColor" opacity=".5"/>
          <circle cx="21" cy="16" r="2.2" fill="currentColor" opacity=".35"/>
          <circle cx="29" cy="16" r="2.2" fill="currentColor" opacity=".2"/>
          <!-- 中央感叹号三角形 -->
          <path d="M32 28l-9 16h18L32 28Z" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/>
          <line x1="32" y1="35" x2="32" y2="39" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
          <circle cx="32" cy="42.5" r="1.3" fill="currentColor"/>
        </svg>
      </div>

      <!-- 文字区 -->
      <div class="ifb-title">{{ title }}</div>
      <div class="ifb-desc">{{ desc }}</div>

      <!-- 重试按钮（有 onRetry 时显示）-->
      <button v-if="showRetry" class="ifb-retry-btn" type="button" @click="$emit('retry')">
        重新加载
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  /** 标题文字 */
  title:     { type: String,  default: '页面加载失败' },
  /** 描述文字 */
  desc:      { type: String,  default: '业务表单暂时无法加载，请稍后重试或联系管理员' },
  /** 是否显示重试按钮 */
  showRetry: { type: Boolean, default: false },
})

defineEmits(['retry'])
</script>

<style scoped>
.iframe-fallback {
  width: 100%;
  height: 100%;
  min-height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--wf-bg);
}

.ifb-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--wf-space-12);
  padding: var(--wf-space-32) var(--wf-space-24);
  text-align: center;
  max-width: 320px;
}

.ifb-icon-wrap {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: var(--wf-bg-section);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-bottom: var(--wf-space-4);
}

.ifb-icon {
  width: 38px;
  height: 38px;
  color: var(--wf-ink-disabled);
}

.ifb-title {
  font-size: var(--wf-font-lg);
  font-weight: var(--wf-font-weight-semibold);
  color: var(--wf-ink-2);
  line-height: var(--wf-line-height-tight);
}

.ifb-desc {
  font-size: var(--wf-font-base);
  color: var(--wf-ink-3);
  line-height: var(--wf-line-height-base);
}

.ifb-retry-btn {
  margin-top: var(--wf-space-4);
  padding: 8px 20px;
  border-radius: var(--wf-radius-sm);
  border: 1px solid var(--wf-primary-border);
  background: transparent;
  color: var(--wf-primary);
  font-size: var(--wf-font-base);
  font-weight: var(--wf-font-weight-medium);
  font-family: inherit;
  cursor: pointer;
  transition: background var(--wf-transition-fast),
              border-color var(--wf-transition-fast),
              transform    var(--wf-transition-fast);
}

.ifb-retry-btn:hover  { background: var(--wf-primary-light); border-color: var(--wf-primary); }
.ifb-retry-btn:active { transform: scale(0.96); }
</style>
