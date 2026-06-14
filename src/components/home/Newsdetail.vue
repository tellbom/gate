<template>
  <div class="nd-page">

    <!-- ══ 顶部导航栏 ══ -->
    <div class="nd-nav">
      <button class="nd-back" @click="goBack">
        <svg viewBox="0 0 8 14" fill="none" width="8" height="14">
          <path d="M7 1L1 7l6 6" stroke="currentColor" stroke-width="1.8"
            stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        返回
      </button>

      <div class="nd-breadcrumb">
        <span class="nd-bc-item nd-bc-root">首页</span>
        <svg class="nd-bc-sep" viewBox="0 0 6 10" fill="none" width="6" height="10">
          <path d="M1 1l4 4-4 4" stroke="currentColor" stroke-width="1.4"
            stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="nd-bc-item">{{ sourceLabel }}</span>
        <svg class="nd-bc-sep" viewBox="0 0 6 10" fill="none" width="6" height="10">
          <path d="M1 1l4 4-4 4" stroke="currentColor" stroke-width="1.4"
            stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="nd-bc-item nd-bc-current">{{ article.title }}</span>
      </div>

      <div class="nd-nav-actions">
        <button class="nd-action-btn" title="打印" @click="window.print()">
          <svg viewBox="0 0 18 18" fill="none" width="16" height="16">
            <rect x="3" y="6" width="12" height="8" rx="1.5" stroke="currentColor" stroke-width="1.4"/>
            <path d="M6 6V3a.5.5 0 01.5-.5h5a.5.5 0 01.5.5v3" stroke="currentColor" stroke-width="1.4"/>
            <path d="M6 12h6M6 14.5h4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
            <circle cx="13.5" cy="9" r="1" fill="currentColor"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- ══ 主体内容区 ══ -->
    <div class="nd-body">
      <div class="nd-container">

        <!-- 文章头部 -->
        <div class="nd-article-head">
          <div class="nd-meta-top">
            <span class="nd-source-tag" :class="`nd-source-tag--${sourceKey}`">
              {{ sourceLabel }}
            </span>
            <span v-if="article.category" class="nd-cat-tag">{{ article.category }}</span>
          </div>

          <h1 class="nd-title">{{ article.title }}</h1>

          <div class="nd-meta-row">
            <div class="nd-meta-item">
              <svg viewBox="0 0 16 16" fill="none" width="13" height="13">
                <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" stroke-width="1.3"/>
                <path d="M5 1v3M11 1v3M2 7h12" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
              </svg>
              {{ formattedDate }}
            </div>
            <div v-if="article.department || article.company" class="nd-meta-item">
              <svg viewBox="0 0 16 16" fill="none" width="13" height="13">
                <path d="M3 14V5a2 2 0 012-2h6a2 2 0 012 2v9M1 14h14" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
                <rect x="6" y="9" width="4" height="5" rx=".5" stroke="currentColor" stroke-width="1.3"/>
              </svg>
              {{ article.department || article.company }}
            </div>
            <div class="nd-meta-item nd-meta-item--views">
              <svg viewBox="0 0 16 16" fill="none" width="13" height="13">
                <path d="M1 8C2.5 4 5 2.5 8 2.5S13.5 4 15 8c-1.5 4-4 5.5-7 5.5S2.5 12 1 8z"
                  stroke="currentColor" stroke-width="1.3"/>
                <circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.3"/>
              </svg>
              {{ viewCount }} 次阅读
            </div>
          </div>

          <div class="nd-divider"/>
        </div>

        <!-- 正文区 -->
        <div class="nd-article-body">
          <!-- 摘要 -->
          <div v-if="article.summary" class="nd-summary">
            <div class="nd-summary-label">摘要</div>
            <div class="nd-summary-text">{{ article.summary }}</div>
          </div>

          <!-- 正文 HTML（mock 内容，接口对接后替换） -->
          <div class="nd-content" v-html="article.content || FALLBACK_CONTENT" />
        </div>

        <!-- 附件区 -->
        <div v-if="article.attachments?.length" class="nd-attachments">
          <div class="nd-att-hd">
            <svg viewBox="0 0 16 16" fill="none" width="14" height="14">
              <path d="M12.5 7L7 12.5a4 4 0 01-5.657-5.657l6-6a2.5 2.5 0 013.535 3.535L5.121 10.12a1 1 0 01-1.414-1.414L9.5 3"
                stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
            </svg>
            附件（{{ article.attachments.length }}）
          </div>
          <div class="nd-att-list">
            <div v-for="f in article.attachments" :key="f.name" class="nd-att-item">
              <div class="nd-att-icon">
                <svg viewBox="0 0 16 16" fill="none" width="16" height="16">
                  <rect x="3" y="1" width="10" height="14" rx="2" stroke="currentColor" stroke-width="1.3"/>
                  <path d="M6 5h4M6 8h4M6 11h2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
                </svg>
              </div>
              <div class="nd-att-info">
                <span class="nd-att-name">{{ f.name }}</span>
                <span class="nd-att-size">{{ fmtSize(f.size) }}</span>
              </div>
              <div class="nd-att-actions">
                <button class="nd-att-btn nd-att-btn--view" @click="viewFile(f)">
                  <svg viewBox="0 0 14 10" fill="none" width="13" height="10">
                    <path d="M1 5C2.5 2 4.5.5 7 .5S11.5 2 13 5c-1.5 3-3.5 4.5-6 4.5S2.5 8 1 5z"
                      stroke="currentColor" stroke-width="1.3"/>
                    <circle cx="7" cy="5" r="1.8" stroke="currentColor" stroke-width="1.3"/>
                  </svg>
                  查看
                </button>
                <button class="nd-att-btn nd-att-btn--dl" @click="downloadFile(f)">
                  <svg viewBox="0 0 14 14" fill="none" width="13" height="13">
                    <path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="currentColor" stroke-width="1.4"
                      stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  下载
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 相关文章 -->
        <div v-if="relatedList.length" class="nd-related">
          <div class="nd-related-hd">相关文章</div>
          <div class="nd-related-list">
            <button
              v-for="r in relatedList"
              :key="r.id"
              class="nd-related-item"
              @click="navigateTo(r)"
            >
              <span class="nd-related-dot"/>
              <span class="nd-related-title">{{ r.title }}</span>
              <span class="nd-related-date">{{ r.date }}</span>
            </button>
          </div>
        </div>

        <!-- 底部操作栏 -->
        <div class="nd-footer">
          <button class="nd-footer-back" @click="goBack">
            <svg viewBox="0 0 8 14" fill="none" width="8" height="14">
              <path d="M7 1L1 7l6 6" stroke="currentColor" stroke-width="1.8"
                stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            返回
          </button>
          <button class="nd-footer-btn" @click="scrollToTop">回到顶部 ↑</button>
        </div>

      </div>
    </div>

  </div>
