<template>
    <el-drawer v-model="visible" size="470px" :with-header="false">
        <div v-if="group" class="drawer-body">
            <div class="group-head">
                <span class="glyph">盾</span>
                <div>
                    <h2>{{ group.groupName || group.groupCode }}</h2>
                    <code>{{ group.groupCode }}</code>
                </div>
            </div>
            <div class="meta">
                <div><span>Project</span><strong>{{ group.project }}</strong></div>
                <div><span>父权限组</span><strong>{{ group.parent_group_code || group.parentGroupCode || '根组' }}</strong></div>
            </div>
            <section>
                <div class="section-title">
                    <h3>成员</h3>
                    <el-tag type="info" effect="plain">{{ members.length }}</el-tag>
                </div>
                <div class="member-add">
                    <el-select
                        v-model="userid"
                        filterable
                        clearable
                        placeholder="选择用户加入当前权限组"
                    >
                        <el-option
                            v-for="user in candidates"
                            :key="user.userid"
                            :label="`${user.username || user.userid} (${user.userid})`"
                            :value="user.userid"
                        />
                    </el-select>
                    <el-button :loading="submitting" type="primary" :disabled="!userid" @click="addMember">加入</el-button>
                </div>
                <div class="members">
                    <div v-for="user in members" :key="user.userid" class="member-row">
                        <div>
                            <strong>{{ user.username || user.userid }}</strong>
                            <code>{{ user.userid }}</code>
                        </div>
                        <el-button
                            text
                            type="danger"
                            :loading="submitting"
                            @click="removeMember(user.userid)"
                        >
                            移除
                        </el-button>
                    </div>
                    <span v-if="!members.length" class="empty">当前 API 未返回成员明细时，会基于全局用户的 groupCodes 做聚合展示。</span>
                </div>
            </section>
            <section>
                <h3>授权权限码</h3>
                <div class="chips">
                    <code v-for="code in group.permissionCodes || []" :key="code">{{ code }}</code>
                    <span v-if="!group.permissionCodes?.length">-</span>
                </div>
            </section>
        </div>
    </el-drawer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
    addGlobalGroupMember,
    removeGlobalGroupMember,
    type AdminItem,
    type GroupItem,
} from '/@/api/backend/rbac'

const props = defineProps<{ modelValue: boolean; group: GroupItem | null; users: AdminItem[] }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean]; refresh: [] }>()
const visible = computed({ get: () => props.modelValue, set: (value) => emit('update:modelValue', value) })
const userid = ref('')
const submitting = ref(false)
const members = computed(() => {
    if (!props.group) return []
    return props.users.filter((user) => {
        const inGroup = user.groupCodes?.includes(props.group!.groupCode)
        const inProject = user.projectCodes?.includes(props.group!.project) || user.superProjects?.includes(props.group!.project)
        const grant = user.grants?.[props.group!.project]
        return (inGroup && inProject) || grant?.groups?.includes(props.group!.groupCode)
    })
})
const candidates = computed(() => {
    if (!props.group) return []
    const memberIds = new Set(members.value.map((user) => user.userid))
    return props.users.filter((user) => !memberIds.has(user.userid))
})

watch(() => props.group?.groupCode, () => { userid.value = '' })

async function addMember() {
    if (!props.group || !userid.value) return
    submitting.value = true
    try {
        await addGlobalGroupMember(props.group.groupCode, { userid: userid.value, targetProject: props.group.project })
        ElMessage.success('已加入权限组')
        userid.value = ''
        emit('refresh')
    } finally {
        submitting.value = false
    }
}

async function removeMember(targetUserid: string) {
    if (!props.group) return
    submitting.value = true
    try {
        await removeGlobalGroupMember(props.group.groupCode, targetUserid, props.group.project)
        ElMessage.success('已移除成员')
        emit('refresh')
    } finally {
        submitting.value = false
    }
}
</script>

<style scoped>
.drawer-body { padding: 24px; color: #1d1d1f; }
.group-head { display: flex; align-items: center; gap: 13px; padding-bottom: 18px; border-bottom: 1px solid #f0f0f0; }
.glyph { width: 48px; height: 48px; border-radius: 13px; background: #eaf2fb; color: #0066cc; display: flex; align-items: center; justify-content: center; font-weight: 600; }
h2, h3 { margin: 0; }
.meta { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 18px 0; }
.meta div { padding: 10px 12px; border-radius: 10px; background: #f5f5f7; }
.meta span { display: block; color: #7a7a7a; font-size: 12px; }
section { margin-top: 22px; }
.section-title { display: flex; align-items: center; justify-content: space-between; }
.member-add { display: flex; gap: 8px; margin-top: 12px; }
.member-add .el-select { flex: 1; }
.members { display: grid; gap: 8px; margin-top: 12px; }
.member-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-radius: 10px; background: #f5f5f7; }
.member-row strong, .member-row code { display: block; }
.member-row code, .empty { color: #7a7a7a; font-size: 12px; }
.chips { display: flex; gap: 7px; flex-wrap: wrap; margin-top: 12px; }
.chips code { padding: 5px 10px; border-radius: 7px; background: #f3f3f5; color: #0066cc; }
</style>
