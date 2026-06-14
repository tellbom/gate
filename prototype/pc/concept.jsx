/* ============================================================
   Concept & IA + Page→API mapping appendix + future extensions.
   ============================================================ */
const { useState: useSC } = React;

function ConceptPage({ ctx, go }) {
  const principles = [
    { icon: "grid", title: "卡片优先的呈现", desc: "信息以卡片与画廊式平铺组织，而非密集的 RBAC 树。色彩切换即分隔，去除多余边框与阴影。" },
    { icon: "key", title: "清晰的授权工作流", desc: "授权是核心任务。按用户与按系统两种视图共用同一组接口，逐 project 结果透明可见。" },
    { icon: "shield", title: "契约即真相", desc: "每个界面只消费现有 /api/global/* 与配套接口。不臆造后端能力，缺口单列为未来扩展。" },
    { icon: "spark", title: "克制的视觉", desc: "单一 Action Blue 承载全部交互信号，SF Pro 字体与充裕留白，营造高端而非传统后台的观感。" },
  ];
  const iaTree = [
    { label: "概览", sub: "权限运营中心", api: "project/list · user/list · group/list · menu/list · audit-logs" },
    { label: "用户", sub: "跨 project 管理员账号", api: "global/user/list · user/{id}/status" },
    { label: "授权", sub: "Project 访问与超管", api: "user/{id}/project-grants · project-grant/{id}/super" },
    { label: "权限组", sub: "成员与权限码", api: "global/group/list · group/{code}/members · rule/tree" },
    { label: "菜单与路由", sub: "规则树与 API 映射", api: "global/menu/list · rule/* · api-map/*" },
    { label: "审计", sub: "运行时鉴权与权限视图", api: "search/audit-logs · search/permission-view" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
      {/* vision hero */}
      <div style={{ background: "var(--tile-dark)", borderRadius: 24, padding: "48px 44px", color: "#fff" }}>
        <Badge tone="blue" size="sm">设计愿景</Badge>
        <div className="t-hero" style={{ color: "#fff", marginTop: 18, maxWidth: 760, fontSize: 42 }}>把跨系统的权限治理，做成一座安静的画廊。</div>
        <div className="t-lead" style={{ color: "#bbb", marginTop: 18, maxWidth: 680, fontSize: 20 }}>
          统一权限中心以保留 project <span className="t-mono" style={{ color: "#fff", fontSize: 16 }}>__global__</span> 进入，
          将六大系统的用户、授权、权限组、菜单与审计聚合为一个运营中心 —— 每个操作都严格映射到现有 API 契约。
        </div>
        <div style={{ display: "flex", gap: 40, marginTop: 32 }}>
          {[["6","接入系统"],["2,356","管理员"],["158","权限组"],["1,248","菜单路由"]].map(([v,l]) => (
            <div key={l}><div className="t-display" style={{ color: "#fff", fontSize: 32 }}>{v}</div><div className="t-cap" style={{ color: "#999", marginTop: 4 }}>{l}</div></div>
          ))}
        </div>
      </div>

      {/* principles */}
      <div>
        <div className="t-title" style={{ marginBottom: 6 }}>设计原则</div>
        <div className="t-body" style={{ color: "var(--ink-60)", marginBottom: 20 }}>源自 Apple 设计语言，服务于企业级权限运营效率。</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {principles.map(p => (
            <div key={p.title} className="card" style={{ padding: 26, display: "flex", gap: 16 }}>
              <span style={{ width: 44, height: 44, borderRadius: 12, background: "var(--blue-wash)", color: "var(--blue)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name={p.icon} size={22} /></span>
              <div><div className="t-section" style={{ marginBottom: 6 }}>{p.title}</div><div className="t-body" style={{ color: "var(--ink-60)", fontSize: 14.5 }}>{p.desc}</div></div>
            </div>
          ))}
        </div>
      </div>

      {/* IA */}
      <div>
        <div className="t-title" style={{ marginBottom: 6 }}>信息架构与导航</div>
        <div className="t-body" style={{ color: "var(--ink-60)", marginBottom: 20 }}>六个运营模块 + 两个说明模块，每个模块聚合一组现有接口。</div>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {iaTree.map((n, i) => (
            <div key={n.label} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 24px", borderTop: i ? "1px solid var(--divider)" : "none" }}>
              <span className="t-mono muted" style={{ width: 24, fontSize: 12 }}>{String(i+1).padStart(2,"0")}</span>
              <div style={{ width: 150, flexShrink: 0 }}><div className="t-body-strong">{n.label}</div><div className="t-cap">{n.sub}</div></div>
              <Icon name="arrowR" size={15} style={{ color: "var(--ink-48)", flexShrink: 0 }} />
              <span className="t-mono" style={{ fontSize: 11.5, color: "var(--ink-60)" }}>{n.api}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 28, display: "flex", alignItems: "center", gap: 20, background: "var(--blue-wash)", borderColor: "var(--blue-wash-strong)" }}>
        <div style={{ flex: 1 }}>
          <div className="t-section" style={{ color: "var(--blue)" }}>查看完整的页面 · API 映射</div>
          <div className="t-body" style={{ color: "var(--ink-60)", marginTop: 4 }}>逐页对照所用接口、聚合方式与契约支持情况，并附未来扩展建议。</div>
        </div>
        <button className="btn btn-primary" onClick={() => go("apimap")}>打开映射表 <Icon name="arrowR" size={15} /></button>
      </div>
    </div>
  );
}

/* ---------------- Page → API mapping appendix ---------------- */
const PAGE_MAP = [
  { page: "概览 / 运营中心", endpoints: [
      { m:"GET", p:"/api/admin/index" }, { m:"GET", p:"/api/global/project/list" }, { m:"GET", p:"/api/global/user/list" },
      { m:"GET", p:"/api/global/group/list" }, { m:"GET", p:"/api/global/menu/list" }, { m:"GET", p:"/api/search/audit-logs" }],
    data: "系统计数、管理员/组/菜单总数、近期鉴权活动", actions: "导航跳转、启动授权场景", support: "full",
    note: "每个 project 的细分计数由各 list 接口传 project 参数聚合" },
  { page: "用户管理", endpoints: [
      { m:"GET", p:"/api/global/user/list" }, { m:"PUT", p:"/api/global/user/{userid}/status" },
      { m:"POST", p:"/api/global/user/{userid}/project-grants" }, { m:"DELETE", p:"/api/global/user/{userid}/project-grants/{project}" }],
    data: "跨 project 用户、状态、所属系统、权限组、超管", actions: "启用/禁用、查看详情、撤销授权", support: "full" },
  { page: "项目授权", endpoints: [
      { m:"POST", p:"/api/global/user/{userid}/project-grants" }, { m:"DELETE", p:"/api/global/user/{userid}/project-grants/{project}" },
      { m:"GET", p:"/api/global/user/list" }, { m:"GET", p:"/api/global/project/list" }],
    data: "用户授权关系、目标系统、逐 project 结果报告", actions: "多选系统授权、撤销、自动建号", support: "full" },
  { page: "超管提升 / 降级", endpoints: [
      { m:"PUT", p:"/api/project-grant/{userid}/super" }, { m:"POST", p:"/api/global/user/{userid}/project-grants" }],
    data: "用户在各 project 的 super 标记", actions: "确认摘要后提升 / 降级", support: "partial",
    note: "全局已存在授权的 super 切换需进入目标 project 上下文；建议补全局超管切换接口" },
  { page: "权限组管理", endpoints: [
      { m:"GET", p:"/api/global/group/list" }, { m:"POST", p:"/api/group" }, { m:"PUT", p:"/api/group/{groupCode}/status" },
      { m:"POST", p:"/api/global/group/{groupCode}/members" }, { m:"DELETE", p:"/api/global/group/{groupCode}/members/{userid}" }, { m:"GET", p:"/api/rule/tree" }],
    data: "跨 project 权限组、成员、权限码、规则", actions: "创建、启停、增删成员、规则授权", support: "partial",
    note: "组的新建/编辑为 per-project 接口；跨 project 组模板为未来扩展" },
  { page: "菜单与路由", endpoints: [
      { m:"GET", p:"/api/global/menu/list" }, { m:"GET", p:"/api/rule/tree" }, { m:"PUT", p:"/api/rule/{ruleCode}/status" },
      { m:"PUT", p:"/api/rule/{ruleCode}/weigh" }, { m:"GET", p:"/api/api-map/records" }, { m:"POST", p:"/api/api-map" }],
    data: "规则树、菜单/按钮、API 权限映射", actions: "启停规则、排序、API 映射增删改", support: "full" },
  { page: "审计与活动", endpoints: [
      { m:"GET", p:"/api/search/audit-logs" }, { m:"GET", p:"/api/search/permission-view" }],
    data: "运行时鉴权结果（Allow/Deny/Error）、权限视图", actions: "按结果/方法/时间过滤、导出", support: "partial",
    note: "仅运行时鉴权决策；授权变更历史（操作审计）为未来扩展" },
];

const FUTURE = [
  { title: "授权变更审计追踪", why: "现有 audit-logs 仅记录运行时鉴权决策，无法回答“谁在何时授予/撤销/提升了什么”。", api: "GET /api/global/change-logs", impact: "高" },
  { title: "全局超管切换", why: "全局 project-grants 对已存在授权返回 skipped，不更新 super；切换需逐 project 进入上下文。", api: "PUT /api/global/user/{userid}/super", impact: "高" },
  { title: "汇总统计接口", why: "首页计数当前需对多个 list 接口分别取 total，单一汇总接口可减少调用与延迟。", api: "GET /api/global/summary", impact: "中" },
  { title: "全局用户资料编辑", why: "用户名修改为 per-project 接口；状态已是全局写入，资料编辑宜对齐为全局。", api: "PUT /api/global/user/{userid}", impact: "中" },
  { title: "跨 project 权限组模板", why: "组的新建/编辑均为 per-project；批量在多系统创建同构组目前需逐项目重复。", api: "POST /api/global/group", impact: "中" },
  { title: "批量成员操作回执", why: "成员逐个加入/移除；批量操作并返回逐条结果可提升运营效率。", api: "POST /api/global/group/{groupCode}/members:batch", impact: "低" },
];

function ApiMapPage({ ctx, go }) {
  const supTone = { full: ["ok","完全支持"], partial: ["warn","部分支持 · 见备注"] };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <div>
        <div className="t-title" style={{ marginBottom: 6 }}>页面 · API 映射</div>
        <div className="t-body" style={{ color: "var(--ink-60)", maxWidth: 680 }}>每个界面所消费的接口、数据、动作与契约支持情况。全部基于现有 API，未臆造任何后端能力。</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {PAGE_MAP.map(pm => {
          const [tone, label] = supTone[pm.support];
          return (
            <div key={pm.page} className="card" style={{ padding: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                <div className="t-section">{pm.page}</div>
                <Badge tone={tone} dot size="md">{label}</Badge>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                {pm.endpoints.map((e, i) => <ApiTag key={i} method={e.m} path={e.p} mini />)}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div><div className="t-cap-strong" style={{ marginBottom: 4 }}>展示数据</div><div className="t-body" style={{ fontSize: 14, color: "var(--ink-60)" }}>{pm.data}</div></div>
                <div><div className="t-cap-strong" style={{ marginBottom: 4 }}>支持动作</div><div className="t-body" style={{ fontSize: 14, color: "var(--ink-60)" }}>{pm.actions}</div></div>
              </div>
              {pm.note && <div style={{ display: "flex", gap: 9, alignItems: "flex-start", marginTop: 14, padding: "10px 13px", background: "var(--warn-wash)", borderRadius: 10 }}>
                <Icon name="spark" size={14} style={{ color: "var(--warn)", marginTop: 2 }} />
                <span className="t-cap" style={{ color: "#7a5500" }}>{pm.note}</span>
              </div>}
            </div>
          );
        })}
      </div>

      {/* future extensions */}
      <div>
        <div className="t-title" style={{ marginBottom: 6 }}>未来 API 扩展建议</div>
        <div className="t-body" style={{ color: "var(--ink-60)", marginBottom: 20, maxWidth: 680 }}>以下能力当前契约尚未提供。设计已用现有接口降级实现，补齐后体验更顺滑。这些为<b>独立建议</b>，不影响现有可实现性。</div>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.3fr 2fr 1.4fr 70px", padding: "12px 24px", background: "var(--pearl)", borderBottom: "1px solid var(--hairline)" }}>
            {["能力","现状缺口","建议接口","影响"].map((h,i)=><span key={i} className="t-cap-strong" style={{ fontSize: 12 }}>{h}</span>)}
          </div>
          {FUTURE.map((f, i) => (
            <div key={f.title} style={{ display: "grid", gridTemplateColumns: "1.3fr 2fr 1.4fr 70px", padding: "16px 24px", alignItems: "center", borderTop: i ? "1px solid var(--divider)" : "none" }}>
              <span className="t-body-strong" style={{ fontSize: 14 }}>{f.title}</span>
              <span className="t-body" style={{ fontSize: 13, color: "var(--ink-60)" }}>{f.why}</span>
              <span className="t-mono" style={{ fontSize: 11.5, color: "var(--blue)" }}>{f.api}</span>
              <span><Badge tone={f.impact === "高" ? "deny" : f.impact === "中" ? "warn" : "neutral"} size="sm">{f.impact}</Badge></span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

window.ConceptPage = ConceptPage;
window.ApiMapPage = ApiMapPage;
