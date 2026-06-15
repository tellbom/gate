<!--
  放置路径：src/layouts/backend/components/logo.vue
  完整替换原文件。
  保留原有折叠逻辑（fold/unfold），移除 <img> 依赖，改为 SVG shield + 两行文字。
  新增 context pill（全局视图 / __global__）。
  折叠时只显示 shield 图标，pill 和文字隐藏。
-->
<template>
  <div class="pc-logo-wrap">

    <!-- Logo 区 -->
    <div class="pc-logo" :class="{ 'pc-logo--collapsed': config.layout.menuCollapse }">
      <div v-if="!config.layout.menuCollapse" class="pc-logo__icon">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none"
             stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/>
        </svg>
      </div>
      <transition name="el-fade-in">
        <div v-if="!config.layout.menuCollapse" class="pc-logo__text">
          <div class="pc-logo__title">统一权限中心</div>
          <div class="pc-logo__sub">Permission Center</div>
        </div>
      </transition>
      <!-- 折叠按钮（保留原有逻辑） -->
      <Icon
        v-if="config.layout.layoutMode !== 'Streamline'"
        @click="onMenuCollapse"
        :name="config.layout.menuCollapse ? 'fa fa-indent' : 'fa fa-dedent'"
        :class="config.layout.menuCollapse ? 'pc-logo__fold pc-logo__fold--unfold' : 'pc-logo__fold'"
        :color="config.getColorVal('menuActiveColor')"
        size="16"
      />
    </div>

    <!-- Context Pill（仅展开时显示） -->
    <transition name="el-fade-in">
      <div v-if="!config.layout.menuCollapse" class="pc-context-pill">
        <span class="pc-context-pill__dot" />
        <span class="pc-context-pill__label">全局视图</span>
        <span class="pc-context-pill__code">__global__</span>
      </div>
    </transition>

  </div>
</template>

<script setup lang="ts">
import { useConfig } from '/@/stores/config'
import { closeShade } from '/@/utils/pageShade'
import { Session } from '/@/utils/storage'
import { BEFORE_RESIZE_LAYOUT } from '/@/stores/constant/cacheKey'
import { setNavTabsWidth } from '/@/utils/layout'

const config = useConfig()

const onMenuCollapse = () => {
  if (config.layout.shrink && !config.layout.menuCollapse) {
    closeShade()
  }
  config.setLayout('menuCollapse', !config.layout.menuCollapse)
  Session.set(BEFORE_RESIZE_LAYOUT, {
    layoutMode: config.layout.layoutMode,
    menuCollapse: config.layout.menuCollapse,
  })
  setTimeout(() => setNavTabsWidth(), 350)
}
</script>

<style scoped lang="scss">
/* ── Logo 外层 ── */
.pc-logo-wrap {
  width: 100%;
  background: v-bind('config.layout.layoutMode !== "Streamline" ? config.getColorVal("menuTopBarBackground") : "transparent"');
}

/* ── Logo 行 ── */
.pc-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 16px 12px;
  min-height: 60px;
}

.pc-logo--collapsed {
  justify-content: center;
  padding: 14px 0 10px;
}

.pc-logo__icon {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  background: var(--pc-ink);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pc-logo__text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.pc-logo__title {
  font-size: 14.5px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: v-bind('config.getColorVal("menuColor")');
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pc-logo__sub {
  font-size: 11px;
  color: v-bind('config.getColorVal("menuColor")');
  opacity: 0.5;
  white-space: nowrap;
  margin-top: 1px;
}

.pc-logo__fold {
  margin-left: auto;
  cursor: pointer;
  flex-shrink: 0;
}

.pc-logo__fold--unfold {
  margin: 0 auto;
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* ── Context Pill ── */
.pc-context-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 14px 10px;
  padding: 7px 12px;
  background: var(--pc-parchment);
  border-radius: 10px;
}

.pc-context-pill__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--pc-ok);
  flex-shrink: 0;
}

.pc-context-pill__label {
  font-size: 12px;
  font-weight: 600;
  color: var(--pc-ink-60);
}

.pc-context-pill__code {
  margin-left: auto;
  font-family: var(--pc-font-mono);
  font-size: 11px;
  color: var(--pc-ink-48);
}
</style>
