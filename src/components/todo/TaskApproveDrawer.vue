<template>
  <el-drawer
    v-model="drawerVisible"
    :size="drawerWidth"
    direction="rtl"
    destroy-on-close
    :before-close="handleClose"
    class="task-approve-drawer"
  >
    <!-- ══ Header ══ -->
    <template #header>
      <div class="drawer-header">
        <div class="header-title-block">
          <div class="header-task-name">{{ taskInfo?.taskName || '审批任务' }}</div>
          <div class="header-meta">
            <el-tag
              :type="businessTypeMap[taskInfo?.businessType]?.color || 'info'"
              size="small" round effect="plain"
            >{{ businessTypeMap[taskInfo?.businessType]?.label || taskInfo?.businessType }}</el-tag>
            <el-tag
              v-if="!readonly"
              :type="priorityMap[taskInfo?.priority]?.type || ''"
              size="small" round
            >{{ priorityMap[taskInfo?.priority]?.label || '普通' }}</el-tag>
            <span class="header-bid">{{ taskInfo?.businessId }}</span>
          </div>
        </div>

        <div class="header-actions" v-if="!readonly">
          <el-button
            type="success" :icon="CircleCheck"
            :loading="submitting === 'approve'"
            :disabled="iframeLocked"
            @click="handleApprove"
          >
            <span v-if="iframeLocked">等待表单...</span>
            <span v-else>同意</span>
          </el-button>
          <el-button
            v-if="taskInfo?.canReject"
            type="danger" :icon="CircleClose"
            :loading="submitting === 'reject'"
            @click="openRejectDialog"
          >驳回</el-button>
          <el-button :icon="Switch" plain @click="reassignDialogVisible = true">转派</el-button>
        </div>

        <div class="header-readonly-badge" v-else>
          <el-tag type="info" effect="plain" :icon="View">查看模式</el-tag>
        </div>
      </div>
    </template>

    <!-- ══ 主体 ══ -->
    <div class="drawer-body">
      <el-tabs v-model="activeTab" class="drawer-tabs">

        <!-- ─── Tab1：业务表单 + 选人区 ─── -->
        <el-tab-pane label="审批表单" name="form">
          <div class="tab-form-content">

            <!-- iframe 区域 -->
            <div class="iframe-section" :style="{ height: iframeHeight }">
              <div v-if="iframeLoading" class="iframe-loading">
                <el-icon class="spin"><Loading /></el-icon>
                <span>加载业务表单…</span>
              </div>
              <iframe
                v-if="taskInfo?.pageUrl"
                ref="iframeEl"
                :key="iframeKey"
                :src="taskInfo.pageUrl"
                class="task-iframe"
                :class="{ 'iframe-hidden': iframeLoading }"
                frameborder="0"
                allowfullscreen
                @load="handleIframeLoad"
                @error="handleIframeError"
              />
              <IframeErrorFallback
                v-if="!taskInfo?.pageUrl || iframeError"
                :title="iframeError ? '页面加载失败' : '暂无业务表单'"
                :desc="iframeError ? '业务表单加载出错，请刷新重试或联系管理员' : '当前节点未配置业务表单页面'"
                :show-retry="iframeError"
                @retry="reloadIframe"
              />
            </div>

            <!-- ── 选人区（有激活 slot 时渲染）── -->
            <div v-if="!readonly && (gatewayGroups.length || activeSlots.length)" class="slot-section">
              <el-divider content-position="left">
                <span class="divider-text">下一节点处理人</span>
              </el-divider>

              <div
                v-for="group in gatewayGroups"
                :key="group.variable"
                class="gateway-choice"
              >
                <div class="gateway-choice__head">
                  <span class="gateway-choice__title">{{ group.label }}</span>
                  <span class="gateway-choice__hint">请选择后查看对应推荐人员</span>
                </div>
                <div class="gateway-choice__options">
                  <button
                    v-for="option in group.options"
                    :key="option.value"
                    type="button"
                    class="gateway-choice__option"
                    :class="{ 'is-active': String(flowVars[group.variable] ?? '') === option.value }"
                    @click="selectGatewayOption(group.variable, option.value)"
                  >
                    <span class="gateway-choice__option-main">{{ option.label }}</span>
                    <span v-if="option.slotLabels.length" class="gateway-choice__option-sub">
                      {{ option.slotLabels.join(' / ') }}
                    </span>
                  </button>
                </div>
              </div>

              <div
                v-for="slot in activeSlots"
                :key="slot.slotKey"
                class="slot-item"
              >
                <!-- 已选人员条 -->
                <SelectedUserBar
                  :users="slotSelections[slot.slotKey] || []"
                  :label="slot.label + (slot.required ? ' *' : '')"
                  :restrict-to-recommended="slot.restrictToRecommended"
                  :required="slot.required"
                  @remove="removeSlotUser(slot.slotKey, $event)"
                  @click-add="openSlotSelector(slot)"
                />

                <!-- 推荐候选人条 -->
                <DefaultAssigneeBar
                  v-if="getSlotCandidates(slot).length"
                  :candidates="getSlotCandidates(slot)"
                  :used-ids="(slotSelections[slot.slotKey] || []).map(u => u.workNo ?? u.id)"
                  :restrict-to-recommended="slot.restrictToRecommended"
                  :label="slot.label"
                  @use-one="useSlotCandidate(slot.slotKey, $event)"
                  @use-all="useAllSlotCandidates(slot.slotKey)"
                />
              </div>
            </div>

          </div>
        </el-tab-pane>

        <!-- ─── Tab2：流程进度 ─── -->
        <el-tab-pane label="流程进度" name="flow">
          <div class="tab-pane-content flow-tab-content">
            <div class="flow-meta-bar" v-if="flowRenderData">
              <span class="fmb-item">
                <span class="fmb-label">发起人</span>
                <span class="fmb-val">{{ flowRenderData.createdBy }}</span>
              </span>
              <span class="fmb-sep" />
              <span class="fmb-item">
                <span class="fmb-label">发起时间</span>
                <span class="fmb-val">{{ formatDate(flowRenderData.createdTime) }}</span>
              </span>
              <span class="fmb-sep" />
              <span class="fmb-item">
                <span class="fmb-label">流程状态</span>
                <el-tag :type="statusTagType(flowRenderData.status)" size="small" round>
                  {{ statusLabel(flowRenderData.status) }}
                </el-tag>
              </span>
            </div>
            <FlowGraph :data="flowRenderData" :loading="flowDataLoading" :error="flowDataError" />
          </div>
        </el-tab-pane>

      </el-tabs>
    </div>

    <!-- ══ 驳回 Dialog ══ -->
    <el-dialog
      v-model="rejectDialogVisible"
      title="填写驳回原因"
      width="480px"
      append-to-body
      :close-on-click-modal="false"
    >
      <el-form ref="rejectFormRef" :model="rejectForm" :rules="rejectRules" label-position="top">
        <el-form-item v-if="rejectOptions.length > 1" label="驳回方式" prop="rejectCode">
          <div class="reject-options-list">
            <div
              v-for="opt in rejectOptions"
              :key="opt.rejectCode"
              class="reject-option-item"
              :class="{ 'is-selected': rejectForm.rejectCode === opt.rejectCode }"
              @click="rejectForm.rejectCode = opt.rejectCode"
            >
              <div class="ro-radio">
                <div v-if="rejectForm.rejectCode === opt.rejectCode" class="ro-dot" />
              </div>
              <div class="ro-info">
                <div class="ro-label">{{ opt.label }}</div>
                <div v-if="opt.description" class="ro-desc">{{ opt.description }}</div>
              </div>
            </div>
          </div>
        </el-form-item>
        <el-alert
          v-else-if="rejectOptions.length === 1"
          type="warning" :closable="false" show-icon style="margin-bottom: 16px"
        >
          <template #title>{{ rejectOptions[0].label }}</template>
          <template v-if="rejectOptions[0].description" #default>{{ rejectOptions[0].description }}</template>
        </el-alert>
        <el-form-item label="驳回原因" prop="rejectReason">
          <el-input
            v-model="rejectForm.rejectReason"
            type="textarea" :rows="4"
            placeholder="请填写驳回原因（必填）"
            maxlength="500" show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="danger" :loading="submitting === 'reject'" @click="handleReject">
          确认驳回
        </el-button>
      </template>
    </el-dialog>

    <!-- ══ 转派 Dialog ══ -->
    <el-dialog
      v-model="reassignDialogVisible"
      title="转派任务"
      width="780px"
      append-to-body
      :close-on-click-modal="false"
      class="reassign-dialog"
    >
      <div class="reassign-tip">
        <el-alert type="warning" :closable="false" show-icon>
          <template #title>转派后，该任务将从您的待办中移除，由新处理人继续审批</template>
        </el-alert>
      </div>
      <ContactSelector
        :org-list="orgList"
        :user-list="userList"
        :multiple="false"
        @confirm="handleReassignConfirm"
        @cancel="reassignDialogVisible = false"
      />
      <template #footer>
        <el-button @click="reassignDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="submitting === 'reassign'"
          :disabled="!reassignTarget"
          @click="handleReassignSubmit"
        >确认转派给 {{ reassignTarget?.name || '' }}</el-button>
      </template>
    </el-dialog>

    <!-- ══ 选人 Dialog（restrictToRecommended=false 时才会触发）══ -->
    <el-dialog
      v-model="selectorVisible"
      :title="`选择「${activeSelectorSlot?.label || '处理人'}」`"
      width="860px"
      append-to-body
      :close-on-click-modal="false"
      class="slot-selector-dialog"
    >
      <ContactSelector
        :org-list="orgList"
        :user-list="userList"
        :multiple="activeSelectorSlot?.mode === 'multiple'"
        @confirm="handleSlotSelectorConfirm"
        @cancel="selectorVisible = false"
      />
    </el-dialog>

  </el-drawer>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { CircleCheck, CircleClose, Switch, View, Loading } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useAdminInfo } from '/@/stores/adminInfo'
