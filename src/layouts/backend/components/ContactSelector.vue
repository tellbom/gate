<template>
    <div class="contact-selector">
        <!-- 搜索栏 -->
        <div class="search-bar">
            <el-input
                v-model="searchKeyword"
                placeholder="搜索部门或人员"
                clearable
                @input="handleSearch"
            >
                <template #prefix>
                    <i class="fa fa-search"></i>
                </template>
            </el-input>
        </div>

        <div class="content-wrapper">
            <!-- 左侧：组织架构树 -->
            <div class="org-tree-section">
                <div class="section-title">组织架构</div>
                <el-tree
                    ref="orgTreeRef"
                    :data="filteredOrgTree"
                    :props="treeProps"
                    node-key="id"
                    :default-expand-all="false"
                    :expand-on-click-node="false"
                    :show-checkbox="multiple"
                    :check-strictly="false"
                    @node-click="handleOrgClick"
                    @check="handleOrgCheck"
                >
                    <template #default="{ node, data }">
                        <span class="tree-node">
                            <i class="fa fa-sitemap node-icon"></i>
                            <span class="node-label">{{ node.label }}</span>
                            <span class="node-count">({{ getOrgUserCount(data.id) }})</span>
                        </span>
                    </template>
                </el-tree>
            </div>

            <!-- 右侧：人员列表 -->
            <div class="user-list-section">
                <div class="section-header">
                    <div class="section-title">
                        {{ currentOrgName || '全部人员' }}
                        <span class="total-count">共 {{ filteredUsers.length }} 人</span>
                    </div>
                    <div class="actions">
                        <el-button 
                            v-if="multiple && selectedUsers.length > 0" 
                            text 
                            type="primary"
                            @click="clearSelection"
                        >
                            清空已选 ({{ selectedUsers.length }})
                        </el-button>
                    </div>
                </div>

                <div class="user-list" v-loading="loading">
                    <div v-if="paginatedUsers.length === 0" class="empty-state">
                        <el-empty description="暂无人员" />
                    </div>
                    
                    <div 
                        v-for="user in paginatedUsers" 
                        :key="user.id"
                        class="user-item"
                        :class="{ selected: isUserSelected(user.id) }"
                        @click="handleUserClick(user)"
                    >
                        <el-checkbox 
                            v-if="multiple"
                            :model-value="isUserSelected(user.id)"
                            @change="(val) => handleUserCheckChange(val, user)"
                            @click.stop
                        />
                        <div class="user-avatar">
                            <i class="fa fa-user"></i>
                        </div>
                        <div class="user-info">
                            <div class="user-name">{{ user.name }}</div>
                            <div class="user-meta">
                                <span class="user-job">{{ user.position }}</span>
                                <span class="user-org">{{ getOrgNameById(user.orgId) }}</span>
                            </div>
                        </div>
                        <div class="user-contact">
                            <div class="user-phone">
                                <i class="fa fa-phone"></i>
                                {{ user.phone }}
                            </div>
                            <div class="user-code">工号: {{ user.workNo }}</div>
                        </div>
                    </div>
                </div>

                <!-- 分页 -->
                <div class="pagination-wrapper" v-if="filteredUsers.length > pageSize">
                    <el-pagination
                        v-model:current-page="currentPage"
                        :page-size="pageSize"
                        :total="filteredUsers.length"
                        layout="prev, pager, next"
                        small
                    />
                </div>
            </div>
        </div>

        <!-- 底部操作栏 -->
        <div class="footer-actions" v-if="multiple">
            <div class="selected-info">
                已选择 {{ selectedUsers.length }} 人
            </div>
            <div class="action-buttons">
                <el-button @click="handleCancel">取消</el-button>
                <el-button type="primary" @click="handleConfirm">
                    确定
                </el-button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { from } from 'linq-ts'

interface OrgItem {
    id: string
    pid: string | null
    name: string
}

