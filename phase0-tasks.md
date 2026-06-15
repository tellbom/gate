# Phase 0 任务计划 — 统一权限中心

> 按节点交付，每完成一节点后将代码提交给 Marcel 审查再推进下一节点。

---

## 环境前置（已确认，无需 Codex 检索）

| 项目 | 结论 |
|---|---|
| 组件库路径 | `src/components/claudetable/{Commontable,Commonsearch,EditorDrawer}.vue`，import 路径 `/@/components/claudetable/...` |
| ContactSelector | `/@/components/ContactSelector.vue` |
| RBAC API 出口 | `src/api/backend/rbac/index.ts`，所有 endpoint 从此 import |
| X-Project 注入 | `client/index.ts` 请求拦截器，值读 `VITE_RBAC_PROJECT`，默认 `__global__`，已对准统一权限中心，无需改动 |
| adminInfo store | `src/stores/adminInfo.ts`，已含 `userid / project / super / setRbacInfo / clearRbacInfo`，使用此版本 |
| 新页面目录 | `src/views/backend/{dashboard,users,groups,menus,projects,audit,apiMap}/index.vue` |
| 布局入口 | Classic 布局：`aside.vue` → `logo.vue` + `menuVertical.vue`；`header.vue` → `navBar/classic.vue` |
| 样式注入点 | `src/styles/index.scss` 末尾追加 `@use '/@/styles/rbac-tokens';` |

---

## T0.1 — 注入设计 Token

**文件**：将 `rbac-tokens.scss` 放到 `src/styles/rbac-tokens.scss`

**操作**：在 `src/styles/index.scss` 末尾追加一行：
```scss
@use '/@/styles/rbac-tokens';
```

**说明**：
- 所有变量以 `--pc-` 前缀隔离，不覆盖现有 `--wf-*` / `--el-*`
- `--pc-blue` 与 `--wf-primary` 值相同（`#0066cc`），语义别名
- 样式类以 `pc-` 前缀，不与现有全局类冲突
- Element Plus 覆盖已由 `workflow-tokens.scss` 完成，T0.1 不重复

**交付验收**：页面 DevTools 中 `:root` 可见 `--pc-blue`、`--pc-ok` 等变量。

---

## T0.2 — 共享 UI 原语组件

**目录**：`src/components/rbac/`

### 需要新建的组件

**`RbacBadge.vue`**
- props：`tone`（ok/warn/deny/blue/super/neutral）、`dot`（boolean）、`size`（sm/md）
- 使用 `pc-badge` + `pc-badge--{tone}` + `pc-badge--{size}` CSS 类
- dot 时在内容前渲染 `<span class="pc-badge__dot" />`

**`RbacAvatar.vue`**
- props：`name`（string）、`size`（number，默认 32）、`dim`（boolean）
- 取 `name[0]` 大写为字母，`hue = charCodeAt(0) * 47 % 360`
- dim=true 时：`background: #ededf0; color: #9a9aa0`
- dim=false 时：`background: oklch(0.92 0.04 {hue}); color: oklch(0.42 0.09 {hue})`

**`RbacProjectGlyph.vue`**
- props：`code`（string）、`name`（string）、`size`（number，默认 36）
- 内置颜色映射（`[bg, fg]`）：
  ```
  portal:   ['#e9f0fb','#0066cc']
  workflow: ['#eef0f4','#3a3a3c']
  message:  ['#eaf3ee','#1a7f47']
  news:     ['#f6efdc','#9a6a00']
  quality:  ['#efeaf7','#6b4ea8']
  rbac:     ['#fbeae9','#b3261e']
  ```
- 未匹配时降级为 `['#eee','#555']`
- 显示 `name[0]` 大写字母，`border-radius: 9px`

**`RbacMethodPill.vue`**
- props：`method`（GET/POST/PUT/DELETE/PATCH）、`path`（string）、`mini`（boolean）
- 使用 `pc-method pc-method--{method}` 类

**`RbacApiSource.vue`**
- props：`endpoints`（`Array<{m: string, p: string, d?: string}>`）
- 折叠/展开，蓝底 wash 背景，展示接口来源
- 内部使用 `RbacMethodPill`

**`RbacEmptyState.vue`**
- props：`title`、`description`、`icon`（可选）
- 居中布局，`pc-t-body-strong` 标题，`pc-t-cap` 描述

**`RbacSpinner.vue`**
- 居中 `el-loading` 风格圆形 spinner，用于页面级占位

### 复用已有组件（不新建）

| 需求 | 使用 |
|---|---|
| 搜索栏 | `Commonsearch.vue` |
| 数据表格 | `Commontable.vue` |
| 表单抽屉 | `EditorDrawer.vue`（简单表单）或 `el-drawer`（复杂自定义布局） |
| 用户选择 | `ContactSelector.vue` |
| 分页 | `el-pagination`（直接使用） |
| 确认弹窗 | `ElMessageBox.confirm`（直接使用） |