import ContactSelector     from '/@/components/ContactSelector.vue'
import FlowGraph           from './Flowgraph.vue'
import IframeErrorFallback from './IframeErrorFallback.vue'
import SelectedUserBar     from './SelectedUserBar.vue'
import DefaultAssigneeBar  from './Defaultassigneebar.vue'
import { completeTask, reassignTask } from '/@/api/workflow/processApi'
import { statusTagType, statusLabel, formatDate } from '/@/workflow-shared/workflowUtils.js'
import { businessTypeMap, priorityMap } from '/@/components/todo/workflowConstants'
import { mockOrgList, mockUserList } from '/@/components/todo/mockData.js'
import { onIframeEvent } from '/@/utils/iframeBridge'

const adminInfo = useAdminInfo()

// ── Props ──────────────────────────────────────────────────────
const props = defineProps({
  modelValue:      { type: Boolean, default: false },
  readonly:        { type: Boolean, default: false },
  /**
   * taskInfo — 来自 PendingTaskDto（PATCH-S01 新增字段）：
   *   taskId / taskName / businessId / businessType / nodeSemantic
   *   roleKey / pageCode / pageUrl / priority / createTime
   *   isAfterConvergencePoint / canReject / rejectOptions
   *   requiredSlots / slotRecommendedUsers / restrictToRecommended
   */
  taskInfo:        { type: Object,  default: null  },
  flowRenderData:  { type: Object,  default: null  },
  flowDataLoading: { type: Boolean, default: false },
  flowDataError:   { type: String,  default: ''    },
})

