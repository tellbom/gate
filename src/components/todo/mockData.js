/**
 * mockData.js — PATCH-R06 最终清理版
 *
 * 变更说明：
 *   1. 所有 API 函数已全部移除（A04 已完成）
 *   2. businessTypeMap / priorityMap 已迁移至 workflowConstants.js（A02 已完成）
 *   3. 本文件只保留 ContactSelector 转派场景的临时 mock 数据
 *
 * PATCH-R06 修正冲突：
 *   mockOrgList.parentId → pid
 *     原因：ContactSelector.vue 的 OrgItem 接口使用 pid 字段，
 *           orgChildrenMap computed 通过 o.pid ?? '__root__' 构建树。
 *           旧 parentId 字段完全无效，会导致所有节点扁平堆在根层，树形结构失效。
 *
 *   mockUserList 补充 phone 字段
 *     原因：ContactSelector.vue 的 UserItem 接口 phone 为必填字段，
 *           缺失时人员列表的电话行显示为空字符串。
 *
 * 后续替换说明：
 *   当真实组织/人员接口就绪后：
 *   1. TaskApproveDrawer.vue 中的 mockOrgList/mockUserList 替换为接口调用
 *   2. 本文件整体删除
 */

// ──────────────────────────────────────────────────────────────
//  组织架构（ContactSelector orgList prop）
//
//  字段说明（与 ContactSelector OrgItem 接口对齐）：
//    id:   组织唯一 ID
//    pid:  父组织 ID，顶级节点为 null    ← PATCH-R06 修正：旧版为 parentId
//    name: 组织显示名称
// ──────────────────────────────────────────────────────────────

export const mockOrgList = [
  // ── 顶级节点 ──
  { id: 'org_001', pid: null,      name: '局办公室'       },
  { id: 'org_002', pid: null,      name: '巡察监督管理局' },

  // ── 局办公室下属 ──
  { id: 'org_003', pid: 'org_001', name: '综合科'         },
  { id: 'org_004', pid: 'org_001', name: '行政科'         },

  // ── 巡察监督管理局下属 ──
  { id: 'org_005', pid: 'org_002', name: '巡察一室'       },
  { id: 'org_006', pid: 'org_002', name: '巡察二室'       },
]

// ──────────────────────────────────────────────────────────────
//  人员列表（ContactSelector userList prop）
//
//  字段说明（与 ContactSelector UserItem 接口对齐）：
//    id:       人员唯一 ID
//    name:     姓名
//    workNo:   工号（completeTask / reassignTask 传此值）
//    phone:    联系电话    ← PATCH-R06 补充：原版缺失导致显示空
//    position: 职位/职称
//    orgId:    所属组织 ID（与 mockOrgList.id 对应）
// ──────────────────────────────────────────────────────────────

export const mockUserList = [
  { id: 'u_001', name: '王局长',   workNo: 'EMP001', phone: '13800000001', position: '局长',     orgId: 'org_001' },
  { id: 'u_002', name: '陈副局长', workNo: 'EMP002', phone: '13800000002', position: '副局长',   orgId: 'org_001' },
  { id: 'u_003', name: '刘科长',   workNo: 'EMP003', phone: '13800000003', position: '科长',     orgId: 'org_003' },
  { id: 'u_004', name: '张科员',   workNo: 'EMP004', phone: '13800000004', position: '科员',     orgId: 'org_003' },
  { id: 'u_005', name: '李主任',   workNo: 'EMP005', phone: '13800000005', position: '主任',     orgId: 'org_002' },
  { id: 'u_006', name: '赵室长',   workNo: 'EMP006', phone: '13800000006', position: '室长',     orgId: 'org_005' },
  { id: 'u_007', name: '钱巡察',   workNo: 'EMP007', phone: '13800000007', position: '巡察专员', orgId: 'org_005' },
  { id: 'u_008', name: '孙室长',   workNo: 'EMP008', phone: '13800000008', position: '室长',     orgId: 'org_006' },
]

/*
 * ── 已移除的内容（完整迁移记录）─────────────────────────────────
 *
 * businessTypeMap / priorityMap
 *   → 迁移至 src/components/todo/workflowConstants.js（A02）
 *
 * apiGetTodoList         → getPendingTasks()      src/api/workflow/processApi.ts
 * apiGetFlowRender       → getFlowRender()        src/api/workflow/processApi.ts
 * apiGetApplicationList  → getProcessList()       src/api/workflow/processApi.ts
 * apiTerminateProcess    → terminateProcess()     src/api/workflow/processApi.ts
 * apiGetApplicationDetail→ getProcessProgress()   src/api/workflow/processApi.ts
 * apiGetNodeFormData     → 各业务 service（已废弃，iframe 架构不需要）
 * apiReassignTask        → reassignTask()         src/api/workflow/processApi.ts
 * ──────────────────────────────────────────────────────────────
 */
