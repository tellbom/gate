/* ============================================================
   Menu & route management — rule tree + API permission map.
   APIs: GET /api/global/menu/list, GET /api/rule/tree, GET /api/rule/list,
         PUT /api/rule/{ruleCode}/status, PUT /api/rule/{ruleCode}/weigh,
         GET /api/api-map/records, POST/PUT/DELETE /api/api-map
   ============================================================ */
const { useState: useSM, useEffect: useEffM } = React;

const TYPE_META = {
  MenuDir: { tone: "blue", label: "目录", icon: "folder" },
  Menu:    { tone: "ok", label: "菜单", icon: "menu" },
  Button:  { tone: "neutral", label: "按钮", icon: "spark" },
};

function RuleRow({ node, depth, ctx, project }) {
  const { actions } = ctx;
  const [open, setOpen] = useSM(true);
  const meta = TYPE_META[node.type] || TYPE_META.Menu;
  const hasChildren = node.children && node.children.length > 0;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 16px", paddingLeft: 16 + depth * 26,
        borderTop: "1px solid var(--divider)", background: node.status === "Disabled" ? "var(--pearl)" : "transparent" }}>
        <button className="btn" onClick={() => hasChildren && setOpen(o => !o)} style={{ width: 18, height: 18, padding: 0, opacity: hasChildren ? 1 : 0 }}>
          <Icon name="chevR" size={14} style={{ color: "var(--ink-48)", transform: open ? "rotate(90deg)" : "none", transition: "transform .15s" }} />
        </button>
        <span style={{ width: 30, height: 30, borderRadius: 8, background: meta.tone === "blue" ? "var(--blue-wash)" : meta.tone === "ok" ? "var(--ok-wash)" : "#f0f0f2",
          color: meta.tone === "blue" ? "var(--blue)" : meta.tone === "ok" ? "var(--ok)" : "var(--ink-60)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name={meta.icon} size={16} /></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="t-body-strong" style={{ fontSize: 14, color: node.status === "Disabled" ? "var(--ink-48)" : "var(--ink)" }}>{node.title}</span>
            <Badge tone={meta.tone} size="sm">{meta.label}</Badge>
          </div>
          <div className="t-cap" style={{ marginTop: 1, display: "flex", gap: 10 }}>
            <span className="t-mono" style={{ fontSize: 11.5 }}>{node.ruleCode}</span>
            {node.path && <span className="t-mono muted" style={{ fontSize: 11.5 }}>{node.path}</span>}
          </div>
        </div>
        <span className="t-mono" style={{ fontSize: 11, color: node.permissionCode.startsWith("menu:") ? "var(--blue)" : "var(--super)" }}>{node.permissionCode}</span>
        <span className="t-cap" style={{ width: 56, textAlign: "right" }}>权重 {node.weigh}</span>
        <Toggle on={node.status === "Active"} onChange={(v) => actions.setRuleStatus(project, node.ruleCode, v ? "Active" : "Disabled")} />
      </div>
      {hasChildren && open && node.children.map(c => <RuleRow key={c.ruleCode} node={c} depth={depth + 1} ctx={ctx} project={project} />)}
    </div>
  );
}

