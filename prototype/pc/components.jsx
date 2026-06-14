/* ============================================================
   Shared UI primitives — Apple language, exported to window.
   ============================================================ */
const { useState, useEffect, useRef, useMemo } = React;

/* ---------- Icons (simple line set) ---------- */
const ICONS = {
  grid:   "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  users:  "M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM22 19v-1a4 4 0 0 0-3-3.87M16 4.13A4 4 0 0 1 16 12",
  key:    "M14 8a4 4 0 1 1-4 4M14 8l7-7m-3 3 2 2m-2 1 2 2",
  shield: "M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z",
  menu:   "M4 6h16M4 12h16M4 18h16",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3",
  cog:    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9z",
  plus:   "M12 5v14M5 12h14",
  check:  "M20 6L9 17l-5-5",
  x:      "M18 6L6 18M6 6l12 12",
  chevR:  "M9 6l6 6-6 6",
  chevD:  "M6 9l6 6 6-6",
  star:   "M12 3l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.6 9.1l5.8-.8z",
  layers: "M12 2l9 5-9 5-9-5zM3 12l9 5 9-5M3 17l9 5 9-5",
  doc:    "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6",
  clock:  "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
  link:   "M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1",
  trash:  "M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6",
  edit:   "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z",
  arrowR: "M5 12h14M13 6l6 6-6 6",
  power:  "M12 3v9M6.6 6.6a8 8 0 1 0 10.8 0",
  building:"M3 21h18M5 21V7l8-4v18M19 21V11l-6-3M9 9h.01M9 13h.01M9 17h.01",
  flow:   "M5 5h5v5H5zM14 14h5v5h-5zM10 7h6a2 2 0 0 1 2 2v5",
  spark:  "M13 2L4.5 13H11l-1 9 8.5-11H12z",
  list:   "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  filter: "M3 4h18l-7 8v6l-4 2v-8z",
  dl:     "M12 3v12m0 0l4-4m-4 4l-4-4M4 21h16",
};

function Icon({ name, size = 18, stroke = 1.7, className = "", style = {}, fill = false }) {
  const d = ICONS[name] || "";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill ? "currentColor" : "none"}
         stroke={fill ? "none" : "currentColor"} strokeWidth={stroke} strokeLinecap="round"
         strokeLinejoin="round" className={className} style={{ flexShrink: 0, ...style }}>
      <path d={d} />
    </svg>
  );
}

/* ---------- Project glyph (initial tile) ---------- */
const PROJ_TINT = {
  portal:  ["#e9f0fb", "#0066cc"],
  workflow:["#eef0f4", "#3a3a3c"],
  message: ["#eaf3ee", "#1a7f47"],
  news:    ["#f6efdc", "#9a6a00"],
  quality: ["#efeaf7", "#6b4ea8"],
  rbac:    ["#fbeae9", "#b3261e"],
};
function ProjectGlyph({ code, name, size = 36, radius = 9 }) {
  const [bg, fg] = PROJ_TINT[code] || ["#eee", "#555"];
  const letter = (name || code || "?").trim()[0].toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: radius, background: bg, color: fg,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "var(--font-display)", fontWeight: 600, fontSize: size * 0.42, flexShrink: 0,
      letterSpacing: "-0.02em" }}>{letter}</div>
  );
}

/* ---------- Avatar ---------- */
function Avatar({ name, size = 32, dim = false }) {
  const letter = (name || "?").trim()[0];
  const hue = ((name || "").charCodeAt(0) * 47) % 360;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: dim ? "#ededf0" : `oklch(0.92 0.04 ${hue})`,
      color: dim ? "#9a9aa0" : `oklch(0.42 0.09 ${hue})`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 600, fontSize: size * 0.42, fontFamily: "var(--font-display)" }}>{letter}</div>
  );
}

/* ---------- Status badge ---------- */
function Badge({ tone = "neutral", children, dot = false, soft = true, size = "md" }) {
  const tones = {
    ok:     ["var(--ok)", "var(--ok-wash)"],
    warn:   ["var(--warn)", "var(--warn-wash)"],
    deny:   ["var(--deny)", "var(--deny-wash)"],
    blue:   ["var(--blue)", "var(--blue-wash)"],
    super:  ["var(--super)", "var(--super-wash)"],
    neutral:["var(--ink-60)", "#f0f0f2"],
  };
  const [fg, bg] = tones[tone] || tones.neutral;
  const pad = size === "sm" ? "2px 8px" : "3px 10px";
  const fs = size === "sm" ? 11 : 12;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: pad,
      borderRadius: 9999, background: soft ? bg : "transparent", color: fg,
      fontSize: fs, fontWeight: 600, letterSpacing: "-0.01em", whiteSpace: "nowrap", lineHeight: 1.3 }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: "50%", background: fg }} />}
      {children}
    </span>
  );
}

