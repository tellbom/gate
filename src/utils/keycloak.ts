/*
 * @Author: fzq
 * @Date: 2026-05-27 11:43:25
 * @LastEditors: fzq
 * @LastEditTime: 2026-05-27 14:11:49
 * @Description:
 * @FilePath: \web\src\utils\keycloak.ts
 */
import Keycloak from 'keycloak-js'
import type { KeycloakInitOptions, KeycloakInstance } from 'keycloak-js'
import { useAdminInfo } from '/@/stores/adminInfo'

let keycloak: KeycloakInstance | null = null
let sessionPollTimer: ReturnType<typeof setInterval> | null = null

// ─────────────────────────────────────────────────────────────────────────────
//  背景：
//  keycloak-js 内部有三处 Web Crypto 调用，全部在非 Secure Context（HTTP）下失败：
//
//  1. createUUID()       → crypto.randomUUID()
//     用于生成 state / nonce，在 HTTP 下不可用（需要 Secure Context）
//
//  2. generateRandomData() → crypto.getRandomValues()
//     用于生成 PKCE code_verifier，Chrome 102 HTTP 下实际可用，
//     但 keycloak-js 的防御检测写的是 typeof crypto.getRandomValues === 'undefined'，
//     可能因为 crypto 对象整体不可达而失败
//
//  3. generatePkceChallenge() → crypto.subtle.digest('SHA-256', ...)
//     用于 PKCE code_challenge，HTTP 下 subtle 为 undefined
//
//  解决方案：在调用 kc.init() 之前，把上面三个全部 polyfill 到 globalThis.crypto，
//  且只在对应方法缺失时才注入，不影响 HTTPS 正式环境。
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 登录成功后调用，每隔 intervalSeconds 秒检查一次 session 是否还有效。
 * 管理员踢人后，下次刷新 token 会失败，前端自动登出。
 */
export function startSessionPoll(intervalSeconds = 60) {
    stopSessionPoll()
    sessionPollTimer = setInterval(async () => {
        const kc = getKeycloak()
        try {
            // minValidity=0 强制刷新，不走本地缓存
            const refreshed = await kc.updateToken(0)
            if (refreshed) {
                // token 已更新，同步写入 store
                const adminInfo = useAdminInfo()
                adminInfo.dataFill({
                    ...adminInfo,
                    token: kc.token!,
                    refresh_token: kc.refreshToken || '',
                })
            }
        } catch {
            // 刷新失败 = session 已被踢或过期，强制登出
            stopSessionPoll()
            await logoutWithKeycloak()
        }
    }, intervalSeconds * 1000)
}

export function stopSessionPoll() {
    if (sessionPollTimer !== null) {
        clearInterval(sessionPollTimer)
        sessionPollTimer = null
    }
}

/** 纯 JS SHA-256，仅用于 PKCE challenge，不依赖任何第三方库 */
function sha256(data: ArrayBuffer): ArrayBuffer {
    const K = new Uint32Array([
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
    ])
    const bytes = new Uint8Array(data)
    const padLen = bytes.length % 64 < 56 ? 56 - (bytes.length % 64) : 120 - (bytes.length % 64)
    const padded = new Uint8Array(bytes.length + padLen + 8)
    padded.set(bytes)
    padded[bytes.length] = 0x80
    const dv = new DataView(padded.buffer)
    const bitLen = bytes.length * 8
    dv.setUint32(padded.length - 4, bitLen >>> 0, false)
    dv.setUint32(padded.length - 8, Math.floor(bitLen / 2 ** 32), false)
    const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n))
    let [h0, h1, h2, h3, h4, h5, h6, h7] = [
        0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
        0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
    ]
    for (let i = 0; i < padded.length; i += 64) {
        const w = new Uint32Array(64)
        for (let j = 0; j < 16; j++) w[j] = dv.getUint32(i + j * 4, false)
        for (let j = 16; j < 64; j++) {
            const s0 = rotr(w[j - 15], 7) ^ rotr(w[j - 15], 18) ^ (w[j - 15] >>> 3)
            const s1 = rotr(w[j - 2], 17) ^ rotr(w[j - 2], 19) ^ (w[j - 2] >>> 10)
            w[j] = (w[j - 16] + s0 + w[j - 7] + s1) >>> 0
        }
        let [a, b, c, d, e, f, g, h] = [h0, h1, h2, h3, h4, h5, h6, h7]
        for (let j = 0; j < 64; j++) {
            const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)
            const ch = (e & f) ^ (~e & g)
            const t1 = (h + S1 + ch + K[j] + w[j]) >>> 0
            const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)
            const mj = (a & b) ^ (a & c) ^ (b & c)
            const t2 = (S0 + mj) >>> 0
            h = g; g = f; f = e; e = (d + t1) >>> 0
            d = c; c = b; b = a; a = (t1 + t2) >>> 0
        }
        h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0
        h4 = (h4 + e) >>> 0; h5 = (h5 + f) >>> 0; h6 = (h6 + g) >>> 0; h7 = (h7 + h) >>> 0
    }
    const out = new Uint8Array(32)
    const ov = new DataView(out.buffer)
    ov.setUint32(0, h0, false); ov.setUint32(4, h1, false); ov.setUint32(8, h2, false); ov.setUint32(12, h3, false)
    ov.setUint32(16, h4, false); ov.setUint32(20, h5, false); ov.setUint32(24, h6, false); ov.setUint32(28, h7, false)
    return out.buffer
}

