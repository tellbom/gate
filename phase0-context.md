# Phase 0 Context

## 1. 全局样式入口

实际文件路径：

- `src/main.ts`
- `src/styles/index.scss`
- `src/styles/var.scss`
- `src/styles/workflow-tokens.scss`
- `src/styles/element.scss`

结论：

- 全局 SCSS 入口是 `src/styles/index.scss`，由 `src/main.ts` 引入。
- 当前已有 `:root` 变量块，分别在 `src/styles/var.scss` 和 `src/styles/workflow-tokens.scss`。
- Element Plus 主题色覆盖主要写在 `src/styles/workflow-tokens.scss`。
- `src/styles/element.scss` 是 Element Plus 组件样式修正文件，但未定义 `--el-color-primary`。

关键内容摘录：

```ts
// src/main.ts
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/display.css'
import '/@/styles/index.scss'
```

```scss
// src/styles/index.scss
@use '/@/styles/app';
@use '/@/styles/element';
@use '/@/styles/var';
@use '/@/styles/workflow-tokens';
@use '/@/styles/dark';
@use '/@/styles/markdown';
```

```scss
// src/styles/workflow-tokens.scss
:root {
  --wf-primary: #0066cc;
  --wf-radius-sm: 6px;
  --el-color-primary: var(--wf-primary);
  --el-border-radius-base: var(--wf-radius-sm);
}
```

## 2. 共享组件目录

实际文件路径：

- `src/components/claudetable/Commontable.vue`
- `src/components/claudetable/Commonsearch.vue`
- `src/components/claudetable/EditorDrawer.vue`
- `src/components/ContactSelector.vue`
- `src/layouts/backend/components/ContactSelector.vue` 也存在一个同名布局组件副本/变体。

结论：

- `Commontable.vue`、`Commonsearch.vue`、`EditorDrawer.vue` 位于 `src/components/claudetable/`。
- 页面中使用 `/@/components/claudetable/...` 方式导入。
- 业务页面使用的 `ContactSelector.vue` 位于 `src/components/ContactSelector.vue`，导入路径是 `/@/components/ContactSelector.vue`。

关键内容摘录：

```ts
// src/views/backend/auth/admin/index.vue
import Commonsearch from '/@/components/claudetable/Commonsearch.vue'
import Commontable  from '/@/components/claudetable/Commontable.vue'
```

```ts
// src/views/backend/auth/group/components/GroupFormDrawer.vue
import EditorDrawer from '/@/components/claudetable/EditorDrawer.vue'
```

```ts
// src/views/backend/auth/admin/components/AdminFormDrawer.vue
import ContactSelector from '/@/components/ContactSelector.vue'
```

## 3. RBAC API 层实际路径

实际文件路径：

- `client.ts`：无。实际为 `src/api/backend/rbac/client/index.ts`
- `types/index.ts`：`src/api/backend/rbac/types/index.ts`
- `adapters/index.ts`：`src/api/backend/rbac/adapters/index.ts`
- `admin/index.ts`：`src/api/backend/rbac/admin/index.ts`
- `group/index.ts`：`src/api/backend/rbac/group/index.ts`
- `rule/index.ts`：`src/api/backend/rbac/rule/index.ts`
- `apiMap/index.ts`：`src/api/backend/rbac/apiMap/index.ts`
- `projectGrant/index.ts`：`src/api/backend/rbac/projectGrant/index.ts`
- `global/index.ts`：`src/api/backend/rbac/global/index.ts`
- 统一出口：`src/api/backend/rbac/index.ts`
- 额外桥接文件：`src/api/backend/rbac/bridge.ts`

关键内容摘录：

```ts
// src/api/backend/rbac/index.ts
export { rbacClient, RBAC_PROJECT, RbacApiError } from './client'
export type { RbacResponse, PagedData, PagedQuery } from './client'
export type { RecordStatus, RuleType, RuleMenuType } from './types'
export { toRuleType, fromRuleType, toMenuType, fromMenuType } from './adapters'
```

