import { Node } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import AttachmentView from './AttachmentView.vue'

export const Attachment = Node.create({
    name: 'attachment',
    group: 'block',
    atom: true,
    selectable: true,

    addAttributes() {
        return {
            id: { default: null },
            url: { default: null },
            name: { default: '' },
            size: { default: 0 },
            type: { default: '' },
            previewUrl: { default: null },
        }
    },

    parseHTML() {
        return [
            { tag: 'div[data-file-attachment]' }
        ]
    },

    renderHTML({ HTMLAttributes }) {
        const ext = (HTMLAttributes.name || '').split('.').pop()?.toLowerCase() || ''
        const canPreview = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'pdf'].includes(ext)
        const previewUrl = HTMLAttributes.previewUrl || HTMLAttributes.url
        
        // 获取文件图标
        const getFileIcon = (ext) => {
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

        // 格式化文件大小
        const formatSize = (bytes) => {
            if (!bytes) return '0 B'
            const k = 1024
            const sizes = ['B', 'KB', 'MB', 'GB']
            const i = Math.floor(Math.log(bytes) / Math.log(k))
            return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
        }

        // 返回 HTML 结构
        return [
            'div',
            {
                class: 'file-attachment',
                'data-file-attachment': 'true',
            },
            [
                'div',
                { class: 'file-icon' },
                ['i', { class: `fa ${getFileIcon(ext)}` }]
            ],
            [
                'div',
                { class: 'file-info' },
                ['div', { class: 'file-name' }, HTMLAttributes.name || '未命名文件'],
                ['div', { class: 'file-size' }, formatSize(HTMLAttributes.size)]
            ],
            [
                'div',
                { class: 'file-actions' },
                // 预览按钮（条件渲染）
                ...(canPreview ? [[
                    'a',
                    {
                        class: 'file-preview-btn',
                        href: previewUrl,
                        target: '_blank',
                        rel: 'noopener noreferrer',
                        title: '预览',
                    },
                    ['i', { class: 'fa fa-eye' }]
                ]] : []),
                // 下载按钮
                [
                    'a',
                    {
                        class: 'file-download-btn',
                        href: HTMLAttributes.url,
                        download: HTMLAttributes.name,
                        target: '_blank',
                        rel: 'noopener noreferrer',
                        title: '下载',
                    },
                    ['i', { class: 'fa fa-download' }]
                ]
            ]
        ]
    },

    addNodeView() {
        return VueNodeViewRenderer(AttachmentView)
    },

    addCommands() {
        return {
            // 插入附件命令
            insertAttachment: (attrs) => ({ commands }) => {
                return commands.insertContent({
                    type: this.name,
                    attrs: {
                        id: attrs.id ?? null,
                        url: attrs.url,
                        name: attrs.name,
                        size: attrs.size,
                        type: attrs.type || '',
                        previewUrl: attrs.previewUrl || null,
                    }
                })
            }
        }
    }
})