</template>

<script setup>
/**
 * NewsDetail.vue — 新闻 / 资源详情独立路由页
 *
 * 路由注册示例：
 *   {
 *     path: '/news-detail',
 *     name: 'NewsDetail',
 *     component: () => import('/@/views/home/NewsDetail.vue'),
 *   }
 *
 * 跳转方式：
 *   router.push({
 *     name: 'NewsDetail',
 *     query: {
 *       id:     item.id,
 *       source: 'regulation',         // SOURCE_MAP 的 key
 *       // related 通过 JSON 序列化传入，或改用 store / sessionStorage
 *       related: JSON.stringify(siblings.map(s => ({ id: s.id, title: s.title, date: s.date }))),
 *     }
 *   })
 *
 * TODO: 接口对接后，将 MOCK_ARTICLES 替换为真实 API 调用（按 id 拉取详情）。
 */
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const route  = useRoute()
const router = useRouter()

// ── 路由参数 ──────────────────────────────────────
const articleId = computed(() => String(route.query.id ?? ''))
const sourceKey = computed(() => String(route.query.source ?? 'resource'))
const relatedRaw = computed(() => {
  try { return JSON.parse(route.query.related || '[]') } catch { return [] }
})

// ── 来源标签映射 ──────────────────────────────────
const SOURCE_MAP = {
  resource:   '资源共享',
  company:    '企业动态',
  regulation: '制度文件',
  speech:     '重要讲话',
  report:     '工作报告',
  training:   '培训材料',
  notice:     '通知公告',
  special:    '专项行动',
}
const sourceLabel = computed(() => SOURCE_MAP[sourceKey.value] ?? '资讯')