```ts
// src/api/backend/rbac/index.ts
export { rbacLogin, getBackendIndex, getAdminList } from './admin'
export { getGroupIndex, getGroupOptions, getGroupList } from './group'
export { getRuleTree, getRuleList, createRule } from './rule'
export { grantProjectAccess, revokeProjectAccess } from './projectGrant'
export { getApiMapList, getApiMapRecords } from './apiMap'
export { getGlobalProjects, getGlobalUsers, getGlobalGroups } from './global'
```

## 4. `rbacClient` 的 `X-Project` 注入方式

实际文件路径：

- `src/api/backend/rbac/client/index.ts`

结论：

- `X-Project` 不是硬编码业务项目常量。
- 当前从环境变量 `import.meta.env.VITE_RBAC_PROJECT` 读取。
- 未配置时默认值是 `__global__`。
- 如果需要切换到 `__global__`，优先在 `.env` 或 `.env.local` 设置 `VITE_RBAC_PROJECT=__global__`；也可修改 `src/api/backend/rbac/client/index.ts` 中 `RBAC_PROJECT` 的默认值。
- 请求拦截器只在调用方未显式设置 `config.headers['X-Project']` 时注入默认值。

关键内容摘录：

```ts
// src/api/backend/rbac/client/index.ts
export const RBAC_PROJECT: string =
    (import.meta.env.VITE_RBAC_PROJECT as string) || '__global__'
```

```ts
// src/api/backend/rbac/client/index.ts
const adminInfo = useAdminInfo()
const token = adminInfo.getToken?.() ?? adminInfo.token ?? ''
if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
}
if (!config.headers['X-Project']) {
    config.headers['X-Project'] = RBAC_PROJECT
}
```

## 5. 现有页面目录结构

实际目录树，两级：

```text
src/views/backend/apiMap
src/views/backend/audit
src/views/backend/auth
  admin/
  adminLog/
  apiMap/
  group/
  projectGrant/
  rule/
src/views/backend/groups
src/views/backend/menus
src/views/backend/module
  components/
src/views/backend/projects
src/views/backend/routine
  attachment/
  config/
src/views/backend/security
  dataRecycle/
  dataRecycleLog/
  sensitiveData/
  sensitiveDataLog/
src/views/backend/users
```

权限管理相关页面实际路径：

- 旧/框架权限页：
  - `src/views/backend/auth/admin/index.vue`
  - `src/views/backend/auth/group/index.vue`
  - `src/views/backend/auth/rule/index.vue`
  - `src/views/backend/auth/apiMap/index.vue`
  - `src/views/backend/auth/projectGrant/index.vue`
  - `src/views/backend/auth/adminLog/index.vue`
- 新/统一权限中心页面：
  - `src/views/backend/users/index.vue`
  - `src/views/backend/groups/index.vue`
  - `src/views/backend/menus/index.vue`
  - `src/views/backend/apiMap/index.vue`
  - `src/views/backend/projects/index.vue`
  - `src/views/backend/audit/index.vue`

路由注册位置：

- 基础后台路由：`src/router/static/adminBase.ts`
- 动态注册函数：`src/utils/router.ts`
- 动态页面扫描：`import.meta.glob('/src/views/backend/**/*.vue')`

关键内容摘录：

```ts
// src/router/static/adminBase.ts
export const adminBaseRoutePath = '/lnbox'
const adminBaseRoute: RouteRecordRaw = {
    path: adminBaseRoutePath,
    name: 'admin',
    component: () => import('/@/layouts/backend/index.vue'),
}
```

```ts
// src/utils/router.ts
export const handleAdminRoute = (routes: any) => {
    const viewsComponent = import.meta.glob('/src/views/backend/**/*.vue')
    addRouteAll(viewsComponent, routes, adminBaseRoute.name as string)
    const menuAdminBaseRoute = (adminBaseRoute.path as string) + '/'
}
```

