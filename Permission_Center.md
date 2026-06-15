# Plan

### Scope Summary

The objective is to fully redevelop the prototype from `Unified_Permission_Center.html` into a clean, file-separated React JSX codebase (mirroring the current `*.jsx` / `theme.css` / `app.jsx` layout), then hand it off to Codex for integration into the Vue shell. Two concerns are being addressed in parallel:

**Concern A — Shell & Menu Style:** The current `app.jsx` sidebar has the correct structure, but its visual details diverge from the HTML prototype (active-item style, section label treatment, bottom user row, project context pill). This must be brought to pixel-parity with the prototype.

**Concern B — Child Pages:** All six operational pages (`dashboard`, `users`, `authorization`, `groups`, `menus`, `audit`) and both appendix pages (`concept`, `apimap`) must be completely rewritten. The current `*.jsx` page files use mock in-memory store; the new versions must be written against the live backend API contract from `API-Backend-README.md`. All mock images, placeholder illustrations, and seed-data dependencies must be removed.

---

# Task Breakdown

### Phase 0 — Foundation (no logic, no API calls)

**T0.1 — `theme.css` audit & lock**
Verify `theme.css` matches every CSS variable in `Unified_Permission_Center.html` exactly (tokens, typography classes, button classes, card class, animation keyframes, scrollbar rules). Patch any divergences. Output: a finalized `theme.css` that Codex treats as read-only.

**T0.2 — `components.jsx` full rewrite**
Rewrite shared primitives to match the prototype's visual language exactly:
- `Icon` — same 24×24 SVG line set, same icon names
- `Avatar` — color-from-name, dim variant
- `Badge` — all six tones (ok / warn / deny / blue / super / neutral), dot variant, sm/md size
- `ProjectGlyph` — per-project tint map (portal, workflow, message, news, quality, rbac)
- `Spinner`, `EmptyState` — new additions for async states (not in current file)
- `ApiSource` — footnote component showing endpoint pills (used in every page)
- `Toast` / `useToast` — keep as-is (already matches prototype)
- `Drawer` — slide-in panel used by Users and Groups pages; rewrite to match prototype animation exactly
- `Modal` / `Confirm` — destructive-action confirmation dialog
- `SearchBar` — unified filter input used across list pages
- `PaginationBar` — page/pageSize control wired to API query params
- All helpers: `timeAgo`, `formatDate`

**T0.3 — `data.js` → `api.js`**
Replace the seed-data `data.js` with an `api.js` module that exports typed fetch wrappers for every backend endpoint listed in `API-Backend-README.md`. No mock data; all functions return Promises. Include a shared `apiFetch(method, path, params)` base function that attaches the `X-Project` header from a context store. This file has zero UI; it is a pure service layer.

---

### Phase 1 — Shell Fixes

**T1.1 — `app.jsx` sidebar style patch**
Bring the sidebar to exact prototype spec:
- Logo block: 34×34 rounded dark tile with filled shield icon + two-line wordmark
- Context pill: `全局视图` label, green status dot, `__global__` mono label, parchment background, 10px radius
- Nav group labels: `t-micro` uppercase, `ink-48`, 8px bottom padding
- Nav items: 9px 12px padding, 9px radius, blue-wash / blue active, ink-80 / ink-80 inactive weight 400
- Active item: `blue-wash` background, `blue` color, fontWeight 600
- Bottom user row: Avatar + name/role text + `super` badge (purple dot pill)
- No changes to routing logic or store

**T1.2 — `app.jsx` top bar fix**
- Frosted glass: `rgba(255,255,255,0.8)` + `saturate(180%) blur(20px)` backdrop
- Height 60px, `hairline` border-bottom, sticky z-20
- Two-line title (page name bold, subtitle caption)
- Right slot for page-level action button (passed as prop)

---

### Phase 2 — Child Pages (one task per page)

All pages follow a single contract:
- Accept `{ ctx }` prop where `ctx = { store, actions, go, scenario, intent, setIntent, toast }`
- Must call real API functions from `api.js` on mount and on user action
- Must handle loading / empty / error states via `Spinner` and `EmptyState`
- Must show `ApiSource` footnote at the bottom of each section listing the endpoints used
- No images, no illustrations, no placeholder art

**T2.1 — `dashboard.jsx` rewrite**
Layout: 4-stat tile row → project system grid → recent audit activity feed.
- Stat tiles: total users, total groups, total menus, active projects (numbers fetched by aggregating `/api/global/user/list`, `/api/global/group/list`, `/api/global/menu/list`)
- Project grid: one card per project with glyph, name, user/super counts, quick-action buttons (→ grant, → members, → menus)
- Audit feed: last 8 rows from `/api/search/audit-logs` (Allow/Deny/Error badge, username, route, timestamp)
- Scenario launcher: clicking card quick-actions calls `scenario()` to cross-navigate

**T2.2 — `users.jsx` rewrite**
Layout: filter bar → paginated table → right drawer for detail.
- List from `GET /api/global/user/list` with keyword / project / status filters and page/pageSize
- Columns: Avatar+name, userid, project badges, group badges, super indicator, status, actions
- Actions: toggle status (`PUT /api/admin/{userid}/status`), open detail drawer, open grant dialog
- Detail drawer: user info + per-project grant list + remove grant button per row
- Grant dialog (inline): project multi-select + isSuper toggle → `POST /api/global/user/{userid}/project-grants`
- Revoke: `DELETE /api/global/user/{userid}/project-grants/{project}` with confirm modal

