// Dashboard + Jobs list (primary dense table) + variants
const { useState: uS1, useMemo: uM1 } = React;

const Dashboard = ({ onNavigate }) => {
  const { JOBS } = window.JT_DATA;
  const stats = [
    { label: "Saved",      value: JOBS.filter(j=>j.status==="saved").length, delta: "+4 this week" },
    { label: "Applied",    value: JOBS.filter(j=>j.status==="applied").length, delta: "+2 this week" },
    { label: "Interviews", value: JOBS.filter(j=>j.status==="interview").length, delta: "+1 this week" },
    { label: "Offers",     value: JOBS.filter(j=>j.status==="offer").length, delta: "1 active" },
  ];
  return (
    <div className="page">
      <Topbar crumbs={["Workspace", "Dashboard"]} actions={
        <>
          <button className="btn ghost"><Icon name="refresh" /> Sync techmap</button>
          <button className="btn primary" onClick={() => onNavigate("jobs")}><Icon name="briefcase" /> Open jobs</button>
        </>
      }/>
      <div className="page-body">
        <div className="stat-grid">
          {stats.map(s => (
            <div className="stat" key={s.label}>
              <div className="label">{s.label}</div>
              <div className="value">{s.value}</div>
              <div className="delta">{s.delta}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: "0 14px 18px" }}>
          <div className="panel">
            <div className="panel-header">
              Upcoming
              <span className="subtitle">interviews · deadlines · follow-ups</span>
            </div>
            <div style={{ padding: "6px 0" }}>
              {[
                { t: "Interview · Fiverr", s: "Technical · Round 2", when: "Tomorrow · 10:30", dot: "var(--warn)" },
                { t: "Follow-up · Wiz",    s: "Email recruiter",    when: "Apr 26 · 09:00", dot: "var(--accent)" },
                { t: "Offer deadline",     s: "Papaya Global",      when: "Apr 28 · 18:00", dot: "var(--success)" },
                { t: "Intro call · Deel",  s: "Screening",          when: "May 02 · 15:00", dot: "var(--info)" },
              ].map((r,i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", borderTop: i ? "1px solid var(--border)" : 0 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: r.dot, flex: "0 0 6px" }}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500 }}>{r.t}</div>
                    <div className="muted" style={{ fontSize: 11.5 }}>{r.s}</div>
                  </div>
                  <span className="mono-strong">{r.when}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const JobsPage = ({ onOpen, onTailor, initialView = "table" }) => {
  const { JOBS } = window.JT_DATA;
  const [view, setView] = uS1(initialView);
  const [q, setQ] = uS1("");
  const [selected, setSelected] = uS1(new Set());
  const [statusFilter, setStatusFilter] = uS1("all");
  const [pasteOpen, setPasteOpen] = uS1(false);

  const filtered = uM1(() => {
    let out = JOBS;
    if (q) {
      const qq = q.toLowerCase();
      out = out.filter(j => j.company.toLowerCase().includes(qq) || j.role.toLowerCase().includes(qq) || j.loc.toLowerCase().includes(qq));
    }
    if (statusFilter !== "all") out = out.filter(j => j.status === statusFilter);
    return out;
  }, [q, statusFilter]);

  const toggle = (id) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };

  return (
    <div className="page">
      <Topbar crumbs={["Workspace", "Jobs"]} actions={
        <>
          <div className="row" style={{ gap: 2, border: "1px solid var(--border)", borderRadius: 6, padding: 2 }}>
            <button className={`icon-btn${view==="table"?" active":""}`} style={{ background: view==="table"?"var(--hover)":"transparent" }} onClick={()=>setView("table")} title="Table"><Icon name="list" /></button>
            <button className={`icon-btn${view==="split"?" active":""}`} style={{ background: view==="split"?"var(--hover)":"transparent" }} onClick={()=>setView("split")} title="Split"><Icon name="split" /></button>
            <button className={`icon-btn${view==="grid"?" active":""}`} style={{ background: view==="grid"?"var(--hover)":"transparent" }} onClick={()=>setView("grid")} title="Grid"><Icon name="grid" /></button>
          </div>
          <button className="btn ghost"><Icon name="refresh" /> Sync techmap</button>
          <button className="btn" onClick={()=>setPasteOpen(true)}><Icon name="link" /> Paste URL</button>
          <button className="btn primary" onClick={()=>onTailor(filtered[0]?.id)}><Icon name="sparkle" /> Tailor resume</button>
        </>
      }/>

      <div className="filter-bar">
        <div className="search-wrap">
          <Icon name="search" size={13} />
          <input className="input" placeholder="Filter by company, role, location…" value={q} onChange={e=>setQ(e.target.value)}/>
        </div>
        <div className="row" style={{ gap: 4 }}>
          {["all","saved","interested","applied","interview","offer"].map(s => (
            <button key={s} className={`btn sm ${statusFilter===s?"":"ghost"}`} onClick={()=>setStatusFilter(s)}>
              {s.charAt(0).toUpperCase()+s.slice(1)}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <span className="mono-strong muted">{filtered.length} jobs</span>
        <div className="sep" />
        <button className="btn sm ghost"><Icon name="filter" size={12} /> Filters</button>
        <button className="btn sm ghost"><Icon name="sortAsc" size={12} /> Sort</button>
        {selected.size > 0 && (
          <>
            <div className="sep" />
            <span className="chip chip-accent">{selected.size} selected</span>
            <button className="btn sm">Tailor all…</button>
            <button className="btn sm ghost"><Icon name="trash" size={12} /></button>
          </>
        )}
      </div>

      {view === "table" && <JobsTable jobs={filtered} selected={selected} toggle={toggle} onOpen={onOpen} onTailor={onTailor} />}
      {view === "split" && <JobsSplit jobs={filtered} onOpen={onOpen} onTailor={onTailor} />}
      {view === "grid"  && <JobsGrid jobs={filtered} onOpen={onOpen} onTailor={onTailor} />}

      {pasteOpen && <PasteUrlModal onClose={()=>setPasteOpen(false)} onTailor={(id)=>{setPasteOpen(false); onTailor(id);}} />}
    </div>
  );
};

const PasteUrlModal = ({ onClose, onTailor }) => {
  const [url, setUrl] = uS1("");
  const [stage, setStage] = uS1("idle"); // idle | fetching | done
  const [parsed, setParsed] = uS1(null);
  const run = () => {
    setStage("fetching");
    setTimeout(() => {
      setParsed({
        company: "Elementor",
        role: "Full Stack Developer",
        loc: "Ramat Gan",
        remote: "Hybrid",
        stack: ["PHP","React","MySQL","Node"],
        source: url || "elementor.com/careers/",
      });
      setStage("done");
    }, 1400);
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "grid", placeItems: "center", zIndex: 100 }} onClick={onClose}>
      <div className="panel" style={{ width: 560, boxShadow: "var(--shadow-lg)" }} onClick={e=>e.stopPropagation()}>
        <div className="panel-header">
          <Icon name="link" /> Add job from URL
          <span style={{ flex: 1 }} />
          <button className="icon-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div style={{ padding: 16 }}>
          <label className="field-label">Paste any job posting URL</label>
          <div className="row" style={{ gap: 6 }}>
            <input className="input mono" placeholder="https://elementor.com/careers/position/full-stack-developer" value={url} onChange={e=>setUrl(e.target.value)} />
            <button className="btn primary" onClick={run} disabled={stage==="fetching"}>
              {stage==="fetching" ? <><Icon name="refresh" size={12} /> Fetching…</> : <>Fetch</>}
            </button>
          </div>
          <div className="muted" style={{ fontSize: 11.5, marginTop: 6 }}>
            Backend tunnels to the page, extracts structured fields, and optionally tailors your resume.
          </div>

          {stage === "fetching" && (
            <div className="panel mono" style={{ marginTop: 14, padding: 12, fontSize: 11, background: "var(--surface-2)" }}>
              <div>→ GET {url || "…"}</div>
              <div>→ parsing HTML / JSON-LD</div>
              <div>→ extracting: company, role, location, stack</div>
              <div className="muted">… 1.2s</div>
            </div>
          )}

          {stage === "done" && parsed && (
            <div className="panel" style={{ marginTop: 14, padding: 14 }}>
              <div className="row" style={{ gap: 10, marginBottom: 10 }}>
                <span className="chip chip-success dot">Parsed</span>
                <span className="muted mono-strong">{parsed.source}</span>
              </div>
              <dl style={{ display: "grid", gridTemplateColumns: "90px 1fr", gap: "6px 12px", margin: 0 }}>
                <dt className="muted">Company</dt><dd style={{ fontWeight: 500 }}>{parsed.company}</dd>
                <dt className="muted">Role</dt><dd style={{ fontWeight: 500 }}>{parsed.role}</dd>
                <dt className="muted">Location</dt><dd>{parsed.loc} · {parsed.remote}</dd>
                <dt className="muted">Stack</dt>
                <dd><span className="row" style={{ gap: 4, flexWrap: "wrap" }}>{parsed.stack.map(s=><span key={s} className="chip chip-accent">{s}</span>)}</span></dd>
              </dl>
              <div className="row" style={{ gap: 6, marginTop: 14, justifyContent: "flex-end" }}>
                <button className="btn" onClick={onClose}>Save only</button>
                <button className="btn primary" onClick={()=>onTailor("elementor-fs")}><Icon name="sparkle" size={12} /> Tailor resume now</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const JobsTable = ({ jobs, selected, toggle, onOpen, onTailor }) => (
  <div className="table-scroll">
    <table className="data">
      <thead>
        <tr>
          <th style={{ width: 28 }}></th>
          <th>Company</th>
          <th>Role</th>
          <th>Location</th>
          <th>Remote</th>
          <th>Stack</th>
          <th>Match</th>
          <th>Status</th>
          <th>Stage</th>
          <th style={{ textAlign: "right" }}>Posted</th>
          <th style={{ width: 120, textAlign: "right" }}></th>
        </tr>
      </thead>
      <tbody>
        {jobs.map((j, idx) => {
          const match = 60 + ((idx * 11) % 35);
          return (
            <tr key={j.id} className={selected.has(j.id) ? "selected" : ""}>
              <td onClick={(e)=>{e.stopPropagation(); toggle(j.id);}}>
                <input type="checkbox" checked={selected.has(j.id)} onChange={()=>{}} />
              </td>
              <td className="company-cell" onClick={()=>onOpen(j.id)} style={{cursor:"pointer"}}>
                <CompanyLogo company={j.company} color={j.color} />
                {j.company}
              </td>
              <td onClick={()=>onOpen(j.id)} style={{ color: "var(--text)", cursor: "pointer", fontWeight: 500 }}>{j.role}</td>
              <td className="muted">{j.loc}</td>
              <td><span className="chip">{j.remote}</span></td>
              <td>
                <span className="row" style={{ gap: 3 }}>
                  {j.stack.slice(0,2).map(t => <span key={t} className="chip">{t}</span>)}
                  {j.stack.length > 2 && <span className="muted mono" style={{fontSize:11}}>+{j.stack.length-2}</span>}
                </span>
              </td>
              <td><MatchBar value={match} /></td>
              <td><StatusChip status={j.status} /></td>
              <td><StageBar stage={j.stage} /></td>
              <td className="muted" style={{ textAlign: "right" }}>{j.posted}</td>
              <td style={{ textAlign: "right" }}>
                <div className="row" style={{ gap: 4, justifyContent: "flex-end" }}>
                  <button className="btn sm" onClick={(e)=>{e.stopPropagation(); onTailor(j.id);}}>
                    <Icon name="sparkle" size={12} /> Tailor
                  </button>
                  <button className="icon-btn" onClick={(e)=>e.stopPropagation()}><Icon name="dotsV" /></button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

const MatchBar = ({ value }) => (
  <div className="row" style={{ gap: 6, minWidth: 70 }}>
    <div style={{ width: 42, height: 4, background: "var(--surface-2)", borderRadius: 2 }}>
      <div style={{ width: `${value}%`, height: "100%", background: value >= 80 ? "var(--success)" : value >= 60 ? "var(--accent)" : "var(--warn)", borderRadius: 2 }}/>
    </div>
    <span className="mono-strong" style={{ fontSize: 11 }}>{value}</span>
  </div>
);

const JobsSplit = ({ jobs, onOpen, onTailor }) => {
  const [active, setActive] = uS1(jobs[0]?.id);
  const current = jobs.find(j => j.id === active) || jobs[0];
  return (
    <div className="split" style={{ flex: 1 }}>
      <div className="panel-col">
        <table className="data">
          <tbody>
            {jobs.map(j => (
              <tr key={j.id} className={current?.id===j.id?"selected":""} onClick={()=>setActive(j.id)} style={{cursor:"pointer"}}>
                <td className="company-cell" style={{ minWidth: 170 }}>
                  <CompanyLogo company={j.company} color={j.color} />
                  <div style={{ display:"flex", flexDirection:"column", gap:1 }}>
                    <span style={{ fontWeight: 500 }}>{j.company}</span>
                    <span className="muted" style={{ fontSize: 11.5 }}>{j.role}</span>
                  </div>
                </td>
                <td><span className="chip">{j.remote}</span></td>
                <td><StatusChip status={j.status} /></td>
                <td className="muted" style={{textAlign:"right"}}>{j.posted}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="panel-col" style={{ padding: 18 }}>
        {current && <JobDetailInline job={current} onOpenFull={() => onOpen(current.id)} onTailor={()=>onTailor(current.id)} />}
      </div>
    </div>
  );
};

const JobsGrid = ({ jobs, onOpen, onTailor }) => (
  <div style={{ flex: 1, overflow: "auto", padding: 14 }}>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
      {jobs.map(j => (
        <div key={j.id} className="panel" style={{ padding: 14 }}>
          <div className="row" style={{ gap: 10 }}>
            <CompanyLogo company={j.company} color={j.color} />
            <div className="col" style={{ gap: 2, flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600 }}>{j.company}</div>
              <div className="muted" style={{ fontSize: 11.5 }}>{j.loc} · {j.remote}</div>
            </div>
            <StatusChip status={j.status} />
          </div>
          <div style={{ marginTop: 10, fontWeight: 500, cursor: "pointer" }} onClick={()=>onOpen(j.id)}>{j.role}</div>
          <div className="row" style={{ marginTop: 10, gap: 4, flexWrap: "wrap" }}>
            {j.stack.map(t => <span key={t} className="chip">{t}</span>)}
          </div>
          <div className="row" style={{ marginTop: 12, justifyContent: "space-between", fontSize: 11 }}>
            <StageBar stage={j.stage} />
            <span className="muted">{j.posted}</span>
          </div>
          <div className="row" style={{ marginTop: 10, gap: 6 }}>
            <button className="btn sm" style={{ flex: 1 }} onClick={()=>onOpen(j.id)}>Open</button>
            <button className="btn sm primary" style={{ flex: 1 }} onClick={()=>onTailor(j.id)}><Icon name="sparkle" size={12} /> Tailor</button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const JobDetailInline = ({ job, onOpenFull, onTailor }) => (
  <div>
    <div className="row" style={{ gap: 12 }}>
      <div style={{ width: 40, height: 40, borderRadius: 8, background: job.color, color: "#fff", display: "grid", placeItems: "center", fontWeight: 700 }}>{job.company[0]}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em" }}>{job.role}</div>
        <div className="muted">{job.company} · {job.loc} · {job.remote}</div>
      </div>
      <button className="btn ghost sm" onClick={onOpenFull}><Icon name="external" size={12} /> Open</button>
    </div>
    <div className="row" style={{ marginTop: 14, gap: 6, flexWrap: "wrap" }}>
      <span className="chip mono-strong">{job.id}</span>
      <span className="chip">{job.type}</span>
      {job.stack.map(t => <span key={t} className="chip chip-accent">{t}</span>)}
    </div>
    <h4 className="section-title" style={{ marginTop: 18 }}>Description</h4>
    <p className="muted">Senior role owning frontend architecture for a fast-growing product. Partner closely with design and backend to ship the customer-facing console.</p>
    <div className="row" style={{ marginTop: 18, gap: 8 }}>
      <button className="btn primary" onClick={onTailor}><Icon name="sparkle" size={12} /> Tailor resume</button>
      <button className="btn"><Icon name="star" size={12} /> Save</button>
      <button className="btn ghost"><Icon name="external" size={12} /> Source</button>
    </div>
  </div>
);

Object.assign(window, { Dashboard, JobsPage, JobDetailInline, PasteUrlModal });