// ── Mock 文章数据（接口对接后用 API 替换）────────────
// TODO: const { data } = await useFetch(`/api/news/${articleId.value}`)
const MOCK_ARTICLES = {
  // ── 资源共享 ──
  '1': {
    id: 1, title: '2025年12月份整治争秀文化工作制度',
    department: '巡察办', date: '12-30',
    summary: '本制度旨在规范2025年12月巡察工作中的廉洁文化建设要求，明确各责任主体的履职边界。',
    content: `
      <h2>一、总则</h2>
      <p>为深入推进廉洁文化建设，根据上级有关部署，结合本单位实际，制定本制度。</p>
      <h2>二、主要内容</h2>
      <p>各部门须在本月内完成廉洁文化学习教育活动，重点围绕以下三个方面开展：</p>
      <ol>
        <li>组织全体干部职工参加廉洁从业专题培训，培训时长不少于4课时；</li>
        <li>开展廉洁文化主题征文或演讲活动，每单位提交不少于2篇优秀作品；</li>
        <li>完善廉洁风险防控台账，对新增高风险岗位进行登记备案。</li>
      </ol>
      <h2>三、工作要求</h2>
      <p>各单位须于本月25日前将活动开展情况总结报送巡察办，逾期未报视为未完成。</p>
      <blockquote>本制度自发布之日起执行，由巡察工作领导小组办公室负责解释。</blockquote>
    `,
  },
  '6': {
    id: 6, title: '巡察工作保密规定及操作规程',
    department: '办公室', date: '05-10',
    summary: '本规程规定了巡察工作全过程的保密要求，适用于巡察准备、实施、反馈各阶段。',
    content: `
      <h2>第一章 总则</h2>
      <p>为维护巡察工作秩序，防止巡察信息泄露，依据有关保密法规，制定本规定。</p>
      <h2>第二章 保密范围</h2>
      <p>下列事项属于巡察工作秘密：</p>
      <ol>
        <li>巡察对象名单及巡察时间安排；</li>
        <li>巡察工作方案及重点检查事项；</li>
        <li>巡察过程中掌握的问题线索及证据材料；</li>
        <li>巡察报告及反馈意见。</li>
      </ol>
      <h2>第三章 操作规程</h2>
      <p>巡察人员须严格遵守：不得在非保密场所讨论巡察工作；不得使用个人设备存储巡察材料；不得向无关人员透露巡察进展。</p>
    `,
  },
  '7': {
    id: 7, title: '书记在2025年巡察工作会议上的讲话',
    department: '党委', date: '01-15',
    summary: '书记就深化政治巡察、强化整改落实、压实主体责任等问题作出重要指示。',
    content: `
      <p>同志们：</p>
      <p>今天，我们召开2025年度巡察工作会议，主要任务是总结2024年工作，部署2025年重点任务。</p>
      <h2>一、2024年工作成效</h2>
      <p>过去一年，巡察工作取得了积极成效。全年完成巡察计划28项，整改率达到96%，较上年提升3个百分点。</p>
      <h2>二、2025年重点任务</h2>
      <p>2025年，我们要重点做好以下几项工作：</p>
      <ol>
        <li><strong>深化政治巡察</strong>：紧紧围绕"两个维护"，聚焦政治问题，发挥政治监督作用；</li>
        <li><strong>强化整改落实</strong>：建立整改台账，逐项对账销号，确保整改工作见底见效；</li>
        <li><strong>压实主体责任</strong>：各级党委要把巡察工作纳入党建考核，一级抓一级，层层传导压力。</li>
      </ol>
      <blockquote>巡察工作任重道远，要以高度的政治责任感，扎实推进各项工作落实。</blockquote>
    `,
  },
  '11': {
    id: 11, title: '中央巡视组2024年度工作报告要点',
    department: '纪委', date: '11-10',
    summary: '本报告提炼了中央巡视组2024年度工作的主要成效、典型做法及下一步部署要求。',
    content: `
      <h2>一、2024年主要工作成效</h2>
      <p>2024年，中央巡视组共完成多轮次巡视工作，覆盖单位范围进一步扩大，发现问题数量同比增加，推动解决重大问题若干件。</p>
      <h2>二、典型经验做法</h2>
      <p>各巡视组在工作中积累了宝贵经验，主要包括：坚持政治巡视定位、注重发现问题线索、强化成果运用转化三个方面。</p>
      <h2>三、2025年工作要求</h2>
      <p>2025年，各地区各部门要认真落实巡视整改要求，确保问题件件有着落、条条有回音。</p>
    `,
  },
  '14': {
    id: 14, title: '关于开展2025年专项巡察工作的通知',
    department: '党委', date: '12-25',
    summary: '本通知明确了2025年专项巡察的工作目标、范围对象、时间安排和工作要求。',
    content: `
      <p>各单位：</p>
      <p>根据年度工作部署，经研究决定，于2025年开展专项巡察工作。现将有关事项通知如下。</p>
      <h2>一、工作目标</h2>
      <p>通过专项巡察，深入了解各单位贯彻落实党中央决策部署情况，推动全面从严治党向纵深发展。</p>
      <h2>二、巡察对象</h2>
      <p>本次专项巡察对象为集团公司所属各一级单位，共计6个。</p>
      <h2>三、时间安排</h2>
      <p>专项巡察工作于2025年3月启动，6月底前全部完成。</p>
      <h2>四、工作要求</h2>
      <p>各单位要高度重视、积极配合，如实反映情况，不得干扰巡察工作正常开展。</p>
    `,
  },
  // ── 企业动态 ──
  '3': {
    id: 3, title: '2025年度航飞公司巡察工作全面启动',
    company: '航飞', date: '02-28',
    summary: '2025年度巡察工作正式启动，将重点检查党委主体责任落实、干部选拔用人、资产管理等情况。',
    content: `
      <p>2025年2月28日，航飞公司2025年度巡察工作正式启动。本次巡察为期约3个月，将重点检查以下方面：</p>
      <ol>
        <li>党委班子贯彻执行党的路线方针政策情况；</li>
        <li>党风廉政建设和反腐败工作情况；</li>
        <li>干部选拔任用工作情况；</li>
        <li>国有资产管理和财务资金使用情况。</li>
      </ol>
      <p>请各部门积极配合，如实反映情况。</p>
    `,
  },
  '5': {
    id: 5, title: '长飞公司2025年巡察工作部署会召开',
    company: '长飞', date: '03-12',
    content: `
      <p>3月12日，长飞公司召开2025年巡察工作部署会，传达了上级巡察工作要求，明确了本年度巡察重点和时间节点，各部门负责人参加会议并表态发言。</p>
      <h2>主要部署内容</h2>
      <ol>
        <li>全面启动新一轮巡察工作，4月底前完成进驻准备；</li>
        <li>持续跟进上轮整改落实，确保5月底前完成剩余整改事项；</li>
        <li>加强日常监督，每月上报一次监督工作动态。</li>
      </ol>
    `,
  },
}

