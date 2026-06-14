# Quickstart Validation: 统一权限管理中心

## Prerequisites
- Configure backend base URL in `.env` / `.env.development`.
- Configure RBAC project for the unified center as `VITE_RBAC_PROJECT=__global__`.
- Ensure `/api/admin/index` returns RBAC menus whose component paths point to the new permission center Vue pages.
- Have a valid JWT usable by existing login/portal login flow.

## Run
```bash
npm install
npm run typecheck
npm run build
npm run dev
```

## Current Validation Notes
- `npm run typecheck` currently fails on pre-existing framework/auth/store typing issues outside the new flat permission-center pages. Examples include `src/components/common/TableSearchBar.vue`, `src/components/ContactSelector.vue`, `src/layouts/backend/components/ContactSelector.vue`, `src/layouts/backend/components/navMenus.vue`, `src/stores/adminInfo.ts`, `src/stores/messageCenter.ts`, and restored framework pages under `src/views/backend/auth/*`.
- The new `src/views/backend/groups/*` and `src/views/backend/menus/index.vue` changes no longer add typecheck errors after the Element event typing adjustment.
- `NODE_OPTIONS=--max-old-space-size=8192 npm run build` succeeds.

## Scenarios
1. Login and route bootstrap
   - Open `/` or `/login`.
   - Complete existing login/token flow.
   - Expected: RBAC bridge calls `/api/auth/login`; backend layout calls `/api/admin/index`; menus are dynamically registered.

2. Dashboard
   - Open the RBAC-downloaded dashboard route.
   - Expected: project/user/group/menu/audit data loads from documented APIs; empty responses render empty states.

3. User grant
   - Open 用户管理, select a user, go to 授权.
   - Submit project grants.
   - Expected: `POST /api/global/user/{userid}/project-grants` returns a result report and the user list refreshes.

4. Super demotion
   - Choose a target project where the user is super.
   - Toggle super off.
   - Expected: request uses the target project as `X-Project` and calls `/api/project-grant/{userid}/super` or documented global grant semantics.

5. Group/menu/API scoped writes
   - Choose a project before mutation.
   - Expected: `/api/group`, `/api/rule`, `/api/api-map` writes use that project context and do not send project in the body unless the endpoint documents it.

6. Audit
   - Filter by `Deny` or `Error`.
   - Expected: `GET /api/search/audit-logs` updates the activity list.
