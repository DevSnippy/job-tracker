// Job detail full page + Apply flow modal
const { useState: uSJ, useMemo: uMJ } = React;

const JobDetail = ({ jobId, onBack, onOpenApply }) => {
  const { JOBS } = window.JT_DATA;
  const job = JOBS.find(j => j.id === jobId) || JOBS[0];
  const [tab, setTab] = uSJ("overview");
  return (
    <div className="page">
      <Topbar crumbs={["Workspace","Jobs", job.company]} actions={
        <>
          <button className="btn ghost" onClick={onBack}><Icon name="arrowLeft" size={12} /> Back</button>
          <button className="btn"><Icon name="star" size={12} /> Save</button>
          <button className="btn"><Icon name="external" size={12} /> Source</button>
          <button className="btn primary" onClick={onOpenApply}><Icon name="zap" size={12} /> Apply</button>
        </>
      }/>
      <div className="page-body">
        <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--border)" }}>
          <div className="row" style={{ gap: 14 }}>
            <div style={{ width: 56, height: 56, borderRadius: 10, background: job.color, color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 22 }}>{job.company[0]}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.015em" }}>{job.role}</div>
              <div className="row" style={{ gap: 8, marginTop: 4 }}>
                <span style={{ fontWeight: 500 }}>{job.company}</span>
                <span className="muted">·</span>
                <span className="muted row" style={{ gap: 4 }}><Icon name="map" size={12} /> {job.loc}</span>
                <span className="muted">·</span>
                <span className="muted">{job.remote}</span>
                <span className="muted">·</span>
                <span className="muted">{job.type}</span>
                <span className="muted">·</span>
                <span className="muted row" style={{ gap: 4 }}><Icon name="clock" size={12} /> Posted {job.posted} ago</span>
              </div>
            </div>
            <div className="col" style={{ alignItems: "flex-end", gap: 6 }}>
              <div className="mono-strong" style={{ fontSize: 13, color: "var(--text)" }}>{job.salary}</div>
              <StatusChip status={job.status} />
            </div>
          </div>
          <div className="row" style={{ marginTop: 14, gap: 6, flexWrap: "wrap" }}>
            <span className="chip mono-strong">{job.id}</span>
            <span className="chip">techmap</span>
            {job.stack.map(t => <span key={t} className="chip chip-accent">{t}</span>)}
          </div>
        </div>

        <div className="tabs">
          {["overview","description","company","activity","notes"].map(t => (
            <button key={t} className={`tab${tab===t?" active":""}`} onClick={()=>setTab(t)}>
              {t.charAt(0).toUpperCase()+t.slice(1)}
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 22, padding: 22 }}>
          <div className="col" style={{ gap: 22 }}>
            <section>
              <h4 className="section-title">About the role</h4>
              <p>Senior role owning frontend architecture for our cloud-security console. Partner closely with design and backend to ship new surface area, contribute to the internal design system, and drive perf work on data-dense tables and graph visualizations.</p>
              <p>You'll be one of five senior frontend engineers on a team that ships weekly, reviews each other's PRs, and cares a lot about craft.</p>
            </section>

            <section>
              <h4 className="section-title">What you'll do</h4>
              <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
                <li>Architect and ship major product surfaces in React + TypeScript</li>
                <li>Extend the internal design system — tokens, primitives, patterns</li>
                <li>Own perf budgets; profile and optimize large table + graph views</li>
                <li>Mentor 1–2 mid-level engineers; set code-review tone</li>
                <li>Partner with product design on flows before they hit Figma</li>
              </ul>
            </section>

            <section>
              <h4 className="section-title">Requirements</h4>
              <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
                <li>6+ years production React / TypeScript</li>
                <li>Shipped a design-system or component library at scale</li>
                <li>Comfortable with data-dense B2B UX patterns</li>
                <li>Experience with observability / security tooling is a plus</li>
              </ul>
            </section>

            <section>
              <h4 className="section-title">Activity</h4>
              <div className="panel">
                {[
                  { t: "You saved this job", who: "You", when: "5 days ago", icon: "star" },
                  { t: "Webhook fired → Notion DB",   who: "n8n · Applications", when: "5 days ago", icon: "plug" },
                  { t: "Resume attached: Senior Frontend — General.pdf", who: "You", when: "4 days ago", icon: "doc" },
                  { t: "Applied via company website", who: "You", when: "4 days ago", icon: "check" },
                  { t: "Recruiter reached out",        who: "gmail inbox",    when: "2 days ago", icon: "mail" },
                ].map((e,i) => (
                  <div key={i} className="row" style={{ gap: 10, padding: "10px 14px", borderTop: i ? "1px solid var(--border)" : 0 }}>
                    <span style={{ width: 22, height: 22, borderRadius: 5, background: "var(--surface-2)", display: "grid", placeItems: "center", color: "var(--text-2)" }}><Icon name={e.icon} size={12} /></span>
                    <span style={{ flex: 1 }}>{e.t}</span>
                    <span className="muted mono-strong">{e.who}</span>
                    <span className="muted mono-strong">{e.when}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="col" style={{ gap: 14 }}>
            <div className="panel" style={{ padding: 14 }}>
              <h4 className="section-title">Match score</h4>
              <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em" }}>87<span className="muted" style={{ fontSize: 14, fontWeight: 400 }}> / 100</span></div>
              <div className="muted" style={{ fontSize: 11.5 }}>Based on your default resume</div>
              <div className="stack-sm" style={{ marginTop: 12 }}>
                {[
                  { k: "React experience", v: 95 },
                  { k: "TypeScript", v: 92 },
                  { k: "Design systems", v: 80 },
                  { k: "Security domain", v: 45 },
                ].map(r => (
                  <div key={r.k}>
                    <div className="row" style={{ justifyContent: "space-between", fontSize: 11.5 }}>
                      <span>{r.k}</span>
                      <span className="mono-strong">{r.v}%</span>
                    </div>
                    <div style={{ height: 4, background: "var(--surface-2)", borderRadius: 2, marginTop: 3 }}>
                      <div style={{ width: `${r.v}%`, height: "100%", background: "var(--accent)", borderRadius: 2 }}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel" style={{ padding: 14 }}>
              <h4 className="section-title">Company</h4>
              <div className="row" style={{ gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: job.color, color: "#fff", display: "grid", placeItems: "center", fontWeight: 700 }}>{job.company[0]}</div>
                <div>
                  <div style={{ fontWeight: 600 }}>{job.company}</div>
                  <div className="muted" style={{ fontSize: 11.5 }}>Cloud Security · 900–1500</div>
                </div>
              </div>
              <div className="stack-sm" style={{ marginTop: 10, fontSize: 12 }}>
                <div className="row"><Icon name="globe" size={12} /><span className="muted">wiz.io</span></div>
                <div className="row"><Icon name="building" size={12} /><span className="muted">HQ in Tel Aviv, NY</span></div>
                <div className="row"><Icon name="trend" size={12} /><span className="muted">Series E · $1.9B raised</span></div>
              </div>
            </div>

            <div className="panel" style={{ padding: 14 }}>
              <h4 className="section-title">Similar roles</h4>
              <div className="stack-sm">
                {window.JT_DATA.JOBS.filter(j=>j.id!==job.id).slice(0,3).map(j=>(
                  <div key={j.id} className="row" style={{ gap: 8, padding: "6px 0", borderTop: "1px solid var(--border)" }}>
                    <CompanyLogo company={j.company} color={j.color} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{j.role}</div>
                      <div className="muted" style={{ fontSize: 11 }}>{j.company}</div>
                    </div>
                    <span className="mono-strong" style={{ fontSize: 11 }}>{j.salary}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

const ApplyModal = ({ job, onClose }) => {
  const { RESUMES } = window.JT_DATA;
  const [step, setStep] = uSJ(0);
  const [resume, setResume] = uSJ(RESUMES[0].id);
  const [coverLetter, setCoverLetter] = uSJ("AI-draft");
  const [fireWebhook, setFireWebhook] = uSJ(true);

  const steps = ["Resume", "Cover letter", "Review", "Fired"];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,12,18,0.45)", display: "grid", placeItems: "center", zIndex: 100 }} onClick={onClose}>
      <div className="panel" style={{ width: 620, maxHeight: "86vh", overflow: "auto", boxShadow: "var(--shadow-lg)" }} onClick={e=>e.stopPropagation()}>
        <div className="panel-header">
          <Icon name="zap" />
          Apply — {job?.company || "Wiz"} · {job?.role || "Senior Frontend Engineer"}
          <span style={{ flex: 1 }} />
          <button className="icon-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
          <div className="row" style={{ gap: 6 }}>
            {steps.map((s,i) => (
              <React.Fragment key={i}>
                <div className="row" style={{ gap: 6, color: i<=step?"var(--text)":"var(--text-3)" }}>
                  <span style={{ width: 18, height: 18, borderRadius: "50%", background: i<step?"var(--accent)":i===step?"var(--accent-soft)":"var(--surface-2)", color: i<step?"#fff":"var(--text-2)", display:"grid", placeItems:"center", fontSize: 11, fontWeight: 600 }}>
                    {i<step?"✓":i+1}
                  </span>
                  <span style={{ fontSize: 12.5, fontWeight: i===step?500:400 }}>{s}</span>
                </div>
                {i < steps.length-1 && <span style={{ flex: 1, height: 1, background: i<step?"var(--accent)":"var(--border)" }}/>}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div style={{ padding: 18 }}>
          {step === 0 && (
            <div>
              <h4 className="section-title">Pick a resume</h4>
              <div className="stack-sm">
                {RESUMES.map(r => (
                  <label key={r.id} className="panel" style={{ padding: 10, display: "flex", gap: 10, alignItems: "center", cursor: "pointer", borderColor: resume===r.id ? "var(--accent)" : "var(--border)", boxShadow: resume===r.id ? "0 0 0 2px var(--accent-soft)" : "none" }}>
                    <input type="radio" checked={resume===r.id} onChange={()=>setResume(r.id)} />
                    <Icon name="doc" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500 }}>{r.name}</div>
                      <div className="muted" style={{ fontSize: 11.5 }}>Template: {r.template} · {r.pages} pages · updated {r.updated}</div>
                    </div>
                    {r.default && <span className="chip chip-accent">default</span>}
                  </label>
                ))}
              </div>
              <button className="btn ghost sm" style={{ marginTop: 10 }}><Icon name="plus" size={12} /> Upload another</button>
            </div>
          )}

          {step === 1 && (
            <div>
              <h4 className="section-title">Cover letter</h4>
              <div className="row" style={{ gap: 6, marginBottom: 10 }}>
                {["AI-draft","Template","None"].map(c => (
                  <button key={c} className={`btn sm ${coverLetter===c?"":"ghost"}`} onClick={()=>setCoverLetter(c)}>{c}</button>
                ))}
                {coverLetter==="AI-draft" && <span className="chip chip-accent"><Icon name="sparkle" size={10} /> Draft with Claude</span>}
              </div>
              <textarea className="input" rows={10} defaultValue={`Hi Wiz team,\n\nI'm writing about the Senior Frontend Engineer role. Over the last seven years I've shipped data-dense B2B consoles — most recently at a Series C observability startup where I led the move to a tokenized design system and rebuilt our tables layer for large datasets.\n\nYour focus on craft and the depth of your product surface maps closely to what I'm looking for next. I've attached a tailored resume.\n\n— Yonatan`}/>
            </div>
          )}

          {step === 2 && (
            <div>
              <h4 className="section-title">Review</h4>
              <dl style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "10px 14px", margin: 0 }}>
                <dt className="muted">Role</dt><dd>{job?.role || "Senior Frontend Engineer"} @ {job?.company || "Wiz"}</dd>
                <dt className="muted">Resume</dt><dd>{RESUMES.find(r=>r.id===resume)?.name}</dd>
                <dt className="muted">Cover letter</dt><dd>{coverLetter}</dd>
                <dt className="muted">Fire webhooks</dt><dd><label className="row" style={{ gap: 6 }}><span className={`switch${fireWebhook?" on":""}`} onClick={()=>setFireWebhook(!fireWebhook)} /> POST to 3 active webhooks</label></dd>
                <dt className="muted">Status after</dt><dd><StatusChip status="applied" /></dd>
              </dl>
            </div>
          )}

          {step === 3 && (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--success-soft)", color: "var(--success)", display: "grid", placeItems: "center", margin: "0 auto 14px" }}>
                <Icon name="check" size={24} stroke={2.25} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>Application fired</div>
              <div className="muted">Status updated · 3 webhooks POSTed successfully</div>
              <div className="panel mono-strong" style={{ textAlign: "left", marginTop: 14, padding: 12, fontSize: 11.5 }}>
                {`POST https://n8n.example.com/webhook/a2f9e1\n→ 200 OK · 214ms\nPOST https://n8n.example.com/webhook/b71d03\n→ 200 OK · 187ms\nPOST https://n8n.example.com/webhook/d913ab\n→ 200 OK · 341ms`.split("\n").map((l,i)=><div key={i}>{l}</div>)}
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <div className="row" style={{ gap: 6 }}>
            {step > 0 && step < 3 && <button className="btn" onClick={()=>setStep(step-1)}>Back</button>}
            {step < 2 && <button className="btn primary" onClick={()=>setStep(step+1)}>Continue <Icon name="arrowRight" size={12} /></button>}
            {step === 2 && <button className="btn primary" onClick={()=>setStep(3)}><Icon name="zap" size={12} /> Fire application</button>}
            {step === 3 && <button className="btn primary" onClick={onClose}>Done</button>}
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { JobDetail, ApplyModal });