// ── 当前文章（优先 mock，fallback 用 query 中的基础字段）──
const article = computed(() => {
  const mock = MOCK_ARTICLES[articleId.value]
  if (mock) return mock
  // 接口对接前，用路由传参里的基础信息兜底
  return {
    id:         articleId.value,
    title:      route.query.title  ?? '文章详情',
    date:       route.query.date   ?? '',
    department: route.query.dept   ?? '',
    company:    route.query.co     ?? '',
    content:    null,
  }
})

// ── 无 content 时的兜底正文 ──
const FALLBACK_CONTENT = `
  <p>本文内容暂未录入，接口对接后将显示完整正文。</p>
  <p>如需查阅原文，请联系发布单位获取相关文件。</p>
`

// ── 相关文章（来自路由 query.related 或 mock 同来源条目）──
const relatedList = computed(() => relatedRaw.value.slice(0, 5))

// ── 日期格式化 ──
const formattedDate = computed(() => {
  const d = article.value.date || ''
  if (!d) return '—'
  if (/^\d{4}-\d{2}-\d{2}/.test(d)) {
    const [y, m, day] = d.split('-')
    return `${y}年${m}月${day}日`
  }
  if (/^\d{2}-\d{2}$/.test(d)) return `2025年${d.replace('-', '月')}日`
  return d
})

