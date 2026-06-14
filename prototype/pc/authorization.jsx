/* ============================================================
   Project authorization — user-centric ↔ project-centric.
   APIs: POST /api/global/user/{userid}/project-grants,
         DELETE /api/global/user/{userid}/project-grants/{project},
         PUT /api/project-grant/{userid}/super, GET /api/global/user/list,
         GET /api/global/project/list
   ============================================================ */
const { useState: useSA, useEffect: useEffA } = React;

/* ---- per-project best-effort result report (matches doc shape) ---- */
function ResultReport({ results, onClose }) {
  const ok = results.filter(r => r.success && !r.skipped).length;
  const sk = results.filter(r => r.skipped).length;
  const fail = results.filter(r => !r.success).length;
  return (
    <div style={{ padding: 26 }}>
      <div style={{ width: 46, height: 46, borderRadius: 12, background: fail ? "var(--warn-wash)" : "var(--ok-wash)",
        color: fail ? "var(--warn)" : "var(--ok)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
        <Icon name="check" size={24} stroke={2.4} />
      </div>
      <div className="t-title" style={{ fontSize: 21, marginBottom: 6 }}>授权完成</div>
      <div className="t-body" style={{ color: "var(--ink-60)", marginBottom: 18 }}>
        逐 project 写入结果（best-effort 语义，单个失败不回滚其余）。成功 {ok} · 跳过 {sk} · 失败 {fail}。
      </div>
      <div style={{ border: "1px solid var(--hairline)", borderRadius: 12, overflow: "hidden", marginBottom: 20 }}>
        {results.map((r, i) => (
          <div key={r.project} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderTop: i ? "1px solid var(--divider)" : "none" }}>
            <ProjectGlyph code={r.project} name={r.name} size={30} />
            <div style={{ flex: 1 }}>
              <div className="t-body-strong" style={{ fontSize: 13.5 }}>{r.name}</div>
              <div className="t-cap"><span className="t-mono">{r.project}</span></div>
            </div>
            {r.skipped ? <Badge tone="neutral" size="sm">已存在 · skipped</Badge>
              : r.success ? <Badge tone="ok" dot size="sm">success</Badge>
              : <Badge tone="deny" dot size="sm">failed</Badge>}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button className="btn btn-primary" onClick={onClose}>完成</button>
      </div>
    </div>
  );
}

/* ---- user-centric grant workspace ---- */
function UserGrant({ ctx, user }) {
  const { store, actions } = ctx;
  const u = store.users.find(x => x.userid === user.userid) || user;
  const [picked, setPicked] = useSA([]);
  const [asSuper, setAsSuper] = useSA(false);
  const [report, setReport] = useSA(null);
  const [superConfirm, setSuperConfirm] = useSA(null);

  const available = store.projects.filter(p => !u.projectCodes.includes(p.code));
  const toggle = (code) => setPicked(p => p.includes(code) ? p.filter(c => c !== code) : [...p, code]);

  const doGrant = () => {
    const results = picked.map(pc => {
      const p = store.projects.find(x => x.code === pc);
      return { project: pc, name: p.name, success: true, skipped: false };
    });
    actions.grantProjects(u.userid, u.username, picked, asSuper);
    setReport(results); setPicked([]); setAsSuper(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      {/* current grants */}
      <div className="card" style={{ padding: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 18 }}>
          <Avatar name={u.username} size={46} dim={u.status === "Disabled"} />
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <span className="t-title" style={{ fontSize: 21 }}>{u.username}</span>
              {u.status === "Disabled" && <Badge tone="neutral" size="sm">已禁用</Badge>}
              {u.isSuper && <Badge tone="super" dot size="sm">全局超管</Badge>}
            </div>
            <div className="t-cap" style={{ marginTop: 2 }}><span className="t-mono">{u.userid}</span> · 已授权 {u.projectCodes.length} 个系统</div>
          </div>
        </div>
        <div className="t-cap-strong" style={{ marginBottom: 10 }}>当前授权</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {u.projectCodes.length === 0 && <div className="t-cap" style={{ padding: "6px 0" }}>该用户暂无任何项目授权</div>}
          {u.projectCodes.map(pc => {
            const p = store.projects.find(x => x.code === pc);
            const isSup = u.superProjects.includes(pc);
            return (
              <div key={pc} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", border: "1px solid var(--hairline)", borderRadius: 12 }}>
                <ProjectGlyph code={pc} name={p.name} size={32} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="t-body-strong" style={{ fontSize: 14 }}>{p.name}</div>
                  <div className="t-cap"><span className="t-mono">{pc}</span></div>
                </div>
                {isSup && <Badge tone="super" dot size="sm">超管</Badge>}
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span className="t-cap" style={{ color: isSup ? "var(--super)" : "var(--ink-48)" }}>超管</span>
                  <Toggle tone="super" on={isSup} onChange={(v) => setSuperConfirm({ pc, p, val: v })} />
                </div>
                <button className="btn" onClick={() => actions.revokeGrant(u.userid, pc)} title="撤销"
                  style={{ width: 30, height: 30, borderRadius: 8, color: "var(--deny)", background: "var(--deny-wash)" }}><Icon name="trash" size={15} /></button>
              </div>
            );
          })}
        </div>
      </div>

      {/* new grant */}
      <div className="card" style={{ padding: 22 }}>
        <div className="t-section" style={{ marginBottom: 4 }}>新增项目授权</div>
        <div className="t-cap" style={{ marginBottom: 16 }}>选择一个或多个系统，一次性提交 · POST /api/global/user/{"{userid}"}/project-grants</div>
        {available.length === 0 ? <div className="t-cap">已授权全部系统</div> : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 18 }}>
            {available.map(p => {
              const on = picked.includes(p.code);
              return (
                <button key={p.code} className="btn" onClick={() => toggle(p.code)}
                  style={{ justifyContent: "flex-start", gap: 11, padding: "12px 14px", borderRadius: 12,
                    border: on ? "2px solid var(--blue)" : "1px solid var(--hairline)", background: on ? "var(--blue-wash)" : "#fff" }}>
                  <ProjectGlyph code={p.code} name={p.name} size={30} />
                  <div style={{ textAlign: "left", flex: 1, minWidth: 0 }}>
                    <div className="t-body-strong" style={{ fontSize: 13.5 }}>{p.name}</div>
                    <div className="t-cap" style={{ fontSize: 11.5 }}><span className="t-mono">{p.code}</span></div>
                  </div>
                  {on && <Icon name="check" size={16} stroke={2.6} style={{ color: "var(--blue)" }} />}
                </button>
              );
            })}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "space-between", flexWrap: "wrap" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <Toggle tone="super" on={asSuper} onChange={setAsSuper} />
            <div>
              <div className="t-body-strong" style={{ fontSize: 13.5 }}>同时授予超管</div>
              <div className="t-cap">对所选系统赋予全部权限（isSuper = true）</div>
            </div>
          </label>
          <button className="btn btn-primary" disabled={picked.length === 0} onClick={doGrant}>
            <Icon name="key" size={15} /> 授权到 {picked.length || ""} 个系统
          </button>
        </div>
      </div>

      {report && <Modal open onClose={() => setReport(null)} width={460}><ResultReport results={report} onClose={() => setReport(null)} /></Modal>}
      {superConfirm && <Modal open onClose={() => setSuperConfirm(null)} width={440}>
        <SuperConfirm u={u} project={superConfirm.p} pc={superConfirm.pc} val={superConfirm.val}
          onCancel={() => setSuperConfirm(null)}
          onConfirm={() => { actions.setSuper(u.userid, superConfirm.pc, superConfirm.val); setSuperConfirm(null); }} />
      </Modal>}
    </div>
  );
}

/* ---- project-centric member workspace ---- */
function ProjectGrantPanel({ ctx, project }) {
  const { store, actions } = ctx;
  const members = store.users.filter(u => u.projectCodes.includes(project.code));
  const candidates = store.users.filter(u => !u.projectCodes.includes(project.code));
  const [adding, setAdding] = useSA(false);
  const [kw, setKw] = useSA("");
  const [superConfirm, setSuperConfirm] = useSA(null);
  const filtered = candidates.filter(u => u.username.includes(kw) || u.userid.toLowerCase().includes(kw.toLowerCase()));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div className="card" style={{ padding: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
          <ProjectGlyph code={project.code} name={project.name} size={46} radius={12} />
          <div style={{ flex: 1 }}>
            <div className="t-title" style={{ fontSize: 21 }}>{project.name}</div>
            <div className="t-cap" style={{ marginTop: 2 }}>{project.cn} · <span className="t-mono">{project.code}</span> · {members.length} 位已授权用户</div>
          </div>
          <button className="btn btn-primary" onClick={() => setAdding(true)}><Icon name="plus" size={15} /> 添加用户</button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 90px", padding: "12px 22px", background: "var(--pearl)", borderBottom: "1px solid var(--hairline)" }}>
          {["用户", "权限组", "超管", ""].map((h,i) => <span key={i} className="t-cap-strong" style={{ fontSize: 12 }}>{h}</span>)}
        </div>
        {members.map((u, i) => {
          const isSup = u.superProjects.includes(project.code);
          const grant = u.grants[project.code] || {};
          const gnames = (grant.groups || []).map(gc => (store.groups.find(g => g.groupCode === gc) || {}).groupName || gc);
          return (
            <div key={u.userid} style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 90px", padding: "13px 22px", alignItems: "center", borderTop: i ? "1px solid var(--divider)" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                <Avatar name={u.username} size={32} dim={u.status === "Disabled"} />
                <div><div className="t-body-strong" style={{ fontSize: 14 }}>{u.username}</div><div className="t-cap"><span className="t-mono" style={{ fontSize: 11.5 }}>{u.userid}</span></div></div>
              </div>
              <div className="t-body" style={{ fontSize: 13 }}>{gnames.length ? gnames.join("、") : <span className="muted">—</span>}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <Toggle tone="super" on={isSup} onChange={(v) => setSuperConfirm({ u, val: v })} />
              </div>
              <div style={{ textAlign: "right" }}>
                <button className="btn" onClick={() => actions.revokeGrant(u.userid, project.code)} title="撤销授权"
                  style={{ width: 30, height: 30, borderRadius: 8, color: "var(--deny)", background: "var(--deny-wash)" }}><Icon name="trash" size={15} /></button>
              </div>
            </div>
          );
        })}
        {members.length === 0 && <div style={{ padding: 40, textAlign: "center" }} className="t-cap">暂无授权用户</div>}
      </div>

      <Drawer open={adding} onClose={() => setAdding(false)} width={420}>
        <div style={{ padding: "22px 24px 16px", borderBottom: "1px solid var(--divider)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span className="t-section">添加用户到 {project.name}</span>
            <button className="btn" onClick={() => setAdding(false)} style={{ width: 30, height: 30, borderRadius: 8, background: "var(--parchment)" }}><Icon name="x" size={16} /></button>
          </div>
          <SearchInput value={kw} onChange={setKw} placeholder="搜索用户" width="100%" />
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 16px" }}>
          {filtered.map(u => (
            <div key={u.userid} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 8px", borderBottom: "1px solid var(--divider)" }}>
              <Avatar name={u.username} size={32} />
              <div style={{ flex: 1 }}><div className="t-body-strong" style={{ fontSize: 13.5 }}>{u.username}</div><div className="t-cap"><span className="t-mono" style={{ fontSize: 11 }}>{u.userid}</span></div></div>
              <button className="btn btn-ghost btn-sm" onClick={() => { actions.grantProjects(u.userid, u.username, [project.code], false); ctx.toast.push(`已授权 ${u.username}`); }}>授权</button>
            </div>
          ))}
          {filtered.length === 0 && <div style={{ padding: 30, textAlign: "center" }} className="t-cap">无匹配用户</div>}
        </div>
      </Drawer>

      {superConfirm && <Modal open onClose={() => setSuperConfirm(null)} width={440}>
        <SuperConfirm u={superConfirm.u} project={project} pc={project.code} val={superConfirm.val}
          onCancel={() => setSuperConfirm(null)}
          onConfirm={() => { actions.setSuper(superConfirm.u.userid, project.code, superConfirm.val); setSuperConfirm(null); }} />
      </Modal>}
    </div>
  );
}

function AuthorizationPage({ ctx, setAction }) {
  const { store, intent } = ctx;
  const [mode, setMode] = useSA(intent && intent.project ? "project" : "user");
  const [userId, setUserId] = useSA((intent && intent.userid) || store.users[0].userid);
  const [projCode, setProjCode] = useSA((intent && intent.project) || store.projects[0].code);
  const [kw, setKw] = useSA("");

  useEffA(() => {
    setAction(<Segmented value={mode} onChange={setMode} options={[{value:"user",label:"按用户授权"},{value:"project",label:"按系统授权"}]} />);
    return () => setAction(null);
  }, [mode]);

  const user = store.users.find(u => u.userid === userId) || store.users[0];
  const project = store.projects.find(p => p.code === projCode) || store.projects[0];
  const userList = store.users.filter(u => u.username.includes(kw) || u.userid.toLowerCase().includes(kw.toLowerCase()));

  return (
    <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20, alignItems: "start" }}>
      {/* selector rail */}
      <div className="card" style={{ padding: 0, overflow: "hidden", position: "sticky", top: 20 }}>
        <div style={{ padding: 14, borderBottom: "1px solid var(--divider)" }}>
          {mode === "user"
            ? <SearchInput value={kw} onChange={setKw} placeholder="搜索用户" width="100%" />
            : <div className="t-cap-strong" style={{ padding: "4px 2px" }}>选择系统</div>}
        </div>
        <div style={{ maxHeight: "calc(100vh - 200px)", overflowY: "auto" }}>
          {mode === "user" ? userList.map(u => {
            const on = u.userid === userId;
            return (
              <button key={u.userid} className="btn" onClick={() => setUserId(u.userid)}
                style={{ width: "100%", justifyContent: "flex-start", gap: 11, padding: "11px 14px", borderRadius: 0,
                  background: on ? "var(--blue-wash)" : "transparent", borderBottom: "1px solid var(--divider)" }}>
                <Avatar name={u.username} size={30} dim={u.status === "Disabled"} />
                <div style={{ textAlign: "left", flex: 1, minWidth: 0 }}>
                  <div className="t-body-strong" style={{ fontSize: 13.5, color: on ? "var(--blue)" : "var(--ink)" }}>{u.username}</div>
                  <div className="t-cap" style={{ fontSize: 11.5 }}>{u.projectCodes.length} 系统 · {u.superProjects.length} 超管</div>
                </div>
              </button>
            );
          }) : store.projects.map(p => {
            const on = p.code === projCode;
            return (
              <button key={p.code} className="btn" onClick={() => setProjCode(p.code)}
                style={{ width: "100%", justifyContent: "flex-start", gap: 11, padding: "12px 14px", borderRadius: 0,
                  background: on ? "var(--blue-wash)" : "transparent", borderBottom: "1px solid var(--divider)" }}>
                <ProjectGlyph code={p.code} name={p.name} size={32} />
                <div style={{ textAlign: "left", flex: 1, minWidth: 0 }}>
                  <div className="t-body-strong" style={{ fontSize: 13.5, color: on ? "var(--blue)" : "var(--ink)" }}>{p.name}</div>
                  <div className="t-cap" style={{ fontSize: 11.5 }}>{p.users} 用户 · {p.supers} 超管</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        {mode === "user" ? <UserGrant ctx={ctx} user={user} /> : <ProjectGrantPanel ctx={ctx} project={project} />}
        <div style={{ marginTop: 22 }}>
          <ApiSource endpoints={[
            { m: "POST", p: "/api/global/user/{userid}/project-grants", d: "授权到多个 project（body 含 targetProjects、isSuper、username）" },
            { m: "DELETE", p: "/api/global/user/{userid}/project-grants/{project}", d: "撤销单个 project 授权（幂等）" },
            { m: "PUT", p: "/api/project-grant/{userid}/super", d: "切换已有授权的超管标记" },
            { m: "GET", p: "/api/global/user/list", d: "按系统筛选已授权用户" },
            { m: "GET", p: "/api/global/project/list", d: "可选目标系统" },
          ]} note="按用户与按系统两种视图共用同一组写接口，仅入口与聚合方向不同。超管切换需进入目标 project 上下文（建议未来提供全局超管切换接口）。" />
        </div>
      </div>
    </div>
  );
}

window.AuthorizationPage = AuthorizationPage;
window.ResultReport = ResultReport;