const emit = defineEmits(['update:modelValue', 'approved', 'rejected', 'reassigned'])

// 转派 + 选人用人员数据（方案B：联调期间用 mock，后续接口替换）
const orgList  = mockOrgList
const userList = mockUserList

// ── Visible ────────────────────────────────────────────────────
const drawerWidth   = '920px'
const drawerVisible = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v),
})

const activeTab = ref('form')

// ── iframe 状态 ────────────────────────────────────────────────
const iframeLoading = ref(true)
const iframeError   = ref(false)
const iframeKey     = ref(0)
const iframeEl      = ref(null)
const iframeLocked  = ref(false)
const iframeFormVars = ref({})
const iframeFormError = ref('')
const bridgeUnsubs = ref([])

function resetBridgeState() {
  bridgeUnsubs.value.forEach(fn => fn())
  bridgeUnsubs.value = []
  iframeLocked.value = false
  iframeFormVars.value = {}
  iframeFormError.value = ''
}

function handleIframeLoad() {
  iframeLoading.value = false
  resetBridgeState()

  if (!iframeEl.value) return

  const unsubLoading = onIframeEvent(iframeEl.value, 'formLoading', () => {
    iframeLocked.value = true
    iframeFormError.value = ''
  })

  const unsubReady = onIframeEvent(iframeEl.value, 'formReady', (payload) => {
    iframeLocked.value = false
    iframeFormError.value = ''
    if (payload?.variables && typeof payload.variables === 'object') {
      iframeFormVars.value = payload.variables
    }
  })

  const unsubError = onIframeEvent(iframeEl.value, 'formError', (payload) => {
    iframeLocked.value = false
    iframeFormError.value = payload?.reason || '业务表单存在错误，请检查后重试'
  })

  bridgeUnsubs.value = [unsubLoading, unsubReady, unsubError]
}

