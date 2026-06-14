/* ============================================================
   Permission group management.
   APIs: GET /api/global/group/list, GET /api/group/list,
         POST /api/group, PUT /api/group/{groupCode}/status,
         POST /api/global/group/{groupCode}/members,
         DELETE /api/global/group/{groupCode}/members/{userid}?targetProject=
         GET /api/rule/tree, GET /api/api-map/list
   ============================================================ */
const { useState: useSG, useEffect: useEffG } = React;

function GroupDetail({ group, ctx, onClose }) {
  const { store, actions } = ctx;
  const g = store.groups.find(x => x.groupCode === group.groupCode) || group;
  const p = store.projects.find(x => x.code === g.project);
  const members = store.users.filter(u => u.groupCodes.includes(g.groupCode));
  const [adding, setAdding] = useSG(false);
  const [kw, setKw] = useSG("");
  const candidates = store.users.filter(u => !u.groupCodes.includes(g.groupCode) && (u.username.includes(kw) || u.userid.toLowerCase().includes(kw.toLowerCase())));

  return (
    <React.Fragment>
      <div style={{ padding: "22px 24px 18px", borderBottom: "1px solid var(--divider)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span className="t-cap-strong">权限组详情</span>
          <button className="btn" onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, background: "var(--parchment)" }}><Icon name="x" size={17} /></button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
          <span style={{ width: 48, height: 48, borderRadius: 13, background: "var(--blue-wash)", color: "var(--blue)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="shield" size={24} /></span>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <span className="t-title" style={{ fontSize: 21 }}>{g.groupName}</span>
              <Badge tone={g.status === "Active" ? "ok" : "neutral"} dot size="sm">{g.status === "Active" ? "启用" : "禁用"}</Badge>
            </div>
            <div className="t-cap" style={{ marginTop: 2 }}><span className="t-mono">{g.groupCode}</span></div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <div style={{ flex: 1, padding: "10px 12px", background: "var(--parchment)", borderRadius: 10, display: "flex", alignItems: "center", gap: 9 }}>
            <ProjectGlyph code={g.project} name={p ? p.name : g.project} size={26} />
            <div><div className="t-cap" style={{ fontSize: 11 }}>所属系统</div><div className="t-body-strong" style={{ fontSize: 13 }}>{p ? p.name : g.project}</div></div>
          </div>
          <div style={{ flex: 1, padding: "10px 12px", background: "var(--parchment)", borderRadius: 10 }}>
            <div className="t-cap" style={{ fontSize: 11 }}>父权限组</div>
            <div className="t-body-strong" style={{ fontSize: 13 }}>{g.parent_group_code || "根组"}</div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "var(--parchment)", borderRadius: 12, marginBottom: 22 }}>
          <div><div className="t-body-strong" style={{ fontSize: 14 }}>启用状态</div><div className="t-cap">PUT /api/group/{"{groupCode}"}/status</div></div>
          <Toggle on={g.status === "Active"} onChange={(v) => actions.setGroupStatus(g.groupCode, v ? "Active" : "Disabled")} />
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <span className="t-section">成员（{members.length}）</span>
          <button className="btn btn-text" onClick={() => setAdding(a => !a)}><Icon name="plus" size={14} /> 添加成员</button>
        </div>
        {adding && (
          <div className="anim-fade" style={{ border: "1px solid var(--hairline)", borderRadius: 12, padding: 12, marginBottom: 14 }}>
            <SearchInput value={kw} onChange={setKw} placeholder={`搜索用户加入 ${g.project}`} width="100%" />
            <div style={{ maxHeight: 200, overflowY: "auto", marginTop: 10 }}>
              {candidates.slice(0, 8).map(u => (
                <div key={u.userid} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 4px", borderTop: "1px solid var(--divider)" }}>
                  <Avatar name={u.username} size={28} />
                  <div style={{ flex: 1 }}><span className="t-body-strong" style={{ fontSize: 13 }}>{u.username}</span> <span className="t-cap"><span className="t-mono" style={{ fontSize: 11 }}>{u.userid}</span></span></div>
                  <button className="btn btn-ghost btn-sm" onClick={() => actions.addMember(g.groupCode, u.userid, g.project, u.username)}>加入</button>
                </div>
              ))}
              {candidates.length === 0 && <div className="t-cap" style={{ padding: 10, textAlign: "center" }}>无可添加用户</div>}
            </div>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 24 }}>
          {members.map(u => (
            <div key={u.userid} style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 12px", border: "1px solid var(--hairline)", borderRadius: 11 }}>
              <Avatar name={u.username} size={30} dim={u.status === "Disabled"} />
              <div style={{ flex: 1 }}><div className="t-body-strong" style={{ fontSize: 13.5 }}>{u.username}</div><div className="t-cap"><span className="t-mono" style={{ fontSize: 11 }}>{u.userid}</span></div></div>
              <button className="btn" onClick={() => actions.removeMember(g.groupCode, u.userid)} title="移除"
                style={{ width: 28, height: 28, borderRadius: 8, color: "var(--deny)", background: "var(--deny-wash)" }}><Icon name="x" size={15} /></button>
            </div>
          ))}
          {members.length === 0 && <div className="t-cap" style={{ padding: "6px 0" }}>暂无成员</div>}
        </div>

        <div className="t-section" style={{ marginBottom: 4 }}>授权权限码（{g.permissionCodes.length}）</div>
        <div className="t-cap" style={{ marginBottom: 12 }}>permissionCodes = ruleCodes 推导值 ∪ extraPermissionCodes</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {g.permissionCodes.map(pc => (
            <span key={pc} className="t-mono" style={{ fontSize: 11.5, padding: "5px 10px", background: pc.startsWith("menu:") ? "#eef4fb" : "#f3eefb",
              color: pc.startsWith("menu:") ? "var(--blue)" : "var(--super)", borderRadius: 7 }}>{pc}</span>
          ))}
        </div>
      </div>
    </React.Fragment>
  );
}