// ── 模拟阅读量 ──
const viewCount = computed(() => (Number(articleId.value) || 1) * 137 % 900 + 100)

// ── 导航 ──
function goBack() { router.back() }

function navigateTo(r) {
  router.push({
    name:  'NewsDetail',
    query: {
      id:      r.id,
      source:  sourceKey.value,
      related: route.query.related ?? '[]',
    },
  })
}

// ── 附件操作 ──
function viewFile(f) {
  if (f.url) window.open(f.url, '_blank')
  else ElMessage.info('文件暂不可预览')
}
function downloadFile(f) {
  if (!f.url) { ElMessage.info('暂无下载地址'); return }
  const a = document.createElement('a')
  a.href = f.url; a.download = f.name || 'file'; a.target = '_blank'
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
}
function fmtSize(b) {
  if (!b) return ''
  if (b < 1024)    return b + ' B'
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB'
  return (b / 1048576).toFixed(1) + ' MB'
}
function scrollToTop() {
  document.querySelector('.nd-body')?.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<style scoped>
.nd-page {
  min-height: 100vh;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', sans-serif;
}

/* ══ 顶部导航栏 ══════════════════════════════════ */
.nd-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 24px;
  height: 52px;
  background: #fff;
  border-bottom: 1px solid #eee;
  flex-shrink: 0;
  box-shadow: 0 1px 4px rgba(0,0,0,.04);
}

