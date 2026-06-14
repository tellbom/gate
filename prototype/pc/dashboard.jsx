/* ============================================================
   Dashboard — three switchable directions (compare → commit).
   ============================================================ */
const { useState: useStateD } = React;

function StatTile({ icon, label, value, sub, accent }) {
  return (
    <div className="card" style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14, flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span className="t-cap-strong">{label}</span>
        <span style={{ color: accent || "var(--ink-48)", display: "flex" }}><Icon name={icon} size={18} /></span>
      </div>
      <div>
        <div className="t-display" style={{ fontSize: 38, lineHeight: 1 }}>{value}</div>
        {sub && <div className="t-cap" style={{ marginTop: 8 }}>{sub}</div>}
      </div>
    </div>
  );
}

function ActivityRow({ a, compact }) {
  const tone = a.result === "Allow" ? "ok" : a.result === "Deny" ? "deny" : "warn";
  const label = a.result === "Allow" ? "通过" : a.result === "Deny" ? "拒绝" : "异常";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: compact ? "9px 0" : "12px 0" }}>
      <Avatar name={a.username} size={30} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span className="t-body-strong" style={{ fontSize: 13.5 }}>{a.username}</span>
          <span className="t-cap" style={{ fontSize: 12 }}>{a.userid}</span>
        </div>
        <div className="t-cap" style={{ marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          <span style={{ fontWeight: 600, color: "var(--ink-60)" }}>{a.httpMethod}</span> {a.route}
        </div>
      </div>
      <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
        <Badge tone={tone} dot size="sm">{label}</Badge>
        <span className="t-cap" style={{ fontSize: 11.5 }}>{timeAgo(a.createdAt)}</span>
      </div>
    </div>
  );
}