**T2.3 — `authorization.jsx` rewrite**
Layout: two-panel view switcher (by-user / by-project).
- By-user panel: user search → grant summary → super toggle per project row
- By-project panel: project list sidebar → user list for selected project → super toggle
- Super toggle calls `PUT /api/project-grant/{userid}/super`
- Batch grant: user select + project multi-select → `POST /api/global/user/{userid}/project-grants`
- Revoke: `DELETE /api/global/user/{userid}/project-grants/{project}`
- Intent handling: when `ctx.intent` is set (from dashboard scenario launcher), auto-open the relevant view/project

**T2.4 — `groups.jsx` rewrite**
Layout: filter bar → card grid or table → detail drawer (members + permission codes).
- List from `GET /api/global/group/list` with project / status filter
- Group card: groupName, project glyph, member count, parent group, status badge, permission code count
- Status toggle: `PUT /api/group/{groupCode}/status`
- Detail drawer: member list (`GET /api/group/list` filtered) + add/remove member, permission codes display
- Add member: userid input → `POST /api/group/{groupCode}/members`
- Remove member: `DELETE /api/group/{groupCode}/members/{userid}` with confirm
- Create group form: groupCode, groupName, parentGroupCode (select), status, ruleCodes tree from `GET /api/rule/tree` → `POST /api/group`
- Rule tree uses `ruleCode` as node key; submit checked + halfChecked ruleCodes

**T2.5 — `menus.jsx` rewrite**
Layout: left project selector → rule tree panel → right API-map panel (tabs).
- Rule tree: `GET /api/rule/tree` for selected project, rendered as indent tree with type icons
- Node actions: toggle status (`PUT /api/rule/{ruleCode}/status`), weigh up/down (`PUT /api/rule/{ruleCode}/weigh`)
- Type display: `MenuDir` → folder icon, `Menu` → page icon, `Button` → button icon
- Status badge on each node
- API map tab: paginated list from `GET /api/api-map/records`, columns: method badge, route pattern, permissionCode, action, status
- Add mapping form: httpMethod select, routePattern input, permissionCode input, action select → `POST /api/api-map`
- Edit mapping: permissionCode + action only → `PUT /api/api-map/{id}`
- Delete: `DELETE /api/api-map/{id}` with confirm
- Intent: if `ctx.intent.type === "menus"`, auto-select the intent project

**T2.6 — `audit.jsx` rewrite**
Layout: filter bar → results table → permission-view tab.
- Audit log tab: `GET /api/search/audit-logs` with filters (userid, permissionCode, result, httpMethod, date range) and pagination
- Columns: user, project, permissionCode, result badge (Allow=ok / Deny=deny / Error=warn), reason, timestamp
- Permission view tab: `GET /api/search/permission-view` with keyword/status filter
- Columns: permissionCode, action, resourceType, title

---

### Phase 3 — Appendix Pages (keep content, update style)

**T3.1 — `concept.jsx` style refresh**
The architecture narrative content can stay; remove all mock-data dependencies. Update visual styling (card tokens, badge tones, icon usage) to exactly match the prototype. No API calls needed.

**T3.2 — `apimap.jsx` style refresh**
The PAGE_MAP and FUTURE tables can stay as static content. Update visual styling. No API calls needed.

---

### Phase 4 — Integration Handoff Prep

**T4.1 — File inventory & `index.html` entry-point update**
Produce a clean `index.html` that:
- Loads `theme.css`
- Loads React + Babel from CDN (matching current setup)
- Loads scripts in dependency order: `api.js` → `data.js` (removed) → `components.jsx` → `dashboard.jsx` → `users.jsx` → `authorization.jsx` → `groups.jsx` → `menus.jsx` → `audit.jsx` → `concept.jsx` → `apimap.jsx` → `app.jsx`
- No inline script blocks; every page is a separate file

**T4.2 — Codex integration notes**
Produce a short `CODEX-HANDOFF.md` documenting:
- File list and load order
- The `X-Project` header injection point in `api.js`
- How `ctx` is threaded from `App` into pages
- The one Vue integration touch-point: `app.jsx`'s `App` component is mounted into `#root` by the Vue shell's iframe or micro-frontend boundary (to be handled by Marcel)
- Known stubs: `concept.jsx` and `apimap.jsx` have no live data; they are static reference pages

---

### Constraints & Non-Negotiables

1. Zero images anywhere. All visual identity comes from CSS tokens + SVG icons + letter-based Avatar/Glyph.
2. Every `*.jsx` file exports its root component to `window.*` (same pattern as current `app.jsx`).
3. The prototype's CSS variable names are the source of truth for all color references; never hardcode hex values in JSX.
4. All API error states must be surfaced inline (not swallowed silently).
5. `data.js` is removed entirely once `api.js` is complete. No page may import or reference mock seed data.
6. `concept.jsx` and `apimap.jsx` are design-reference pages — no API calls, no RBAC gate.
7. Codex does the implementation; this plan is the specification.