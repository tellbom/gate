/*
 * @Author: fzq
 * @Date: 2025-10-24 09:08:36
 * @LastEditors: fzq
 * @LastEditTime: 2026-06-09 20:36:39
 * @Description: 
 * @FilePath: \web\src\router\static\adminBase.ts
 */
import type { RouteRecordRaw } from 'vue-router'

/**
 * 后台基础路由路径
 * 您可以随时于后台->系统配置中修改此值，程序可自动完成代码修改，同时建立对应的API入口和禁止admin应用访问
 */
export const adminBaseRoutePath = '/lnbox'

/*
 * 后台基础静态路由
 */
const adminBaseRoute: RouteRecordRaw = {
    path: adminBaseRoutePath,
    name: 'admin',
    component: () => import('/@/layouts/backend/index.vue'),
    // 直接重定向到 loading 路由
    redirect: adminBaseRoutePath + '/loading',
    meta: {
        title: `pagesTitle.admin`,
    },
    children: [
        {
            path: 'loading/:to?',
            name: 'adminMainLoading',
            component: () => import('/@/layouts/common/components/loading.vue'),
            meta: {
                title: `pagesTitle.loading`,
            },
        },
    ],
}

export default adminBaseRoute
