# Feature Specification: 统一权限管理中心界面

**Feature Branch**: `001-unified-permission-center`

**Created**: 2026-06-14

**Status**: Draft

**Input**: User description: "基于 prototype/ 文件夹里的设计稿和 api_backend 文档，对当前前端项目进行统一权限管理中心界面开发；复刻 prototype 视觉、结构和交互，接入现有 RBAC 后端接口，不沿用无关旧页面，不编造 API，菜单和路由继续依赖 RBAC 动态下发。"

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.

  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - 全局权限运营总览 (Priority: P1)

作为统一权限中心管理员，我可以进入一个 Apple 风格的权限运营首页，查看已接入系统、管理员账号、权限组、菜单/路由和近期鉴权活动，并从首页跳转到授权、用户、权限组、菜单/API、审计等工作区。

**Why this priority**: 首页是统一权限中心的入口，必须替代旧框架首页，让管理员确认当前处于全局权限视图。

**Independent Test**: 使用 RBAC 登录后进入后台，首屏显示 prototype 对应的项目画廊/指标/近期活动，并且数据来自 `/api/global/*` 和 `/api/search/audit-logs` 聚合结果。

**Acceptance Scenarios**:

1. **Given** 已登录且拥有 RBAC 下发的首页菜单，**When** 访问后台首页，**Then** 看到统一权限中心首页而不是旧 dashboard。
2. **Given** 后端 project/user/group/menu/audit 返回为空，**When** 首页加载，**Then** 页面显示空态和 0 统计，不渲染假数据。

---

### User Story 2 - 跨 Project 用户授权与超管管理 (Priority: P2)

作为管理员，我可以跨 project 搜索用户，查看其授权 project、权限组和超管身份，并通过现有全局授权接口授予或撤销 project 访问，通过 project grant super 能力完成超管提升和降权。

**Why this priority**: 用户授权是权限中心最核心的写操作，必须严格依赖现有 API 和 X-Project 上下文。

**Independent Test**: 在用户页筛选用户，打开授权工作区，选择目标 project 执行授权/撤销/超管切换，刷新列表后状态与后端一致。

**Acceptance Scenarios**:

1. **Given** 用户没有某 project 授权，**When** 管理员提交 `POST /api/global/user/{userid}/project-grants`，**Then** 页面展示逐 project 结果报告并刷新授权列表。
2. **Given** 用户已是某 project 超管，**When** 管理员关闭超管开关，**Then** 页面使用 `/api/project-grant/{userid}/super` 或全局授权三态语义完成降权，不直接改前端状态伪造成功。

---

### User Story 3 - 权限组、菜单路由、API 映射和审计管理 (Priority: P3)

作为管理员，我可以维护权限组、成员、菜单/按钮规则、API 权限映射，并查看审计日志和权限视图；跨 project 查询优先走 `/api/global/*`，project 内写操作复用 `/api/group`、`/api/rule`、`/api/api-map`、`/api/search`。

**Why this priority**: 这些页面支撑 RBAC 配置和运行时排障，是 prototype 中已有能力，但部分写入能力只存在 project 内接口。

**Independent Test**: 分别打开权限组、菜单路由、API 权限、审计页，执行筛选、查看、创建/编辑/状态切换等后端已支持操作。

**Acceptance Scenarios**:

1. **Given** 已选择目标 project，**When** 修改规则或 API 映射，**Then** 请求携带正确 `X-Project` 并调用文档中已有 project 内接口。
2. **Given** 未选择单一目标 project，**When** 页面只支持跨 project 查询，**Then** 写操作被禁用或引导选择 project，不臆造全局写接口。

### Edge Cases

