<template>
    <el-dialog v-model="visible" width="500px" :show-close="false">
        <div class="dialog-head">
            <div><h2>{{ model ? '编辑 API 映射' : '新增 API 映射' }}</h2><p>{{ model ? 'PUT /api/api-map/{id}' : 'POST /api/api-map' }}</p></div>
            <el-button circle @click="visible = false">×</el-button>
        </div>
        <el-form label-position="top">
            <el-form-item label="HTTP 方法"><el-select v-model="form.httpMethod" :disabled="!!model" style="width: 100%"><el-option v-for="m in methods" :key="m" :label="m" :value="m" /></el-select></el-form-item>
            <el-form-item label="路由模板"><el-input v-model="form.routePattern" :disabled="!!model" placeholder="/api/admin/{userid}" /></el-form-item>
            <el-form-item label="权限码"><el-input v-model="form.permissionCode" placeholder="menu:system.user" /></el-form-item>
            <el-form-item label="动作"><el-select v-model="form.action" style="width: 100%"><el-option v-for="a in actions" :key="a" :label="a" :value="a" /></el-select></el-form-item>
        </el-form>
        <template #footer><el-button @click="visible = false">取消</el-button><el-button type="primary" @click="$emit('submit', form)">保存</el-button></template>
    </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import type { ApiAction, ApiMapRecordItem, HttpMethod } from '/@/api/backend/rbac'

const props = defineProps<{ modelValue: boolean; model: ApiMapRecordItem | null }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean]; submit: [form: { httpMethod: HttpMethod; routePattern: string; permissionCode: string; action: ApiAction }] }>()
const visible = computed({ get: () => props.modelValue, set: (value) => emit('update:modelValue', value) })
const methods: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
const actions: ApiAction[] = ['read', 'create', 'update', 'delete', 'execute', 'access']
const form = reactive<{ httpMethod: HttpMethod; routePattern: string; permissionCode: string; action: ApiAction }>({ httpMethod: 'GET', routePattern: '', permissionCode: '', action: 'read' })

watch(visible, (open) => {
    if (!open) return
    form.httpMethod = props.model?.httpMethod || 'GET'
    form.routePattern = props.model?.routePattern || ''
    form.permissionCode = props.model?.permissionCode || ''
    form.action = props.model?.action || 'read'
})
</script>

<style scoped>
.dialog-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; }
h2 { margin: 0; font-size: 21px; color: #1d1d1f; }
p { margin: 4px 0 0; color: #7a7a7a; font-size: 13px; }
</style>
