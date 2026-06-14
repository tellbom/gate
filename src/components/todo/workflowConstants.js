/**
 * 流程中心前端静态配置常量。
 *
 * businessTypeMap 的 key 与后端 businessType 字段值保持一致。
 */

export const businessTypeMap = {
  personnel_selection_approval: { color: 'primary', label: '人才选调' },
  daily_supervision: { color: 'success', label: '日常监督' },
  inspection_preparation: { color: 'warning', label: '巡察准备' },
  pre_inspection_briefing: { color: 'danger', label: '巡前通报' },
}

export const priorityMap = {
  3: { type: 'danger', label: '紧急' },
  2: { type: 'warning', label: '高优先' },
  1: { type: '', label: '普通' },
  0: { type: 'info', label: '低优先' },
}