```ts
// src/utils/router.ts
if ((routes[idx].menu_type == 'tab' && viewsComponent[routes[idx].component]) || routes[idx].menu_type == 'iframe') {
    addRouteItem(viewsComponent, routes[idx], parentName, analyticRelation)
}
router.addRoute(parentName, routeBaseInfo)
```

## 6. 布局组件路径

实际文件路径：

- 后台布局入口：`src/layouts/backend/index.vue`
- Classic 容器：`src/layouts/backend/container/classic.vue`
- 侧边栏组件：`src/layouts/backend/components/aside.vue`
- 顶部导航栏组件：`src/layouts/backend/components/header.vue`
- Classic 顶部导航实现：`src/layouts/backend/components/navBar/classic.vue`
- 菜单渲染组件：`src/layouts/backend/components/menus/menuVertical.vue`
- 菜单树组件：`src/layouts/backend/components/menus/menuTree.vue`
- Logo 组件：`src/layouts/backend/components/logo.vue`

关键内容摘录：

```vue
<!-- src/layouts/backend/index.vue -->
<template>
  <component :is="config.layout.layoutMode"></component>
</template>
```

```ts
// src/layouts/backend/container/classic.vue
import Aside from '/@/layouts/backend/components/aside.vue'
import Header from '/@/layouts/backend/components/header.vue'
import Main from '/@/layouts/backend/router-view/main.vue'
import CloseFullScreen from '/@/layouts/backend/components/closeFullScreen.vue'
```

```ts
// src/layouts/backend/components/aside.vue
import Logo from '/@/layouts/backend/components/logo.vue'
import MenuVertical from '/@/layouts/backend/components/menus/menuVertical.vue'
import MenuVerticalChildren from '/@/layouts/backend/components/menus/menuVerticalChildren.vue'
```

```ts
// src/layouts/backend/components/header.vue
import ClassicNavBar from '/@/layouts/backend/components/navBar/classic.vue'
```

## 7. adminInfo store

实际文件路径：

- `src/stores/adminInfo.ts`
- 存储 key 常量：`src/stores/constant/cacheKey.ts`

结论：

- `adminInfo` store 路径是 `src/stores/adminInfo.ts`。
- 持久化存储 key 是 `ADMIN_INFO`，值为 `'adminInfo'`。
- `state` 中已存在 `token`、`userid`、`username`、`super`、`project` 字段。

关键内容摘录：

```ts
// src/stores/constant/cacheKey.ts
export const ADMIN_INFO = 'adminInfo'
```

```ts
// src/stores/adminInfo.ts
state: (): AdminInfo => {
    return {
        id: 0,
        username: '',
        avatar: '',
        token: '',
        refresh_token: '',
        super: false,
        userid: '',
        project: '',
    }
}
```

```ts
// src/stores/adminInfo.ts
persist: {
    key: ADMIN_INFO,
}
```

## 8. 现有 Element Plus 版本与主题配置

实际文件路径：

- `package.json`
- `src/main.ts`
- `src/styles/index.scss`
- `src/styles/workflow-tokens.scss`
- `src/styles/element.scss`

结论：

- Element Plus 版本：`2.7.8`。
- Element Plus 原始 CSS 在 `src/main.ts` 中引入。
- 项目主题变量覆盖在 `src/styles/workflow-tokens.scss`。
- 当前 `--el-color-primary` 覆盖值为 `var(--wf-primary)`，而 `--wf-primary` 是 `#0066cc`。
- 当前 `--el-border-radius-base` 覆盖值为 `var(--wf-radius-sm)`，而 `--wf-radius-sm` 是 `6px`。

关键内容摘录：

```json
// package.json
"element-plus": "2.7.8"
```

```ts
// src/main.ts
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/display.css'
import '/@/styles/index.scss'
```

```scss
// src/styles/workflow-tokens.scss
--wf-primary: #0066cc;
--wf-radius-sm: 6px;
--el-color-primary: var(--wf-primary);
--el-border-radius-base: var(--wf-radius-sm);
```

