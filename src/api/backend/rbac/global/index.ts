import type { PagedData, PagedQuery } from '../client'
import { rbacClient } from '../client'
import type {
    AdminItem,
    GlobalGroupMemberForm,
    GlobalProjectListResult,
    GlobalUserGrantForm,
    GroupCreateForm,
    GroupItem,
    GroupUpdateForm,
    ProjectWriteResult,
    RuleCreateForm,
    RuleItem,
    RuleUpdateForm,
} from '../types'

export interface GlobalProjectQuery {
    project?: string
}

export interface GlobalUserListQuery extends PagedQuery {
    keyword?: string
    project?: string
    userid?: string
    groupCode?: string
    status?: 'Active' | 'Disabled'
}

export interface GlobalGroupListQuery extends PagedQuery {
    keyword?: string
    project?: string
    groupCode?: string
    permissionCode?: string
    status?: 'Active' | 'Disabled'
}

export interface GlobalMenuListQuery extends PagedQuery {
    project?: string
    ruleCode?: string
    permissionCode?: string
    type?: string
    menuType?: string
    keyword?: string
    status?: 'Active' | 'Disabled'
}

export type GlobalGroupCreateForm = GroupCreateForm & { targetProject: string }
export type GlobalGroupUpdateForm = GroupUpdateForm & {
    targetProject: string
    extraPermissionCodes?: string[]
}
export type GlobalMenuCreateForm = RuleCreateForm & { targetProject: string }
export type GlobalMenuUpdateForm = RuleUpdateForm & { targetProject: string }

export async function getGlobalProjects(): Promise<GlobalProjectListResult> {
    return rbacClient.get<any, GlobalProjectListResult>('/api/global/project/list')
}

export async function getGlobalUsers(query: GlobalUserListQuery = {}): Promise<PagedData<AdminItem>> {
    return rbacClient.get<any, PagedData<AdminItem>>('/api/global/user/list', { params: query })
}

export async function updateGlobalUserStatus(userid: string, status: 'Active' | 'Disabled'): Promise<void> {
    return rbacClient.put<any, void>(`/api/global/user/${encodeURIComponent(userid)}/status`, { status })
}

export async function grantGlobalUserProjects(userid: string, form: GlobalUserGrantForm): Promise<ProjectWriteResult> {
    return rbacClient.post<any, ProjectWriteResult>(`/api/global/user/${encodeURIComponent(userid)}/project-grants`, form)
}

export async function revokeGlobalUserProject(userid: string, project: string): Promise<ProjectWriteResult> {
    return rbacClient.delete<any, ProjectWriteResult>(
        `/api/global/user/${encodeURIComponent(userid)}/project-grants/${encodeURIComponent(project)}`
    )
}

export async function toggleGlobalUserProjectSuper(userid: string, project: string, isSuper: boolean): Promise<void> {
    return rbacClient.put<any, void>(
        `/api/global/user/${encodeURIComponent(userid)}/project-grants/${encodeURIComponent(project)}/super`,
        { isSuper }
    )
}

export async function deleteGlobalUser(userid: string): Promise<void> {
    return rbacClient.delete<any, void>(`/api/global/user/${encodeURIComponent(userid)}`)
}

export async function getGlobalGroups(query: GlobalGroupListQuery = {}): Promise<PagedData<GroupItem>> {
    return rbacClient.get<any, PagedData<GroupItem>>('/api/global/group/list', { params: query })
}

export async function createGlobalGroup(form: GlobalGroupCreateForm): Promise<{ groupCode: string }> {
    return rbacClient.post<any, { groupCode: string }>('/api/global/group', form)
}

export async function updateGlobalGroup(groupCode: string, form: GlobalGroupUpdateForm): Promise<void> {
    return rbacClient.put<any, void>(`/api/global/group/${encodeURIComponent(groupCode)}`, form)
}

export async function deleteGlobalGroup(groupCode: string, targetProject: string): Promise<void> {
    return rbacClient.delete<any, void>(`/api/global/group/${encodeURIComponent(groupCode)}`, {
        params: { targetProject },
    })
}

export async function addGlobalGroupMember(groupCode: string, form: GlobalGroupMemberForm): Promise<void> {
    return rbacClient.post<any, void>(`/api/global/group/${encodeURIComponent(groupCode)}/members`, form)
}

export async function removeGlobalGroupMember(groupCode: string, userid: string, targetProject: string): Promise<void> {
    return rbacClient.delete<any, void>(`/api/global/group/${encodeURIComponent(groupCode)}/members/${encodeURIComponent(userid)}`, {
        params: { targetProject },
    })
}

export async function getGlobalMenus(query: GlobalMenuListQuery = {}): Promise<PagedData<RuleItem>> {
    return rbacClient.get<any, PagedData<RuleItem>>('/api/global/menu/list', { params: query })
}

export async function createGlobalMenu(form: GlobalMenuCreateForm): Promise<{ ruleCode: string }> {
    return rbacClient.post<any, { ruleCode: string }>('/api/global/menu', form)
}

export async function updateGlobalMenu(ruleCode: string, form: GlobalMenuUpdateForm): Promise<void> {
    return rbacClient.put<any, void>(`/api/global/menu/${encodeURIComponent(ruleCode)}`, form)
}

export async function deleteGlobalMenu(ruleCode: string, targetProject: string): Promise<void> {
    return rbacClient.delete<any, void>(`/api/global/menu/${encodeURIComponent(ruleCode)}`, {
        params: { targetProject },
    })
}

