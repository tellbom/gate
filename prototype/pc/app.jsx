/* ============================================================
   App shell — sidebar nav, top bar, in-memory store + actions.
   ============================================================ */
const { useState: useS, useMemo: useM } = React;

/* ---- deep clone seed into mutable store ---- */
function initStore() {
  const d = window.PC_DATA;
  return {
    projects: d.PROJECTS,
    users: JSON.parse(JSON.stringify(d.USERS)),
    groups: JSON.parse(JSON.stringify(d.GROUPS)),
    ruleTree: JSON.parse(JSON.stringify(d.RULE_TREE)),
    audit: d.AUDIT,
    apiMap: JSON.parse(JSON.stringify(d.API_MAP)),
    permView: d.PERMISSION_VIEW,
    stats: d.STATS,
    helpers: d.helpers,
  };
}

const NAV = [
  { group: "运营", items: [
    { key: "dashboard", label: "概览", icon: "grid" },
    { key: "users", label: "用户", icon: "users" },
    { key: "authorization", label: "授权", icon: "key" },
    { key: "groups", label: "权限组", icon: "shield" },
    { key: "menus", label: "菜单与路由", icon: "menu" },
    { key: "audit", label: "审计", icon: "clock" },
  ]},
  { group: "设计说明", items: [
    { key: "concept", label: "设计愿景与架构", icon: "spark" },
    { key: "apimap", label: "页面 · API 映射", icon: "link" },
  ]},
];

const PAGE_TITLES = {
  dashboard: ["概览", "权限运营中心"],
  users: ["用户", "跨 project 管理员账号"],
  authorization: ["授权", "Project 访问与超管管理"],
  groups: ["权限组", "成员与权限码管理"],
  menus: ["菜单与路由", "规则树与 API 权限映射"],
  audit: ["审计", "运行时鉴权与权限视图"],
  concept: ["设计愿景与架构", "Unified Permission Center"],
  apimap: ["页面 · API 映射", "契约对照与未来扩展"],
};

