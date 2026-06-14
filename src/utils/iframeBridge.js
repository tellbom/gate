/**
 * iframeBridge.js — 轻量 postMessage 通信（Parent 侧）
 *
 * Child → Parent 主动推送：
 *   { type: 'WF_EVENT', event: 'formLoading' }
 *   { type: 'WF_EVENT', event: 'formReady', payload: { variables?: Record<string, any> } }
 *   { type: 'WF_EVENT', event: 'formError', payload: { reason?: string } }
 *
 * 三方表单不实现协议时，parent 收不到任何消息，同意按钮全程可点。
 */

/**
 * 订阅来自指定 iframe 的 WF_EVENT 事件。
 *
 * @param {HTMLIFrameElement} iframeEl
 * @param {string} eventName
 * @param {(payload: any) => void} handler
 * @returns {() => void}
 */
export function onIframeEvent(iframeEl, eventName, handler) {
  function listener(event) {
    if (iframeEl && event.source !== iframeEl.contentWindow) return

    const data = event.data
    if (data?.type === 'WF_EVENT' && data.event === eventName) {
      handler(data.payload ?? {})
    }
  }

  window.addEventListener('message', listener)
  return () => window.removeEventListener('message', listener)
}
