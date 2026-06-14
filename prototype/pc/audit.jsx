/* ============================================================
   Audit & activity — runtime authZ decisions + permission view.
   APIs: GET /api/search/audit-logs, GET /api/search/permission-view
   ============================================================ */
const { useState: useSAu, useEffect: useEffAu } = React;

function AuditPage({ ctx }) {
  const { store, intent } = ctx;
  const [tab, setTab] = useSAu("logs");
  const [result, setResult] = useSAu("all");
  const [method, setMethod] = useSAu("all");
  const [kw, setKw] = useSAu("");

  const rows = store.audit.filter(a => {
    if (result !== "all" && a.result !== result) return false;
    if (method !== "all" && a.httpMethod !== method) return false;
    if (kw && !(a.username.includes(kw) || a.userid.toLowerCase().includes(kw.toLowerCase()) || a.permissionCode.toLowerCase().includes(kw.toLowerCase()))) return false;
    return true;
  });
  const counts = {
    Allow: store.audit.filter(a => a.result === "Allow").length,
    Deny: store.audit.filter(a => a.result === "Deny").length,
    Error: store.audit.filter(a => a.result === "Error").length,
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <Segmented value={tab} onChange={setTab} options={[{value:"logs",label:"鉴权日志"},{value:"perm",label:"权限视图"}]} />
        <div style={{ marginLeft: "auto" }} className="t-cap">只读查询 · 不产生写操作与 Outbox 事件</div>
      </div>

      {tab === "logs" ? (
        <React.Fragment>
          {/* honest scope callout */}
          <div style={{ display: "flex", gap: 11, alignItems: "flex-start", padding: "13px 16px", background: "var(--warn-wash)", border: "1px solid #ecdcb0", borderRadius: 12, marginBottom: 18 }}>
            <Icon name="spark" size={17} style={{ color: "var(--warn)", marginTop: 1 }} />
            <div className="t-cap" style={{ color: "#7a5500", lineHeight: 1.5 }}>
              本页记录的是<b>运行时鉴权结果</b>（Allow / Deny / Error），来自 GET /api/search/audit-logs。
              它<b>不是</b>授权变更历史（谁授予 / 撤销了什么）—— 写操作审计追踪为建议的未来 API 扩展。
            </div>
          </div>

          <div style={{ display: "flex", gap: 14, marginBottom: 18 }}>
            {[["通过","Allow","ok",counts.Allow],["拒绝","Deny","deny",counts.Deny],["异常","Error","warn",counts.Error]].map(([label,key,tone,val]) => (
              <button key={key} className="btn card" onClick={() => setResult(result === key ? "all" : key)}
                style={{ flex: 1, padding: "16px 20px", flexDirection: "column", alignItems: "flex-start", gap: 8,
                  borderColor: result === key ? `var(--${tone})` : "var(--hairline)", borderWidth: result === key ? 2 : 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
                  <Badge tone={tone} dot size="sm">{label}</Badge>
                  <Icon name="filter" size={13} style={{ marginLeft: "auto", color: result === key ? `var(--${tone})` : "var(--ink-48)" }} />
                </div>
                <div className="t-display" style={{ fontSize: 30 }}>{val}</div>
              </button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
            <SearchInput value={kw} onChange={setKw} placeholder="搜索用户或权限码" width={240} />
            <Segmented size="sm" value={result} onChange={setResult} options={[{value:"all",label:"全部"},{value:"Allow",label:"通过"},{value:"Deny",label:"拒绝"},{value:"Error",label:"异常"}]} />
            <select value={method} onChange={e => setMethod(e.target.value)} style={{ height: 34, borderRadius: 9999, border: "1px solid var(--hairline)", background: "#fff", padding: "0 14px", fontSize: 13.5 }}>
              <option value="all">全部方法</option>
              {["GET","POST","PUT","DELETE"].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <button className="btn btn-neutral btn-sm" style={{ marginLeft: "auto" }}><Icon name="dl" size={15} /> 导出</button>
          </div>

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1.6fr 2fr 1.6fr 0.9fr", padding: "12px 22px", background: "var(--pearl)", borderBottom: "1px solid var(--hairline)" }}>
              {["时间","用户","请求","权限码","结果"].map((h,i)=><span key={i} className="t-cap-strong" style={{ fontSize: 12 }}>{h}</span>)}
            </div>
            {rows.map((a, i) => {
              const tone = a.result === "Allow" ? "ok" : a.result === "Deny" ? "deny" : "warn";
              const label = a.result === "Allow" ? "通过" : a.result === "Deny" ? "拒绝" : "异常";
              return (
                <div key={a.auditId} style={{ display: "grid", gridTemplateColumns: "1.4fr 1.6fr 2fr 1.6fr 0.9fr", padding: "12px 22px", alignItems: "center", borderTop: i ? "1px solid var(--divider)" : "none" }}>
                  <div><div className="t-body" style={{ fontSize: 13 }}>{fmtTime(a.createdAt)}</div><div className="t-cap" style={{ fontSize: 11 }}>{timeAgo(a.createdAt)}</div></div>
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <Avatar name={a.username} size={28} />
                    <div><div className="t-body-strong" style={{ fontSize: 13 }}>{a.username}</div><div className="t-cap"><span className="t-mono" style={{ fontSize: 11 }}>{a.userid}</span> · {store.helpers.pname(a.project).replace(" Center","")}</div></div>
                  </div>
                  <div><span style={{ fontFamily: "SF Mono, ui-monospace, monospace", fontSize: 11, fontWeight: 700, color: METHOD_TONE[a.httpMethod] }}>{a.httpMethod}</span> <span className="t-mono" style={{ fontSize: 12 }}>{a.route}</span></div>
                  <div className="t-mono" style={{ fontSize: 12, color: a.permissionCode.startsWith("menu:") ? "var(--blue)" : a.permissionCode.startsWith("button:") ? "var(--super)" : "var(--ink-80)" }}>{a.permissionCode}</div>
                  <div><Badge tone={tone} dot size="sm">{label}</Badge></div>
                </div>
              );
            })}
            {rows.length === 0 && <div style={{ padding: 40, textAlign: "center" }} className="t-cap">无匹配日志</div>}
          </div>
          <div className="t-cap" style={{ marginTop: 12 }}>显示 {rows.length} 条 · 支持 userid / permissionCode / result / httpMethod / 时间范围过滤</div>

          <div style={{ marginTop: 22 }}>
            <ApiSource endpoints={[
              { m: "GET", p: "/api/search/audit-logs", d: "鉴权审计日志（userid / permissionCode / result / httpMethod / createdAtFrom~To）" },
            ]} note="返回字段：auditId、userid、project、permissionCode、result、reason、createdAt。" />
          </div>
        </React.Fragment>
      ) : (
        <React.Fragment>
          <div className="t-cap" style={{ marginBottom: 14 }}>API 到权限码的权限视图 · GET /api/search/permission-view</div>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 2fr", padding: "12px 22px", background: "var(--pearl)", borderBottom: "1px solid var(--hairline)" }}>
              {["权限码","动作","资源类型","标题"].map((h,i)=><span key={i} className="t-cap-strong" style={{ fontSize: 12 }}>{h}</span>)}
            </div>
            {store.permView.map((pv, i) => (
              <div key={pv.permissionCode} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 2fr", padding: "13px 22px", alignItems: "center", borderTop: i ? "1px solid var(--divider)" : "none" }}>
                <span className="t-mono" style={{ fontSize: 12.5, color: pv.permissionCode.startsWith("menu:") ? "var(--blue)" : pv.permissionCode.startsWith("button:") ? "var(--super)" : "var(--ink-80)" }}>{pv.permissionCode}</span>
                <span><Badge tone="neutral" size="sm">{pv.action}</Badge></span>
                <span className="t-body" style={{ fontSize: 13 }}>{pv.resourceType}</span>
                <span className="t-body" style={{ fontSize: 13 }}>{pv.title}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 22 }}>
            <ApiSource endpoints={[
              { m: "GET", p: "/api/search/permission-view", d: "权限视图（permissionCode / action / resourceType / keyword）" },
            ]} />
          </div>
        </React.Fragment>
      )}
    </div>
  );
}

window.AuditPage = AuditPage;
