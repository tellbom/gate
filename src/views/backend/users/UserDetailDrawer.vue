<template>
    <el-drawer v-model="visible" size="470px" :with-header="false">
        <div v-if="user" class="drawer-body">
            <div class="user-head">
                <div class="avatar">{{ user.username.slice(0, 1) }}</div>
                <div>
                    <h2>{{ user.username }}</h2>
                    <code>{{ user.userid }}</code>
                </div>
            </div>
            <section>
                <div class="section-title">
                    <h3>项目授权</h3>
                    <el-button link type="primary" @click="emitGrant">新增授权</el-button>
                </div>
                <div v-if="!user.projectCodes?.length" class="empty">暂无项目授权</div>
                <div v-for="project in user.projectCodes || []" :key="project" class="grant-row">
                    <div>
                        <strong>{{ project }}</strong>
                        <p>{{ user.superProjects?.includes(project) ? '超管' : '普通管理员' }}</p>
                    </div>
                    <el-switch
                        :model-value="user.superProjects?.includes(project)"
                        :active-color="'#6b4ea8'"
                        @change="(value) => emitToggleSuper(project, value === true)"
                    />
                    <el-button link type="danger" @click="emitRevoke(project)">撤销</el-button>
                </div>
            </section>
            <section>
                <h3>权限组</h3>
                <div class="chips">
                    <code v-for="name in user.groupNames || []" :key="name">{{ name }}</code>
                    <span v-if="!user.groupNames?.length">-</span>
                </div>
            </section>
        </div>
    </el-drawer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { AdminItem } from '/@/api/backend/rbac'

const props = defineProps<{ modelValue: boolean; user: AdminItem | null }>()
const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    grant: [user: AdminItem]
    revoke: [user: AdminItem, project: string]
    'toggle-super': [user: AdminItem, project: string, value: boolean]
}>()

const visible = computed({
    get: () => props.modelValue,
    set: (value) => emitValue(value),
})

function emitValue(value: boolean) {
    emit('update:modelValue', value)
}

function emitGrant() {
    if (props.user) emit('grant', props.user)
}

function emitRevoke(project: string) {
    if (props.user) emit('revoke', props.user, project)
}

function emitToggleSuper(project: string, value: boolean) {
    if (props.user) emit('toggle-super', props.user, project, value)
}
</script>

<style scoped>
.drawer-body { padding: 24px; color: #1d1d1f; }
.user-head { display: flex; align-items: center; gap: 14px; padding-bottom: 20px; border-bottom: 1px solid #f0f0f0; }
.avatar { width: 52px; height: 52px; border-radius: 50%; background: #1d1d1f; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 600; }
h2, h3 { margin: 0; }
section { margin-top: 22px; }
.section-title { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.grant-row { display: grid; grid-template-columns: 1fr auto auto; gap: 12px; align-items: center; padding: 11px 14px; border: 1px solid #e0e0e0; border-radius: 12px; margin-bottom: 8px; }
.grant-row p { margin: 2px 0 0; color: #7a7a7a; font-size: 13px; }
.chips { display: flex; gap: 7px; flex-wrap: wrap; }
.chips code { padding: 5px 10px; border-radius: 7px; background: #f3f3f5; }
.empty { padding: 14px; color: #7a7a7a; background: #f5f5f7; border-radius: 12px; }
</style>