**交付验收**：在任意页面中 import `RbacBadge` 并渲染 6 种 tone，样式与原型色值一致。

---

## T0.3 — API 层核查（并行，不阻塞 T0.2）

检查以下 3 个问题并将答案写入代码注释：

1. `getGlobalUsers` 返回值 — 确认是 `PagedData<AdminItem>`（含 `list/total`）还是直接数组
2. `updateGlobalUserStatus` — 确认路由是 `/api/global/user/{userid}/status` 还是 `/api/admin/{userid}/status`
3. `removeGlobalGroupMember` — 确认 `targetProject` 是 path param 还是 query param

如发现实现与 README 不符，只记录差异，不自行修改，等待 Marcel 确认后再改。

---

## T0.4 — Sidebar 样式改造

**文件**：`src/layouts/backend/components/logo.vue`、`src/layouts/backend/components/menus/menuVertical.vue`

### logo.vue 改造

将现有 `<img>` + `siteConfig.siteName` 结构替换为：

```html
<!-- Logo 区 -->
<div class="pc-sidebar__logo">
  <div class="pc-sidebar__logo-icon">
    <!-- SVG shield 图标，24×24，白色 -->
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/>
    </svg>
  </div>
  <div>
    <div class="pc-sidebar__logo-title">统一权限中心</div>
    <div class="pc-sidebar__logo-sub">Permission Center</div>
  </div>
</div>

<!-- Context Pill -->
<div class="pc-sidebar__context-pill">
  <span class="pc-sidebar__context-dot"></span>
  <span class="pc-sidebar__context-label">全局视图</span>
  <span class="pc-sidebar__context-code">__global__</span>
</div>
```

保留原有 `fold/unfold` 折叠按钮逻辑，放在 context pill 下方。

### menuVertical.vue — el-menu 样式覆盖

在 `<style>` 中追加（不改模板逻辑）：

```scss
.layouts-menu-vertical {
  --el-menu-bg-color: transparent;
  --el-menu-text-color: var(--pc-ink-80);
  --el-menu-active-color: var(--pc-blue);
  --el-menu-hover-bg-color: var(--pc-blue-wash);
  border-right: none;
}
.layouts-menu-vertical .el-menu-item,
.layouts-menu-vertical .el-sub-menu__title {
  height: 38px;
  line-height: 38px;
  margin: 1px 14px;
  border-radius: 9px;
  font-size: 14px;
  font-weight: 400;
  padding: 0 12px !important;
}
.layouts-menu-vertical .el-menu-item.is-active {
  background-color: var(--pc-blue-wash) !important;
  color: var(--pc-blue) !important;
  font-weight: 600;
}
```

**底部 User Row** — 在 `aside.vue` 的 `<el-aside>` 最底部追加：

```html
<div class="pc-sidebar__user">
  <RbacAvatar :name="adminInfo.username" :size="34" />
  <div class="pc-sidebar__user-info">
    <div class="pc-sidebar__user-name">{{ adminInfo.username }}</div>
    <div class="pc-sidebar__user-sub">{{ adminInfo.userid }} · {{ adminInfo.super ? '超管' : '管理员' }}</div>
  </div>
  <RbacBadge v-if="adminInfo.super" tone="super" dot size="sm">super</RbacBadge>
</div>
```

**交付验收**：侧边栏显示 shield 图标 + 「统一权限中心」两行文字 + `__global__` 绿点 context pill + 底部用户行。

---

## T0.5 — TopBar 样式改造

**文件**：`src/layouts/backend/components/navBar/classic.vue`

将 `.nav-bar` 样式调整为：

```scss
.nav-bar {
  height: 60px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border-bottom: 1px solid var(--pc-hairline);
  display: flex;
  align-items: center;
  padding: 0 32px;
  position: sticky;
  top: 0;
  z-index: 20;
}
```

在模板左侧追加页面标题区（从 `navTabs.state.activeRoute?.meta` 读取 title/subTitle）：

```html
<div class="pc-topbar__title-wrap" v-if="activeTitle">
  <div class="pc-topbar__title">{{ activeTitle }}</div>
  <div class="pc-topbar__sub">{{ activeSub }}</div>
</div>
```

保留现有 `NavTabs` 和 `NavMenus` 逻辑，不删除。

**交付验收**：顶栏高度 60px，磨砂玻璃背景，左侧显示当前页面名称。

---

## 节点交付顺序

```
T0.1 → 验收后 → T0.2（并行 T0.3）→ 验收后 → T0.4 → 验收后 → T0.5
```

T0.3 结论对接 Phase 1 开发前完成即可，不阻塞 T0.4/T0.5。

---

## Phase 1–3 预告（每节点完成后单独下发）

- Phase 1：Dashboard 页（概览统计 + 项目卡片 + 审计 feed）
- Phase 2：Users 页 + Authorization 页
- Phase 3：Groups 页 + Menus 页 + Audit 页