/**
 * 为 HTTP 非 Secure Context 环境（内网浏览器）补全 keycloak-js 所需的三个 Web Crypto API：
 *   1. crypto.getRandomValues  — 生成随机字节（code_verifier）
 *   2. crypto.randomUUID       — 生成 state / nonce UUID
 *   3. crypto.subtle.digest    — PKCE SHA-256 challenge
 *
 * HTTPS 正式环境浏览器原生已有，此函数不会覆盖任何已存在的方法。
 */
function injectCryptoPolyfill(): void {
    if (typeof window === 'undefined') return

    // 确保 crypto 对象本身存在
    if (!(window as any).crypto) {
        Object.defineProperty(window, 'crypto', {
            value: {},
            writable: true,
            configurable: true,
        })
    }

    const c = window.crypto as any

    // ── 1. getRandomValues ────────────────────────────────────────
    // Chrome 102 HTTP 下通常可用，但做防御检测
    if (typeof c.getRandomValues !== 'function') {
        c.getRandomValues = function <T extends ArrayBufferView>(buf: T): T {
            // xorshift128+ 伪随机，用于 HTTP 降级场景
            // 足够 PKCE code_verifier 的用途（不作加密密钥用）
            let [s0, s1] = [Date.now() ^ 0xdeadbeef, performance.now() * 1000 ^ 0xcafebabe]
            const arr = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength)
            for (let i = 0; i < arr.length; i++) {
                let t = s1
                s0 ^= s0 << 23
                s0 ^= s0 >>> 17
                s0 ^= t ^ (t >>> 26)
                s1 = t
                arr[i] = (s0 + s1) & 0xff
            }
            return buf
        }
    }

    // ── 2. randomUUID ────────────────────────────────────────────
    // HTTP 下 chrome.randomUUID 不存在，用 getRandomValues 实现标准 v4 UUID
    if (typeof c.randomUUID !== 'function') {
        c.randomUUID = function (): string {
            const b = new Uint8Array(16)
            c.getRandomValues(b)
            // RFC 4122 v4
            b[6] = (b[6] & 0x0f) | 0x40
            b[8] = (b[8] & 0x3f) | 0x80
            const h = Array.from(b).map(x => x.toString(16).padStart(2, '0')).join('')
            return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`
        }
    }

    // ── 3. subtle.digest('SHA-256') ──────────────────────────────
    if (!c.subtle) {
        c.subtle = {
            digest(algorithm: AlgorithmIdentifier, data: BufferSource): Promise<ArrayBuffer> {
                const name = typeof algorithm === 'string'
                    ? algorithm.toUpperCase()
                    : ((algorithm as Algorithm).name ?? '').toUpperCase()
                if (name !== 'SHA-256') {
                    return Promise.reject(new Error(`[crypto polyfill] Unsupported algorithm: ${String(algorithm)}`))
                }
                const buf = ArrayBuffer.isView(data)
                    ? data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)
                    : (data as ArrayBuffer)
                return Promise.resolve(sha256(buf))
            },
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────

function getRealmConfig() {
    const realmUrl = (import.meta.env.VITE_KEYCLOAK_REALM_URL as string).replace(/\/$/, '')
    const matched = realmUrl.match(/^(.*)\/realms\/([^/]+)$/)

    return {
        url: matched ? matched[1] : realmUrl,
        realm: matched ? matched[2] : (import.meta.env.VITE_KEYCLOAK_REALM as string || 'master'),
        clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID as string,
        realmUrl,
    }
}

export function getKeycloak() {
    if (!keycloak) {
        const config = getRealmConfig()
        keycloak = new Keycloak({
            url: config.url,
            realm: config.realm,
            clientId: config.clientId,
        })
    }
    return keycloak
}

export function getKeycloakLoginRedirectUri() {
    return `${window.location.origin}/login`
}

export function getKeycloakLogoutRedirectUri() {
    return `${window.location.origin}/`
}

export async function loginWithKeycloak() {
    // 必须在 new Keycloak() / kc.init() 之前注入
    // keycloak-js 在 createUUID() 和 generateRandomData() 里做了同步检测
    injectCryptoPolyfill()

    const kc = getKeycloak()
    const adminInfo = useAdminInfo()

    const initOptions: KeycloakInitOptions = {
        onLoad: 'login-required',
        pkceMethod: 'S256',
        checkLoginIframe: false,
        redirectUri: getKeycloakLoginRedirectUri(),
    }

    const authenticated = await kc.init(initOptions)
    if (!authenticated || !kc.token) {
        await kc.login({ redirectUri: getKeycloakLoginRedirectUri() })
        return false
    }
    if (kc.token) {
        adminInfo.setToken(kc.token, 'auth')
    }
    startSessionPoll(60)   // 每 60 秒检查一次，按需调整

    return true
}

export async function logoutWithKeycloak() {
    const adminInfo = useAdminInfo()
    const config = getRealmConfig()
    const idTokenHint = keycloak?.idToken

    adminInfo.removeToken()

    const logoutUrl = new URL(`${config.realmUrl}/protocol/openid-connect/logout`)
    logoutUrl.searchParams.set('client_id', config.clientId)
    logoutUrl.searchParams.set('post_logout_redirect_uri', getKeycloakLogoutRedirectUri())
    if (idTokenHint) logoutUrl.searchParams.set('id_token_hint', idTokenHint)

    window.location.href = logoutUrl.toString()
}