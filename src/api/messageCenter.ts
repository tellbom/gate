import createAxios from '/@/utils/axios'

export interface MessageItem {
    messageId: string
    title: string
    content: string
    url: string | null
    read: boolean
    seen: boolean
    createdAt: string
}

export interface MarkResult {
    messageId: string
    read: boolean
    unreadCount: number
}

const BASE = '/api/message-center'
const PROXY_PREFIX = '/messageCenter'

export function getMyMessages(page = 0, limit = 100) {
    return createAxios<MessageItem[]>({
        url: `${BASE}/my`,
        method: 'get',
        params: { page, limit },
    }, { urlPrefix: PROXY_PREFIX })
}

export function getUnreadCount() {
    return createAxios<{ unreadCount: number }>({
        url: `${BASE}/unread-count`,
        method: 'get',
    }, { urlPrefix: PROXY_PREFIX })
}

export function markRead(messageId: string) {
    return createAxios<MarkResult>({
        url: `${BASE}/messages/${messageId}/read`,
        method: 'post',
    }, { urlPrefix: PROXY_PREFIX })
}

export function markUnread(messageId: string) {
    return createAxios<MarkResult>({
        url: `${BASE}/messages/${messageId}/unread`,
        method: 'post',
    }, { urlPrefix: PROXY_PREFIX })
}
