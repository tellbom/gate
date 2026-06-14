<template>
  <footer class="copyright-bar" role="contentinfo" aria-label="版权与法律信息">
    <div class="inner">
      <div class="left">
        <img v-if="logoSrc" class="logo" :src="logoSrc" alt="logo" />
        <div class="text">
          <p class="line">
            <span v-if="prefix">{{ prefix }}</span>
            <span v-if="prefix"> </span>
            <span>© {{ displayYear }} {{ company }}</span>
            <span v-if="suffix"> · {{ suffix }}</span>
          </p>
          <p v-if="address" class="muted">{{ address }}</p>
          <p class="muted" v-if="icp || beian?.code">
            <a v-if="icp" class="link" :href="icpLink || 'javascript:void(0)'" target="_blank" rel="noopener">{{ icp }}</a>
            <span v-if="icp && beian?.code">｜</span>
            <a v-if="beian?.code" class="link" :href="beian.href || 'javascript:void(0)'" target="_blank" rel="noopener">
              <span class="police-icon" aria-hidden="true">🛡️</span>{{ beian.code }}
            </a>
          </p>
        </div>
      </div>

      <nav v-if="links?.length" class="right" aria-label="底部导航">
        <a v-for="(l, i) in links"
           :key="i"
           class="nav-link"
           :href="l.href || 'javascript:void(0)'"
           :target="l.external ? '_blank' : undefined"
           rel="noopener"
        >{{ l.label }}</a>
      </nav>
    </div>

    <div v-if="showDivider" class="divider" aria-hidden="true"></div>
  </footer>
</template>

<script setup lang="ts">
import { computed, defineProps } from 'vue'

type LinkItem = { label: string; href?: string; external?: boolean }
type Beian = { code: string; href?: string }
type Theme = {
  bg?: string
  text?: string
  muted?: string
  border?: string
  link?: string
  linkHover?: string
}

const props = defineProps<{
  year?: number | string
  company: string
  prefix?: string
  suffix?: string
  address?: string
  icp?: string
  icpLink?: string
  beian?: Beian
  links?: LinkItem[]
  logoSrc?: string
  showDivider?: boolean
  theme?: Theme
}>()

const displayYear = computed(() => {
  const y = props.year ?? new Date().getFullYear()
  return typeof y === 'number' ? y : String(y)
})

/** 将主题色写入 CSS 变量，支持父组件传入“附件一”的配色 */
const cssVars = computed(() => {
  const t = props.theme || {}
  return {
    '--cb-bg': t.bg || 'transparent',
    '--cb-text': t.text || 'rgba(255,255,255,0.86)',
    '--cb-muted': t.muted || 'rgba(255,255,255,0.56)',
    '--cb-border': t.border || 'rgba(255,255,255,0.12)',
    '--cb-link': t.link || '#7aa2ff',
    '--cb-link-hover': t.linkHover || '#a3beff',
  } as Record<string, string>
})
</script>

<style scoped>
.copyright-bar {
  width: 100%;
  background: var(--cb-bg);
  color: var(--cb-text);
  padding: 16px 20px 12px;
  box-sizing: border-box;
}
.inner {
  max-width: 1320px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 16px;
  align-items: center;
}
.left {
  display: flex;
  gap: 12px;
  align-items: center;
  min-width: 0;
}
.logo {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  object-fit: cover;
  flex: 0 0 24px;
  filter: drop-shadow(0 1px 1px rgba(0,0,0,0.25));
}
.text {
  min-width: 0;
}
.line {
  font-size: 13px;
  line-height: 1.5;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.muted {
  margin-top: 2px;
  font-size: 12px;
  color: var(--cb-muted);
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.right {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.nav-link, .link {
  font-size: 13px;
  color: var(--cb-link);
  text-decoration: none;
  transition: color .2s ease, opacity .2s ease;
}
.nav-link:hover, .link:hover {
  color: var(--cb-link-hover);
}
.police-icon {
  margin-right: 4px;
}
.divider {
  height: 1px;
  background: var(--cb-border);
  margin-top: 12px;
}

/* 响应式：小屏改为上下两行 */
@media (max-width: 640px) {
  .inner {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  .right {
    justify-content: flex-start;
  }
}
</style>

<!-- 设计要点
1) “Apple风格”收敛：小字号、半透明文字、柔和边框、悬停轻微强化
2) 完全由父组件透传数据与颜色；不写死文案、不锁定主题
3) 自适应：小屏自动换行，长文案省略
-->
