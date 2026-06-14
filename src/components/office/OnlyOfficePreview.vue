<template>
  <div class="onlyoffice-preview">
    <div v-if="loading" class="preview-loading">
      文档加载中...
    </div>

    <div v-else-if="error" class="preview-error">
      <div class="preview-error__title">文档加载失败</div>
      <div class="preview-error__desc">{{ error }}</div>
    </div>

    <DocumentEditor
      v-else
      id="onlyoffice-preview-editor"
      :documentServerUrl="DOCUMENT_SERVER_URL"
      :config="editorConfig"
      class="onlyoffice-editor"
    />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { DocumentEditor } from '@onlyoffice/document-editor-vue'

const props = defineProps({
  url: {
    type: String,
    default: ''
  }
})

const route = useRoute()

/**
 * 测试阶段写死文件网关地址
 * 后续建议改为环境变量
 */
const FILE_PREFIX = 'http://127.0.0.1:9000'

/**
 * OnlyOffice Document Server
 */
const DOCUMENT_SERVER_URL = 'http://127.0.0.1:8088'

const loading = ref(true)
const error = ref('')

/**
 * 优先使用 props.url
 * 如果没有，则读取路由 query.url
 */
const rawUrl = computed(() => {
  if (props.url) return props.url

  const value = route.query.url
  if (Array.isArray(value)) return value[0] || ''
  return value || ''
})

/**
 * 拼接完整文件地址
 */
const fileUrl = computed(() => {
  const url = String(rawUrl.value || '').trim()
  if (!url) return ''

  if (/^https?:\/\//i.test(url)) {
    return url
  }

  const cleanPrefix = FILE_PREFIX.replace(/\/+$/, '')
  const cleanPath = url.replace(/^\/+/, '')

  return `${cleanPrefix}/${cleanPath}`
})

/**
 * 文件名
 */
const fileName = computed(() => {
  if (!fileUrl.value) return '未命名文件'

  try {
    const pureUrl = fileUrl.value.split('?')[0]
    const name = pureUrl.substring(pureUrl.lastIndexOf('/') + 1)
    return decodeURIComponent(name)
  } catch {
    return '未命名文件'
  }
})

/**
 * 扩展名
 */
const fileExt = computed(() => {
  const name = fileName.value.toLowerCase()
  const index = name.lastIndexOf('.')
  return index > -1 ? name.slice(index + 1) : ''
})

/**
 * onlyoffice fileType
 */
const fileType = computed(() => {
  const ext = fileExt.value

  const allow = [
    'doc',
    'docx',
    'ppt',
    'pptx',
    'pdf'
  ]

  return allow.includes(ext) ? ext : ''
})

/**
 * documentType
 */
const documentType = computed(() => {
  const ext = fileExt.value

  if (['doc', 'docx'].includes(ext)) return 'word'
  if (['ppt', 'pptx'].includes(ext)) return 'slide'
  if (ext === 'pdf') return 'pdf'

  return ''
})

/**
 * key 防缓存
 */
function buildDocKey(url) {
  const text = String(url || '')
  let hash = 0

  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i)
    hash |= 0
  }

  return `preview_${Math.abs(hash)}`
}

const editorConfig = computed(() => ({
  document: {
    title: fileName.value,
    url: fileUrl.value,
    fileType: fileType.value,
    key: buildDocKey(fileUrl.value)
  },

  documentType: documentType.value,

  editorConfig: {
    mode: 'view',
    lang: 'zh-CN',
    customization: {
      autosave: false,
      forcesave: false,
      comments: false,
      feedback: false,
      help: false,
      compactToolbar: true
    }
  },

  height: '100%',
  width: '100%',
  type: 'desktop'
}))

function validateFile() {

  loading.value = true
  error.value = ''

  if (!rawUrl.value) {
    error.value = '缺少文件地址'
    loading.value = false
    return
  }

  if (!fileType.value) {
    error.value = `当前文件类型不支持: .${fileExt.value}`
    loading.value = false
    return
  }

  loading.value = false
}

watch(
  () => [rawUrl.value, fileType.value],
  validateFile,
  { immediate: true }
)
</script>

<style scoped>

.onlyoffice-preview{
  width:100%;
  height:100%;
  min-height:600px;
  background:#f5f7fa;
}

.onlyoffice-editor{
  width:100%;
  height:100%;
  min-height:600px;
}

.preview-loading,
.preview-error{
  display:flex;
  align-items:center;
  justify-content:center;
  flex-direction:column;
  min-height:600px;
  color:#606266;
}

.preview-error__title{
  font-size:18px;
  margin-bottom:8px;
}

.preview-error__desc{
  color:#909399;
}

</style>