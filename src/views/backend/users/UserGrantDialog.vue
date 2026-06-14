<template>
    <el-dialog v-model="visible" width="520px" :show-close="false" class="grant-dialog">
        <div class="dialog-head">
            <div>
                <h2>新增项目授权</h2>
                <p>POST /api/global/user/{{ '{userid}' }}/project-grants</p>
            </div>
            <el-button circle @click="visible = false">×</el-button>
        </div>
        <el-form label-position="top">
            <el-form-item label="目标系统">
                <el-select v-model="targetProjects" multiple filterable placeholder="选择一个或多个 project" style="width: 100%">
                    <el-option v-for="project in projects" :key="project" :label="project" :value="project" />
                </el-select>
            </el-form-item>
            <el-checkbox v-model="isSuper">同时授予超管</el-checkbox>
        </el-form>
        <div v-if="results.length" class="result-list">
            <div v-for="row in results" :key="row.project" class="result-row">
                <code>{{ row.project }}</code>
                <el-tag :type="row.success ? 'success' : 'danger'">{{ row.skipped ? 'skipped' : row.success ? 'success' : 'failed' }}</el-tag>
            </div>
        </div>
        <template #footer>
            <el-button @click="visible = false">取消</el-button>
            <el-button type="primary" :disabled="!targetProjects.length" @click="submit">授权到 {{ targetProjects.length || '' }} 个系统</el-button>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { grantGlobalUserProjects, type AdminItem, type ProjectWriteResultItem } from '/@/api/backend/rbac'

const props = defineProps<{ modelValue: boolean; user: AdminItem | null; projects: string[] }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean]; success: [] }>()

const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value),
})
const targetProjects = ref<string[]>([])
const isSuper = ref(false)
const results = ref<ProjectWriteResultItem[]>([])

watch(visible, (open) => {
    if (open) {
        targetProjects.value = []
        isSuper.value = false
        results.value = []
    }
})

async function submit() {
    if (!props.user) return
    const result = await grantGlobalUserProjects(props.user.userid, {
        username: props.user.username,
        targetProjects: targetProjects.value,
        isSuper: isSuper.value,
    })
    results.value = result.results || []
    ElMessage.success('授权请求已提交')
    emit('success')
}
</script>

<style scoped>
.dialog-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; }
.dialog-head h2 { margin: 0; font-size: 21px; color: #1d1d1f; }
.dialog-head p { margin: 4px 0 0; color: #7a7a7a; font-size: 13px; }
.result-list { border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; margin-top: 18px; }
.result-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border-top: 1px solid #f0f0f0; }
.result-row:first-child { border-top: 0; }
</style>
