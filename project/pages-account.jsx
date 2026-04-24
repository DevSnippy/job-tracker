// Profile + Integrations (n8n) + Settings + Tracker (kanban-light)
const { useState: uSP } = React;

const ProfilePage = () => {
  const [saving, setSaving] = uSP(false);
  return (
    <div className="page">
      <Topbar crumbs={["Account","My Profile"]} actions={
        <button className="btn primary" onClick={()=>{setSaving(true); setTimeout(()=>setSaving(false), 900);}}>
          {saving ? "Saving…" : "Save changes"}
        </button>
      }/>
      <div className="page-body" style={{ padding: 22, maxWidth: 900 }}>
        <div className="panel" style={{ padding: 18 }}>
          <div className="row" style={{ gap: 14 }}>
            <div style={{ width: 64, height: 64, borderRadius: 12, background: "linear-gradient(135deg, var(--accent), oklch(65% 0.15 calc(var(--accent-h) + 50)))", color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 24 }}>YL</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 600 }}>Yonatan Levi</div>
              <div className="muted">Senior Frontend Engineer · Tel Aviv, IL</div>
            </div>
            <button className="btn ghost"><Icon name="upload" size={12} /> Change photo</button>
          </div>
        </div>

        <div className="panel" style={{ padding: 18, marginTop: 14 }}>
          <h4 className="section-title">Personal info</h4>
          <div className="form-grid">
            <div className="field"><label className="field-label">Full name</label><input className="input" defaultValue="Yonatan Levi" /></div>
            <div className="field"><label className="field-label">Headline</label><input className="input" defaultValue="Senior Frontend Engineer" /></div>
            <div className="field"><label className="field-label">Email</label><input className="input" defaultValue="yonatan@pm.me" /></div>
            <div className="field"><label className="field-label">Phone</label><input className="input" defaultValue="+972 54-123-4567" /></div>
            <div className="field"><label className="field-label">Location</label><input className="input" defaultValue="Tel Aviv, IL" /></div>
            <div className="field"><label className="field-label">Website / portfolio</label><input className="input" defaultValue="yonatan.dev" /></div>
            <div className="field"><label className="field-label">LinkedIn</label><input className="input" defaultValue="linkedin.com/in/yonatanlevi" /></div>
            <div className="field"><label className="field-label">GitHub</label><input className="input" defaultValue="github.com/yonatanl" /></div>
          </div>
        </div>

        <div className="panel" style={{ padding: 18, marginTop: 14 }}>
          <h4 className="section-title">Skills & experience summary</h4>
          <div className="field">
            <label className="field-label">One-line pitch</label>
            <input className="input" defaultValue="Senior FE engineer shipping data-dense B2B consoles." />
          </div>
          <div className="field">
            <label className="field-label">Summary</label>
            <textarea className="input" rows={5} defaultValue="7+ years building data-dense B2B consoles. Owned design systems, rebuilt perf-critical tables, and mentored mid-level ICs. Looking for staff-track frontend work at a product-focused company." />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="field-label">Skills</label>
            <div className="row" style={{ gap: 4, flexWrap: "wrap" }}>
              {["React","TypeScript","Node.js","GraphQL","Design Systems","Perf","Accessibility","Figma","CSS","Testing"].map(s => (
                <span key={s} className="chip chip-accent">{s} <Icon name="close" size={10} /></span>
              ))}
              <button className="chip" style={{ cursor:"pointer", color: "var(--text-3)" }}><Icon name="plus" size={10} /> Add skill</button>
            </div>
          </div>
        </div>

        <div className="panel" style={{ padding: 18, marginTop: 14 }}>
          <h4 className="section-title">Connected accounts</h4>
          <div className="stack-sm">
            {[
              { n: "GitHub",   sub: "github.com/yonatanl",    connected: true, icon: "github" },
              { n: "Google",   sub: "yonatan@gmail.com",      connected: true, icon: "mail" },
              { n: "LinkedIn", sub: "Not connected",          connected: false, icon: "link" },
            ].map(a => (
              <div key={a.n} className="row" style={{ padding: "8px 0", borderTop: "1px solid var(--border)", gap: 10 }}>
                <Icon name={a.icon} size={16} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500 }}>{a.n}</div>
                  <div className="muted" style={{ fontSize: 11.5 }}>{a.sub}</div>
                </div>
                <button className={`btn sm ${a.connected?"ghost":""}`}>{a.connected?"Disconnect":"Connect"}</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const IntegrationsPage = () => {
  const { WEBHOOKS, EVENTS } = window.JT_DATA;
  const [hooks, setHooks] = uSP(WEBHOOKS);
  const [testing, setTesting] = uSP(null);
  const [lastTest, setLastTest] = uSP(null);
  const [newUrl, setNewUrl] = uSP("");
  const [newName, setNewName] = uSP("");
  const [newEvents, setNewEvents] = uSP(["job.applied"]);

  const toggle = (id) => setHooks(hs => hs.map(h => h.id===id?{...h, active:!h.active}:h));
  const test = (id) => {
    setTesting(id);
    setLastTest(null);
    setTimeout(() => {
      setTesting(null);
      setLastTest({ id, ok: true, latency: 180 + Math.floor(Math.random()*200), at: "just now" });
      setHooks(hs => hs.map(h => h.id===id?{...h, lastFired: "just now", status: "ok"}:h));
    }, 1100);
  };
  const add = () => {
    if (!newUrl || !newName) return;
    setHooks([{ id: `wh${Date.now()}`, name: newName, url: newUrl, events: newEvents, active: true, lastFired: "never", status: "untested" }, ...hooks]);
    setNewName(""); setNewUrl(""); setNewEvents(["job.applied"]);
  };

  return (
    <div className="page">
      <Topbar crumbs={["Account","Integrations"]} actions={
        <>
          <button className="btn ghost"><Icon name="external" size={12} /> n8n docs</button>
          <button className="btn primary"><Icon name="plus" /> New webhook</button>
        </>
      }/>
      <div className="page-body" style={{ padding: 22, maxWidth: 1000 }}>

        <div className="panel" style={{ padding: 16, marginBottom: 14 }}>
          <div className="row" style={{ gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: "#EA4B71", color: "#fff", display: "grid", placeItems: "center", fontWeight: 700 }}>n8</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>n8n Webhooks</div>
              <div className="muted" style={{ fontSize: 12 }}>Fire a POST to any n8n webhook URL when events happen in Job Tracker. Payload is JSON with the job, resume, and event type.</div>
            </div>
            <span className={`chip ${hooks.filter(h=>h.active).length?"chip-success":""} dot`}>{hooks.filter(h=>h.active).length} active</span>
          </div>
        </div>

        <div className="panel" style={{ marginBottom: 14 }}>
          <div className="panel-header">Add webhook <span className="subtitle">single POST URL from n8n</span></div>
          <div style={{ padding: 14 }}>
            <div className="form-grid">
              <div className="field">
                <label className="field-label">Label</label>
                <input className="input" placeholder="e.g. Notion DB logger" value={newName} onChange={e=>setNewName(e.target.value)} />
              </div>
              <div className="field">
                <label className="field-label">Trigger on</label>
                <select className="input" value={newEvents[0]} onChange={e=>setNewEvents([e.target.value])}>
                  {EVENTS.map(ev => <option key={ev} value={ev}>{ev}</option>)}
                  <option value="*">All events</option>
                </select>
              </div>
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label className="field-label">n8n webhook URL</label>
                <div className="row" style={{ gap: 6 }}>
                  <input className="input mono" placeholder="https://n8n.yourdomain.com/webhook/…" value={newUrl} onChange={e=>setNewUrl(e.target.value)} />
                  <button className="btn" onClick={add}><Icon name="plus" size={12} /> Add</button>
                  <button className="btn ghost" onClick={()=>{setNewUrl("https://n8n.example.com/webhook/sandbox-test"); setNewName("Test webhook");}}><Icon name="play" size={12} /> Test payload</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            Connected webhooks
            <span className="subtitle">{hooks.length} total</span>
          </div>
          <table className="data">
            <thead>
              <tr>
                <th style={{ width: 42 }}></th>
                <th>Name</th>
                <th>Events</th>
                <th>URL</th>
                <th>Last fired</th>
                <th>Status</th>
                <th style={{ textAlign: "right", width: 180 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {hooks.map(h => (
                <tr key={h.id}>
                  <td><div className={`switch${h.active?" on":""}`} onClick={()=>toggle(h.id)} /></td>
                  <td style={{ fontWeight: 500 }}>{h.name}</td>
                  <td>
                    <span className="row" style={{ gap: 3 }}>
                      {h.events.map(e => <span key={e} className="chip mono">{e}</span>)}
                    </span>
                  </td>
                  <td className="mono-strong" style={{ maxWidth: 260, overflow:"hidden", textOverflow:"ellipsis" }}>{h.url}</td>
                  <td className="muted">{h.lastFired}</td>
                  <td>
                    {h.status === "ok" && <span className="chip chip-success dot">OK</span>}
                    {h.status === "paused" && <span className="chip">paused</span>}
                    {h.status === "untested" && <span className="chip chip-warn dot">untested</span>}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div className="row" style={{ gap: 4, justifyContent: "flex-end" }}>
                      <button className="btn sm" onClick={()=>test(h.id)} disabled={testing===h.id}>
                        {testing===h.id ? "Testing…" : <><Icon name="play" size={12} /> Test</>}
                      </button>
                      <button className="icon-btn"><Icon name="copy" size={12} /></button>
                      <button className="icon-btn"><Icon name="trash" size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {lastTest && (
          <div className="panel" style={{ marginTop: 14, padding: 14 }}>
            <div className="row" style={{ gap: 8, marginBottom: 10 }}>
              <span className="chip chip-success dot">200 OK</span>
              <span className="mono-strong">{lastTest.latency}ms</span>
              <span className="muted">· test payload delivered</span>
            </div>
            <pre className="mono" style={{ background: "var(--surface-2)", padding: 12, borderRadius: 6, margin: 0, overflow: "auto", fontSize: 11 }}>
{`POST ${hooks.find(h=>h.id===lastTest.id)?.url}
Content-Type: application/json
X-JobTracker-Event: job.applied

{
  "event": "job.applied",
  "timestamp": "2026-04-24T14:32:11Z",
  "job": {
    "id": "TM-8421",
    "company": "Wiz",
    "role": "Senior Frontend Engineer",
    "source": "techmap",
    "salary": "₪55–75k"
  },
  "resume": { "id": "r1", "name": "Senior Frontend — General.pdf" },
  "user": { "email": "yonatan@pm.me" }
}`}
            </pre>
          </div>
        )}

        <div className="panel" style={{ marginTop: 14, padding: 14 }}>
          <h4 className="section-title">Python backend</h4>
          <div className="row" style={{ gap: 10 }}>
            <span className="chip chip-success dot">connected</span>
            <span className="mono-strong">techmap.py · v0.3.1</span>
            <span className="muted" style={{ flex: 1 }}>pulling from mluggy/techmap · last sync 4m ago</span>
            <button className="btn sm ghost"><Icon name="refresh" size={12} /> Sync now</button>
            <button className="btn sm ghost"><Icon name="github" size={12} /> Source</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SettingsPage = () => {
  return (
    <div className="page">
      <Topbar crumbs={["Account","Settings"]} />
      <div className="page-body" style={{ padding: 22, maxWidth: 820 }}>
        <div className="panel" style={{ padding: 18, marginBottom: 14 }}>
          <h4 className="section-title">Sync & sources</h4>
          {[
            { n: "techmap (mluggy/techmap)", sub: "GitHub-backed job feed", on: true },
            { n: "LinkedIn Jobs", sub: "Chrome extension required", on: false },
            { n: "Greenhouse boards", sub: "Direct API pull", on: true },
          ].map((s, i) => (
            <div key={i} className="row" style={{ gap: 10, padding: "10px 0", borderTop: i ? "1px solid var(--border)" : 0 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500 }}>{s.n}</div>
                <div className="muted" style={{ fontSize: 11.5 }}>{s.sub}</div>
              </div>
              <div className={`switch${s.on?" on":""}`} />
            </div>
          ))}
        </div>
        <div className="panel" style={{ padding: 18, marginBottom: 14 }}>
          <h4 className="section-title">Notifications</h4>
          {[
            { n: "New jobs matching your filters", on: true },
            { n: "Interview reminders (24h before)", on: true },
            { n: "Webhook failures",                 on: true },
            { n: "Weekly summary email",             on: false },
          ].map((s, i) => (
            <div key={i} className="row" style={{ gap: 10, padding: "10px 0", borderTop: i ? "1px solid var(--border)" : 0 }}>
              <div style={{ flex: 1 }}>{s.n}</div>
              <div className={`switch${s.on?" on":""}`} />
            </div>
          ))}
        </div>
        <div className="panel" style={{ padding: 18, marginBottom: 14 }}>
          <h4 className="section-title">Data & privacy</h4>
          <div className="stack-sm">
            <button className="btn"><Icon name="download" size={12} /> Export all data (JSON)</button>
            <button className="btn danger"><Icon name="trash" size={12} /> Delete account</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const TrackerPage = () => {
  const { JOBS, STAGES } = window.JT_DATA;
  const byStage = STAGES.map((_, i) => JOBS.filter(j => j.stage === i));
  return (
    <div className="page">
      <Topbar crumbs={["Workspace","Tracker"]} actions={
        <>
          <button className="btn ghost"><Icon name="filter" size={12} /> Filters</button>
          <button className="btn primary"><Icon name="plus" /> Add</button>
        </>
      }/>
      <div style={{ flex: 1, overflow: "auto", padding: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${STAGES.length}, minmax(240px, 1fr))`, gap: 10 }}>
          {STAGES.map((st, i) => (
            <div key={st} className="panel" style={{ background: "var(--surface-2)", display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 120px)" }}>
              <div className="panel-header" style={{ borderBottom: 0, paddingBottom: 4 }}>
                <span>{st}</span>
                <span className="mono-strong muted">{byStage[i].length}</span>
                <button className="icon-btn" style={{ marginLeft: "auto" }}><Icon name="plus" size={12} /></button>
              </div>
              <div style={{ padding: "0 8px 8px", display: "flex", flexDirection: "column", gap: 6, overflow: "auto" }}>
                {byStage[i].map(j => (
                  <div key={j.id} className="panel" style={{ padding: 10, cursor: "grab", background: "var(--surface)" }}>
                    <div className="row" style={{ gap: 8 }}>
                      <CompanyLogo company={j.company} color={j.color} />
                      <div style={{ fontWeight: 500, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{j.company}</div>
                    </div>
                    <div style={{ fontSize: 12, marginTop: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{j.role}</div>
                    <div className="row" style={{ marginTop: 8, justifyContent: "space-between" }}>
                      <span className="mono-strong" style={{ fontSize: 11 }}>{j.salary}</span>
                      <span className="muted mono" style={{ fontSize: 11 }}>{j.posted}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { ProfilePage, IntegrationsPage, SettingsPage, TrackerPage });