function handleIframeError() {
  iframeLoading.value = false
  iframeError.value   = true
  resetBridgeState()
}

function reloadIframe() {
  iframeError.value   = false
  iframeLoading.value = true
  resetBridgeState()
  iframeKey.value++
}

watch(() => props.taskInfo?.pageUrl, () => {
  iframeLoading.value = true
  iframeError.value   = false
  resetBridgeState()
})

// ── iframe 高度：有选人区时压缩，无选人区时撑满 ──────────────
const iframeHeight = computed(() =>
  (gatewayGroups.value.length || activeSlots.value.length) ? '500px' : '100%'
)

// ══════════════════════════════════════════════════════════════
//  选人区逻辑（PATCH-S04 新增）
// ══════════════════════════════════════════════════════════════

// ── conditionalOn 条件求值 ────────────────────────────────────
// 格式：'varName==value' 或 '!varName'，与后端 EvaluateCondition 对齐
function evaluateCondition(condition, variables) {
  if (!condition) return true
  try {
    const negate = condition.startsWith('!')
    const expr   = negate ? condition.slice(1) : condition
    const eqIdx  = expr.indexOf('==') >= 0 ? expr.indexOf('==') : expr.indexOf('=')
    const eqLen  = expr.indexOf('==') >= 0 ? 2 : 1
    if (eqIdx < 0) {
      const exists = variables[expr.trim()] != null
      return negate ? !exists : exists
    }
    const varName  = expr.slice(0, eqIdx).trim()
    const expected = expr.slice(eqIdx + eqLen).trim()
    const actual   = String(variables[varName] ?? '')
    const boolMap  = { true: true, false: false }
    const eLower   = expected.toLowerCase()
    const aLower   = actual.toLowerCase()
    const matched  = (eLower in boolMap && aLower in boolMap)
      ? boolMap[aLower] === boolMap[eLower]
      : aLower === eLower
    return negate ? !matched : matched
  } catch { return true }
}

// 业务变量（网关条件用，当前页面无输入入口，预留扩展）
const flowVars = ref({})

function parseGatewayCondition(condition) {
  if (!condition) return null
  const expr  = condition.startsWith('!') ? condition.slice(1) : condition
  const eqIdx = expr.indexOf('==') >= 0 ? expr.indexOf('==') : expr.indexOf('=')
  const eqLen = expr.indexOf('==') >= 0 ? 2 : 1
  if (eqIdx < 0) return null

  const variable = expr.slice(0, eqIdx).trim()
  const value    = expr.slice(eqIdx + eqLen).trim()
  if (!variable || !value) return null
  return { variable, value }
}

function gatewayValueLabel(value) {
  const normalized = String(value).toLowerCase()
  if (normalized === 'true') return '是'
  if (normalized === 'false') return '否'
  return String(value)
}

function coerceGatewayValue(value) {
  const normalized = String(value).toLowerCase()
  if (normalized === 'true') return true
  if (normalized === 'false') return false
  return value
}

const gatewayGroups = computed(() => {
  const groupMap = new Map()

  ;(props.taskInfo?.requiredSlots ?? []).forEach(slot => {
    const parsed = parseGatewayCondition(slot.conditionalOn)
    if (!parsed) return

    if (!groupMap.has(parsed.variable)) {
      groupMap.set(parsed.variable, {
        variable: parsed.variable,
        label: `分支选择：${parsed.variable}`,
        options: new Map(),
      })
    }

    const group = groupMap.get(parsed.variable)
    if (!group.options.has(parsed.value)) {
      group.options.set(parsed.value, {
        value: parsed.value,
        label: gatewayValueLabel(parsed.value),
        slotLabels: [],
      })
    }

    const option = group.options.get(parsed.value)
    const slotLabel = slot.label || slot.slotKey
    if (slotLabel && !option.slotLabels.includes(slotLabel)) {
      option.slotLabels.push(slotLabel)
    }
  })

  return Array.from(groupMap.values()).map(group => ({
    ...group,
    options: Array.from(group.options.values()),
  }))
})