interface UserItem {
    id: string
    name: string
    workNo: string
    phone: string
    position: string
    orgId: string
}

interface TreeNode {
    id: string
    label: string
    children?: TreeNode[]
}

interface UserWithOrg extends UserItem {
    orgName: string
}

interface Props {
    orgList: OrgItem[]
    userList: UserItem[]
    multiple?: boolean
    pageSize?: number
}

const props = withDefaults(defineProps<Props>(), {
    orgList: () => [],
    userList: () => [],
    multiple: true,
    pageSize: 20
})

interface Emits {
    (e: 'confirm', users: UserWithOrg[]): void
    (e: 'cancel'): void
}

const emit = defineEmits<Emits>()

// 状态
const loading = ref(false)
const searchKeyword = ref('')
const currentOrgId = ref<string>('')
const currentPage = ref(1)
const selectedUsers = ref<UserWithOrg[]>([])
const selectedOrgIds = ref<string[]>([])
const orgTreeRef = ref()

// 树形配置
const treeProps = {
    children: 'children',
    label: 'label'
}

// 构建组织树
const orgTree = computed(() => {
    return buildOrgTree(props.orgList)
})

const buildOrgTree = (list: OrgItem[], parentId: string | null = null): TreeNode[] => {
    return from(list)
        .where(item => item.pid === parentId)
        .select(item => ({
            id: item.id,
            label: item.name,
            children: buildOrgTree(list, item.id)
        }))
        .toArray()
}

// 过滤后的组织树（搜索）
const filteredOrgTree = computed(() => {
    if (!searchKeyword.value) return orgTree.value
    return filterTree(orgTree.value, searchKeyword.value)
})

const filterTree = (tree: TreeNode[], keyword: string): TreeNode[] => {
    const result: TreeNode[] = []
    
    for (const node of tree) {
        const match = node.label.toLowerCase().includes(keyword.toLowerCase())
        const children = node.children ? filterTree(node.children, keyword) : []
        
        if (match || children.length > 0) {
            result.push({
                ...node,
                children: children.length > 0 ? children : node.children
            })
        }
    }
    
    return result
}

// 根据组织ID获取组织名称
const getOrgNameById = (orgId: string): string => {
    const org = from(props.orgList).firstOrDefault(o => o.id === orgId)
    return org?.name || ''
}

// 获取组织下的人员数量
const getOrgUserCount = (orgId: string): number => {
    const allChildOrgIds = getAllChildOrgIds(orgId)
    return from(props.userList)
        .where(u => allChildOrgIds.includes(u.orgId))
        .count()
}

// 获取所有子组织ID（包括自己）
const getAllChildOrgIds = (orgId: string): string[] => {
    const result = [orgId]
    const children = from(props.orgList).where(o => o.pid === orgId).toArray()
    
    for (const child of children) {
        result.push(...getAllChildOrgIds(child.id))
    }
    
    return result
}

// 当前组织名称
const currentOrgName = computed(() => {
    if (!currentOrgId.value) return ''
    return getOrgNameById(currentOrgId.value)
})

// 过滤后的用户列表
const filteredUsers = computed(() => {
    let users = props.userList
    
    // 按组织过滤
    if (currentOrgId.value) {
        const orgIds = getAllChildOrgIds(currentOrgId.value)
        users = from(users).where(u => orgIds.includes(u.orgId)).toArray()
    }
    
    // 搜索过滤
    if (searchKeyword.value) {
        const keyword = searchKeyword.value.toLowerCase()
        users = from(users).where(u => 
            u.name.toLowerCase().includes(keyword) ||
            u.workNo.toLowerCase().includes(keyword) ||
            u.phone.includes(keyword) ||
            u.position.toLowerCase().includes(keyword)
        ).toArray()
    }
    
    return users
})

