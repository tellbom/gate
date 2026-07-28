import { defineStore } from 'pinia'
import { ADMIN_INFO } from '/@/stores/constant/cacheKey'
import type { AdminInfo } from '/@/stores/interface'

export const useAdminInfo = defineStore('adminInfo', {
    state: (): AdminInfo => {
        return {
            id: 0,
            username: '',
            avatar: '',
            token: '',
            refresh_token: '',
            super: false,
            // ── 新增 ──────────────────────────────
            userid: '',
            project: '',
            loginIp: '',
        }
    },
    actions: {
        dataFill(state: AdminInfo) {
            this.$state = { ...this.$state, ...state }
        },
        // adminInfo.ts - actions 追加
        setRbacInfo(info: { id?: string | number; userid?: string; username?: string; project?: string; super?: boolean; loginIp?: string }) {
            if (info.id !== undefined) this.id = String(info.id)
            if (info.userid !== undefined) this.userid = info.userid
            if (info.project !== undefined) this.project = info.project
            if (info.super !== undefined) this.super = info.super
            if (info.loginIp !== undefined) this.loginIp = info.loginIp
            if (info.username !== undefined) {
                this.username = info.username
                if (!this.nickname) this.nickname = info.username
            }
        },
        clearRbacInfo() {
            this.userid = ''
            this.project = ''
            this.super = false
            this.loginIp = ''
        },

        // adminInfo.ts - removeToken 末尾追加
        removeToken() {
            this.token = ''
            this.refresh_token = ''
            this.clearRbacInfo()  // ← 新增
        },
        setToken(token: string, type: 'auth' | 'refresh') {
            const field = type == 'auth' ? 'token' : 'refresh_token'
            this[field] = token
        },
        getToken(type: 'auth' | 'refresh' = 'auth') {
            return type === 'auth' ? this.token : this.refresh_token
        },
        setSuper(val: boolean) {
            this.super = val
        },
    },
    persist: {
        key: ADMIN_INFO,
    },
})
