import type { PagedData, PagedQuery } from '../client'
import { rbacClient } from '../client'
import type {
    AdminItem,
    GlobalGroupMemberForm,
    GlobalProjectListResult,
    GlobalUserGrantForm,
    GroupItem,
    ProjectWriteResult,
    RuleItem,
} from '../types'

export interface GlobalProjectQuery {
    project?: string
}

export interface GlobalUserListQuery extends PagedQuery {
    project?: string
    userid?: string
    groupCode?: string
}

export interface GlobalGroupListQuery extends PagedQuery {
    project?: string
    groupCode?: string
    permissionCode?: string
}

export interface GlobalMenuListQuery extends PagedQuery {
    project?: string
    ruleCode?: string
    permissionCode?: string
    type?: string
    menuType?: string
}

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

export async function getGlobalGroups(query: GlobalGroupListQuery = {}): Promise<PagedData<GroupItem>> {
    return rbacClient.get<any, PagedData<GroupItem>>('/api/global/group/list', { params: query })
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

