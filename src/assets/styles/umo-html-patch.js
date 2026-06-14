/**
 * umo-html-patch.js
 *
 * UMO Editor 富文本输出的 DOM 补丁工具。
 *
 * 职责：对 v-html 渲染出来的 UMO HTML 内容执行一次性 DOM 修补，
 * 使附件节点、视频节点等无法纯 CSS 处理的结构变为可交互的真实 DOM。
 *
 * 使用方式（业务组件里只需这两步，不得在组件内写任何富文本相关样式）：
 *
 *   import { patchUmoHtml } from '/@/assets/styles/umo-html-patch.js'
 *
 *   const contentRef = ref(null)
 *   watch(() => props.content, () => nextTick(() => patchUmoHtml(contentRef.value)), { immediate: true })
 *
 * 所有样式统一在 umo-html-output.css 中维护，本文件不包含任何样式定义。
 */

/**
 * 对富文本容器执行 DOM 补丁。
 * 幂等：同一节点只处理一次（通过 el._umoPatched 标记）。
 *
 * @param {HTMLElement|null} root  v-html 挂载的容器元素
 */
export function patchUmoHtml(root) {
  if (!root) return
  _patchAttachments(root)
  _patchVideos(root)
}

// ─────────────────────────────────────────────────────────────────────────────
//  私有：附件节点补丁
//  UMO 序列化：<div data-type="attachment" data-url="..." data-name="..." data-size="...">
//  补丁后：原地替换为 <a class="umo-att-card" href="..." download="...">
//  样式全部由 umo-html-output.css 中的 .umo-att-card 系列规则控制。
// ─────────────────────────────────────────────────────────────────────────────
function _patchAttachments(root) {
  root.querySelectorAll('[data-type="attachment"]').forEach(el => {
    if (el._umoPatched) return
    el._umoPatched = true

    const url  = el.getAttribute('data-url')  || ''
    const name = el.getAttribute('data-name') || '未知文件'
    const size = parseInt(el.getAttribute('data-size') || '0', 10)
    const sizeStr = _fmtSize(size)

    const a = document.createElement('a')
    a.href      = url
    a.download  = name
    a.target    = '_blank'
    a.rel       = 'noopener noreferrer'
    a.className = 'umo-att-card'

    // innerHTML 只包含结构和 class，不内联任何 style
    // 所有视觉样式均由 umo-html-output.css 负责
    a.innerHTML = `
      <span class="umo-att-icon-wrap">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
                stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          <polyline points="14 2 14 8 20 8"
                    stroke="currentColor" stroke-width="1.8"
                    stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
      <span class="umo-att-info">
        <span class="umo-att-name" title="${_esc(name)}">${_esc(name)}</span>
        ${sizeStr ? `<span class="umo-att-size">${sizeStr}</span>` : ''}
      </span>
      <span class="umo-att-dl" aria-label="下载 ${_esc(name)}">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
                stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round"/>
          <polyline points="7 10 12 15 17 10"
                    stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round"/>
          <line x1="12" y1="15" x2="12" y2="3"
                stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        下载
      </span>`

    el.parentNode.replaceChild(a, el)
  })
}

// ─────────────────────────────────────────────────────────────────────────────
//  私有：视频节点补丁
//  UMO 序列化：<div data-type="video" data-src="...">
//  补丁后：向 div 内注入 <video controls> 标签
//  .umo-html-body video 样式由 umo-html-output.css 控制。
// ─────────────────────────────────────────────────────────────────────────────
function _patchVideos(root) {
  root.querySelectorAll('[data-type="video"]').forEach(el => {
    if (el._umoPatched) return
    el._umoPatched = true

    const src = el.getAttribute('data-src')
    if (!src) return

    const video = document.createElement('video')
    video.src      = src
    video.controls = true
    // 不内联 style，由 umo-html-output.css 的 .umo-html-body video 规则控制

    el.innerHTML = ''
    el.appendChild(video)
  })
}

// ─────────────────────────────────────────────────────────────────────────────
//  工具函数
// ─────────────────────────────────────────────────────────────────────────────

/** 文件大小格式化 */
function _fmtSize(bytes) {
  if (!bytes || bytes <= 0) return ''
  if (bytes < 1024)         return bytes + ' B'
  if (bytes < 1024 * 1024)  return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

/** HTML 特殊字符转义，防止 innerHTML 注入 */
function _esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}