/* ---------- Segmented control ---------- */
function Segmented({ options, value, onChange, size = "md" }) {
  const pad = size === "sm" ? "5px 12px" : "7px 16px";
  const fs = size === "sm" ? 13 : 14;
  return (
    <div style={{ display: "inline-flex", background: "#ececef", borderRadius: 10, padding: 3, gap: 2 }}>
      {options.map(opt => {
        const val = typeof opt === "string" ? opt : opt.value;
        const label = typeof opt === "string" ? opt : opt.label;
        const active = val === value;
        return (
          <button key={val} className="btn" onClick={() => onChange(val)}
            style={{ padding: pad, fontSize: fs, borderRadius: 8, fontWeight: active ? 600 : 400,
              background: active ? "#fff" : "transparent", color: active ? "var(--ink)" : "var(--ink-60)",
              boxShadow: active ? "0 1px 3px rgba(0,0,0,0.12)" : "none", transition: "all .15s ease" }}>
            {label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Toggle switch ---------- */
function Toggle({ on, onChange, disabled, tone = "blue" }) {
  const col = tone === "super" ? "var(--super)" : "var(--blue)";
  return (
    <button className="btn" disabled={disabled} onClick={() => !disabled && onChange(!on)}
      style={{ width: 42, height: 25, borderRadius: 9999, padding: 0, position: "relative",
        background: on ? col : "#d4d4d8", transition: "background .2s ease", flexShrink: 0,
        opacity: disabled ? 0.5 : 1 }}>
      <span style={{ position: "absolute", top: 2.5, left: on ? 19.5 : 2.5, width: 20, height: 20,
        borderRadius: "50%", background: "#fff", transition: "left .2s cubic-bezier(.3,.7,.3,1)",
        boxShadow: "0 1px 2px rgba(0,0,0,0.3)" }} />
    </button>
  );
}

/* ---------- Checkbox ---------- */
function Check({ on, onChange, disabled }) {
  return (
    <button className="btn" disabled={disabled} onClick={() => !disabled && onChange(!on)}
      style={{ width: 20, height: 20, borderRadius: 6, padding: 0, flexShrink: 0,
        border: on ? "none" : "1.5px solid #c4c4ca", background: on ? "var(--blue)" : "#fff",
        color: "#fff", opacity: disabled ? 0.4 : 1 }}>
      {on && <Icon name="check" size={13} stroke={2.6} />}
    </button>
  );
}

/* ---------- Search input ---------- */
function SearchInput({ value, onChange, placeholder = "搜索", width = 260 }) {
  return (
    <div style={{ position: "relative", width }}>
      <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--ink-48)", pointerEvents: "none" }}>
        <Icon name="search" size={15} />
      </span>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", height: 38, borderRadius: 9999, border: "1px solid var(--hairline)",
          background: "#fff", padding: "0 16px 0 36px", fontSize: 14, color: "var(--ink)", outline: "none" }} />
    </div>
  );
}

/* ---------- Plain field input ---------- */
function Field({ label, value, onChange, placeholder, hint, mono, as = "input", children }) {
  return (
    <label style={{ display: "block" }}>
      {label && <div className="t-cap-strong" style={{ marginBottom: 7 }}>{label}</div>}
      {as === "select" ? (
        <select value={value} onChange={e => onChange(e.target.value)}
          style={{ width: "100%", height: 40, borderRadius: 10, border: "1px solid var(--hairline)",
            background: "#fff", padding: "0 12px", fontSize: 14, color: "var(--ink)", outline: "none" }}>
          {children}
        </select>
      ) : (
        <input value={value} onChange={e => onChange && onChange(e.target.value)} placeholder={placeholder}
          style={{ width: "100%", height: 40, borderRadius: 10, border: "1px solid var(--hairline)",
            background: "#fff", padding: "0 13px", fontSize: 14, color: "var(--ink)", outline: "none",
            fontFamily: mono ? "var(--font-text)" : "inherit" }} />
      )}
      {hint && <div className="t-cap" style={{ marginTop: 6 }}>{hint}</div>}
    </label>
  );
}

/* ---------- API endpoint tag ---------- */
const METHOD_TONE = { GET:"#1a7f47", POST:"#0066cc", PUT:"#9a6a00", DELETE:"#b3261e", PATCH:"#6b4ea8" };
function ApiTag({ method, path, mini = false }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "#f6f6f8",
      border: "1px solid var(--divider)", borderRadius: 7, padding: mini ? "2px 8px 2px 6px" : "4px 10px 4px 7px",
      fontFamily: "var(--font-text)", maxWidth: "100%" }}>
      <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.03em", color: METHOD_TONE[method] || "#555",
        fontFamily: "SF Mono, ui-monospace, monospace" }}>{method}</span>
      <span className="t-mono" style={{ color: "var(--ink-80)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: mini ? 11.5 : 12.5 }}>{path}</span>
    </span>
  );
}

/* ---------- "Powered by" API source strip (page-level) ---------- */
function ApiSource({ endpoints, note }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: "var(--blue-wash)", border: "1px solid var(--blue-wash-strong)",
      borderRadius: 12, padding: "11px 14px" }}>
      <button className="btn" onClick={() => setOpen(o => !o)}
        style={{ width: "100%", justifyContent: "space-between", padding: 0, background: "transparent" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--blue)" }}>
          <Icon name="link" size={15} />
          <span className="t-cap-strong" style={{ color: "var(--blue)" }}>本页数据来源 · {endpoints.length} 个接口</span>
        </span>
        <Icon name="chevD" size={16} style={{ color: "var(--blue)", transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
      </button>
      {open && (
        <div className="anim-fade" style={{ marginTop: 11, display: "flex", flexDirection: "column", gap: 7 }}>
          {endpoints.map((e, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <ApiTag method={e.m} path={e.p} />
              <span className="t-cap">{e.d}</span>
            </div>
          ))}
          {note && <div className="t-cap" style={{ marginTop: 4, color: "var(--ink-60)" }}>{note}</div>}
        </div>
      )}
    </div>
  );
}

/* ---------- Drawer (slide-over) ---------- */
function Drawer({ open, onClose, children, width = 460 }) {
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.28)", animation: "overlayIn .2s ease both" }} />
      <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width, maxWidth: "94vw",
        background: "var(--canvas)", boxShadow: "var(--float-shadow)", animation: "slideInRight .32s cubic-bezier(.2,.7,.2,1) both",
        display: "flex", flexDirection: "column" }}>
        {children}
      </div>
    </div>
  );
}

