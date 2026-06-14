# Research: 统一权限管理中心界面

## Decision: Preserve BuildAdmin shell and RBAC dynamic routing
Rationale: The current frontend already has `/lnbox` admin shell, login pages, RBAC bridge, `loadRbacBackendIndex`, `handleAdminRoute`, Pinia admin/nav stores, and dynamic menu registration from `/api/admin/index`. Reusing this keeps access controlled by backend RBAC menus and avoids hardcoding business navigation.
Alternatives considered: Rebuilding a standalone SPA would make prototype replication easier but would bypass dynamic route permissions and violate the requirement to keep RBAC route/menu authority.

## Decision: Extend the RBAC API module instead of creating ad hoc request calls
Rationale: `src/api/backend/rbac/client/index.ts` already unwraps `{ code, msg, data }`, injects Bearer token, handles RBAC errors, and centralizes types. The new UI should add global API functions and context-aware project calls there.
Alternatives considered: Using the generic `createAxios` would lose RBAC-specific success semantics and `X-Project` handling.

## Decision: Global reads use `/api/global/*`; project writes use scoped clients
Rationale: The API document defines global cross-project reads and several global grant/member writes, but menu/rule and API-map writes remain project scoped. The UI must choose a target project before calling `/api/group`, `/api/rule`, or `/api/api-map` write endpoints.
Alternatives considered: Sending `project` in body for scoped endpoints is explicitly disallowed by the docs.

## Decision: Project display names and aggregate stats are derived, not invented
Rationale: `/api/global/project/list` returns project codes only. Prototype has `name`, `cn`, user/group/menu counts. The frontend can aggregate counts from existing list endpoints when available; otherwise it labels projects by code and marks unavailable richer names as backend gaps.
Alternatives considered: Hardcoding names from prototype seed data would create false backend truth.

## Decision: Prototype pages become Vue feature modules under `views/backend/permissionCenter`
Rationale: Keeping a dedicated module isolates old BuildAdmin pages/styles while letting dynamic route components point to stable Vue files.
Alternatives considered: Reusing existing `views/backend/auth/*` pages preserves API work but does not match the prototype visual system or full interaction model.

## Decision: Apple visual language implemented with local CSS tokens
Rationale: `DESIGN.md` requires Action Blue, ink, pearl/parchment canvases, restrained chrome, tight typography, and no decorative gradients/orbs. A module-scoped stylesheet avoids old Element Plus table/card defaults from dominating the new pages.
Alternatives considered: Global rewrite of `src/styles` is higher risk and may break login/layout.

## Decision: Unsupported prototype content is labeled as backend gap
Rationale: The user explicitly prohibited virtual APIs and fictional features. The UI contract will mark unsupported project metadata, exact global dashboard aggregates, and any non-documented mutations as gaps.
Alternatives considered: Mock fallback data would be faster visually but violates the request.
