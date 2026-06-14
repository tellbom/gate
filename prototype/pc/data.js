/* ============================================================
   Seed data — shaped to mirror the /api/global/* responses.
   All field names match the documented API contract so the
   page→API mapping is literal, not decorative.
   ============================================================ */
(function () {
  // ---- /api/global/project/list -> data.list (codes) ----
  const PROJECTS = [
    { code: "portal",   name: "Portal Center",   cn: "门户中心",   users: 612, supers: 4, groups: 28, menus: 214 },
    { code: "workflow", name: "Workflow Center", cn: "流程中心",   users: 488, supers: 3, groups: 31, menus: 256 },
    { code: "message",  name: "Message Center",  cn: "消息中心",   users: 305, supers: 2, groups: 22, menus: 188 },
    { code: "news",     name: "News Center",     cn: "资讯中心",   users: 274, supers: 2, groups: 19, menus: 167 },
    { code: "quality",  name: "Quality Center",  cn: "质量中心",   users: 351, supers: 3, groups: 26, menus: 201 },
    { code: "rbac",     name: "RBAC Center",     cn: "权限中心",   users: 126, supers: 5, groups: 32, menus: 222 },
  ];

  const pname = (code) => (PROJECTS.find(p => p.code === code) || { name: code }).name;

  // ---- /api/global/group/list -> list items ----
  // fields: groupCode, groupName, project, parent_group_code, status, permissionCodes
  const GROUPS = [
    { groupCode: "portal_admin",   groupName: "门户管理员",   project: "portal",   parent_group_code: null,           status: "Active",   members: 12, permissionCodes: ["menu:portal.home","menu:portal.layout","button:portal.publish","menu:portal.user","button:portal.user.edit"] },
    { groupCode: "portal_editor",  groupName: "门户编辑",     project: "portal",   parent_group_code: "portal_admin", status: "Active",   members: 34, permissionCodes: ["menu:portal.home","button:portal.publish"] },
    { groupCode: "workflow_admin", groupName: "流程管理员",   project: "workflow", parent_group_code: null,           status: "Active",   members: 9,  permissionCodes: ["menu:workflow.design","menu:workflow.instance","button:workflow.deploy","menu:workflow.form"] },
    { groupCode: "workflow_ops",   groupName: "流程运维",     project: "workflow", parent_group_code: "workflow_admin", status: "Active", members: 18, permissionCodes: ["menu:workflow.instance","button:workflow.retry"] },
    { groupCode: "message_admin",  groupName: "消息管理员",   project: "message",  parent_group_code: null,           status: "Active",   members: 7,  permissionCodes: ["menu:message.template","menu:message.channel","button:message.send"] },
    { groupCode: "news_admin",     groupName: "资讯管理员",   project: "news",     parent_group_code: null,           status: "Active",   members: 6,  permissionCodes: ["menu:news.article","menu:news.category","button:news.publish"] },
    { groupCode: "news_reviewer",  groupName: "资讯审核",     project: "news",     parent_group_code: "news_admin",   status: "Disabled", members: 4,  permissionCodes: ["menu:news.article","button:news.review"] },
    { groupCode: "quality_admin",  groupName: "质量管理员",   project: "quality",  parent_group_code: null,           status: "Active",   members: 11, permissionCodes: ["menu:quality.audit","menu:quality.report","button:quality.export"] },
    { groupCode: "quality_viewer", groupName: "质量只读",     project: "quality",  parent_group_code: "quality_admin", status: "Active",  members: 52, permissionCodes: ["menu:quality.report"] },
    { groupCode: "rbac_admin",     groupName: "权限管理员",   project: "rbac",     parent_group_code: null,           status: "Active",   members: 5,  permissionCodes: ["menu:system","menu:system.user","menu:system.group","button:admin.edit","menu:system.rule"] },
    { groupCode: "rbac_auditor",   groupName: "权限审计员",   project: "rbac",     parent_group_code: "rbac_admin",   status: "Active",   members: 8,  permissionCodes: ["menu:search.audit","menu:search.permission"] },
    { groupCode: "operator",       groupName: "通用操作员",   project: "message",  parent_group_code: null,           status: "Active",   members: 41, permissionCodes: ["menu:message.template","button:message.send"] },
  ];

  // ---- /api/global/user/list -> list items ----
  // fields: userid, username, status, projectCodes, groupCodes, groupNames, superProjects, isSuper
  function mkUser(userid, username, status, grants) {
    // grants: { [projectCode]: { groups:[groupCode], super:bool } }
    const projectCodes = Object.keys(grants).filter(k => k !== "__global__");
    const groupCodes = [], groupNames = [], superProjects = [];
    projectCodes.forEach(pc => {
      (grants[pc].groups || []).forEach(gc => {
        groupCodes.push(gc);
        const g = GROUPS.find(x => x.groupCode === gc);
        groupNames.push(g ? g.groupName : gc);
      });
      if (grants[pc].super) superProjects.push(pc);
    });
    return { userid, username, status, projectCodes, groupCodes, groupNames, superProjects,
             isSuper: grants.__global__ ? true : false, grants, dept: "" };
  }

  const USERS = [
    mkUser("EMP001", "张三", "Active", { __global__: { super: true }, portal: { groups:["portal_admin"], super:true }, rbac: { groups:["rbac_admin"], super:true }, workflow: { groups:["workflow_admin"] } }),
    mkUser("EMP002", "李四", "Active", { workflow: { groups:["workflow_admin"], super:true }, message: { groups:["message_admin"] } }),
    mkUser("EMP003", "王五", "Active", { message: { groups:["message_admin"] }, news: { groups:["news_admin"], super:true } }),
    mkUser("EMP004", "赵六", "Disabled", { quality: { groups:["quality_admin"] } }),
    mkUser("EMP005", "钱七", "Active", { portal: { groups:["portal_editor"] }, news: { groups:["news_reviewer"] } }),
    mkUser("EMP006", "孙八", "Active", { quality: { groups:["quality_admin"], super:true }, rbac: { groups:["rbac_auditor"] } }),
    mkUser("EMP007", "周九", "Active", { workflow: { groups:["workflow_ops"] } }),
    mkUser("EMP008", "吴十", "Active", { portal: { groups:["portal_editor"] }, message: { groups:["operator"] }, quality: { groups:["quality_viewer"] } }),
    mkUser("EMP009", "郑十一", "Disabled", { news: { groups:["news_admin"] } }),
    mkUser("EMP010", "王十二", "Active", { rbac: { groups:["rbac_admin"], super:true } }),
    mkUser("EMP011", "冯十三", "Active", { message: { groups:["operator"] } }),
    mkUser("EMP012", "陈十四", "Active", { portal: { groups:["portal_admin"], super:true }, quality: { groups:["quality_viewer"] } }),
    mkUser("EMP013", "褚十五", "Active", { workflow: { groups:["workflow_ops"] }, news: { groups:["news_reviewer"] } }),
    mkUser("EMP014", "卫十六", "Active", { quality: { groups:["quality_admin"] } }),
  ];

  // ---- /api/global/menu/list & /api/rule/tree ----
  // node fields: ruleCode, permissionCode, title, type, status, icon, weigh, menuType, path, children
  const RULE_TREE = {
    portal: [
      { ruleCode:"portal.home", permissionCode:"menu:portal.home", title:"门户首页", type:"Menu", status:"Active", icon:"home", weigh:90, path:"/portal/home", children:[
        { ruleCode:"portal.publish", permissionCode:"button:portal.publish", title:"发布", type:"Button", status:"Active", weigh:10 },
      ]},
      { ruleCode:"portal.layout", permissionCode:"menu:portal.layout", title:"版面管理", type:"Menu", status:"Active", icon:"layout", weigh:80, path:"/portal/layout", children:[] },
      { ruleCode:"portal.user", permissionCode:"menu:portal.user", title:"门户用户", type:"Menu", status:"Active", icon:"user", weigh:70, path:"/portal/user", children:[
        { ruleCode:"portal.user.edit", permissionCode:"button:portal.user.edit", title:"编辑用户", type:"Button", status:"Active", weigh:10 },
      ]},
    ],
    workflow: [
      { ruleCode:"workflow", permissionCode:"menu:workflow", title:"流程管理", type:"MenuDir", status:"Active", icon:"folder", weigh:100, children:[
        { ruleCode:"workflow.design", permissionCode:"menu:workflow.design", title:"流程设计", type:"Menu", status:"Active", icon:"edit", weigh:90, path:"/workflow/design", children:[
          { ruleCode:"workflow.deploy", permissionCode:"button:workflow.deploy", title:"部署", type:"Button", status:"Active", weigh:10 },
        ]},
        { ruleCode:"workflow.instance", permissionCode:"menu:workflow.instance", title:"流程实例", type:"Menu", status:"Active", icon:"list", weigh:80, path:"/workflow/instance", children:[
          { ruleCode:"workflow.retry", permissionCode:"button:workflow.retry", title:"重试", type:"Button", status:"Active", weigh:10 },
        ]},
        { ruleCode:"workflow.form", permissionCode:"menu:workflow.form", title:"表单管理", type:"Menu", status:"Disabled", icon:"form", weigh:70, path:"/workflow/form", children:[] },
      ]},
    ],
    rbac: [
      { ruleCode:"system", permissionCode:"menu:system", title:"系统管理", type:"MenuDir", status:"Active", icon:"cog", weigh:100, children:[
        { ruleCode:"system.user", permissionCode:"menu:system.user", title:"用户管理", type:"Menu", status:"Active", icon:"user", weigh:90, path:"/system/user", children:[
          { ruleCode:"admin.edit", permissionCode:"button:admin.edit", title:"编辑管理员", type:"Button", status:"Active", weigh:20 },
        ]},
        { ruleCode:"system.group", permissionCode:"menu:system.group", title:"权限组", type:"Menu", status:"Active", icon:"group", weigh:80, path:"/system/group", children:[] },
        { ruleCode:"system.rule", permissionCode:"menu:system.rule", title:"菜单规则", type:"Menu", status:"Active", icon:"menu", weigh:70, path:"/system/rule", children:[] },
      ]},
      { ruleCode:"search", permissionCode:"menu:search", title:"查询中心", type:"MenuDir", status:"Active", icon:"search", weigh:90, children:[
        { ruleCode:"search.audit", permissionCode:"menu:search.audit", title:"审计日志", type:"Menu", status:"Active", icon:"shield", weigh:90, path:"/search/audit", children:[] },
        { ruleCode:"search.permission", permissionCode:"menu:search.permission", title:"权限视图", type:"Menu", status:"Active", icon:"key", weigh:80, path:"/search/permission", children:[] },
      ]},
    ],
    message: [
      { ruleCode:"message.template", permissionCode:"menu:message.template", title:"消息模板", type:"Menu", status:"Active", icon:"mail", weigh:90, path:"/message/template", children:[
        { ruleCode:"message.send", permissionCode:"button:message.send", title:"发送", type:"Button", status:"Active", weigh:10 },
      ]},
      { ruleCode:"message.channel", permissionCode:"menu:message.channel", title:"渠道配置", type:"Menu", status:"Active", icon:"radio", weigh:80, path:"/message/channel", children:[] },
    ],
    news: [
      { ruleCode:"news.article", permissionCode:"menu:news.article", title:"资讯文章", type:"Menu", status:"Active", icon:"doc", weigh:90, path:"/news/article", children:[
        { ruleCode:"news.publish", permissionCode:"button:news.publish", title:"发布", type:"Button", status:"Active", weigh:10 },
        { ruleCode:"news.review", permissionCode:"button:news.review", title:"审核", type:"Button", status:"Active", weigh:9 },
      ]},
      { ruleCode:"news.category", permissionCode:"menu:news.category", title:"栏目管理", type:"Menu", status:"Active", icon:"layers", weigh:80, path:"/news/category", children:[] },
    ],
    quality: [
      { ruleCode:"quality.audit", permissionCode:"menu:quality.audit", title:"质量审查", type:"Menu", status:"Active", icon:"check", weigh:90, path:"/quality/audit", children:[
        { ruleCode:"quality.export", permissionCode:"button:quality.export", title:"导出", type:"Button", status:"Active", weigh:10 },
      ]},
      { ruleCode:"quality.report", permissionCode:"menu:quality.report", title:"质量报表", type:"Menu", status:"Active", icon:"chart", weigh:80, path:"/quality/report", children:[] },
    ],
  };

  // ---- /api/search/audit-logs -> list items ----
  // fields: auditId, userid, project, permissionCode, result, reason, createdAt, httpMethod, route
  const RESULTS = ["Allow","Allow","Allow","Allow","Deny","Allow","Allow","Deny","Error","Allow"];
  const ROUTES = [
    ["GET","/api/admin/list","menu:system.user","read"],
    ["POST","/api/group/{groupCode}/members","button:admin.edit","create"],
    ["PUT","/api/project-grant/{userid}/super","menu:system.user","update"],
    ["DELETE","/api/rule/{ruleCode}","menu:system.rule","delete"],
    ["GET","/api/search/audit-logs","menu:search.audit","read"],
    ["POST","/api/global/user/{userid}/project-grants","rbac.global.grant","create"],
    ["GET","/api/global/menu/list","rbac.global.menu","read"],
    ["PUT","/api/rule/{ruleCode}/status","menu:system.rule","update"],
  ];
  const AUDIT = [];
  const now = new Date("2026-06-14T11:20:00+08:00").getTime();
  for (let i = 0; i < 32; i++) {
    const u = USERS[i % USERS.length];
    const r = ROUTES[i % ROUTES.length];
    const result = RESULTS[i % RESULTS.length];
    const proj = u.projectCodes[0] || "rbac";
    AUDIT.push({
      auditId: "aud_" + (10240 - i),
      userid: u.userid, username: u.username,
      project: proj,
      httpMethod: r[0], route: r[1],
      permissionCode: r[2], action: r[3],
      result,
      reason: result === "Allow" ? "命中权限码授权" : result === "Deny" ? "权限码未授权" : "鉴权管道异常",
      createdAt: new Date(now - i * 1000 * 60 * 7 - (i%5)*60000).toISOString(),
    });
  }

  // ---- /api/api-map/records -> list items ----
  const API_MAP = [
    { id:"3fa85f64-0001", httpMethod:"GET",    routePattern:"/api/admin/list",                       permissionCode:"menu:system.user",      action:"read",   status:"Active" },
    { id:"3fa85f64-0002", httpMethod:"POST",   routePattern:"/api/admin",                            permissionCode:"button:admin.edit",     action:"create", status:"Active" },
    { id:"3fa85f64-0003", httpMethod:"PUT",    routePattern:"/api/admin/{userid}",                   permissionCode:"button:admin.edit",     action:"update", status:"Active" },
    { id:"3fa85f64-0004", httpMethod:"DELETE", routePattern:"/api/admin/{userid}",                   permissionCode:"button:admin.edit",     action:"delete", status:"Active" },
    { id:"3fa85f64-0005", httpMethod:"GET",    routePattern:"/api/group/list",                       permissionCode:"menu:system.group",     action:"read",   status:"Active" },
    { id:"3fa85f64-0006", httpMethod:"POST",   routePattern:"/api/group/{groupCode}/members",        permissionCode:"menu:system.group",     action:"create", status:"Active" },
    { id:"3fa85f64-0007", httpMethod:"PUT",    routePattern:"/api/project-grant/{userid}/super",     permissionCode:"menu:system.user",      action:"update", status:"Active" },
    { id:"3fa85f64-0008", httpMethod:"GET",    routePattern:"/api/rule/tree",                        permissionCode:"menu:system.rule",      action:"read",   status:"Active" },
    { id:"3fa85f64-0009", httpMethod:"POST",   routePattern:"/api/rule",                             permissionCode:"menu:system.rule",      action:"create", status:"Active" },
    { id:"3fa85f64-0010", httpMethod:"GET",    routePattern:"/api/global/user/list",                 permissionCode:"rbac.global.user",      action:"read",   status:"Active" },
    { id:"3fa85f64-0011", httpMethod:"POST",   routePattern:"/api/global/user/{userid}/project-grants", permissionCode:"rbac.global.grant",  action:"create", status:"Active" },
    { id:"3fa85f64-0012", httpMethod:"GET",    routePattern:"/api/search/audit-logs",                permissionCode:"menu:search.audit",     action:"read",   status:"Disabled" },
  ];

  // ---- /api/api-map/list (permission-view) -> list items ----
  // fields: permissionCode, action, resourceType, title
  const PERMISSION_VIEW = [
    { permissionCode:"menu:system.user",  action:"read",   resourceType:"Menu",   title:"用户管理" },
    { permissionCode:"button:admin.edit", action:"update", resourceType:"Button", title:"编辑管理员" },
    { permissionCode:"menu:system.group", action:"read",   resourceType:"Menu",   title:"权限组" },
    { permissionCode:"menu:system.rule",  action:"read",   resourceType:"Menu",   title:"菜单规则" },
    { permissionCode:"rbac.global.user",  action:"read",   resourceType:"Api",    title:"全局用户查询" },
    { permissionCode:"rbac.global.grant", action:"create", resourceType:"Api",    title:"全局授权" },
    { permissionCode:"menu:search.audit", action:"read",   resourceType:"Menu",   title:"审计日志" },
  ];

  const STATS = { systems: 6, users: 2356, groups: 158, menus: 1248 };

  window.PC_DATA = {
    PROJECTS, USERS, GROUPS, RULE_TREE, AUDIT, API_MAP, PERMISSION_VIEW, STATS,
    helpers: { pname }
  };
})();