- RBAC 菜单未下发某页面时，不应通过硬编码菜单暴露入口；直接访问动态路由应按现有权限守卫处理。
- `/api/global/project/list` 只返回 project code 时，前端只能显示 code；名称/中文名等 prototype 字段属于后端缺口，不可伪造为真实数据。
- 某些统计值没有专用接口时，前端通过已支持分页接口聚合；无法精确聚合时显示可解释的当前页/已加载统计。
- project 内写操作必须携带目标 project 的 `X-Project`，不能用 `__global__` 调用 `/api/group`、`/api/rule`、`/api/api-map` 写接口。
- best-effort 授权部分失败时，页面展示逐 project 结果，不把整体渲染为完全成功。

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: System MUST preserve existing login flow, RBAC bridge, dynamic menu/route registration, permission guards, request wrapper, Pinia stores, and backend layout foundation.
- **FR-002**: System MUST replace or isolate unrelated old dashboard/auth management visuals so the unified permission center is the primary backend experience.
- **FR-003**: System MUST render homepage, system list/project gallery, user management, user authorization, permission groups, menu route management, API permission management, and audit/activity pages from prototype scope.
- **FR-004**: System MUST use RBAC dynamic menus for navigation and route availability; business menus MUST NOT be hardcoded as authoritative access control.
- **FR-005**: System MUST use `/api/global/project/list`, `/api/global/user/list`, `/api/global/group/list`, and `/api/global/menu/list` for cross project reads where possible.
- **FR-006**: System MUST use `/api/global/user/{userid}/project-grants` and `/api/global/user/{userid}/project-grants/{project}` for cross project grant/revoke operations.
- **FR-007**: System MUST implement super grant/demotion through documented `isSuper` behavior and `/api/project-grant/{userid}/super` with correct project context.
- **FR-008**: System MUST use `/api/group`, `/api/rule`, `/api/api-map`, and `/api/search` only according to documented methods and fields.
- **FR-009**: System MUST surface unsupported prototype-only fields as UI limitations or backend gaps, not generated business truth.
- **FR-010**: System MUST follow `DESIGN.md` Apple visual principles: restrained chrome, white/parchment canvases, black ink, Action Blue, photographic/product-gallery feel where applicable, and no decorative gradients/orbs.
- **FR-011**: System MUST retain correct `Authorization: Bearer <jwt>` and `X-Project` headers for all RBAC requests.
- **FR-012**: System MUST handle loading, empty, error, and no-permission states for every page.

### Key Entities *(include if feature involves data)*

- **Project**: A business project code returned by global project list; used as RBAC context for scoped management.
- **Admin User**: RBAC administrator account with userid, username, status, projectCodes, groupCodes, groupNames, superProjects, and isSuper.
- **Project Grant**: A user-to-project authorization with optional super flag.
- **Permission Group**: A group within a project with groupCode, groupName, parent_group_code, status, and permissionCodes.
- **Rule/Menu Node**: Menu directory, menu, or button rule with ruleCode, permissionCode, type, route metadata, status, and tree relationship.
- **API Map Record**: HTTP route to permissionCode/action mapping with id, method, routePattern, status, timestamps.
- **Audit Log**: Runtime authorization activity with userid, project, permissionCode, result, method, route, reason, createdAt.
- **Permission View**: Read-only permission/action/resource projection from API map or search endpoints.

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: All prototype pages listed in FR-003 have corresponding Vue routes/views or integrated tabs reachable only through RBAC menus.
- **SC-002**: No page uses mock seed data for successful API-backed fields; empty API responses produce empty states.
- **SC-003**: User grant, revoke, status toggle, group membership, rule status/weigh, API map CRUD, and audit search requests match documented endpoints.
- **SC-004**: `npm run typecheck` and `npm run build` complete without new TypeScript or bundling errors.
- **SC-005**: Visual comparison against prototype preserves sidebar/topbar/page structure, card rhythm, typography, color tokens, drawers/modals, segmented controls, and status badges.

## Assumptions

- The backend API documented in `api_backend/README.md` is the source of truth.
- The current admin base route `/lnbox` remains unchanged unless RBAC menu paths dictate otherwise.
- Existing RBAC backend client may be extended rather than replaced.
- Prototype fields such as project display name, Chinese label, and aggregate counts are decorative unless the API returns equivalent data.
- The unified center operates under `__global__` for global reads/writes and switches `X-Project` for project-scoped writes.
