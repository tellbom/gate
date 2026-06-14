<template>
    <el-form :inline="true" :model="localForm" class="table-search-bar" label-position="left" :size="size">
        <!-- 动态渲染搜索字段 -->
        <template v-for="field in searchFields" :key="field.key">
            <!-- 文本输入框 -->
            <el-form-item v-if="field.type === 'input'" :label="field.label" class="search-item">
                <el-input v-model="localForm[field.key]" :placeholder="field.placeholder || `请输入${field.label}`"
                    :clearable="true" @keyup.enter="handleSearch" />
            </el-form-item>

            <!-- 下拉选择框 -->
            <el-form-item v-else-if="field.type === 'select'" :label="field.label" class="search-item">
                <el-select v-model="localForm[field.key]" :placeholder="field.placeholder || `请选择${field.label}`"
                    :clearable="true">
                    <el-option v-for="option in field.options" :key="option.value" :label="option.label"
                        :value="option.value" />
                </el-select>
            </el-form-item>

            <!-- 日期选择器 -->
            <el-form-item v-else-if="field.type === 'date'" :label="field.label" class="search-item">
                <el-date-picker v-model="localForm[field.key]" :type="'date'"
                    :placeholder="field.placeholder || `请选择${field.label}`" :clearable="true"
                    value-format="YYYY-MM-DD" />
            </el-form-item>

            <!-- 日期范围选择器 -->
            <el-form-item v-else-if="field.type === 'dateRange'" :label="field.label" class="search-item">
                <el-date-picker v-model="localForm[field.key]" :type="'daterange'"
                    :placeholder="field.placeholder || ['开始日期', '结束日期']" :clearable="true" value-format="YYYY-MM-DD" />
            </el-form-item>
        </template>

        <!-- 操作按钮 -->
        <el-form-item class="search-buttons">
            <el-button type="primary" @click="handleSearch">{{ $t('common.search') || '搜索' }}</el-button>
            <el-button @click="handleReset">{{ $t('common.reset') || '重置' }}</el-button>
        </el-form-item>
    </el-form>
</template>

<script lang="ts" setup>
import { ref, reactive, watch, PropType } from 'vue';

// 定义搜索字段类型
interface SearchField {
    key: string;          // 字段名
    label: string;        // 标签文本
    type: 'input' | 'select' | 'date' | 'dateRange';  // 字段类型
    placeholder?: string; // 占位符文本
    options?: Array<{ label: string; value: any }>; // 下拉选项（select类型时使用）
}

// 组件属性
const props = defineProps({
    // 搜索字段配置
    searchFields: {
        type: Array as PropType<SearchField[]>,
        required: true
    },
    // 表单大小
    size: {
        type: String,
        default: 'default',
        validator: (value: string) => ['large', 'default', 'small', 'mini'].includes(value)
    },
    // 初始搜索值
    initialValues: {
        type: Object,
        default: () => ({})
    }
});

// 事件定义
const emit = defineEmits<{
    // 搜索事件
    search: [formData: Record<string, any>];
    // 重置事件
    reset: [];
}>();

// 本地表单数据
const localForm = reactive<Record<string, any>>({});

// 初始化表单数据
const initForm = () => {
    // 清空表单
    Object.keys(localForm).forEach(key => {
        delete localForm[key];
    });

    // 设置默认值
    props.searchFields.forEach(field => {
        // 先设置为空值
        localForm[field.key] = '';
        // 如果提供了初始值，则使用初始值
        if (props.initialValues[field.key] !== undefined) {
            localForm[field.key] = props.initialValues[field.key];
        }
    });
};

// 监听searchFields变化，重新初始化表单
watch(() => props.searchFields, () => {
    initForm();
}, { immediate: true, deep: true });

// 监听initialValues变化，更新表单
watch(() => props.initialValues, (newValues) => {
    Object.keys(newValues).forEach(key => {
        if (localForm.hasOwnProperty(key)) {
            localForm[key] = newValues[key];
        }
    });
}, { deep: true });

// 处理搜索
const handleSearch = () => {
    // 发送搜索事件，传递表单数据的副本
    emit('search', { ...localForm });
};

// 处理重置
const handleReset = () => {
    // 重置表单
    initForm();
    // 发送重置事件
    emit('reset');
};
</script>

<style lang="scss" scoped>
.table-search-bar {
    padding: 16px;
    background: #fff;
    border-radius: 4px;
    margin-bottom: 20px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;

    .search-item {
        margin-right: 16px;
        margin-bottom: 12px;

        :deep(.el-form-item__label) {
            font-weight: normal;
            white-space: nowrap;
        }

        :deep(.el-input__wrapper),
        :deep(.el-select__wrapper),
        :deep(.el-date-editor) {
            min-width: 200px;
        }
    }

    .search-buttons {
        margin-left: auto;
        margin-bottom: 12px;

        .el-button+.el-button {
            margin-left: 8px;
        }
    }
}

// 响应式布局
@media (max-width: 768px) {
    .table-search-bar {
        padding: 12px;

        .search-item {
            margin-right: 0;
            margin-bottom: 12px;
            width: 100%;

            :deep(.el-input__wrapper),
            :deep(.el-select__wrapper),
            :deep(.el-date-editor) {
                width: 100%;
                min-width: unset;
            }
        }

        .search-buttons {
            margin-left: 0;
            display: flex;
            gap: 8px;
            width: 100%;

            .el-button {
                flex: 1;
            }
        }
    }
}
</style>