/* ---------------- Direction 1: Metrics view ---------------- */
function DashMetrics({ data, go, scenario }) {
  const { stats: STATS, projects: PROJECTS, audit: AUDIT } = data;
  const denies = AUDIT.filter(a => a.result !== "Allow").length;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div style={{ display: "flex", gap: 16 }}>
        <StatTile icon="building" label="接入系统" value={STATS.systems} sub="全部业务 project" accent="var(--blue)" />
        <StatTile icon="users" label="管理员账号" value={fmt(STATS.users)} sub="跨 project 去重" accent="var(--ok)" />
        <StatTile icon="key" label="权限组" value={STATS.groups} sub="全部 project 合计" accent="var(--super)" />
        <StatTile icon="menu" label="菜单与路由" value={fmt(STATS.menus)} sub="含按钮级规则" accent="var(--warn)" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 16, alignItems: "start" }}>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px 14px" }}>
            <span className="t-section">系统总览</span>
            <button className="btn btn-text" onClick={() => go("authorization")}>授权管理 <Icon name="arrowR" size={14} /></button>
          </div>
          <hr className="hr" />
          <div>
            {PROJECTS.map((p, i) => (
              <div key={p.code} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 22px",
                borderTop: i ? "1px solid var(--divider)" : "none" }}>
                <ProjectGlyph code={p.code} name={p.name} size={38} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="t-body-strong">{p.name}</div>
                  <div className="t-cap" style={{ marginTop: 1 }}>{p.cn} · <span className="t-mono">{p.code}</span></div>
                </div>
                <div style={{ display: "flex", gap: 26, textAlign: "right" }}>
                  <div><div className="t-body-strong">{p.users}</div><div className="t-cap">用户</div></div>
                  <div><div className="t-body-strong" style={{ color: "var(--super)" }}>{p.supers}</div><div className="t-cap">超管</div></div>
                  <div><div className="t-body-strong">{p.groups}</div><div className="t-cap">权限组</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card" style={{ padding: "18px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <span className="t-section">最近鉴权</span>
            <button className="btn btn-text" onClick={() => go("audit")}>全部</button>
          </div>
          <div className="t-cap" style={{ marginBottom: 6 }}>来自审计日志的运行时鉴权结果</div>
          <hr className="hr" />
          <div style={{ marginTop: 4 }}>
            {AUDIT.slice(0, 7).map(a => <div key={a.auditId} style={{ borderTop: "1px solid var(--divider)" }}><ActivityRow a={a} compact /></div>)}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Direction 2: Operations console ---------------- */
const SCENARIOS = [
  { key: "grant",    icon: "key",    title: "授权用户到多个系统", desc: "选择用户，一次性授予多个 project 访问", tone: "var(--blue)", bg: "var(--blue-wash)" },
  { key: "super",    icon: "star",   title: "提升 / 降级超管",     desc: "管理用户在 project 内的 super 标记", tone: "var(--super)", bg: "var(--super-wash)" },
  { key: "members",  icon: "users",  title: "分配用户到权限组",     desc: "在指定 project 内增删权限组成员", tone: "var(--ok)", bg: "var(--ok-wash)" },
  { key: "review",   icon: "shield", title: "审查近期鉴权",         desc: "按结果筛选 Allow / Deny / Error", tone: "var(--warn)", bg: "var(--warn-wash)" },
  { key: "crossview",icon: "grid",   title: "查看跨系统权限",       desc: "聚合用户在所有 project 的授权", tone: "var(--ink-80)", bg: "#f0f0f2" },
  { key: "menus",    icon: "menu",   title: "管理菜单与 API 权限",  desc: "维护规则树与 API 映射", tone: "var(--deny)", bg: "var(--deny-wash)" },
];
function DashConsole({ data, go, scenario }) {
  const { audit: AUDIT } = data;
  const attention = AUDIT.filter(a => a.result !== "Allow").slice(0, 4);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div>
        <div className="t-cap-strong" style={{ marginBottom: 14 }}>快捷操作</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {SCENARIOS.map(s => (
            <button key={s.key} className="btn" onClick={() => scenario(s.key)}
              style={{ textAlign: "left", padding: 20, borderRadius: 18, border: "1px solid var(--hairline)",
                background: "#fff", flexDirection: "column", alignItems: "stretch", gap: 14, transition: "border-color .15s, transform .08s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "#cdcdd2"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "var(--hairline)"}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ width: 40, height: 40, borderRadius: 11, background: s.bg, color: s.tone,
                  display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name={s.icon} size={20} /></span>
                <Icon name="arrowR" size={17} style={{ color: "var(--ink-48)" }} />
              </div>
              <div>
                <div className="t-body-strong" style={{ fontSize: 15.5 }}>{s.title}</div>
                <div className="t-cap" style={{ marginTop: 4, lineHeight: 1.4 }}>{s.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 16, alignItems: "start" }}>
        <div className="card" style={{ padding: "18px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <Icon name="shield" size={17} style={{ color: "var(--deny)" }} />
            <span className="t-section">需要关注</span>
          </div>
          <div className="t-cap" style={{ marginBottom: 10 }}>近期被拒绝或异常的鉴权请求</div>
          <hr className="hr" />
          <div style={{ marginTop: 4 }}>
            {attention.map(a => (
              <div key={a.auditId} style={{ borderTop: "1px solid var(--divider)", padding: "12px 0", display: "flex", gap: 11, alignItems: "center" }}>
                <span style={{ width: 32, height: 32, borderRadius: 9, background: a.result === "Deny" ? "var(--deny-wash)" : "var(--warn-wash)",
                  color: a.result === "Deny" ? "var(--deny)" : "var(--warn)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name={a.result === "Deny" ? "x" : "spark"} size={15} stroke={2.2} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="t-body-strong" style={{ fontSize: 13.5 }}>{a.username} · <span className="t-mono">{a.permissionCode}</span></div>
                  <div className="t-cap" style={{ marginTop: 1 }}>{a.reason} · {data.helpers.pname(a.project)}</div>
                </div>
                <span className="t-cap" style={{ fontSize: 11.5 }}>{timeAgo(a.createdAt)}</span>
              </div>
            ))}
          </div>
          <button className="btn btn-neutral btn-sm" style={{ marginTop: 14, width: "100%" }} onClick={() => go("audit")}>打开审计中心</button>
        </div>
        <div className="card" style={{ padding: "18px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <span className="t-section">实时鉴权流</span>
            <Badge tone="ok" dot size="sm">实时</Badge>
          </div>
          <div className="t-cap" style={{ marginBottom: 6 }}>GET /api/search/audit-logs</div>
          <hr className="hr" />
          <div style={{ marginTop: 4 }}>
            {AUDIT.slice(0, 8).map(a => <div key={a.auditId} style={{ borderTop: "1px solid var(--divider)" }}><ActivityRow a={a} compact /></div>)}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Direction 3: Project gallery (recommended) ---------------- */
function GalleryTile({ p, dark, go, scenario }) {
  const [bg] = PROJ_TINT[p.code] || ["#eee"];
  return (
    <div style={{ background: dark ? "var(--tile-dark)" : bg, borderRadius: 22, padding: "30px 32px",
      display: "flex", flexDirection: "column", gap: 22, minHeight: 220, position: "relative", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div className="t-cap-strong" style={{ color: dark ? "#aaa" : "var(--ink-60)", marginBottom: 8 }}>
            <span className="t-mono" style={{ fontSize: 12 }}>{p.code}</span>
          </div>
          <div className="t-title" style={{ color: dark ? "#fff" : "var(--ink)", fontSize: 27 }}>{p.name}</div>
          <div className="t-body" style={{ color: dark ? "#bbb" : "var(--ink-60)", marginTop: 3 }}>{p.cn}</div>
        </div>
        <ProjectGlyph code={p.code} name={p.name} size={44} radius={12} />
      </div>
      <div style={{ display: "flex", gap: 30, marginTop: "auto" }}>
        <div><div className="t-display" style={{ fontSize: 26, color: dark ? "#fff" : "var(--ink)" }}>{p.users}</div><div className="t-cap" style={{ color: dark ? "#999" : "var(--ink-48)" }}>用户</div></div>
        <div><div className="t-display" style={{ fontSize: 26, color: "var(--super)" }}>{p.supers}</div><div className="t-cap" style={{ color: dark ? "#999" : "var(--ink-48)" }}>超管</div></div>
        <div><div className="t-display" style={{ fontSize: 26, color: dark ? "#fff" : "var(--ink)" }}>{p.groups}</div><div className="t-cap" style={{ color: dark ? "#999" : "var(--ink-48)" }}>权限组</div></div>
        <div style={{ marginLeft: "auto", alignSelf: "flex-end" }}>
          <button className="btn" onClick={() => scenario("grant", p.code)}
            style={{ background: dark ? "rgba(255,255,255,0.14)" : "#fff", color: dark ? "#fff" : "var(--blue)",
              borderRadius: 9999, padding: "8px 16px", fontSize: 13, fontWeight: 500 }}>
            授权 <Icon name="arrowR" size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
function DashGallery({ data, go, scenario }) {
  const { stats: STATS, projects: PROJECTS, audit: AUDIT } = data;
  const ribbon = [
    { label: "接入系统", value: STATS.systems },
    { label: "管理员账号", value: fmt(STATS.users) },
    { label: "权限组", value: STATS.groups },
    { label: "菜单与路由", value: fmt(STATS.menus) },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div className="card" style={{ display: "flex", padding: "20px 0" }}>
        {ribbon.map((r, i) => (
          <div key={r.label} style={{ flex: 1, padding: "0 26px", borderLeft: i ? "1px solid var(--divider)" : "none" }}>
            <div className="t-display" style={{ fontSize: 32, lineHeight: 1 }}>{r.value}</div>
            <div className="t-cap" style={{ marginTop: 7 }}>{r.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {PROJECTS.map((p, i) => <GalleryTile key={p.code} p={p} dark={i % 3 === 1} go={go} scenario={scenario} />)}
      </div>
      <div className="card" style={{ padding: "18px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <span className="t-section">近期活动</span>
          <button className="btn btn-text" onClick={() => go("audit")}>审计中心 <Icon name="arrowR" size={14} /></button>
        </div>
        <hr className="hr" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 40 }}>
          {AUDIT.slice(0, 8).map(a => <div key={a.auditId} style={{ borderTop: "1px solid var(--divider)" }}><ActivityRow a={a} compact /></div>)}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Dashboard shell with direction switch ---------------- */
function Dashboard({ data, go, scenario }) {
  const [dir, setDir] = useStateD("gallery");
  const dirs = [
    { value: "gallery", label: "项目画廊" },
    { value: "console", label: "操作控制台" },
    { value: "metrics", label: "指标视图" },
  ];
  const today = "2026年6月14日 星期六";
  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <div className="t-cap-strong" style={{ color: "var(--blue)", marginBottom: 8 }}>{today}</div>
          <div className="t-hero" style={{ fontSize: 40 }}>下午好，张三</div>
          <div className="t-lead" style={{ fontSize: 19, marginTop: 6 }}>统一权限中心 · 全局视图（<span className="t-mono" style={{ fontSize: 15 }}>__global__</span>）</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
          <div className="t-cap" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Icon name="grid" size={13} /> 仪表盘方向
          </div>
          <Segmented options={dirs} value={dir} onChange={setDir} />
        </div>
      </div>
      {dir === "gallery" && (
        <div style={{ marginBottom: 18 }}>
          <Badge tone="blue" size="sm">推荐方向</Badge>
          <span className="t-cap" style={{ marginLeft: 10 }}>卡片优先、画廊式呈现 —— 最贴合 Apple 设计语言与“运营中心”定位。可在右上角切换对比其他方向。</span>
        </div>
      )}
      <div className="anim-fade" key={dir}>
        {dir === "gallery" && <DashGallery data={data} go={go} scenario={scenario} />}
        {dir === "console" && <DashConsole data={data} go={go} scenario={scenario} />}
        {dir === "metrics" && <DashMetrics data={data} go={go} scenario={scenario} />}
      </div>
      <div style={{ marginTop: 22 }}>
        <ApiSource endpoints={[
          { m: "GET", p: "/api/admin/index", d: "当前管理员信息与可见菜单" },
          { m: "GET", p: "/api/global/project/list", d: "接入系统列表与计数" },
          { m: "GET", p: "/api/global/user/list", d: "管理员总数（total）" },
          { m: "GET", p: "/api/global/group/list", d: "权限组总数（total）" },
          { m: "GET", p: "/api/global/menu/list", d: "菜单与路由总数（total）" },
          { m: "GET", p: "/api/search/audit-logs", d: "近期鉴权活动与关注项" },
        ]} note="每个 project 的细分计数通过对各 list 接口传入 project 参数聚合得到。单一汇总统计接口为建议的未来扩展。" />
      </div>
    </div>
  );
}

window.Dashboard = Dashboard;
window.SCENARIOS = SCENARIOS;
