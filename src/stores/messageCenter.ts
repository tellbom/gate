import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
    getMyMessages,
    getUnreadCount,
    markRead as apiMarkRead,
    markUnread as apiMarkUnread,
    type MessageItem,
} from '/@/api/messageCenter'

export const useMcStore = defineStore('messageCenter', () => {
    const messages = ref<MessageItem[]>([])
    const unreadCount = ref(0)
    const loading = ref(false)
    const loadError = ref(false)

    function filtered(filter: string, query: string): MessageItem[] {
        const q = query.trim().toLowerCase()

        return messages.value.filter((message) => {
            if (filter === 'unread' && message.read) return false
            if (filter === 'read' && !message.read) return false

            if (q) {
                const haystack = `${message.title} ${message.content}`.toLowerCase()
                if (!haystack.includes(q)) return false
            }

            return true
        })
    }

    const unreadByFilter = computed(() => {
        let unread = 0

        for (const message of messages.value) {
            if (!message.read) unread++
        }

        return { all: unread, unread, read: 0 }
    })

    async function fetchMessages() {
        loading.value = true
        loadError.value = false

        try {
            const data = await getMyMessages(0, 100)
            messages.value = data ?? []
        } catch {
            loadError.value = true
        } finally {
            loading.value = false
        }
    }

    async function fetchUnreadCount() {
        try {
            const data = await getUnreadCount()
            unreadCount.value = data?.unreadCount ?? 0
        } catch {
            // Badge refresh failure should not block page rendering.
        }
    }

    async function markRead(messageId: string) {
        const message = messages.value.find((item) => item.messageId === messageId)
        const previousRead = message?.read

        if (message && !message.read) {
            message.read = true
            unreadCount.value = Math.max(0, unreadCount.value - 1)
        }

        try {
            const result = await apiMarkRead(messageId)
            if (result) unreadCount.value = result.unreadCount
        } catch {
            if (message && previousRead !== undefined && message.read !== previousRead) {
                message.read = previousRead
                unreadCount.value++
            }
        }
    }

    async function markUnread(messageId: string) {
        const message = messages.value.find((item) => item.messageId === messageId)
        const previousRead = message?.read

        if (message && message.read) {
            message.read = false
            unreadCount.value++
        }

        try {
            const result = await apiMarkUnread(messageId)
            if (result) unreadCount.value = result.unreadCount
        } catch {
            if (message && previousRead !== undefined && message.read !== previousRead) {
                message.read = previousRead
                unreadCount.value = Math.max(0, unreadCount.value - 1)
            }
        }
    }

    async function bulkMark(ids: string[], read: boolean) {
        const previousReadMap = new Map<string, boolean>()
        let delta = 0

        for (const id of ids) {
            const message = messages.value.find((item) => item.messageId === id)
            if (!message || message.read === read) continue

            previousReadMap.set(id, message.read)
            message.read = read
            delta += read ? -1 : 1
        }

        unreadCount.value = Math.max(0, unreadCount.value + delta)

        const request = read ? apiMarkRead : apiMarkUnread
        const results = await Promise.allSettled(ids.map((id) => request(id)))

        for (let i = results.length - 1; i >= 0; i--) {
            const result = results[i]
            if (result.status === 'fulfilled' && result.value) {
                unreadCount.value = result.value.unreadCount
                break
            }
        }

        for (let i = 0; i < results.length; i++) {
            if (results[i].status !== 'rejected') continue

            const id = ids[i]
            const message = messages.value.find((item) => item.messageId === id)
            if (message && previousReadMap.has(id)) {
                message.read = previousReadMap.get(id)!
            }
        }
    }

    return {
        messages,
        unreadCount,
        loading,
        loadError,
        filtered,
        unreadByFilter,
        fetchMessages,
        fetchUnreadCount,
        markRead,
        markUnread,
        bulkMark,
    }
})
