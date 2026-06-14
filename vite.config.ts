/*
 * @Author: fzq
 * @Date: 2024-11-30 13:00:00
 * @LastEditors: fzq
 * @LastEditTime: 2026-05-26 09:12:27
 * @Description: 
 * @FilePath: \web\vite.config.ts
 */
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import type { ConfigEnv, UserConfig } from 'vite'
import { loadEnv } from 'vite'
import { svgBuilder } from '/@/components/icon/svg/index'
import { customHotUpdate, isProd } from '/@/utils/vite'

const pathResolve = (dir: string): any => {
    return resolve(__dirname, '.', dir)
}

// https://vitejs.cn/config/
const viteConfig = ({ mode }: ConfigEnv): UserConfig => {
    const { VITE_PORT, VITE_OPEN, VITE_BASE_PATH, VITE_OUT_DIR, VITE_RBAC_BASE_URL, VITE_MESSAGE_CENTER_PROXY_TARGET } = loadEnv(mode, process.cwd())

    const alias: Record<string, string> = {
        '/@': pathResolve('./src/'),
        assets: pathResolve('./src/assets'),
        'vue-i18n': isProd(mode) ? 'vue-i18n/dist/vue-i18n.cjs.prod.js' : 'vue-i18n/dist/vue-i18n.cjs.js',
    }

    return {
        plugins: [vue(), svgBuilder('./src/assets/icons/'), customHotUpdate()],
        root: process.cwd(),
        resolve: { alias },
        base: VITE_BASE_PATH,
        server: {
            host: true,
            port: parseInt(VITE_PORT),
            open: VITE_OPEN != 'false',
             proxy: {
                '/rbacServer': {
                    target: VITE_RBAC_BASE_URL, // 正式后端地址
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/rbacServer/, ''),
                },
                '/messageCenter': {
                    target: VITE_MESSAGE_CENTER_PROXY_TARGET,
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/messageCenter/, ''),
                },
            },
        },
        build: {
            cssCodeSplit: false,
            sourcemap: false,
            outDir: VITE_OUT_DIR,
            emptyOutDir: true,
            chunkSizeWarningLimit: 1500,
            rollupOptions: {
                output: {
                    manualChunks: {
                        // 分包配置，配置完成自动按需加载
                        vue: ['vue', 'vue-router', 'pinia', 'vue-i18n', 'element-plus'],
                        echarts: ['echarts'],
                    },
                },
            },
        },
    }
}

export default viteConfig
