<template>
    <main class="projects-page">
        <div class="page-head">
            <div>
                <h1>系统列表</h1>
                <p>全部业务 project · 来自 /api/global/project/list</p>
            </div>
            <el-button @click="loadData">刷新</el-button>
        </div>
        <section class="project-grid">
            <article v-for="(project, index) in cards" :key="project.code" class="project-tile" :class="{ dark: index % 3 === 1 }">
                <div class="project-top">
                    <div>
                        <div class="code">{{ project.code }}</div>
                        <h2>{{ project.code }}</h2>
                        <p>后端未提供项目展示名，当前按 code 展示。</p>
                    </div>
                    <div class="glyph">{{ project.code.slice(0, 1).toUpperCase() }}</div>
                </div>
                <div class="metrics">
                    <span><strong>{{ project.users }}</strong>用户</span>
                    <span><strong>{{ project.supers }}</strong>超管</span>
                    <span><strong>{{ project.groups }}</strong>权限组</span>
                </div>
            </article>
        </section>
    </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { getGlobalGroups, getGlobalProjects, getGlobalUsers, type AdminItem, type GroupItem } from '/@/api/backend/rbac'

defineOptions({ name: 'backend/projects' })

const projects = ref<string[]>([])
const users = ref<AdminItem[]>([])
const groups = ref<GroupItem[]>([])

const cards = computed(() =>
    projects.value.map((code) => ({
        code,
        users: users.value.filter((user) => user.projectCodes?.includes(code)).length,
        supers: users.value.filter((user) => user.superProjects?.includes(code)).length,
        groups: groups.value.filter((group) => group.project === code).length,
    }))
)

onMounted(loadData)

async function loadData() {
    const [projectRes, userRes, groupRes] = await Promise.all([
        getGlobalProjects(),
        getGlobalUsers({ page: 1, pageSize: 100 }),
        getGlobalGroups({ page: 1, pageSize: 100 }),
    ])
    projects.value = projectRes.list || []
    users.value = userRes.list || []
    groups.value = groupRes.list || []
}
</script>

<style scoped>
.projects-page { color: #1d1d1f; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif; }
.page-head { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; }
h1 { margin: 0; font-size: 40px; font-weight: 600; letter-spacing: -0.02em; }
.page-head p { margin: 6px 0 0; color: #5c5c60; font-size: 19px; }
.project-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.project-tile { min-height: 220px; background: #f5f5f7; border-radius: 22px; padding: 30px 32px; display: flex; flex-direction: column; justify-content: space-between; }
.project-tile.dark { background: #272729; color: #fff; }
.project-tile.dark p, .project-tile.dark .code, .project-tile.dark .metrics { color: #bbb; }
.project-top { display: flex; justify-content: space-between; gap: 18px; }
.code { color: #7a7a7a; font: 12px "SF Mono", ui-monospace, monospace; }
h2 { margin: 8px 0 0; font-size: 27px; }
p { margin: 3px 0 0; color: #5c5c60; }
.glyph { width: 44px; height: 44px; border-radius: 12px; background: #eaf2fb; color: #0066cc; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 19px; }
.metrics { display: flex; gap: 30px; color: #7a7a7a; }
.metrics strong { display: block; color: inherit; font-size: 26px; line-height: 1; }
@media (max-width: 900px) { .project-grid { grid-template-columns: 1fr; } }
</style>
