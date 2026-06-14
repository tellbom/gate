# Tasks: 统一权限管理中心界面

**Input**: Design documents from `specs/001-unified-permission-center/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/ui-api-map.md`, `quickstart.md`

**Tests**: No TDD flow requested. Validation tasks use `npm run typecheck`, high-memory production build, and manual browser/API scenarios from `quickstart.md`.

**Organization**: Tasks are grouped by user story and keep the requested flat page structure. Do not add `features/`, `modules/`, `domains/`, or `permissionCenter/`.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Align structure and API foundation before page work.

- [X] T001 Update `specs/001-unified-permission-center/plan.md` and `specs/001-unified-permission-center/contracts/ui-api-map.md` to require flat `src/views/backend/*` page directories.
- [X] T002 Remove the generated `src/views/backend/permissionCenter/` layer and replace its references from existing wrappers.
- [X] T003 [P] Keep framework authentication and authorization pages under `src/views/auth` or existing framework-owned auth paths unchanged.
- [X] T004 [P] Keep RBAC dynamic route, login bridge, Pinia stores, and backend layout code unchanged except for documented API client needs.
- [X] T005 Extend `src/api/backend/rbac/client/index.ts` so RBAC defaults to `X-Project: __global__` and still allows request-level project override.
- [X] T006 Add documented global API calls in `src/api/backend/rbac/global/index.ts` and export them from `src/api/backend/rbac/index.ts`.
- [X] T007 Add global project grant and audit data types in `src/api/backend/rbac/types/index.ts`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish the flat page targets and prototype visual baseline.

**CRITICAL**: No user story work should continue until the generated nested `permissionCenter` implementation is removed.

- [X] T008 Create flat business page directories `src/views/backend/users`, `src/views/backend/groups`, `src/views/backend/projects`, `src/views/backend/menus`, `src/views/backend/apiMap`, and `src/views/backend/audit`.
- [X] T009 Copy the Apple design tokens and primitive CSS values from `prototype/pc/theme.css` into page-local styles, starting with `src/views/backend/dashboard.vue`.
- [X] T010 Copy only the visual and interaction patterns needed from `prototype/pc/components.jsx` into page files or page-owned components; do not create `src/components` abstractions.
- [X] T011 Update any RBAC menu component-path compatibility wrappers so business pages point to `src/views/backend/dashboard.vue` or flat `src/views/backend/*/index.vue` paths.
- [X] T012 Document backend gaps in page copy or comments where prototype fields lack API support, especially project names, Chinese labels, and exact global aggregates.

**Checkpoint**: The project has no new `permissionCenter` page layer, and every new business page has an obvious flat file path.

---

## Phase 3: User Story 1 - 全局权限运营总览 (Priority: P1) MVP

**Goal**: Render the prototype-style global dashboard directly in `src/views/backend/dashboard.vue`.

**Independent Test**: Log in through the existing RBAC flow, open the dashboard route, and verify the page uses `/api/global/*` and `/api/search/audit-logs` data with prototype layout, cards, project gallery, and empty states.

### Implementation for User Story 1

- [X] T013 [US1] Implement the dashboard shell directly in `src/views/backend/dashboard.vue` using the structure from `prototype/pc/dashboard.jsx`.
- [X] T014 [US1] Copy the stats ribbon, project gallery, and recent activity visual styles from `prototype/pc/dashboard.jsx` and `prototype/pc/theme.css` into `src/views/backend/dashboard.vue`.
- [X] T015 [US1] Load projects from `getGlobalProjects` in `src/views/backend/dashboard.vue`.
- [X] T016 [US1] Load users, groups, menus, and audit rows from documented APIs in `src/views/backend/dashboard.vue`.
- [X] T017 [US1] Aggregate dashboard counts only from loaded API data in `src/views/backend/dashboard.vue`; do not use prototype seed constants.
- [X] T018 [US1] Add loading and empty states for all dashboard sections in `src/views/backend/dashboard.vue`.
- [X] T019 [US1] Add dashboard navigation actions that route only to RBAC-registered paths for users, groups, menus, apiMap, and audit pages.

**Checkpoint**: Dashboard is independently usable and no longer depends on `CenterPage.vue`.

---

## Phase 4: User Story 2 - 跨 Project 用户授权与超管管理 (Priority: P2)

**Goal**: Provide user list, user detail, project grant, revoke, and super promotion/demotion in flat user page files.

**Independent Test**: Open the users page, filter users, open a detail drawer, grant project access, revoke project access, and toggle super with correct `X-Project`.

### Implementation for User Story 2

- [X] T020 [US2] Implement the cross-project user list in `src/views/backend/users/index.vue` using layout and row styling from `prototype/pc/users.jsx`.
- [X] T021 [P] [US2] Implement the user detail drawer in `src/views/backend/users/UserDetailDrawer.vue`.
- [X] T022 [P] [US2] Implement the project grant dialog in `src/views/backend/users/UserGrantDialog.vue`.
- [X] T023 [US2] Wire `GET /api/global/user/list` filters in `src/views/backend/users/index.vue`.
- [X] T024 [US2] Wire `PUT /api/global/user/{userid}/status` status toggles in `src/views/backend/users/index.vue`.
- [X] T025 [US2] Wire `POST /api/global/user/{userid}/project-grants` grant submission in `src/views/backend/users/UserGrantDialog.vue`.
- [X] T026 [US2] Wire `DELETE /api/global/user/{userid}/project-grants/{project}` revoke action in `src/views/backend/users/UserDetailDrawer.vue`.
- [X] T027 [US2] Wire super promotion/demotion through `PUT /api/project-grant/{userid}/super` with request-level `X-Project` override in `src/views/backend/users/UserDetailDrawer.vue`.
- [X] T028 [US2] Show best-effort grant result rows in `src/views/backend/users/UserGrantDialog.vue`.
- [X] T029 [US2] Ensure project names display as project codes unless the backend returns richer metadata in `src/views/backend/users/index.vue`.