function Sidebar({ page, setPage }) {
  return (
    <div style={{ width: 248, flexShrink: 0, background: "#fff", borderRight: "1px solid var(--hairline)",
      display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "20px 20px 16px", display: "flex", alignItems: "center", gap: 11 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: "var(--ink)", color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="shield" size={19} fill />
        </div>
        <div>
          <div className="t-body-strong" style={{ fontSize: 14.5, letterSpacing: "-0.02em" }}>统一权限中心</div>
          <div className="t-cap" style={{ fontSize: 11 }}>Permission Center</div>
        </div>
      </div>
      <div style={{ padding: "0 14px 10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "var(--parchment)",
          borderRadius: 10 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--ok)" }} />
          <span className="t-cap-strong" style={{ fontSize: 12 }}>全局视图</span>
          <span className="t-mono" style={{ marginLeft: "auto", fontSize: 11, color: "var(--ink-48)" }}>__global__</span>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "4px 14px" }}>
        {NAV.map(sec => (
          <div key={sec.group} style={{ marginBottom: 20 }}>
            <div className="t-micro" style={{ color: "var(--ink-48)", padding: "0 12px 8px", textTransform: "uppercase" }}>{sec.group}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {sec.items.map(it => {
                const active = page === it.key;
                return (
                  <button key={it.key} className="btn" onClick={() => setPage(it.key)}
                    style={{ justifyContent: "flex-start", gap: 11, padding: "9px 12px", borderRadius: 9,
                      background: active ? "var(--blue-wash)" : "transparent", color: active ? "var(--blue)" : "var(--ink-80)",
                      fontWeight: active ? 600 : 400, fontSize: 14, width: "100%" }}>
                    <Icon name={it.icon} size={17} stroke={active ? 2 : 1.7} />
                    {it.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding: 14, borderTop: "1px solid var(--divider)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "6px 8px" }}>
          <Avatar name="张三" size={34} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="t-body-strong" style={{ fontSize: 13.5 }}>张三</div>
            <div className="t-cap" style={{ fontSize: 11 }}>EMP001 · 全局超管</div>
          </div>
          <Badge tone="super" size="sm" dot>super</Badge>
        </div>
      </div>
    </div>
  );
}

function TopBar({ page, action }) {
  const [title, sub] = PAGE_TITLES[page] || ["", ""];
  return (
    <div style={{ height: 60, flexShrink: 0, borderBottom: "1px solid var(--hairline)", background: "rgba(255,255,255,0.8)",
      backdropFilter: "saturate(180%) blur(20px)", WebkitBackdropFilter: "saturate(180%) blur(20px)",
      display: "flex", alignItems: "center", padding: "0 32px", gap: 16, position: "sticky", top: 0, zIndex: 20 }}>
      <div style={{ minWidth: 0 }}>
        <div className="t-body-strong" style={{ fontSize: 15 }}>{title}</div>
        <div className="t-cap" style={{ fontSize: 12 }}>{sub}</div>
      </div>
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
        {action}
      </div>
    </div>
  );
}

function Stub({ name }) {
  return <div className="card" style={{ padding: 60, textAlign: "center" }}><div className="t-lead">{name} · 建设中</div></div>;
}

function App() {
  const [store, setStore] = useS(initStore);
  const [page, setPage] = useS("dashboard");
  const [intent, setIntent] = useS(null); // cross-page action intent
  const toast = useToast();

  const go = (p) => { setPage(p); setIntent(null); };

  // scenario launcher from dashboard
  const scenario = (key, project) => {
    if (key === "grant" || key === "crossview") { setPage("authorization"); setIntent({ type: key, project }); }
    else if (key === "super") { setPage("authorization"); setIntent({ type: "super", project }); }
    else if (key === "members") { setPage("groups"); setIntent({ type: "members", project }); }
    else if (key === "review") { setPage("audit"); setIntent({ type: "review" }); }
    else if (key === "menus") { setPage("menus"); setIntent({ type: "menus", project }); }
  };

  // ---- store actions ----
  const actions = useM(() => ({
    setUserStatus(userid, status) {
      setStore(s => ({ ...s, users: s.users.map(u => u.userid === userid ? { ...u, status } : u) }));
      toast.push(status === "Disabled" ? "已禁用账号" : "已启用账号");
    },
    grantProjects(userid, username, targetProjects, isSuper) {
      setStore(s => {
        let users = s.users; let u = users.find(x => x.userid === userid);
        if (!u && username) { u = { userid, username, status: "Active", projectCodes: [], groupCodes: [], groupNames: [], superProjects: [], isSuper: false, grants: {} }; users = [...users, u]; }
        return { ...s, users: users.map(x => {
          if (x.userid !== userid) return x;
          const grants = { ...x.grants };
          targetProjects.forEach(pc => { if (!grants[pc]) grants[pc] = { groups: [], super: !!isSuper }; });
          const projectCodes = Array.from(new Set([...x.projectCodes, ...targetProjects]));
          const superProjects = isSuper ? Array.from(new Set([...x.superProjects, ...targetProjects])) : x.superProjects;
          return { ...x, grants, projectCodes, superProjects };
        }) };
      });
    },
    revokeGrant(userid, project) {
      setStore(s => ({ ...s, users: s.users.map(x => {
        if (x.userid !== userid) return x;
        const grants = { ...x.grants }; delete grants[project];
        return { ...x, grants, projectCodes: x.projectCodes.filter(p => p !== project), superProjects: x.superProjects.filter(p => p !== project) };
      }) }));
      toast.push("已撤销授权", "deny");
    },
    setSuper(userid, project, val) {
      setStore(s => ({ ...s, users: s.users.map(x => {
        if (x.userid !== userid) return x;
        const superProjects = val ? Array.from(new Set([...x.superProjects, project])) : x.superProjects.filter(p => p !== project);
        const grants = { ...x.grants }; if (grants[project]) grants[project] = { ...grants[project], super: val };
        return { ...x, superProjects, grants };
      }) }));
      toast.push(val ? "已提升为超管" : "已降级为普通管理员", val ? "ok" : "deny");
    },
    addMember(groupCode, userid, project, username) {
      setStore(s => {
        const users = s.users.map(x => {
          if (x.userid !== userid) return x;
          if (x.groupCodes.includes(groupCode)) return x;
          const g = s.groups.find(gg => gg.groupCode === groupCode);
          const projectCodes = Array.from(new Set([...x.projectCodes, project]));
          const grants = { ...x.grants }; if (!grants[project]) grants[project] = { groups: [], super: false };
          grants[project] = { ...grants[project], groups: Array.from(new Set([...(grants[project].groups||[]), groupCode])) };
          return { ...x, groupCodes: [...x.groupCodes, groupCode], groupNames: [...x.groupNames, g ? g.groupName : groupCode], projectCodes, grants };
        });
        const groups = s.groups.map(g => g.groupCode === groupCode ? { ...g, members: g.members + 1 } : g);
        return { ...s, users, groups };
      });
      toast.push("已加入权限组");
    },
    removeMember(groupCode, userid) {
      setStore(s => {
        const users = s.users.map(x => x.userid === userid ? { ...x, groupCodes: x.groupCodes.filter(c => c !== groupCode) } : x);
        const groups = s.groups.map(g => g.groupCode === groupCode ? { ...g, members: Math.max(0, g.members - 1) } : g);
        return { ...s, users, groups };
      });
      toast.push("已移出权限组", "deny");
    },
    createGroup(g) {
      setStore(s => ({ ...s, groups: [{ ...g, members: 0 }, ...s.groups] }));
      toast.push("已创建权限组");
    },
    setGroupStatus(groupCode, status) {
      setStore(s => ({ ...s, groups: s.groups.map(g => g.groupCode === groupCode ? { ...g, status } : g) }));
      toast.push(status === "Disabled" ? "已禁用权限组" : "已启用权限组");
    },
    setRuleStatus(project, ruleCode, status) {
      const walk = (nodes) => nodes.map(n => ({ ...n, status: n.ruleCode === ruleCode ? status : n.status, children: n.children ? walk(n.children) : n.children }));
      setStore(s => ({ ...s, ruleTree: { ...s.ruleTree, [project]: walk(s.ruleTree[project]) } }));
      toast.push("已更新规则状态");
    },
    addApiMap(rec) { setStore(s => ({ ...s, apiMap: [{ ...rec, id: "3fa85f64-" + Math.random().toString().slice(2,6), status: "Active" }, ...s.apiMap] })); toast.push("已新增 API 映射"); },
    updateApiMap(id, patch) { setStore(s => ({ ...s, apiMap: s.apiMap.map(r => r.id === id ? { ...r, ...patch } : r) })); toast.push("已更新 API 映射"); },
    deleteApiMap(id) { setStore(s => ({ ...s, apiMap: s.apiMap.filter(r => r.id !== id) })); toast.push("已删除 API 映射", "deny"); },
  }), []);

  const ctx = { store, actions, go, scenario, intent, setIntent, toast };
  const [topAction, setTopAction] = useS(null);

  let body, action = null;
  if (page === "dashboard") body = <Dashboard data={store} go={go} scenario={scenario} />;
  else if (page === "users" && window.UsersPage) { body = <UsersPage ctx={ctx} setAction={setTopAction} />; action = topAction; }
  else if (page === "authorization" && window.AuthorizationPage) { body = <AuthorizationPage ctx={ctx} setAction={setTopAction} />; action = topAction; }
  else if (page === "groups" && window.GroupsPage) { body = <GroupsPage ctx={ctx} setAction={setTopAction} />; action = topAction; }
  else if (page === "menus" && window.MenusPage) { body = <MenusPage ctx={ctx} setAction={setTopAction} />; action = topAction; }
  else if (page === "audit" && window.AuditPage) { body = <AuditPage ctx={ctx} />; }
  else if (page === "concept" && window.ConceptPage) { body = <ConceptPage ctx={ctx} go={go} />; }
  else if (page === "apimap" && window.ApiMapPage) { body = <ApiMapPage ctx={ctx} go={go} />; }
  else body = <Stub name={(PAGE_TITLES[page]||[""])[0]} />;

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar page={page} setPage={go} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: "var(--parchment)" }}>
        <TopBar page={page} action={action} />
        <div style={{ flex: 1, overflowY: "auto" }}>
          <div style={{ maxWidth: 1240, margin: "0 auto", padding: "30px 32px 80px" }} key={page} className="anim-fade">
            {body}
          </div>
        </div>
      </div>
      {toast.node}
    </div>
  );
}

window.App = App;