function ApiMapEditor({ rec, onSave, onClose }) {
  const [method, setMethod] = useSM(rec ? rec.httpMethod : "GET");
  const [route, setRoute] = useSM(rec ? rec.routePattern : "");
  const [perm, setPerm] = useSM(rec ? rec.permissionCode : "");
  const [action, setAction] = useSM(rec ? rec.action : "read");
  const editing = !!rec;
  return (
    <div style={{ padding: 26 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div><div className="t-title" style={{ fontSize: 20 }}>{editing ? "编辑 API 映射" : "新增 API 映射"}</div>
          <div className="t-cap" style={{ marginTop: 2 }}>{editing ? "PUT /api/api-map/{id} · 仅更新权限码与动作" : "POST /api/api-map"}</div></div>
        <button className="btn" onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, background: "var(--parchment)" }}><Icon name="x" size={17} /></button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 12 }}>
          <Field label="方法" as="select" value={method} onChange={setMethod}>
            {["GET","POST","PUT","DELETE","PATCH"].map(m => <option key={m} value={m} disabled={editing}>{m}</option>)}
          </Field>
          <Field label="路由模板 routePattern" value={route} onChange={setRoute} placeholder="/api/admin/{userid}" mono />
        </div>
        {editing && <div className="t-cap" style={{ marginTop: -6 }}>方法与路由不可改，需删除后重建</div>}
        <Field label="权限码 permissionCode" value={perm} onChange={setPerm} placeholder="menu:system.user" mono />
        <Field label="动作 action" as="select" value={action} onChange={setAction}>
          {["read","create","update","delete","execute","access"].map(a => <option key={a} value={a}>{a}</option>)}
        </Field>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
        <button className="btn btn-neutral" onClick={onClose}>取消</button>
        <button className="btn btn-primary" onClick={() => onSave({ httpMethod: method, routePattern: route, permissionCode: perm, action })}>保存</button>
      </div>
    </div>
  );
}