function selectGatewayOption(variable, value) {
  flowVars.value = {
    ...flowVars.value,
    [variable]: coerceGatewayValue(value),
  }
}

// 激活槽位（过滤 conditionalOn）
const activeSlots = computed(() =>
  (props.taskInfo?.requiredSlots ?? [])
    .filter(s => evaluateCondition(s.conditionalOn, flowVars.value))
    .map(s => ({
      ...s,
      restrictToRecommended:
        s.restrictToRecommended
        ?? props.taskInfo?.restrictToRecommended?.[s.slotKey]
        ?? false,
    }))
)

// ── 推荐候选人查找 ────────────────────────────────────────────
// V1.3 规则：
//   slotRecommendedUsers[slot.slotKey] ?? []
function getSlotCandidates(slot) {
  const rec    = props.taskInfo?.slotRecommendedUsers ?? {}
  // 工号数组
  const rawIds = rec[slot.slotKey] ?? []
  const ids = Array.isArray(rawIds) ? rawIds : []
  // 优先映射本地用户对象；联调真实工号不在 mock 中时保留工号占位，避免推荐区空白。
  return ids
    .map(id => {
      const workNo = String(id)
      return userList.find(u => u.workNo === workNo || u.id === workNo) ?? {
        id: workNo,
        workNo,
        name: workNo,
        position: '推荐人员',
      }
    })
}

// ── 选人状态 ─────────────────────────────────────────────────
const slotSelections = ref({})

// taskInfo 变化时重置选人（新任务）
watch(() => props.taskInfo, () => {
  const init = {}
  ;(props.taskInfo?.requiredSlots ?? []).forEach(s => { init[s.slotKey] = [] })
  slotSelections.value = init
  flowVars.value       = {}
  resetBridgeState()
}, { immediate: true })

// activeSlots 变化时清除失活 slot 的选人（conditionalOn 切换）
watch(activeSlots, (slots) => {
  const activeKeys = new Set(slots.map(s => s.slotKey))
  const cleaned    = {}
  Object.keys(slotSelections.value).forEach(key => {
    cleaned[key] = activeKeys.has(key) ? slotSelections.value[key] : []
  })
  slotSelections.value = cleaned
})

// 移除已选人员
function removeSlotUser(slotKey, user) {
  slotSelections.value[slotKey] =
    (slotSelections.value[slotKey] ?? []).filter(
      u => (u.workNo ?? u.id) !== (user.workNo ?? user.id)
    )
}

// 使用单个推荐人
function useSlotCandidate(slotKey, candidate) {
  const current = slotSelections.value[slotKey] ?? []
  const uid = candidate.workNo ?? candidate.id
  if (current.some(u => (u.workNo ?? u.id) === uid)) return
  slotSelections.value[slotKey] = [...current, candidate]
}

// 使用全部推荐人
function useAllSlotCandidates(slotKey) {
  const slot      = activeSlots.value.find(s => s.slotKey === slotKey)
  if (!slot) return
  const candidates = getSlotCandidates(slot)
  const current    = slotSelections.value[slotKey] ?? []
  const usedIds    = new Set(current.map(u => u.workNo ?? u.id))
  const toAdd      = candidates.filter(c => !usedIds.has(c.workNo ?? c.id))
  slotSelections.value[slotKey] = [...current, ...toAdd]
}

// ── 选人弹窗（restrictToRecommended=false 时才触发）── ────────
const selectorVisible    = ref(false)
const activeSelectorSlot = ref(null)

function openSlotSelector(slot) {
  // 限制范围模式：禁止弹窗新增，SelectedUserBar 的 readonly 已隐藏按钮
  // 此处双重保险
  if (slot.restrictToRecommended) return
  activeSelectorSlot.value = slot
  selectorVisible.value    = true
}

function handleSlotSelectorConfirm(users) {
  if (!activeSelectorSlot.value) return
  slotSelections.value[activeSelectorSlot.value.slotKey] = users
  selectorVisible.value = false
}

// ── 审批：同意 ────────────────────────────────────────────────
const submitting     = ref('')
const approveComment = ref('')