.nd-back {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 6px 14px 6px 10px;
  border: 1.5px solid #e4e7ed;
  border-radius: 20px;
  background: #fff;
  color: #4e5969;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
  flex-shrink: 0;
  transition: border-color .12s, color .12s, background .12s;
}
.nd-back:hover { border-color: #c62f2f; color: #c62f2f; background: #fff1f0; }

.nd-breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
  overflow: hidden;
}
.nd-bc-item { font-size: 12px; color: #86909c; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.nd-bc-root { flex-shrink: 0; }
.nd-bc-current { color: #1d2129; font-weight: 500; max-width: 360px; }
.nd-bc-sep { color: #c0c4cc; flex-shrink: 0; }

.nd-nav-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
.nd-action-btn {
  width: 32px; height: 32px; border-radius: 8px;
  border: 1px solid #e4e7ed; background: transparent; color: #86909c;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: border-color .12s, color .12s, background .12s;
}
.nd-action-btn:hover { border-color: #c62f2f; color: #c62f2f; background: #fff1f0; }

/* ══ 主体滚动区 ══════════════════════════════════ */
.nd-body { flex: 1; overflow-y: auto; overflow-x: hidden; }
.nd-body::-webkit-scrollbar { width: 6px; }
.nd-body::-webkit-scrollbar-thumb { background: #ddd; border-radius: 3px; }
.nd-body::-webkit-scrollbar-thumb:hover { background: #c0c4cc; }

.nd-container {
  max-width: 860px;
  margin: 0 auto;
  padding: 36px 24px 48px;
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* ══ 文章头部 ════════════════════════════════════ */
.nd-meta-top { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; }

.nd-source-tag {
  display: inline-flex; align-items: center;
  padding: 3px 12px; border-radius: 20px;
  font-size: 11px; font-weight: 700; letter-spacing: .3px;
}
.nd-source-tag--resource,
.nd-source-tag--regulation { background: #fff1f0; color: #c62f2f; border: 1px solid #ffd5d5; }
.nd-source-tag--company    { background: #edf2ff; color: #3370ff; border: 1px solid #c5d8ff; }
.nd-source-tag--speech     { background: #fffbf0; color: #b7641a; border: 1px solid #ffe0b0; }
.nd-source-tag--report     { background: #f0fdf4; color: #27ae60; border: 1px solid #b7ebc9; }
.nd-source-tag--training   { background: #f3f0ff; color: #6741d9; border: 1px solid #d4c8ff; }
.nd-source-tag--notice     { background: #fff0fa; color: #c2185b; border: 1px solid #f8bbd0; }
.nd-source-tag--special    { background: #fff8f0; color: #e65100; border: 1px solid #ffcc80; }

.nd-cat-tag {
  padding: 3px 10px; border-radius: 20px;
  font-size: 11px; font-weight: 600;
  background: #f4f5f7; color: #86909c; border: 1px solid #e4e7ed;
}

.nd-title {
  margin: 0 0 16px;
  font-size: 26px; font-weight: 800; color: #1d2129;
  line-height: 1.4; letter-spacing: -.4px;
}

.nd-meta-row {
  display: flex; align-items: center; gap: 18px; flex-wrap: wrap;
  margin-bottom: 20px;
}
.nd-meta-item { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; color: #86909c; }
.nd-meta-item svg { color: #c0c4cc; flex-shrink: 0; }
.nd-meta-item--views { margin-left: auto; }

.nd-divider { height: 1px; background: linear-gradient(90deg, #e4e7ed 0%, transparent 100%); margin-bottom: 28px; }

/* ══ 正文区 ══════════════════════════════════════ */
.nd-article-body { margin-bottom: 32px; }

.nd-summary {
  display: flex; gap: 12px;
  padding: 14px 18px;
  background: #f0f4ff; border-left: 3px solid #3370ff;
  border-radius: 0 10px 10px 0; margin-bottom: 24px;
}
.nd-summary-label { flex-shrink: 0; font-size: 11px; font-weight: 700; color: #3370ff; padding-top: 2px; }
.nd-summary-text  { font-size: 13px; line-height: 1.8; color: #4e5969; }

.nd-content { font-size: 15px; line-height: 2; color: #1d2129; }
.nd-content :deep(p)  { margin: 0 0 14px; text-indent: 2em; }
.nd-content :deep(h2) {
  font-size: 18px; font-weight: 700; color: #1d2129;
  margin: 28px 0 12px; padding-bottom: 8px;
  border-bottom: 2px solid #f0f0f0; text-indent: 0;
}
.nd-content :deep(h3) { font-size: 15px; font-weight: 700; color: #1d2129; margin: 20px 0 8px; text-indent: 0; }
.nd-content :deep(ol),
.nd-content :deep(ul) { padding-left: 1.8em; margin: 0 0 14px; }
.nd-content :deep(li) { margin-bottom: 6px; line-height: 1.8; text-indent: 0; }
.nd-content :deep(strong) { font-weight: 700; color: #1d2129; }
.nd-content :deep(blockquote) {
  margin: 16px 0; padding: 12px 16px;
  background: #fafbfc; border-left: 3px solid #c62f2f;
  border-radius: 0 8px 8px 0; color: #4e5969; font-size: 14px;
}
.nd-content :deep(table) { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
.nd-content :deep(th),
.nd-content :deep(td)    { padding: 10px 14px; border: 1px solid #e4e7ed; text-align: left; }
.nd-content :deep(th)    { background: #fafbfc; font-weight: 600; color: #4e5969; }
.nd-content :deep(tr:hover td) { background: #fafbfc; }

/* ══ 附件区 ══════════════════════════════════════ */
.nd-attachments { background: #fff; border: 1px solid #e4e7ed; border-radius: 12px; overflow: hidden; margin-bottom: 24px; }
.nd-att-hd {
  display: flex; align-items: center; gap: 7px;
  padding: 12px 16px; background: #fafbfc;
  border-bottom: 1px solid #e4e7ed;
  font-size: 13px; font-weight: 700; color: #1d2129;
}
.nd-att-hd svg { color: #86909c; }
.nd-att-list { display: flex; flex-direction: column; }
.nd-att-item {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 16px; border-bottom: 1px solid #f0f0f0;
  transition: background .12s;
}
.nd-att-item:last-child { border-bottom: none; }
.nd-att-item:hover { background: #fafbfc; }
.nd-att-icon { width: 34px; height: 34px; border-radius: 8px; background: #edf2ff; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #3370ff; }
.nd-att-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.nd-att-name { font-size: 13px; font-weight: 500; color: #1d2129; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.nd-att-size { font-size: 11px; color: #86909c; }
.nd-att-actions { display: flex; gap: 6px; flex-shrink: 0; }
.nd-att-btn { display: inline-flex; align-items: center; gap: 4px; padding: 5px 12px; border-radius: 6px; font-size: 12px; font-weight: 500; cursor: pointer; font-family: inherit; transition: background .12s; border: 1px solid; }
.nd-att-btn--view { color: #3370ff; border-color: #c5d8ff; background: #edf2ff; }
.nd-att-btn--view:hover { background: #d8e5ff; }
.nd-att-btn--dl   { color: #27ae60; border-color: #b7ebc9; background: #f0fdf4; }
.nd-att-btn--dl:hover { background: #d5f5e3; }

/* ══ 相关文章 ════════════════════════════════════ */
.nd-related { background: #fff; border: 1px solid #e4e7ed; border-radius: 12px; overflow: hidden; margin-bottom: 32px; }
.nd-related-hd { padding: 12px 16px; background: #fafbfc; border-bottom: 1px solid #e4e7ed; font-size: 13px; font-weight: 700; color: #1d2129; }
.nd-related-list { display: flex; flex-direction: column; }
.nd-related-item {
  display: flex; align-items: center; gap: 10px;
  padding: 11px 16px; border-bottom: 1px solid #f0f0f0;
  background: transparent; border-left: none; border-right: none; border-top: none;
  cursor: pointer; font-family: inherit; text-align: left;
  transition: background .12s;
}
.nd-related-item:last-child { border-bottom: none; }
.nd-related-item:hover { background: #fafbfc; }
.nd-related-item:hover .nd-related-title { color: #c62f2f; }
.nd-related-dot { width: 5px; height: 5px; border-radius: 50%; background: #c62f2f; flex-shrink: 0; opacity: .5; }
.nd-related-title { flex: 1; min-width: 0; font-size: 13px; color: #1d2129; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; transition: color .12s; }
.nd-related-date { font-size: 11px; color: #86909c; flex-shrink: 0; }

/* ══ 底部操作栏 ══════════════════════════════════ */
.nd-footer { display: flex; align-items: center; justify-content: space-between; padding-top: 20px; border-top: 1px solid #e4e7ed; }
.nd-footer-back {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 8px 18px 8px 12px; border: 1.5px solid #e4e7ed; border-radius: 20px;
  background: #fff; color: #4e5969; font-size: 13px; font-weight: 600;
  cursor: pointer; font-family: inherit;
  transition: border-color .12s, color .12s, background .12s;
}
.nd-footer-back:hover { border-color: #c62f2f; color: #c62f2f; background: #fff1f0; }
.nd-footer-btn {
  padding: 7px 16px; border: 1px solid #e4e7ed; border-radius: 20px;
  background: #fff; color: #86909c; font-size: 12px;
  cursor: pointer; font-family: inherit;
  transition: all .12s;
}
.nd-footer-btn:hover { border-color: #c62f2f; color: #c62f2f; background: #fff1f0; }
</style>