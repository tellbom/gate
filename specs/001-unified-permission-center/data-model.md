# Data Model: 统一权限管理中心

## Project
- Fields: `code` (string), `displayName` (derived string), `userCount` (derived number), `groupCount` (derived number), `menuCount` (derived number), `superCount` (derived number).
- Source: `GET /api/global/project/list`; counts derived from global list endpoints when loaded.
- Validation: `code !== "__global__"` for business project writes.
- Backend gap: canonical project name, Chinese name, owner, icon, and exact counts are not documented.

## AdminUser
- Fields: `userid`, `username`, `status`, `projectCodes`, `groupCodes`, `groupNames`, `superProjects`, `isSuper`.
- Source: `GET /api/global/user/list` or `GET /api/admin/list`.
- Relationships: has many `ProjectGrant`; belongs to many `PermissionGroup` by `groupCodes`.
- State transitions: `Active <-> Disabled` via `PUT /api/global/user/{userid}/status` or project scoped admin status.

## ProjectGrant
- Fields: `userid`, `targetProjects`, `project`, `isSuper`, `results`.
- Source: `projectCodes` and `superProjects` on AdminUser; writes through global grant/revoke and project super endpoint.
- State transitions: none -> granted, granted -> revoked, regular -> super, super -> regular.
- Validation: target project list excludes `__global__`; empty target list disables submit.

## PermissionGroup
- Fields: `groupCode`, `groupName`, `project`, `parent_group_code`, `status`, `permissionCodes`.
- Source: `GET /api/global/group/list`, `GET /api/group/list`.
- Relationships: may have parent group; has many AdminUser memberships.
- State transitions: `Active <-> Disabled` via `PUT /api/group/{groupCode}/status`.

## RuleMenuNode
- Fields: `ruleCode`, `permissionCode`, `title`, `type`, `status`, `icon`, `remark`, `weigh`, `name`, `path`, `menuType`, `url`, `component`, `children`.
- Source: `GET /api/global/menu/list`, `GET /api/rule/list`, `GET /api/rule/tree`.
- Relationships: tree parent/child via parent rule code or children.
- State transitions: `Active <-> Disabled`; `weigh` updates.

## ApiMapRecord
- Fields: `id`, `httpMethod`, `routePattern`, `permissionCode`, `action`, `status`, `createdAt`, `updatedAt`.
- Source: `GET /api/api-map/records`.
- Validation: method in `GET|POST|PUT|DELETE|PATCH`; action in `read|create|update|delete|execute|access`; route starts with `/api/`.
- State transitions: create, edit permission/action, delete.

## AuditLog
- Fields: `auditId`, `userid`, `username`, `project`, `permissionCode`, `result`, `reason`, `createdAt`, `httpMethod`, `route`, `action`.
- Source: `GET /api/search/audit-logs`.
- Validation: result is `Allow|Deny|Error` when filtering.

## PermissionView
- Fields: `permissionCode`, `action`, `resourceType`, `title`.
- Source: `GET /api/search/permission-view` or `GET /api/api-map/list`.
- Use: read-only selector/reference for permission code coverage.