// 分页后的用户列表
const paginatedUsers = computed(() => {
    const start = (currentPage.value - 1) * props.pageSize
    const end = start + props.pageSize
    return filteredUsers.value.slice(start, end)
})

// 判断用户是否被选中
const isUserSelected = (userId: string): boolean => {
    return from(selectedUsers.value).any(u => u.id === userId)
}

// 搜索处理
const handleSearch = () => {
    currentPage.value = 1
    currentOrgId.value = ''
}

// 组织节点点击
const handleOrgClick = (data: TreeNode) => {
    if (!props.multiple) {
        currentOrgId.value = data.id
        currentPage.value = 1
    }
}

// 组织节点勾选
const handleOrgCheck = (data: TreeNode, checked: any) => {
    if (!props.multiple) return
    
    const checkedNodes = checked.checkedNodes as TreeNode[]
    selectedOrgIds.value = checkedNodes.map(n => n.id)
    
    // 获取所有选中组织下的用户
    const allOrgIds = from(selectedOrgIds.value)
        .selectMany(id => getAllChildOrgIds(id))
        .distinct()
        .toArray()
    
    // 添加选中组织下的所有用户（去重）
    const orgUsers = from(props.userList)
        .where(u => allOrgIds.includes(u.orgId))
        .select(u => ({
            ...u,
            orgName: getOrgNameById(u.orgId)
        }))
        .toArray()
    
    // 合并已选用户（去重）
    selectedUsers.value = from(selectedUsers.value)
        .concat(orgUsers)
        .distinctBy(u => u.id)
        .toArray()
}

// 用户点击
const handleUserClick = (user: UserItem) => {
    if (!props.multiple) {
        // 单选模式直接返回
        emit('confirm', [{
            ...user,
            orgName: getOrgNameById(user.orgId)
        }])
        return
    }
    
    // 多选模式切换选中状态
    const userWithOrg: UserWithOrg = {
        ...user,
        orgName: getOrgNameById(user.orgId)
    }
    
    if (isUserSelected(user.id)) {
        selectedUsers.value = from(selectedUsers.value)
            .where(u => u.id !== user.id)
            .toArray()
    } else {
        selectedUsers.value.push(userWithOrg)
    }
}

// 用户勾选变化
const handleUserCheckChange = (checked: boolean, user: UserItem) => {
    const userWithOrg: UserWithOrg = {
        ...user,
        orgName: getOrgNameById(user.orgId)
    }
    
    if (checked) {
        if (!isUserSelected(user.id)) {
            selectedUsers.value.push(userWithOrg)
        }
    } else {
        selectedUsers.value = from(selectedUsers.value)
            .where(u => u.id !== user.id)
            .toArray()
    }
}

// 清空选择
const clearSelection = () => {
    selectedUsers.value = []
    selectedOrgIds.value = []
    if (orgTreeRef.value) {
        orgTreeRef.value.setCheckedKeys([])
    }
}

// 确定
const handleConfirm = () => {
    emit('confirm', selectedUsers.value)
}

// 取消
const handleCancel = () => {
    clearSelection()
    emit('cancel')
}

// 监听搜索关键词变化
watch(searchKeyword, () => {
    currentPage.value = 1
})

// 监听当前组织变化
watch(currentOrgId, () => {
    currentPage.value = 1
})
</script>

<style scoped lang="scss">
.contact-selector {
    display: flex;
    flex-direction: column;
    height: 600px;
    background: #ffffff;
    border-radius: 12px;
    overflow: hidden;
}

/* 搜索栏 */
.search-bar {
    padding: 16px;
    border-bottom: 1px solid #e5e5e5;
    
    .el-input {
        :deep(.el-input__wrapper) {
            border-radius: 8px;
            box-shadow: 0 0 0 1px #e5e5e5 inset;
            transition: all 0.3s;
            
            &:hover {
                box-shadow: 0 0 0 1px #d1d1d6 inset;
            }
            
            &.is-focus {
                box-shadow: 0 0 0 2px #007aff inset;
            }
        }
    }
}