function CreateGroupModal({ ctx, onClose }) {
  const { store, actions } = ctx;
  const [name, setName] = useSG("");
  const [code, setCode] = useSG("");
  const [project, setProject] = useSG(store.projects[0].code);
  const [parent, setParent] = useSG("");
  const [ruleCodes, setRuleCodes] = useSG([]);
  const [extra, setExtra] = useSG([]);

  const flatten = (nodes, out = []) => { (nodes||[]).forEach(n => { out.push(n); if (n.children) flatten(n.children, out); }); return out; };
  const rules = flatten(store.ruleTree[project] || []);
  const projGroups = store.groups.filter(g => g.project === project);
  const toggleRule = (rc) => setRuleCodes(s => s.includes(rc) ? s.filter(x => x !== rc) : [...s, rc]);
  const toggleExtra = (pc) => setExtra(s => s.includes(pc) ? s.filter(x => x !== pc) : [...s, pc]);

  const derived = Array.from(new Set([
    ...rules.filter(r => ruleCodes.includes(r.ruleCode)).map(r => r.permissionCode),
    ...extra,
  ]));

  const submit = () => {
    actions.createGroup({
      groupCode: code || ("group_" + Math.random().toString(36).slice(2, 8)),
      groupName: name || "未命名组", project, parent_group_code: parent || null, status: "Active",
      permissionCodes: derived,
    });
    onClose();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", maxHeight: "86vh" }}>
      <div style={{ padding: "22px 26px 16px", borderBottom: "1px solid var(--divider)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div><div className="t-title" style={{ fontSize: 21 }}>新建权限组</div><div className="t-cap" style={{ marginTop: 2 }}>POST /api/group</div></div>
        <button className="btn" onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, background: "var(--parchment)" }}><Icon name="x" size={17} /></button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 26, display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="组名称" value={name} onChange={setName} placeholder="例如 门户管理员" />
          <Field label="组编码 groupCode" value={code} onChange={setCode} placeholder="留空自动生成 group_<guid>" mono />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="所属系统 project" as="select" value={project} onChange={(v) => { setProject(v); setRuleCodes([]); setParent(""); }}>
            {store.projects.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
          </Field>
          <Field label="父权限组" as="select" value={parent} onChange={setParent}>
            <option value="">根组（无父级）</option>
            {projGroups.map(g => <option key={g.groupCode} value={g.groupCode}>{g.groupName}</option>)}
          </Field>
        </div>
        <div>
          <div className="t-cap-strong" style={{ marginBottom: 8 }}>规则授权 ruleCodes · GET /api/rule/tree</div>
          <div style={{ border: "1px solid var(--hairline)", borderRadius: 12, maxHeight: 200, overflowY: "auto", padding: 6 }}>
            {rules.map(r => (
              <label key={r.ruleCode} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 8px", cursor: "pointer", borderRadius: 8 }}>
                <Check on={ruleCodes.includes(r.ruleCode)} onChange={() => toggleRule(r.ruleCode)} />
                <span style={{ paddingLeft: r.type === "Button" ? 16 : 0, display: "flex", alignItems: "center", gap: 7, flex: 1 }}>
                  <Badge tone={r.type === "Button" ? "neutral" : r.type === "MenuDir" ? "blue" : "ok"} size="sm">{r.type}</Badge>
                  <span className="t-body" style={{ fontSize: 13 }}>{r.title}</span>
                  <span className="t-mono muted" style={{ fontSize: 11, marginLeft: "auto" }}>{r.permissionCode}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <div className="t-cap-strong" style={{ marginBottom: 8 }}>追加端点权限 extraPermissionCodes · GET /api/api-map/list</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {store.permView.map(pv => {
              const on = extra.includes(pv.permissionCode);
              return (
                <button key={pv.permissionCode} className="btn" onClick={() => toggleExtra(pv.permissionCode)}
                  style={{ padding: "6px 11px", borderRadius: 9999, fontSize: 12,
                    border: on ? "1.5px solid var(--blue)" : "1px solid var(--hairline)", background: on ? "var(--blue-wash)" : "#fff", color: on ? "var(--blue)" : "var(--ink-80)" }}>
                  <span className="t-mono" style={{ fontSize: 11.5 }}>{pv.permissionCode}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ background: "var(--parchment)", borderRadius: 12, padding: 14 }}>
          <div className="t-cap-strong" style={{ marginBottom: 8 }}>最终授权权限码（{derived.length}）</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {derived.length === 0 ? <span className="t-cap">尚未选择任何规则或端点权限</span> : derived.map(d => <span key={d} className="t-mono" style={{ fontSize: 11, padding: "3px 8px", background: "#fff", borderRadius: 6 }}>{d}</span>)}
          </div>
        </div>
      </div>
      <div style={{ padding: "16px 26px", borderTop: "1px solid var(--divider)", display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button className="btn btn-neutral" onClick={onClose}>取消</button>
        <button className="btn btn-primary" onClick={submit}>创建权限组</button>
      </div>
    </div>
  );
}

function GroupsPage({ ctx, setAction }) {
  const { store, intent } = ctx;
  const [kw, setKw] = useSG("");
  const [proj, setProj] = useSG(intent && intent.project ? intent.project : "all");
  const [sel, setSel] = useSG(null);
  const [creating, setCreating] = useSG(false);

  useEffG(() => {
    setAction(<button className="btn btn-primary" onClick={() => setCreating(true)}><Icon name="plus" size={16} /> 新建权限组</button>);
    return () => setAction(null);
  }, []);

  const rows = store.groups.filter(g => {
    if (proj !== "all" && g.project !== proj) return false;
    if (kw && !(g.groupName.includes(kw) || g.groupCode.toLowerCase().includes(kw.toLowerCase()))) return false;
    return true;
  });

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <SearchInput value={kw} onChange={setKw} placeholder="搜索组名或编码" width={240} />
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="filter" size={15} style={{ color: "var(--ink-48)" }} />
          <select value={proj} onChange={e => setProj(e.target.value)} style={{ height: 34, borderRadius: 9999, border: "1px solid var(--hairline)", background: "#fff", padding: "0 14px", fontSize: 13.5 }}>
            <option value="all">全部系统</option>
            {store.projects.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {rows.map(g => {
          const p = store.projects.find(x => x.code === g.project);
          return (
            <button key={g.groupCode} className="btn" onClick={() => setSel(g)}
              style={{ textAlign: "left", flexDirection: "column", alignItems: "stretch", gap: 14, padding: 20, borderRadius: 18, border: "1px solid var(--hairline)", background: "#fff" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "#cdcdd2"} onMouseLeave={e => e.currentTarget.style.borderColor = "var(--hairline)"}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <span style={{ width: 38, height: 38, borderRadius: 11, background: "var(--blue-wash)", color: "var(--blue)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="shield" size={20} /></span>
                <Badge tone={g.status === "Active" ? "ok" : "neutral"} dot size="sm">{g.status === "Active" ? "启用" : "禁用"}</Badge>
              </div>
              <div>
                <div className="t-body-strong" style={{ fontSize: 15.5 }}>{g.groupName}</div>
                <div className="t-cap" style={{ marginTop: 2 }}><span className="t-mono" style={{ fontSize: 11.5 }}>{g.groupCode}</span></div>
              </div>
              <hr className="hr" style={{ background: "var(--divider)" }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><ProjectGlyph code={g.project} name={p ? p.name : g.project} size={20} radius={5} /><span className="t-cap" style={{ fontWeight: 500 }}>{p ? p.name.replace(" Center","") : g.project}</span></span>
                <span className="t-cap"><b style={{ color: "var(--ink)" }}>{g.members}</b> 成员 · <b style={{ color: "var(--ink)" }}>{g.permissionCodes.length}</b> 权限码</span>
              </div>
            </button>
          );
        })}
      </div>
      {rows.length === 0 && <div className="card" style={{ padding: 50, textAlign: "center" }}><span className="t-cap">无匹配权限组</span></div>}

      <div className="t-cap" style={{ marginTop: 14 }}>显示 {rows.length} 个权限组 · 全局合计 {store.stats.groups} 个</div>

      <div style={{ marginTop: 22 }}>
        <ApiSource endpoints={[
          { m: "GET", p: "/api/global/group/list", d: "跨 project 权限组列表" },
          { m: "POST", p: "/api/group", d: "新建权限组（ruleCodes + extraPermissionCodes）" },
          { m: "PUT", p: "/api/group/{groupCode}/status", d: "启用 / 禁用" },
          { m: "POST", p: "/api/global/group/{groupCode}/members", d: "加入成员（body 含 targetProject）" },
          { m: "DELETE", p: "/api/global/group/{groupCode}/members/{userid}", d: "移除成员（query targetProject）" },
          { m: "GET", p: "/api/rule/tree", d: "规则授权选择器" },
        ]} note="组层级仅用于展示，实际访问由 permissionCodes 决定。组的新建/编辑为 per-project 接口；跨 project 组模板为建议的未来扩展。" />
      </div>

      <Drawer open={!!sel} onClose={() => setSel(null)} width={470}>{sel && <GroupDetail group={sel} ctx={ctx} onClose={() => setSel(null)} />}</Drawer>
      <Modal open={creating} onClose={() => setCreating(false)} width={620}>{creating && <CreateGroupModal ctx={ctx} onClose={() => setCreating(false)} />}</Modal>
    </div>
  );
}

window.GroupsPage = GroupsPage;