const handleApprove = async () => {
  if (iframeFormError.value) {
    ElMessage.warning(iframeFormError.value)
    return
  }

  if (Object.keys(iframeFormVars.value).length) {
    flowVars.value = { ...iframeFormVars.value, ...flowVars.value }
  }

  for (const group of gatewayGroups.value) {
    if (flowVars.value[group.variable] == null || flowVars.value[group.variable] === '') {
      ElMessage.warning(`请选择「${group.label}」`)
      return
    }
  }

  // 点同意时校验（PATCH-S01 §5 规则）
  for (const slot of activeSlots.value) {
    const selected = slotSelections.value[slot.slotKey] ?? []

    // required 校验：至少选 1 人
    if (slot.required && selected.length === 0) {
      ElMessage.warning(`「${slot.label}」至少需要选择 1 人`)
      return
    }

    // restrictToRecommended 校验：不得包含推荐人以外的人员
    if (slot.restrictToRecommended && selected.length > 0) {
      const candidateIds = new Set(
        getSlotCandidates(slot).map(u => u.workNo ?? u.id)
      )
      const invalid = selected.filter(u => !candidateIds.has(u.workNo ?? u.id))
      if (invalid.length > 0) {
        ElMessage.warning(
          `「${slot.label}」只能从推荐人中选择，` +
          `请移除：${invalid.map(u => u.name).join('、')}`
        )
        return
      }
    }
  }

  submitting.value = 'approve'
  try {
    await completeTask({
      businessId:   props.taskInfo.businessId,
      taskId:       props.taskInfo.taskId,       // 必传（PATCH-S01）
      action:       1,
      comment:      approveComment.value || undefined,
      nextSlotSelections: activeSlots.value.map(slot => ({
        slotKey: slot.slotKey,
        users:   (slotSelections.value[slot.slotKey] ?? [])
                   .map(u => u.workNo ?? u.id),
      })),
      businessVariables: Object.keys(flowVars.value).length
        ? { ...flowVars.value }
        : undefined,
    })
    ElMessage.success('审批成功')
    emit('approved')
    drawerVisible.value = false
  } finally {
    submitting.value = ''
  }
}

// ── 审批：驳回 ────────────────────────────────────────────────
const rejectOptions       = computed(() => props.taskInfo?.rejectOptions ?? [])
const rejectDialogVisible = ref(false)
const rejectFormRef       = ref(null)
const rejectForm          = ref({ rejectCode: '', rejectReason: '' })
const rejectRules         = {
  rejectCode:   [{ required: true, message: '请选择驳回方式',  trigger: 'change' }],
  rejectReason: [{ required: true, message: '请填写驳回原因',  trigger: 'blur'   }],
}

function openRejectDialog() {
  rejectForm.value.rejectCode   = rejectOptions.value.length === 1
    ? rejectOptions.value[0].rejectCode
    : ''
  rejectForm.value.rejectReason = ''
  rejectDialogVisible.value     = true
}

const handleReject = async () => {
  await rejectFormRef.value?.validate()
  submitting.value = 'reject'
  try {
    await completeTask({
      businessId:         props.taskInfo.businessId,
      taskId:             props.taskInfo.taskId,
      action:             2,
      rejectCode:         rejectForm.value.rejectCode,
      rejectReason:       rejectForm.value.rejectReason,
      comment:            rejectForm.value.rejectReason,
      nextSlotSelections: [],    // 驳回不传选人
    })
    ElMessage.success('已驳回')
    rejectDialogVisible.value = false
    emit('rejected')
    drawerVisible.value = false
  } finally {
    submitting.value = ''
  }
}

// ── 转派 ──────────────────────────────────────────────────────
const reassignDialogVisible = ref(false)
const reassignTarget        = ref(null)

const handleReassignConfirm = (users) => {
  reassignTarget.value = users[0] || null
}

const handleReassignSubmit = async () => {
  if (!reassignTarget.value) return
  submitting.value = 'reassign'
  try {
    await reassignTask({
      businessId:   props.taskInfo.businessId,
      taskId:       props.taskInfo.taskId,
      newAssignees: [reassignTarget.value.workNo],
      operatorId:   adminInfo.userid,
    })
    ElMessage.success(`已转派给 ${reassignTarget.value.name}`)
    reassignDialogVisible.value = false
    emit('reassigned', reassignTarget.value)
    drawerVisible.value = false
  } finally {
    submitting.value = ''
  }
}

// ── 关闭重置 ──────────────────────────────────────────────────
const handleClose = (done) => {
  approveComment.value          = ''
  rejectForm.value.rejectCode   = ''
  rejectForm.value.rejectReason = ''
  reassignTarget.value          = null
  reassignDialogVisible.value   = false
  selectorVisible.value         = false
  activeSelectorSlot.value      = null
  slotSelections.value          = {}
  flowVars.value                = {}
  iframeLoading.value           = true
  iframeError.value             = false
  resetBridgeState()
  activeTab.value               = 'form'
  done()
}

onBeforeUnmount(() => {
  resetBridgeState()
})
</script>

<style>
.task-approve-drawer {
  top: 48px !important;
  height: calc(100% - 48px) !important;
}
</style>

<style scoped>
/* ── Drawer 结构 ── */
:deep(.el-drawer__header) {
  padding: 0; margin-bottom: 0;
  border-bottom: 1px solid var(--wf-divider);
}
:deep(.el-drawer__body) {
  padding: 0; overflow: hidden;
  display: flex; flex-direction: column;
}

/* ── Header ── */
.drawer-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 20px; gap: var(--wf-space-16); width: 100%;
}
.header-title-block { flex: 1; min-width: 0; }
.header-task-name   { font-size: var(--wf-font-lg); font-weight: var(--wf-font-weight-bold); color: var(--wf-ink); margin-bottom: var(--wf-space-6); letter-spacing: -0.3px; }
.header-meta        { display: flex; align-items: center; gap: var(--wf-space-8); flex-wrap: wrap; }
.header-bid         { font-size: var(--wf-font-sm); color: var(--wf-ink-disabled); font-family: 'SF Mono', 'Consolas', monospace; }
.header-actions     { display: flex; align-items: center; gap: var(--wf-space-8); flex-shrink: 0; }
:deep(.header-actions .el-button) { border-radius: var(--wf-radius-sm); font-weight: var(--wf-font-weight-semibold); }

/* ── 主体 ── */
.drawer-body { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

/* ── Tabs ── */
.drawer-tabs { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
:deep(.drawer-tabs > .el-tabs__header) { margin: 0; padding: 0 20px; background: var(--wf-canvas); border-bottom: 1px solid var(--wf-divider); flex-shrink: 0; }
:deep(.drawer-tabs > .el-tabs__content) { flex: 1; overflow: hidden; padding: 0; }
:deep(.drawer-tabs .el-tab-pane)         { height: 100%; }
:deep(.drawer-tabs .el-tabs__item.is-active) { color: var(--wf-primary); font-weight: var(--wf-font-weight-bold); }
:deep(.drawer-tabs .el-tabs__active-bar)     { background: var(--wf-primary); }

/* ── Tab1 整体：可滚动 flex 列 ── */
.tab-form-content {
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

/* ── iframe 区域 ── */
.iframe-section {
  position: relative;
  flex-shrink: 0;
  width: 100%;
  background: var(--wf-bg);
  transition: height var(--wf-transition-slow);
}

.task-iframe {
  width: 100%; height: 100%;
  border: none; display: block;
  background: var(--wf-canvas);
}
.task-iframe.iframe-hidden { visibility: hidden; position: absolute; }

.iframe-loading {
  position: absolute; inset: 0;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: var(--wf-space-12);
  background: var(--wf-bg);
  font-size: var(--wf-font-base); color: var(--wf-ink-3); z-index: 10;
}
.spin { animation: rotate 0.7s linear infinite; font-size: 24px; color: var(--wf-primary); }
@keyframes rotate { to { transform: rotate(360deg); } }

/* ── 选人区 ── */
.slot-section {
  flex-shrink: 0;
  padding: var(--wf-space-16) var(--wf-space-20) var(--wf-space-20);
  border-top: 1px solid var(--wf-divider);
  background: var(--wf-canvas);
  display: flex;
  flex-direction: column;
  gap: var(--wf-space-16);
}

.divider-text {
  font-size: var(--wf-font-sm);
  color: var(--wf-ink-3);
  font-weight: var(--wf-font-weight-semibold);
  letter-spacing: 0.5px;
}
:deep(.el-divider__text) { background: transparent; }

.slot-item {
  display: flex;
  flex-direction: column;
  gap: var(--wf-space-4);
}

/* ── 流程进度 Tab ── */
.tab-pane-content { padding: var(--wf-space-20); }
.flow-tab-content { display: flex; flex-direction: column; gap: 14px; overflow-y: auto; height: 100%; }
.flow-meta-bar { display: flex; align-items: center; flex-wrap: wrap; gap: 6px 20px; padding: 10px 16px; background: var(--wf-bg-card); border-radius: var(--wf-radius-md); border: 1px solid var(--wf-divider); font-size: var(--wf-font-base); flex-shrink: 0; }
.fmb-item  { display: flex; align-items: center; gap: 7px; }
.fmb-label { color: var(--wf-ink-3); white-space: nowrap; }
.fmb-val   { color: var(--wf-ink); font-weight: var(--wf-font-weight-semibold); }
.fmb-sep   { width: 1px; height: 14px; background: var(--wf-border); }

/* ── 驳回 Dialog ── */
:deep(.reassign-dialog .el-dialog)  { border-radius: var(--wf-radius-xl); }
:deep(.slot-selector-dialog .el-dialog) { border-radius: var(--wf-radius-xl); }

.reject-options-list { display: flex; flex-direction: column; gap: var(--wf-space-8); }
.reject-option-item  { display: flex; align-items: flex-start; gap: 10px; padding: 10px 14px; border: 1.5px solid var(--wf-border); border-radius: var(--wf-radius-md); cursor: pointer; background: var(--wf-canvas); transition: border-color var(--wf-transition-fast), background var(--wf-transition-fast); }
.reject-option-item:hover       { border-color: var(--wf-ink-disabled); background: var(--wf-bg-card); }
.reject-option-item.is-selected { border-color: var(--wf-primary); background: var(--wf-primary-light); }
.ro-radio { width: 16px; height: 16px; border-radius: 50%; border: 1.5px solid var(--wf-ink-disabled); flex-shrink: 0; margin-top: 2px; display: flex; align-items: center; justify-content: center; transition: border-color var(--wf-transition-fast); }
.reject-option-item.is-selected .ro-radio { border-color: var(--wf-primary); }
.ro-dot  { width: 8px; height: 8px; border-radius: 50%; background: var(--wf-primary); }
.ro-info { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
.ro-label { font-size: var(--wf-font-base); font-weight: var(--wf-font-weight-semibold); color: var(--wf-ink); }
.ro-desc  { font-size: var(--wf-font-xs); color: var(--wf-ink-3); }
.reassign-tip { margin-bottom: var(--wf-space-12); }

.gateway-choice {
  display: flex;
  flex-direction: column;
  gap: var(--wf-space-8);
  padding: var(--wf-space-12);
  border: 1px solid var(--wf-border);
  border-radius: var(--wf-radius-md);
  background: var(--wf-bg-section);
}

.gateway-choice__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--wf-space-12);
}

.gateway-choice__title {
  font-size: var(--wf-font-sm);
  font-weight: var(--wf-font-weight-bold);
  color: var(--wf-ink);
}

.gateway-choice__hint {
  font-size: var(--wf-font-xs);
  color: var(--wf-ink-3);
  white-space: nowrap;
}

.gateway-choice__options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--wf-space-8);
}

.gateway-choice__option {
  min-height: 52px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 2px;
  padding: var(--wf-space-8) var(--wf-space-12);
  border: 1px solid var(--wf-border);
  border-radius: var(--wf-radius-sm);
  background: var(--wf-canvas);
  color: var(--wf-ink);
  cursor: pointer;
  font-family: inherit;
  text-align: left;
  transition: border-color var(--wf-transition-fast),
              background var(--wf-transition-fast),
              box-shadow var(--wf-transition-fast);
}

.gateway-choice__option:hover {
  border-color: var(--wf-primary-border);
  background: var(--wf-primary-light);
}

.gateway-choice__option.is-active {
  border-color: var(--wf-primary);
  background: var(--wf-primary-light);
  box-shadow: 0 0 0 2px var(--wf-primary-border);
}

.gateway-choice__option-main {
  font-size: var(--wf-font-base);
  font-weight: var(--wf-font-weight-bold);
  line-height: var(--wf-line-height-tight);
}

.gateway-choice__option-sub {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--wf-font-xs);
  color: var(--wf-ink-3);
}
</style>