/* ---------- Modal ---------- */
function Modal({ open, onClose, children, width = 480 }) {
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose && onClose();
    if (open) window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 70, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.32)", animation: "overlayIn .2s ease both" }} />
      <div style={{ position: "relative", width, maxWidth: "100%", maxHeight: "90vh", overfl:"hidden",
        background: "var(--canvas)", borderRadius: 20, boxShadow: "var(--float-shadow)",
        animation: "scaleIn .26s cubic-bezier(.2,.7,.2,1) both", display: "flex", flexDirection: "column" }}>
        {children}
      </div>
    </div>
  );
}

/* ---------- Toast ---------- */
function useToast() {
  const [toasts, setToasts] = useState([]);
  const push = (msg, tone = "ok") => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t, { id, msg, tone }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  };
  const node = (
    <div style={{ position: "fixed", bottom: 26, left: "50%", transform: "translateX(-50%)", zIndex: 90,
      display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
      {toasts.map(t => (
        <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--ink)",
          color: "#fff", padding: "11px 18px", borderRadius: 12, boxShadow: "var(--float-shadow)",
          animation: "fadeUp .3s ease both", fontSize: 14, fontWeight: 500 }}>
          <span style={{ color: t.tone === "ok" ? "#5fd08a" : t.tone === "deny" ? "#ff8a82" : "#ffd27a", display: "flex" }}>
            <Icon name={t.tone === "deny" ? "x" : "check"} size={16} stroke={2.4} />
          </span>
          {t.msg}
        </div>
      ))}
    </div>
  );
  return { push, node };
}

/* ---------- Stat number formatting ---------- */
function fmt(n) { return n.toLocaleString("en-US"); }
function timeAgo(iso) {
  const diff = (new Date("2026-06-14T11:20:00+08:00") - new Date(iso)) / 60000;
  if (diff < 1) return "刚刚";
  if (diff < 60) return Math.floor(diff) + " 分钟前";
  if (diff < 1440) return Math.floor(diff / 60) + " 小时前";
  return Math.floor(diff / 1440) + " 天前";
}
function fmtTime(iso) {
  const d = new Date(iso);
  const p = (x) => String(x).padStart(2, "0");
  return `${d.getMonth()+1}月${d.getDate()}日 ${p(d.getHours())}:${p(d.getMinutes())}`;
}

Object.assign(window, {
  Icon, ProjectGlyph, Avatar, Badge, Segmented, Toggle, Check, SearchInput, Field,
  ApiTag, ApiSource, Drawer, Modal, useToast, fmt, timeAgo, fmtTime, PROJ_TINT, METHOD_TONE,
});
