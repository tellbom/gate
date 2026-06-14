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
import { computed } from 'vue'
import type { GroupItem } from '/@/api/backend/rbac'

const props = defineProps<{ modelValue: boolean; group: GroupItem | null }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()
const visible = computed({ get: () => props.modelValue, set: (value) => emit('update:modelValue', value) })
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
.chips { display: flex; gap: 7px; flex-wrap: wrap; margin-top: 12px; }
.chips code { padding: 5px 10px; border-radius: 7px; background: #f3f3f5; color: #0066cc; }
</style>
