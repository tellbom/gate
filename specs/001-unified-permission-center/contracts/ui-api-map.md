# UI and API Contract: 统一权限管理中心

## Frontend Structure Review
- Keep: `src/views/backend/login.vue`, `portalLogin.vue`, RBAC bridge/client, `src/router/*`, `src/utils/router.ts`, Pinia stores, backend layout shell, loading route, Element Plus primitives.
- Replace/isolate: old dashboard visuals should no longer be the primary permission center UI. Framework auth/authorization pages under `src/views/auth` are foundational capability and are not part of this feature's migration scope.
- Risk: dynamic route components are supplied by `/api/admin/index`; backend menu records must point to the new Vue component paths or the UI will not be reachable.

## Prototype Page to Vue Page Mapping
| Prototype | Target Vue view | Notes |
| --- | --- | --- |
| `dashboard.jsx` | `src/views/backend/dashboard.vue` | Project gallery, stats ribbon, recent activity. |
| `users.jsx` | `src/views/backend/users/index.vue` | Cross-project user list and detail drawer. |
| `authorization.jsx` | `src/views/backend/users/UserGrantDialog.vue` plus `users/index.vue` | User-centric grant workflow stays with the user page unless backend menu requires a separate route. |
| `groups.jsx` | `src/views/backend/groups/index.vue` | Group tree/list, permission chips, member actions. |
| `menus.jsx` | `src/views/backend/menus/index.vue` and `src/views/backend/apiMap/index.vue` | Rule/menu management and API-map management are flat backend pages. |
| `audit.jsx` | `src/views/backend/audit/index.vue` | Audit logs and permission view. |
| `concept.jsx` / `apimap` | Documentation/reference panel inside dashboard or audit | Do not expose fictional feature pages unless RBAC menu provides them. |
| `components.jsx` / `theme.css` | Page-local `<style scoped>` and page-owned components | Copy visual primitives only where needed; do not introduce a shared component layer unless reuse becomes real. |

## Page to API Mapping
| Page | Reads | Writes |
| --- | --- | --- |
| 首页/系统列表 | `GET /api/global/project/list`, `GET /api/global/user/list`, `GET /api/global/group/list`, `GET /api/global/menu/list`, `GET /api/search/audit-logs` | None. |
| 用户管理 | `GET /api/global/user/list`, optional project filter | `PUT /api/global/user/{userid}/status`, `DELETE /api/global/user/{userid}/project-grants/{project}`. |
| 用户授权 | `GET /api/global/user/list`, `GET /api/global/project/list` | `POST /api/global/user/{userid}/project-grants`, `DELETE /api/global/user/{userid}/project-grants/{project}`, `PUT /api/project-grant/{userid}/super` with target `X-Project`. |
| 权限组 | `GET /api/global/group/list`, `GET /api/group/list`, `GET /api/rule/tree`, `GET /api/api-map/list` | `POST/PUT/DELETE /api/group`, `PUT /api/group/{groupCode}/rules`, member add/remove with global or scoped endpoints. |
| 菜单路由 | `GET /api/global/menu/list`, `GET /api/rule/list`, `GET /api/rule/tree` | `POST/PUT/DELETE /api/rule`, status/weigh updates with target `X-Project`. |
| API 权限 | `GET /api/api-map/records`, `GET /api/api-map/list`, `GET /api/search/permission-view` | `POST /api/api-map`, `PUT /api/api-map/{id}`, `DELETE /api/api-map/{id}` with target `X-Project`. |
| 审计/活动 | `GET /api/search/audit-logs`, `GET /api/search/permission-view` | None. |

## Backend Gaps
- Project list display metadata beyond project code.
- Exact global dashboard aggregate endpoint.
- Cross-project rule/API-map write endpoints.
- Dedicated activity stream endpoint beyond audit logs.
- User detail endpoint beyond list row aggregation.

## RBAC Route Contract
- Backend menus remain the source of truth.
- New components must be referenced by dynamic menu `component` values and match files under `/src/views/backend/**/*.vue`.
- Direct static business menus are not authoritative access control.