/* 内容区域 */
.content-wrapper {
    display: flex;
    flex: 1;
    overflow: hidden;
}

/* 左侧组织树 */
.org-tree-section {
    width: 280px;
    border-right: 1px solid #e5e5e5;
    display: flex;
    flex-direction: column;
    background: #f5f5f7;
}

.section-title {
    padding: 12px 16px;
    font-size: 14px;
    font-weight: 600;
    color: #1d1d1f;
    border-bottom: 1px solid #e5e5e5;
    background: #ffffff;
}

.org-tree-section .el-tree {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
    background: transparent;
    
    :deep(.el-tree-node__content) {
        height: 36px;
        border-radius: 6px;
        margin-bottom: 2px;
        transition: all 0.2s;
        
        &:hover {
            background: rgba(0, 122, 255, 0.08);
        }
    }
    
    :deep(.el-tree-node.is-current > .el-tree-node__content) {
        background: rgba(0, 122, 255, 0.12);
        font-weight: 500;
    }
}

.tree-node {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    font-size: 14px;
}

.node-icon {
    color: #007aff;
    font-size: 14px;
}

.node-label {
    flex: 1;
    color: #1d1d1f;
}

.node-count {
    font-size: 12px;
    color: #86868b;
}

/* 右侧用户列表 */
.user-list-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid #e5e5e5;
    background: #ffffff;
}

.total-count {
    margin-left: 8px;
    font-size: 13px;
    color: #86868b;
    font-weight: 400;
}

.actions {
    .el-button {
        font-size: 13px;
    }
}

/* 用户列表 */
.user-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
}

.empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
}

.user-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 4px;
    cursor: pointer;
    transition: all 0.2s;
    border: 1px solid transparent;
    
    &:hover {
        background: #f5f5f7;
        border-color: #e5e5e5;
    }
    
    &.selected {
        background: rgba(0, 122, 255, 0.08);
        border-color: #007aff;
    }
}

.user-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    font-size: 18px;
    flex-shrink: 0;
}

.user-info {
    flex: 1;
    min-width: 0;
}

.user-name {
    font-size: 15px;
    font-weight: 500;
    color: #1d1d1f;
    margin-bottom: 4px;
}

.user-meta {
    display: flex;
    gap: 12px;
    font-size: 13px;
    color: #86868b;
}

.user-job {
    color: #007aff;
}

.user-contact {
    text-align: right;
    font-size: 13px;
    color: #86868b;
}

.user-phone {
    margin-bottom: 4px;
    
    i {
        margin-right: 4px;
    }
}

/* 分页 */
.pagination-wrapper {
    padding: 12px 16px;
    border-top: 1px solid #e5e5e5;
    display: flex;
    justify-content: center;
}

/* 底部操作栏 */
.footer-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-top: 1px solid #e5e5e5;
    background: #f5f5f7;
}

.selected-info {
    font-size: 14px;
    color: #1d1d1f;
    font-weight: 500;
}

.action-buttons {
    display: flex;
    gap: 8px;
    
    .el-button {
        min-width: 80px;
    }
}

/* 滚动条样式 */
.user-list::-webkit-scrollbar,
.org-tree-section .el-tree::-webkit-scrollbar {
    width: 6px;
}

.user-list::-webkit-scrollbar-thumb,
.org-tree-section .el-tree::-webkit-scrollbar-thumb {
    background: #d1d1d6;
    border-radius: 3px;
    
    &:hover {
        background: #b1b1b6;
    }
}

/* 响应式 */
@media (max-width: 768px) {
    .contact-selector {
        height: 100vh;
    }
    
    .content-wrapper {
        flex-direction: column;
    }
    
    .org-tree-section {
        width: 100%;
        max-height: 200px;
        border-right: none;
        border-bottom: 1px solid #e5e5e5;
    }
}
</style>