**Checkpoint**: User authorization can be tested without the groups, menus, or audit pages being complete.

---

## Phase 5: User Story 3 - 权限组、菜单路由、API 映射和审计管理 (Priority: P3)

**Goal**: Implement remaining prototype business pages as flat backend pages with documented API calls only.

**Independent Test**: Open groups, projects, menus, API map, and audit pages independently; verify each page reads from documented endpoints and disables or scopes writes correctly.

### Implementation for User Story 3

- [X] T030 [US3] Implement project/system list view in `src/views/backend/projects/index.vue` using the dashboard gallery styling from `prototype/pc/dashboard.jsx`.
- [X] T031 [US3] Implement permission group list in `src/views/backend/groups/index.vue` using the visual structure from `prototype/pc/groups.jsx`.
- [X] T032 [P] [US3] Implement group detail drawer in `src/views/backend/groups/GroupDetailDrawer.vue`.
- [X] T033 [US3] Wire `GET /api/global/group/list` filters in `src/views/backend/groups/index.vue`.
- [X] T034 [US3] Wire global group member add/remove endpoints in `src/views/backend/groups/GroupDetailDrawer.vue`.
- [X] T035 [US3] Implement menu/rule management in `src/views/backend/menus/index.vue` using the tree styling from `prototype/pc/menus.jsx`.
- [X] T036 [US3] Wire `GET /api/global/menu/list`, `GET /api/rule/tree`, rule status, and rule weight endpoints in `src/views/backend/menus/index.vue`.
- [X] T037 [US3] Disable project-scoped rule writes in `src/views/backend/menus/index.vue` until exactly one target project is selected.
- [X] T038 [US3] Implement API permission mapping list in `src/views/backend/apiMap/index.vue` using the API-map table styling from `prototype/pc/menus.jsx`.
- [X] T039 [P] [US3] Implement API map editor in `src/views/backend/apiMap/ApiMapEditor.vue`.
- [X] T040 [US3] Wire `GET /api/api-map/records`, `POST /api/api-map`, `PUT /api/api-map/{id}`, and `DELETE /api/api-map/{id}` in `src/views/backend/apiMap/index.vue`.
- [X] T041 [US3] Implement audit/activity page in `src/views/backend/audit/index.vue` using `prototype/pc/audit.jsx` layout.
- [X] T042 [US3] Wire `GET /api/search/audit-logs` and `GET /api/search/permission-view` in `src/views/backend/audit/index.vue`.
- [X] T043 [US3] Add backend-gap labels for unsupported authorization-change history in `src/views/backend/audit/index.vue`.

**Checkpoint**: All prototype business areas have flat Vue pages and documented API mappings.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup, validation, and structure enforcement.

- [X] T044 Remove unused generated files under `src/views/backend/permissionCenter/`.
- [X] T045 Remove stale imports and references to `CenterPage.vue` from `src/views/backend/dashboard.vue` and old compatibility wrappers.
- [X] T046 [P] Confirm no new page-only components were placed under `src/components`.
- [X] T047 [P] Confirm `src/views/auth` and framework-owned auth pages were not modified for this feature.
- [X] T048 Run `npm run typecheck` and record any pre-existing unrelated type failures in `specs/001-unified-permission-center/quickstart.md`.
- [X] T049 Run `NODE_OPTIONS=--max-old-space-size=8192 npm run build` and verify production build succeeds.
- [ ] T050 Validate browser flows from `specs/001-unified-permission-center/quickstart.md` against the running dev server.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup and blocks user story work.
- **US1 Dashboard (Phase 3)**: Depends on Foundational and is the MVP.
- **US2 Users/Authorization (Phase 4)**: Depends on Foundational; can follow US1 or run after T008-T012.
- **US3 Groups/Menus/API/Audit (Phase 5)**: Depends on Foundational; can run after US1 if API helpers are stable.
- **Polish (Phase 6)**: Depends on selected user story completion.

### User Story Dependencies

- **US1 (P1)**: No dependency on US2 or US3.
- **US2 (P2)**: Uses shared global API helpers from Phase 1.
- **US3 (P3)**: Uses shared global API helpers and project override behavior from Phase 1.

### Parallel Opportunities

- T003 and T004 can run in parallel.
- T009 and T010 can run in parallel after T008.
- T021 and T022 can run in parallel.
- T032 and T039 can run in parallel because they are page-owned components in different directories.
- T030, T031, T035, T038, and T041 can run in parallel after Foundational if staffed.

## Parallel Example: User Story 2

```text
Task: "Implement the user detail drawer in src/views/backend/users/UserDetailDrawer.vue"
Task: "Implement the project grant dialog in src/views/backend/users/UserGrantDialog.vue"
```

## Parallel Example: User Story 3

```text
Task: "Implement group detail drawer in src/views/backend/groups/GroupDetailDrawer.vue"
Task: "Implement API map editor in src/views/backend/apiMap/ApiMapEditor.vue"
Task: "Implement audit/activity page in src/views/backend/audit/index.vue"
```

## Implementation Strategy

### MVP First

1. Complete Setup and Foundational tasks.
2. Complete US1 in `src/views/backend/dashboard.vue`.
3. Validate dashboard independently with real APIs and empty states.

### Incremental Delivery

1. Deliver dashboard MVP.
2. Add users and project grant workflow.
3. Add groups, projects, menus, API map, and audit pages.
4. Run typecheck/build/manual quickstart validation.

### Format Validation

All tasks use the required checklist format with task ID, optional `[P]`, story label where required, and explicit file paths.