function MenusPage({ ctx, setAction }) {
  const { store, actions, intent } = ctx;
  const [tab, setTab] = useSM("tree");
  const [proj, setProj] = useSM(intent && intent.project ? intent.project : store.projects[0].code);
  const [kw, setKw] = useSM("");
  const [editing, setEditing] = useSM(null); // {rec} or {new:true}

  useEffM(() => {
    setAction(<Segmented value={tab} onChange={setTab} options={[{value:"tree",label:"规则树"},{value:"apimap",label:"API 映射"}]} />);
    return () => setAction(null);
  }, [tab]);

  const tree = store.ruleTree[proj] || [];
  const apiRows = store.apiMap.filter(r => !kw || r.routePattern.toLowerCase().includes(kw.toLowerCase()) || r.permissionCode.toLowerCase().includes(kw.toLowerCase()));

  return (
    <div>
      {tab === "tree" ? (
        <React.Fragment>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
            <div className="t-cap" style={{ marginRight: "auto" }}>规则树用于前端菜单构建与权限授权 · 跨系统查询经 GET /api/global/menu/list</div>
            <Icon name="filter" size={15} style={{ color: "var(--ink-48)" }} />
            <select value={proj} onChange={e => setProj(e.target.value)} style={{ height: 34, borderRadius: 9999, border: "1px solid var(--hairline)", background: "#fff", padding: "0 14px", fontSize: 13.5 }}>
              {store.projects.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
            </select>
          </div>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "14px 16px", background: "var(--pearl)" }}>
              <ProjectGlyph code={proj} name={(store.projects.find(p=>p.code===proj)||{}).name} size={30} />
              <div style={{ flex: 1 }}><div className="t-body-strong" style={{ fontSize: 14 }}>{(store.projects.find(p=>p.code===proj)||{}).name} 规则树</div></div>
              <span className="t-cap">GET /api/rule/tree</span>
            </div>
            {tree.length === 0 ? <div style={{ padding: 40, textAlign: "center" }} className="t-cap">该系统暂无规则</div>
              : tree.map(n => <RuleRow key={n.ruleCode} node={n} depth={0} ctx={ctx} project={proj} />)}
          </div>
          <div style={{ marginTop: 22 }}>
            <ApiSource endpoints={[
              { m: "GET", p: "/api/rule/tree", d: "完整菜单 / 按钮规则树" },
              { m: "GET", p: "/api/global/menu/list", d: "跨 project 规则查询" },
              { m: "PUT", p: "/api/rule/{ruleCode}/status", d: "启用 / 禁用规则" },
              { m: "PUT", p: "/api/rule/{ruleCode}/weigh", d: "调整排序权重" },
              { m: "POST", p: "/api/rule", d: "新建目录 / 菜单 / 按钮" },
              { m: "DELETE", p: "/api/rule/{ruleCode}", d: "删除规则" },
            ]} />
          </div>
        </React.Fragment>
      ) : (
        <React.Fragment>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
            <SearchInput value={kw} onChange={setKw} placeholder="搜索路由或权限码" width={260} />
            <div className="t-cap" style={{ marginLeft: "auto" }}>HTTP route → permissionCode / action 映射 · 变更触发缓存失效</div>
            <button className="btn btn-primary btn-sm" onClick={() => setEditing({ new: true })}><Icon name="plus" size={15} /> 新增映射</button>
          </div>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "80px 2.2fr 2fr 1fr 90px 70px", padding: "12px 22px", background: "var(--pearl)", borderBottom: "1px solid var(--hairline)" }}>
              {["方法","路由模板","权限码","动作","状态",""].map((h,i)=><span key={i} className="t-cap-strong" style={{ fontSize: 12 }}>{h}</span>)}
            </div>
            {apiRows.map((r, i) => (
              <div key={r.id} style={{ display: "grid", gridTemplateColumns: "80px 2.2fr 2fr 1fr 90px 70px", padding: "12px 22px", alignItems: "center", borderTop: i ? "1px solid var(--divider)" : "none" }}>
                <span style={{ fontFamily: "SF Mono, ui-monospace, monospace", fontSize: 11.5, fontWeight: 700, color: METHOD_TONE[r.httpMethod] }}>{r.httpMethod}</span>
                <span className="t-mono" style={{ fontSize: 12.5 }}>{r.routePattern}</span>
                <span className="t-mono" style={{ fontSize: 12, color: r.permissionCode.startsWith("menu:") ? "var(--blue)" : r.permissionCode.startsWith("button:") ? "var(--super)" : "var(--ink-80)" }}>{r.permissionCode}</span>
                <span><Badge tone="neutral" size="sm">{r.action}</Badge></span>
                <span><Badge tone={r.status === "Active" ? "ok" : "neutral"} dot size="sm">{r.status === "Active" ? "启用" : "禁用"}</Badge></span>
                <span style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                  <button className="btn" onClick={() => setEditing({ rec: r })} style={{ width: 28, height: 28, borderRadius: 7, background: "var(--parchment)", color: "var(--ink-60)" }}><Icon name="edit" size={14} /></button>
                  <button className="btn" onClick={() => actions.deleteApiMap(r.id)} style={{ width: 28, height: 28, borderRadius: 7, background: "var(--deny-wash)", color: "var(--deny)" }}><Icon name="trash" size={14} /></button>
                </span>
              </div>
            ))}
            {apiRows.length === 0 && <div style={{ padding: 40, textAlign: "center" }} className="t-cap">无匹配记录</div>}
          </div>
          <div className="t-cap" style={{ marginTop: 12 }}>共 {apiRows.length} 条映射记录 · 数据源为 MySQL 真相表（GET /api/api-map/records）</div>
          <div style={{ marginTop: 22 }}>
            <ApiSource endpoints={[
              { m: "GET", p: "/api/api-map/records", d: "完整映射记录（含 id，可编辑）" },
              { m: "POST", p: "/api/api-map", d: "新增映射 → Outbox 触发缓存失效" },
              { m: "PUT", p: "/api/api-map/{id}", d: "更新权限码 / 动作" },
              { m: "DELETE", p: "/api/api-map/{id}", d: "删除映射" },
              { m: "GET", p: "/api/api-map/list", d: "ES 权限视图（只读展示）" },
            ]} />
          </div>
        </React.Fragment>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} width={500}>
        {editing && <ApiMapEditor rec={editing.rec}
          onClose={() => setEditing(null)}
          onSave={(data) => { editing.rec ? actions.updateApiMap(editing.rec.id, { permissionCode: data.permissionCode, action: data.action }) : actions.addApiMap(data); setEditing(null); }} />}
      </Modal>
    </div>
  );
}

window.MenusPage = MenusPage;
