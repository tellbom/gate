<template>
  <NodeViewWrapper class="file-attachment-wrapper">
    <div class="file-attachment">
      <!-- 文件图标 -->
      <div class="file-icon">
        <i :class="['fa', getFileIcon()]"></i>
      </div>

      <!-- 文件信息 -->
      <div class="file-info">
        <div class="file-name">{{ node.attrs.name || '未命名文件' }}</div>
        <div class="file-size">{{ formatFileSize(node.attrs.size) }}</div>
      </div>

      <!-- 操作按钮 -->
      <div class="file-actions">
        <!-- 预览按钮 -->
        <a
          v-if="canPreview()"
          class="file-preview-btn"
          :href="node.attrs.previewUrl || node.attrs.url"
          target="_blank"
          rel="noopener noreferrer"
          title="预览"
          @click.stop
        >
          <i class="fa fa-eye"></i>
        </a>

        <!-- 下载按钮 -->
        <a
          class="file-download-btn"
          :href="node.attrs.url"
          :download="node.attrs.name"
          target="_blank"
          rel="noopener noreferrer"
          title="下载"
          @click.stop
        >
          <i class="fa fa-download"></i>
        </a>

        <!-- 删除按钮 -->
        <!-- <button
          type="button"
          class="file-delete-btn"
          @click.stop="handleDelete"
          title="删除"
        >
          <i class="fa fa-trash-o"></i>
        </button> -->
      </div>
    </div>
  </NodeViewWrapper>
</template>

<script setup>
import { NodeViewWrapper } from '@tiptap/vue-3'

const props = defineProps({
  editor: Object,
  node: Object,
  getPos: Function,
  updateAttributes: Function,
})

// 获取文件图标
const getFileIcon = () => {
  const ext = (props.node.attrs.name || '').split('.').pop()?.toLowerCase() || ''
  const iconMap = {
    'doc': 'fa-file-word-o',
    'docx': 'fa-file-word-o',
    'xls': 'fa-file-excel-o',
    'xlsx': 'fa-file-excel-o',
    'ppt': 'fa-file-powerpoint-o',
    'pptx': 'fa-file-powerpoint-o',
    'pdf': 'fa-file-pdf-o',
    'zip': 'fa-file-zip-o',
    'rar': 'fa-file-zip-o',
    '7z': 'fa-file-zip-o',
    'txt': 'fa-file-text-o',
    'md': 'fa-file-text-o',
  }
  return iconMap[ext] || 'fa-file-o'
}

// 判断是否可预览
const canPreview = () => {
  const ext = (props.node.attrs.name || '').split('.').pop()?.toLowerCase() || ''
  return ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'pdf'].includes(ext)
}

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

// 处理删除
const handleDelete = () => {
  props.editor?.commands?.deleteSelection?.()
}
</script>

<style scoped>
.file-attachment-wrapper {
  margin: 12px 0;
}

.file-attachment {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f5f5f7;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  transition: all 0.2s;
}

.file-attachment:hover {
  background: #ebebed;
  border-color: #c62f2f;
  box-shadow: 0 2px 8px rgba(198, 47, 47, 0.1);
}

.file-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  border-radius: 8px;
  flex-shrink: 0;
}

.file-icon i {
  font-size: 22px;
}

/* 文件图标颜色 */
.file-icon .fa-file-word-o { color: #2b579a; }
.file-icon .fa-file-excel-o { color: #217346; }
.file-icon .fa-file-powerpoint-o { color: #d24726; }
.file-icon .fa-file-pdf-o { color: #f40f02; }
.file-icon .fa-file-zip-o { color: #f39c12; }
.file-icon .fa-file-text-o { color: #7f8c8d; }
.file-icon .fa-file-o { color: #95a5a6; }

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 14px;
  font-weight: 600;
  color: #1d1d1f;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 4px;
}

.file-size {
  font-size: 12px;
  color: #86868b;
}

.file-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.file-preview-btn,
.file-download-btn,
.file-delete-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
  cursor: pointer;
  border: none;
  text-decoration: none;
}

.file-preview-btn i,
.file-download-btn i,
.file-delete-btn i {
  font-size: 14px;
}

.file-preview-btn:hover,
.file-download-btn:hover,
.file-delete-btn:hover {
  transform: scale(1.05);
}

.file-preview-btn:active,
.file-download-btn:active,
.file-delete-btn:active {
  transform: scale(0.95);
}

.file-preview-btn {
  background: #007aff;
  color: #ffffff;
}

.file-preview-btn:hover {
  background: #0051d5;
}

.file-download-btn {
 background: #c62f2f;
  color: #ffffff;
}

.file-download-btn:hover {
  background: #a02525;
}

.file-delete-btn {
  background: #c62f2f;
  color: #ffffff;
}

.file-delete-btn:hover {
  background: #a02525;
}

/* 响应式 */
@media (max-width: 768px) {
  .file-attachment {
    padding: 10px 12px;
    gap: 10px;
  }

  .file-icon {
    width: 36px;
    height: 36px;
  }

  .file-icon i {
    font-size: 18px;
  }

  .file-name {
    font-size: 13px;
  }

  .file-size {
    font-size: 11px;
  }

  .file-preview-btn,
  .file-download-btn,
  .file-delete-btn {
    width: 32px;
    height: 32px;
  }

  .file-preview-btn i,
  .file-download-btn i,
  .file-delete-btn i {
    font-size: 12px;
  }
}
</style>