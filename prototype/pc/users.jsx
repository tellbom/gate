/* ============================================================
   User management — cross-project admin accounts.
   APIs: GET /api/global/user/list, PUT /api/global/user/{userid}/status,
         POST /api/global/user/{userid}/project-grants (+ per-project grant)
   ============================================================ */
const { useState: useSU, useEffect: useEffU } = React;

function ProjectChips({ codes, projects, max = 3 }) {
  const shown = codes.slice(0, max);
  const rest = codes.length - shown.length;
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
      {shown.map(c => {
        const p = projects.find(x => x.code === c);
        return <span key={c} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px 3px 6px",
          background: "#f3f3f5", borderRadius: 7, fontSize: 12 }}>
          <ProjectGlyph code={c} name={p ? p.name : c} size={16} radius={4} />
          <span style={{ fontWeight: 500 }}>{p ? p.name.replace(" Center","") : c}</span>
        </span>;
      })}
      {rest > 0 && <span className="t-cap" style={{ fontWeight: 600 }}>+{rest}</span>}
      {codes.length === 0 && <span className="t-cap">—</span>}
    </div>
  );
}

function UserDetail({ user, ctx, onClose, onAuthorize }) {
  const { store, actions } = ctx;
  const u = store.users.find(x => x.userid === user.userid) || user;
  const userAudit = store.audit.filter(a => a.userid === u.userid).slice(0, 5);
  const [confirm, setConfirm] = useSU(null);

  return (
    <React.Fragment>
      <div style={{ padding: "22px 24px 18px", borderBottom: "1px solid var(--divider)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <span className="t-cap-strong">用户详情</span>
          <button className="btn" onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, background: "var(--parchment)" }}><Icon name="x" size={17} /></button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Avatar name={u.username} size={52} dim={u.status === "Disabled"} />
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <span className="t-title" style={{ fontSize: 22 }}>{u.username}</span>
              {u.isSuper && <Badge tone="super" dot size="sm">全局超管</Badge>}
            </div>
            <div className="t-cap" style={{ marginTop: 2 }}><span className="t-mono">{u.userid}</span></div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
        {/* status */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px",
          background: "var(--parchment)", borderRadius: 12, marginBottom: 22 }}>
          <div>
            <div className="t-body-strong" style={{ fontSize: 14 }}>账号状态</div>
            <div className="t-cap" style={{ marginTop: 2 }}>全局启用 / 禁用 · rbac_administrator 单次写入</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Badge tone={u.status === "Active" ? "ok" : "neutral"} dot>{u.status === "Active" ? "已启用" : "已禁用"}</Badge>
            <Toggle on={u.status === "Active"} onChange={(v) => actions.setUserStatus(u.userid, v ? "Active" : "Disabled")} />
          </div>
        </div>

        {/* project grants */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <span className="t-section">项目授权</span>
          <button className="btn btn-text" onClick={() => onAuthorize(u)}><Icon name="plus" size={14} /> 新增授权</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
          {u.projectCodes.length === 0 && <div className="t-cap" style={{ padding: "8px 0" }}>暂无项目授权</div>}
          {u.projectCodes.map(pc => {
            const p = store.projects.find(x => x.code === pc);
            const isSup = u.superProjects.includes(pc);
            return (
              <div key={pc} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", border: "1px solid var(--hairline)", borderRadius: 12 }}>
                <ProjectGlyph code={pc} name={p ? p.name : pc} size={34} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="t-body-strong" style={{ fontSize: 14 }}>{p ? p.name : pc}</div>
                  <div className="t-cap"><span className="t-mono">{pc}</span></div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span className="t-cap" style={{ color: isSup ? "var(--super)" : "var(--ink-48)", fontWeight: isSup ? 600 : 400 }}>超管</span>
                  <Toggle tone="super" on={isSup} onChange={(v) => setConfirm({ pc, p, val: v })} />
                </div>
                <button className="btn" title="撤销授权" onClick={() => actions.revokeGrant(u.userid, pc)}
                  style={{ width: 30, height: 30, borderRadius: 8, color: "var(--deny)", background: "var(--deny-wash)" }}><Icon name="trash" size={15} /></button>
              </div>
            );
          })}
        </div>

        {/* groups */}
        <div className="t-section" style={{ marginBottom: 12 }}>权限组</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
          {u.groupNames.length === 0 && <div className="t-cap">未加入任何权限组</div>}
          {u.groupNames.map((gn, i) => (
            <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "var(--blue-wash)", color: "var(--blue)", borderRadius: 9999, fontSize: 13, fontWeight: 500 }}>
              <Icon name="shield" size={13} /> {gn}
            </span>
          ))}
        </div>

        {/* recent activity */}
        <div className="t-section" style={{ marginBottom: 6 }}>近期鉴权</div>
        <div className="t-cap" style={{ marginBottom: 8 }}>GET /api/search/audit-logs?userid={u.userid}</div>
        <div>
          {userAudit.map(a => {
            const tone = a.result === "Allow" ? "ok" : a.result === "Deny" ? "deny" : "warn";
            return (
              <div key={a.auditId} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderTop: "1px solid var(--divider)" }}>
                <Badge tone={tone} dot size="sm">{a.result === "Allow" ? "通过" : a.result === "Deny" ? "拒绝" : "异常"}</Badge>
                <span className="t-mono" style={{ flex: 1, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.permissionCode}</span>
                <span className="t-cap" style={{ fontSize: 11.5 }}>{timeAgo(a.createdAt)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {confirm && (
        <Modal open onClose={() => setConfirm(null)} width={440}>
          <SuperConfirm u={u} project={confirm.p} pc={confirm.pc} val={confirm.val}
            onCancel={() => setConfirm(null)}
            onConfirm={() => { actions.setSuper(u.userid, confirm.pc, confirm.val); setConfirm(null); }} />
        </Modal>
      )}
    </React.Fragment>
  );
}

/* Super-admin confirm summary (medium ceremony) — reused */
function SuperConfirm({ u, project, pc, val, onConfirm, onCancel }) {
  return (
    <div style={{ padding: 26 }}>
      <div style={{ width: 46, height: 46, borderRadius: 12, background: val ? "var(--super-wash)" : "var(--warn-wash)",
        color: val ? "var(--super)" : "var(--warn)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
        <Icon name="star" size={24} fill={val} />
      </div>
      <div className="t-title" style={{ fontSize: 21, marginBottom: 8 }}>{val ? "提升为项目超管？" : "降级为普通管理员？"}</div>
      <div className="t-body" style={{ color: "var(--ink-60)", marginBottom: 18 }}>
        请确认以下变更。该操作通过 <span className="t-mono" style={{ fontSize: 13 }}>PUT /api/project-grant/{"{userid}"}/super</span> 在目标 project 上下文中执行。
      </div>
      <div style={{ background: "var(--parchment)", borderRadius: 12, padding: 16, marginBottom: 20, display: "flex", flexDirection: "column", gap: 12 }}>
        {[["用户", `${u.username} · ${u.userid}`], ["目标系统", `${project ? project.name : pc}`], ["变更", val ? "普通管理员 → 超级管理员" : "超级管理员 → 普通管理员"], ["影响范围", `仅 ${pc} 内的全部菜单与按钮权限`]].map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
            <span className="t-cap-strong">{k}</span>
            <span className="t-body" style={{ fontSize: 13.5, textAlign: "right", fontWeight: 500 }}>{v}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button className="btn btn-neutral" onClick={onCancel}>取消</button>
        <button className="btn" onClick={onConfirm} style={{ background: val ? "var(--super)" : "var(--warn)", color: "#fff", borderRadius: 9999, padding: "9px 20px" }}>
          {val ? "确认提升" : "确认降级"}
        </button>
      </div>
    </div>
  );
}

function UsersPage({ ctx, setAction }) {
  const { store, go, setIntent } = ctx;
  const [kw, setKw] = useSU("");
  const [proj, setProj] = useSU("all");
  const [status, setStatus] = useSU("all");
  const [sel, setSel] = useSU(null);

  useEffU(() => {
    setAction(<button className="btn btn-primary" onClick={() => { setIntent({ type: "grant" }); go("authorization"); }}><Icon name="plus" size={16} /> 授权用户</button>);
    return () => setAction(null);
  }, [store]);

  const rows = store.users.filter(u => {
    if (proj !== "all" && !u.projectCodes.includes(proj)) return false;
    if (status !== "all" && u.status !== (status === "active" ? "Active" : "Disabled")) return false;
    if (kw && !(u.username.includes(kw) || u.userid.toLowerCase().includes(kw.toLowerCase()))) return false;
    return true;
  });

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <SearchInput value={kw} onChange={setKw} placeholder="搜索姓名或 userid" width={240} />
        <Segmented size="sm" value={status} onChange={setStatus} options={[{value:"all",label:"全部"},{value:"active",label:"启用"},{value:"disabled",label:"禁用"}]} />
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="filter" size={15} style={{ color: "var(--ink-48)" }} />
          <select value={proj} onChange={e => setProj(e.target.value)}
            style={{ height: 34, borderRadius: 9999, border: "1px solid var(--hairline)", background: "#fff", padding: "0 14px", fontSize: 13.5, color: "var(--ink)" }}>
            <option value="all">全部系统</option>
            {store.projects.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
          </select>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 2.4fr 1.4fr 1fr 80px", padding: "12px 22px", borderBottom: "1px solid var(--hairline)", background: "var(--pearl)" }}>
          {["用户", "状态", "所属系统", "权限组", "超管", ""].map((h, i) => <span key={i} className="t-cap-strong" style={{ fontSize: 12 }}>{h}</span>)}
        </div>
        {rows.map((u, i) => (
          <div key={u.userid} onClick={() => setSel(u)}
            style={{ display: "grid", gridTemplateColumns: "2fr 1fr 2.4fr 1.4fr 1fr 80px", padding: "13px 22px", alignItems: "center",
              borderTop: i ? "1px solid var(--divider)" : "none", cursor: "pointer", transition: "background .12s" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--pearl)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <Avatar name={u.username} size={34} dim={u.status === "Disabled"} />
              <div>
                <div className="t-body-strong" style={{ fontSize: 14 }}>{u.username}</div>
                <div className="t-cap"><span className="t-mono" style={{ fontSize: 11.5 }}>{u.userid}</span></div>
              </div>
            </div>
            <div><Badge tone={u.status === "Active" ? "ok" : "neutral"} dot size="sm">{u.status === "Active" ? "启用" : "禁用"}</Badge></div>
            <div><ProjectChips codes={u.projectCodes} projects={store.projects} /></div>
            <div className="t-body" style={{ fontSize: 13.5 }}>{u.groupCodes.length > 0 ? `${u.groupCodes.length} 个组` : <span className="muted">—</span>}</div>
            <div>{u.superProjects.length > 0 ? <Badge tone="super" size="sm" dot>{u.superProjects.length}</Badge> : <span className="muted t-cap">—</span>}</div>
            <div style={{ textAlign: "right" }}><Icon name="chevR" size={16} style={{ color: "var(--ink-48)" }} /></div>
          </div>
        ))}
        {rows.length === 0 && <div style={{ padding: 50, textAlign: "center" }} className="t-cap">无匹配用户</div>}
      </div>

      <div className="t-cap" style={{ marginTop: 14, display: "flex", justifyContent: "space-between" }}>
        <span>显示 {rows.length} / 共 {fmt(store.stats.users)} 个管理员账号（演示数据为前 14 条）</span>
        <span>跨 project 去重统计</span>
      </div>

      <div style={{ marginTop: 22 }}>
        <ApiSource endpoints={[
          { m: "GET", p: "/api/global/user/list", d: "跨 project 用户列表（project / keyword / status / groupCode 过滤）" },
          { m: "PUT", p: "/api/global/user/{userid}/status", d: "全局启用 / 禁用账号" },
          { m: "POST", p: "/api/global/user/{userid}/project-grants", d: "新增项目授权（详情抽屉 → 授权页）" },
          { m: "DELETE", p: "/api/global/user/{userid}/project-grants/{project}", d: "撤销项目授权" },
          { m: "PUT", p: "/api/project-grant/{userid}/super", d: "切换超管标记（目标 project 上下文）" },
        ]} note="用户详情聚合了 user/list 返回的 projectCodes、groupNames、superProjects 字段，无需额外接口。" />
      </div>

      <Drawer open={!!sel} onClose={() => setSel(null)} width={470}>
        {sel && <UserDetail user={sel} ctx={ctx} onClose={() => setSel(null)} onAuthorize={(u) => { setSel(null); setIntent({ type: "grant", userid: u.userid }); go("authorization"); }} />}
      </Drawer>
    </div>
  );
}

window.UsersPage = UsersPage;
window.SuperConfirm = SuperConfirm;
window.ProjectChips = ProjectChips;
