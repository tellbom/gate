# Implementation Plan: 统一权限管理中心界面

**Branch**: `001-unified-permission-center` | **Date**: 2026-06-14 | **Spec**: `specs/001-unified-permission-center/spec.md`

**Input**: Feature specification from `specs/001-unified-permission-center/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Build a unified permission management center in the existing Vue 3/BuildAdmin frontend, visually matching `prototype/` and `DESIGN.md`, while preserving RBAC login, request handling, dynamic menu/route loading, Pinia stores, and permission guards. Cross-project reads and grant/member operations use documented `/api/global/*` endpoints; project-scoped writes keep correct `X-Project` context and call only documented `/api/admin`, `/api/group`, `/api/rule`, `/api/api-map`, `/api/search`, and `/api/project-grant` endpoints.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: Vue 3.4, TypeScript 5.4, Vite 4, Node/npm project.

**Primary Dependencies**: Vue Router 4, Pinia, Element Plus, Axios, existing RBAC API client.

**Storage**: Browser state via Pinia persisted stores; authoritative RBAC data lives in backend APIs.

**Testing**: `npm run typecheck`, `npm run build`; manual API/browser validation per quickstart.

**Target Platform**: Web admin UI in modern desktop browsers, responsive enough for narrow admin screens.

**Project Type**: Frontend web application.

**Performance Goals**: First page renders after RBAC bootstrap without blocking on all secondary datasets; list pages use backend pagination and avoid loading unbounded records.

**Constraints**: Do not hardcode business menus; do not invent APIs; keep `Authorization` and `X-Project` correct; mark backend gaps; isolate old framework visual pollution.

**Scale/Scope**: Eight permission-center workspaces: dashboard, systems, users, authorization, groups, menus/routes, API permissions, audit/activity.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution file is still a template with placeholders. Applicable gates are derived from user constraints:
- PASS: Preserve existing RBAC route/menu authority.
- PASS: API contract limited to `api_backend/README.md`.
- PASS: Frontend implementation reuses existing infrastructure.
- PASS: Unsupported prototype-only content must be surfaced as backend gaps.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
src/
├── api/backend/rbac/
│   ├── client/index.ts
│   ├── global/index.ts
│   └── types/index.ts
├── views/backend/
│   ├── dashboard.vue
│   ├── users/
│   │   ├── index.vue
│   │   ├── UserDetailDrawer.vue
│   │   └── UserGrantDialog.vue
│   ├── groups/
│   │   ├── index.vue
│   │   └── GroupDetailDrawer.vue
│   ├── projects/
│   │   └── index.vue
│   ├── menus/
│   │   ├── index.vue
│   │   └── ApiMapEditor.vue
│   ├── apiMap/
│   │   ├── index.vue
│   │   └── ApiMapEditor.vue
│   └── audit/
│       └── index.vue
├── styles/
└── router/, stores/, utils/
```

**Structure Decision**: Keep the existing Vue application and backend shell. Implement the homepage directly in `src/views/backend/dashboard.vue`. Place business pages as flat, business-named directories under `src/views/backend` (`users`, `groups`, `projects`, `menus`, `apiMap`, `audit`). Keep page-only components inside their owning page directory. Do not create `features/`, `modules/`, `domains/`, or an extra `permissionCenter/` layer. `src/views/auth` and framework authentication/authorization pages are foundational framework capability and should not be migrated or refactored by this feature.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |
