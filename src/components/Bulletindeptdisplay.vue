<template>
  <div class="bdd" :class="readonly ? 'bdd--ro' : 'bdd--edit'">

    <!-- ── 已选部门 tag 区 ── -->
    <div v-if="modelValue.length" class="bdd-selected">
      <span v-for="dept in modelValue" :key="dept.id" class="bdd-tag">
        <svg class="bdd-tag-icon" viewBox="0 0 16 16" fill="none">
          <path d="M2 4h12v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4Z" stroke="currentColor" stroke-width="1.3"/>
          <path d="M5 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" stroke="currentColor" stroke-width="1.3"/>
          <path d="M5 8h6M5 11h4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
        </svg>
        {{ dept.name }}
        <button v-if="!readonly" type="button" class="bdd-tag-del" @click.stop="remove(dept)">
          <svg viewBox="0 0 12 12" fill="none">
            <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
      </span>
    </div>

    <!-- ── 空占位（只读）── -->
    <span v-else-if="readonly" class="bdd-empty">—</span>

    <!-- ── 选择触发按钮（编辑态）── -->
    <button v-if="!readonly" type="button" class="bdd-trigger" @click="open">
      <svg viewBox="0 0 16 16" fill="none">
        <path d="M2 4h12v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4Z" stroke="currentColor" stroke-width="1.3"/>
        <path d="M5 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" stroke="currentColor" stroke-width="1.3"/>
      </svg>
      {{ modelValue.length ? '继续添加' : (placeholder || '选择责任单位') }}
    </button>

    <!-- ── 部门选择弹窗 ── -->
    <el-dialog
      v-model="visible"
      width="480px"
      :close-on-click-modal="false"
      append-to-body
      class="bdd-dialog"
    >
      <template #header>
        <div class="bdd-dlg-hd">
          <span class="bdd-dlg-title">选择责任单位</span>
          <span v-if="checkedCount > 0" class="bdd-dlg-count">已选 {{ checkedCount }} 个</span>
        </div>
      </template>

      <!-- 搜索框 -->
      <div class="bdd-search-wrap">
        <el-input
          v-model="keyword"
          placeholder="搜索部门名称"
          clearable
          size="default"
          class="bdd-search"
        >
          <template #prefix>
            <svg viewBox="0 0 16 16" fill="none" width="14" height="14">
              <circle cx="6.5" cy="6.5" r="4" stroke="currentColor" stroke-width="1.4"/>
              <path d="M10 10l3 3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
            </svg>
          </template>
        </el-input>
      </div>

      <!-- 组织树 -->
      <div class="bdd-tree-wrap">
        <el-tree
          ref="treeRef"
          :data="treeData"
          :props="{ children: 'children', label: 'label' }"
          node-key="id"
          show-checkbox
          :default-checked-keys="initCheckedKeys"
          :default-expand-all="false"
          :default-expanded-keys="rootIds"
          :expand-on-click-node="false"
          :filter-node-method="filterNode"
          class="bdd-tree"
          @check="onTreeCheck"
        >
          <template #default="{ data }">
            <span class="bdd-tree-node">
              <svg class="bdd-tree-icon" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="3" width="12" height="9" rx="1" stroke="currentColor" stroke-width="1.2"/>
                <path d="M4 3V2a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" stroke="currentColor" stroke-width="1.2"/>
              </svg>
              <span class="bdd-tree-label">{{ data.label }}</span>
            </span>
          </template>
        </el-tree>
        <div v-if="!treeData.length" class="bdd-tree-empty">暂无部门数据</div>
      </div>

      <!-- 底部操作 -->
      <template #footer>
        <div class="bdd-dlg-footer">
          <span class="bdd-dlg-hint">
            {{ checkedCount > 0 ? `已勾选 ${checkedCount} 个部门` : '点击勾选部门，支持多选' }}
          </span>
          <div class="bdd-dlg-acts">
            <el-button @click="cancel">取消</el-button>
            <el-button type="primary" @click="confirm">确定</el-button>
          </div>
        </div>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue:  { type: Array,   default: () => [] },
  readonly:    { type: Boolean, default: false     },
  orgList:     { type: Array,   default: () => []  },
  placeholder: { type: String,  default: ''        },
  checkMode: {
    type:      String,
    default:   'leaf',
    validator: v => ['leaf', 'all'].includes(v),
  },
})

const emit = defineEmits(['update:modelValue'])

const visible = ref(false)
const keyword = ref('')
const treeRef = ref(null)

let _kwTimer = null
watch(keyword, v => {
  if (_kwTimer) clearTimeout(_kwTimer)
  _kwTimer = setTimeout(() => { treeRef.value?.filter(v) }, 300)
})

const orgChildrenMap = computed(() => {
  const m = new Map()
  for (const n of props.orgList) {
    const pid = n.pid ?? '__root__'
    if (!m.has(pid)) m.set(pid, [])
    m.get(pid).push(n)
  }
  return m
})

const orgMap = computed(() => {
  const m = new Map()
  for (const n of props.orgList) m.set(n.id, n)
  return m
})

const treeData = computed(() => buildTreeFast('__root__'))

function buildTreeFast(pid) {
  const children = orgChildrenMap.value.get(pid) ?? []
  return children.map(n => ({
    id:       n.id,
    label:    n.name,
    children: buildTreeFast(n.id),
  }))
}

const rootIds = computed(() =>
  (orgChildrenMap.value.get('__root__') ?? []).map(n => n.id)
)

function filterNode(value, data) {
  if (!value) return true
  return data.label.includes(value)
}

const initCheckedKeys = ref([])

function open() {
  initCheckedKeys.value = props.modelValue.map(d => d.id)
  checkedCount.value    = props.modelValue.length
  visible.value         = true
}

function cancel() {
  visible.value         = false
  keyword.value         = ''
  checkedCount.value    = 0
  initCheckedKeys.value = []
}

const checkedCount = ref(0)

function onTreeCheck() {
  const checked = treeRef.value?.getCheckedNodes() ?? []
  checkedCount.value = props.checkMode === 'all'
    ? checked.length
    : checked.filter(n => !n.children || n.children.length === 0).length
}

function confirm() {
  const allChecked = treeRef.value?.getCheckedNodes() ?? []
  const result = props.checkMode === 'all'
    ? allChecked
    : allChecked.filter(n => !n.children || n.children.length === 0)
  emit('update:modelValue', result.map(n => ({ id: n.id, name: n.label })))
  visible.value         = false
  keyword.value         = ''
  checkedCount.value    = 0
  initCheckedKeys.value = []
}

function remove(dept) {
  emit('update:modelValue', props.modelValue.filter(d => d.id !== dept.id))
}
</script>

<style scoped>
/* ── 根容器 ── */
.bdd {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--wf-space-6);
  max-width: 100%;
}

/* ── 已选 tag 区 ── */
.bdd-selected {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 5px;
}

.bdd-tag {
  display: inline-flex;
  align-items: center;
  gap: var(--wf-space-4);
  padding: 3px 6px 3px 8px;
  border-radius: var(--wf-radius-sm);
  font-size: var(--wf-font-sm);
  font-weight: var(--wf-font-weight-medium);
  color: var(--wf-ink);
  background: var(--wf-bg-section);
  border: 1px solid var(--wf-border);
  line-height: 1.4;
  white-space: nowrap;
  user-select: none;
}

.bdd--ro .bdd-tag {
  padding: 3px 8px;
  color: var(--wf-ink-2);
  background: var(--wf-bg-section);
}

.bdd-tag-icon {
  width: 13px;
  height: 13px;
  color: var(--wf-primary);
  flex-shrink: 0;
}

.bdd-tag-del {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  color: var(--wf-ink-3);
  border-radius: 3px;
  flex-shrink: 0;
  transition: color var(--wf-transition-fast),
              background var(--wf-transition-fast);
}

.bdd-tag-del:hover { color: var(--wf-danger); background: var(--wf-danger-bg); }
.bdd-tag-del svg   { width: 9px; height: 9px; display: block; }

/* ── 空占位 ── */
.bdd-empty { font-size: var(--wf-font-base); color: var(--wf-ink-3); }

/* ── 选择触发按钮 ── */
.bdd-trigger {
  display: inline-flex;
  align-items: center;
  gap: var(--wf-space-4);
  padding: 3px 10px 3px 8px;
  border-radius: var(--wf-radius-sm);
  border: 1px dashed var(--wf-ink-disabled);
  background: transparent;
  color: var(--wf-ink-3);
  font-size: var(--wf-font-sm);
  cursor: pointer;
  font-family: inherit;
  line-height: 1.4;
  white-space: nowrap;
  transition: border-color var(--wf-transition-fast),
              color        var(--wf-transition-fast),
              background   var(--wf-transition-fast),
              transform    var(--wf-transition-fast);
}

.bdd-trigger:hover {
  border-color: var(--wf-primary);
  color: var(--wf-primary);
  background: var(--wf-primary-light);
}
.bdd-trigger:active { transform: scale(0.97); }
.bdd-trigger svg    { width: 13px; height: 13px; flex-shrink: 0; }

/* ── 弹窗内容区（scoped 可访问部分）── */
.bdd-search-wrap {
  padding: 10px 14px 8px;
  border-bottom: 1px solid var(--wf-divider);
}

.bdd-tree-wrap {
  height: 360px;
  overflow-y: auto;
  padding: var(--wf-space-8) var(--wf-space-6);
}

.bdd-tree-wrap::-webkit-scrollbar       { width: 5px; }
.bdd-tree-wrap::-webkit-scrollbar-thumb {
  background: var(--wf-border);
  border-radius: 3px;
}

.bdd-tree { background: transparent; }

.bdd-tree-node {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: var(--wf-font-base);
  color: var(--wf-ink);
  flex: 1;
  min-width: 0;
}

.bdd-tree-icon  { width: 14px; height: 14px; color: var(--wf-primary); flex-shrink: 0; }
.bdd-tree-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.bdd-tree-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: var(--wf-font-base);
  color: var(--wf-ink-3);
}

.bdd-dlg-hd {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
}

.bdd-dlg-title {
  font-size: var(--wf-font-lg);
  font-weight: var(--wf-font-weight-semibold);
  color: var(--wf-ink);
  flex: 1;
}

.bdd-dlg-count {
  font-size: var(--wf-font-sm);
  color: var(--wf-primary);
  background: var(--wf-primary-light);
  border: 1px solid var(--wf-primary-border);
  padding: 2px 8px;
  border-radius: var(--wf-radius-pill);
  font-weight: var(--wf-font-weight-semibold);
}

.bdd-dlg-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: var(--wf-bg);
}

.bdd-dlg-hint {
  font-size: var(--wf-font-sm);
  color: var(--wf-ink-3);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: var(--wf-space-12);
}

.bdd-dlg-acts {
  display: flex;
  gap: var(--wf-space-8);
  flex-shrink: 0;
}

/* ── 搜索框 :deep（scoped 穿透）── */
:deep(.bdd-search .el-input__wrapper) {
  border-radius: var(--wf-radius-sm);
  box-shadow: 0 0 0 1px var(--wf-border) inset;
  background: var(--wf-bg-section);
  transition: box-shadow var(--wf-transition-fast);
}
:deep(.bdd-search .el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px var(--wf-ink-disabled) inset;
}
:deep(.bdd-search .el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1.5px var(--wf-primary) inset !important;
  background: var(--wf-canvas);
}

/* ── 组织树 :deep ── */
:deep(.bdd-tree .el-tree-node__content) {
  height: 36px;
  border-radius: var(--wf-radius-sm);
  margin-bottom: 1px;
  transition: background var(--wf-transition-fast);
}
:deep(.bdd-tree .el-tree-node__content:hover) {
  background: var(--wf-bg-section);
}
:deep(.bdd-tree .el-tree-node.is-current > .el-tree-node__content) {
  background: var(--wf-primary-light);
}
:deep(.bdd-tree .el-checkbox__inner) {
  border-radius: var(--wf-radius-sm);
  border-color: var(--wf-ink-disabled);
}
:deep(.bdd-tree .el-checkbox.is-checked .el-checkbox__inner) {
  background: var(--wf-primary);
  border-color: var(--wf-primary);
}

</style>

<style>
.bdd-dialog .el-dialog {
  border-radius: 14px !important;
  overflow: hidden;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.14);
}
.bdd-dialog .el-dialog__header {
  padding: 0 !important;
  margin: 0 !important;
  border-bottom: 1px solid var(--wf-divider);
}
.bdd-dialog .el-dialog__body   { padding: 0 !important; }
.bdd-dialog .el-dialog__footer {
  padding: 0 !important;
  border-top: 1px solid var(--wf-divider);
}
</style>
