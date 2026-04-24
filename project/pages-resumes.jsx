// Resume manager + Resume editor
const { useState: uSR, useMemo: uMR, useRef: uRR } = React;

const ResumesPage = ({ onEdit }) => {
  const { RESUMES } = window.JT_DATA;
  const [dragOver, setDragOver] = uSR(false);
  const [items, setItems] = uSR(RESUMES);
  const fileRef = uRR(null);

  const handleFiles = (files) => {
    const newItems = Array.from(files).map((f, i) => ({
      id: `u${Date.now()}-${i}`,
      name: f.name,
      template: "Vanguard",
      updated: "just now",
      size: `${Math.round(f.size/1024)} KB`,
      pages: 2,
      default: false,
      tags: ["Uploaded"],
    }));
    setItems([...newItems, ...items]);
  };

  return (
    <div className="page">
      <Topbar crumbs={["Documents","Resumes"]} actions={
        <>
          <button className="btn ghost"><Icon name="sparkle" /> Tailor to job</button>
          <button className="btn primary" onClick={()=>fileRef.current?.click()}><Icon name="upload" /> Upload resumes</button>
        </>
      }/>
      <div className="page-body" style={{ padding: 22 }}>
        <input ref={fileRef} type="file" multiple accept=".pdf,.docx,.txt" style={{ display:"none" }} onChange={e=>handleFiles(e.target.files)} />
        <div
          className={`dropzone${dragOver?" active":""}`}
          onDragOver={e=>{e.preventDefault(); setDragOver(true);}}
          onDragLeave={()=>setDragOver(false)}
          onDrop={e=>{e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files);}}
          onClick={()=>fileRef.current?.click()}
          style={{ cursor: "pointer" }}
        >
          <Icon name="upload" size={22} />
          <div style={{ fontSize: 14, fontWeight: 500, margin: "8px 0 2px", color: "var(--text)" }}>Drop resumes here or click to browse</div>
          <div style={{ fontSize: 12 }}>PDF, DOCX, TXT · up to 10 MB each · multi-upload supported</div>
        </div>

        <h4 className="section-title" style={{ marginTop: 24 }}>Your resumes · {items.length}</h4>
        <div className="panel">
          <table className="data">
            <thead>
              <tr>
                <th>Name</th>
                <th>Template</th>
                <th>Tags</th>
                <th>Pages</th>
                <th>Size</th>
                <th>Updated</th>
                <th style={{ width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map(r => (
                <tr key={r.id}>
                  <td className="company-cell">
                    <Icon name="doc" />
                    <span style={{ fontWeight: 500 }}>{r.name}</span>
                    {r.default && <span className="chip chip-accent">default</span>}
                  </td>
                  <td className="muted">{r.template}</td>
                  <td>
                    <span className="row" style={{ gap: 4 }}>
                      {r.tags.map(t => <span key={t} className="chip">{t}</span>)}
                    </span>
                  </td>
                  <td className="mono-strong">{r.pages}</td>
                  <td className="mono-strong">{r.size}</td>
                  <td className="muted">{r.updated}</td>
                  <td>
                    <div className="row" style={{ gap: 2, justifyContent: "flex-end" }}>
                      <button className="icon-btn" title="Edit" onClick={()=>onEdit(r.id)}><Icon name="edit" /></button>
                      <button className="icon-btn" title="Download"><Icon name="download" /></button>
                      <button className="icon-btn" title="More"><Icon name="dotsV" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Resume preview (SVG-like DOM) — 6 templates mapped to layout variants
const ResumePreview = ({ template, data, scale = 1 }) => {
  const t = template;
  const Section = ({ title, children, style }) => (
    <div style={{ marginBottom: 14, ...style }}>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: t.accent, marginBottom: 6, borderBottom: `1px solid ${t.accent}22`, paddingBottom: 3 }}>{title}</div>
      {children}
    </div>
  );

  const Body = () => {
    switch (t.name) {
      case "Vanguard": return (
        <div>
          <div style={{ borderBottom: `3px solid ${t.accent}`, paddingBottom: 10, marginBottom: 12 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#111" }}>{data.name}</div>
            <div style={{ fontSize: 10.5, color: "#444", marginTop: 2 }}>{data.title}</div>
            <div style={{ fontSize: 9, color: "#666", marginTop: 6, display: "flex", gap: 10 }}>
              <span>{data.email}</span><span>·</span><span>{data.phone}</span><span>·</span><span>{data.location}</span>
            </div>
          </div>
          <Section title="Summary"><div style={{ fontSize: 9.5, lineHeight: 1.55, color: "#333" }}>{data.summary}</div></Section>
          <Section title="Experience">{data.experience.map((e,i)=><ExpItem key={i} e={e}/>)}</Section>
          <Section title="Skills">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {data.skills.map(s => <span key={s} style={{ fontSize: 9, padding: "1px 6px", background: `${t.accent}15`, color: t.accent, borderRadius: 3, fontWeight: 500 }}>{s}</span>)}
            </div>
          </Section>
        </div>
      );
      case "Ledger": return (
        <div style={{ fontFamily: '"Georgia", serif' }}>
          <div style={{ textAlign: "center", borderBottom: `1px solid #222`, paddingBottom: 10, marginBottom: 12 }}>
            <div style={{ fontSize: 24, fontWeight: 400, letterSpacing: "0.08em", textTransform: "uppercase", color: "#111" }}>{data.name}</div>
            <div style={{ fontSize: 10, fontStyle: "italic", color: "#555", marginTop: 4 }}>{data.title}</div>
            <div style={{ fontSize: 9, color: "#666", marginTop: 6 }}>{data.email} · {data.phone} · {data.location}</div>
          </div>
          <Section title="Profile"><div style={{ fontSize: 10, lineHeight: 1.6, color: "#222" }}>{data.summary}</div></Section>
          <Section title="Experience">{data.experience.map((e,i)=><ExpItem key={i} e={e} serif/>)}</Section>
          <Section title="Skills"><div style={{ fontSize: 9.5, color: "#222" }}>{data.skills.join(" · ")}</div></Section>
        </div>
      );
      case "Serif Classic": return (
        <div style={{ fontFamily: '"Georgia", serif' }}>
          <div style={{ fontSize: 26, fontWeight: 400, color: "#111", letterSpacing: "-0.01em" }}>{data.name}</div>
          <div style={{ fontSize: 11, fontStyle: "italic", color: t.accent, marginTop: 2, marginBottom: 2 }}>{data.title}</div>
          <div style={{ fontSize: 9, color: "#666", marginBottom: 12 }}>{data.email} — {data.phone} — {data.location}</div>
          <Section title="Summary"><div style={{ fontSize: 10, lineHeight: 1.65, color: "#333", fontStyle: "italic" }}>{data.summary}</div></Section>
          <Section title="Experience">{data.experience.map((e,i)=><ExpItem key={i} e={e} serif/>)}</Section>
          <Section title="Skills"><div style={{ fontSize: 9.5, color: "#333" }}>{data.skills.join(", ")}</div></Section>
        </div>
      );
      case "Modern Grid": return (
        <div style={{ display: "grid", gridTemplateColumns: "35% 65%", gap: 12 }}>
          <div style={{ background: t.accent, color: "#fff", padding: 12, margin: -14, marginRight: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{data.name}</div>
            <div style={{ fontSize: 9, opacity: 0.85, marginTop: 4 }}>{data.title}</div>
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.3)", marginTop: 14, paddingTop: 10 }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Contact</div>
              <div style={{ fontSize: 8.5, lineHeight: 1.7 }}>
                <div>{data.email}</div><div>{data.phone}</div><div>{data.location}</div>
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Skills</div>
              <div style={{ fontSize: 8.5, lineHeight: 1.7 }}>{data.skills.map(s=><div key={s}>{s}</div>)}</div>
            </div>
          </div>
          <div style={{ paddingLeft: 4 }}>
            <Section title="Summary"><div style={{ fontSize: 9.5, lineHeight: 1.55, color: "#333" }}>{data.summary}</div></Section>
            <Section title="Experience">{data.experience.map((e,i)=><ExpItem key={i} e={e}/>)}</Section>
          </div>
        </div>
      );
      case "Monospace": return (
        <div style={{ fontFamily: '"JetBrains Mono", monospace' }}>
          <div style={{ fontSize: 11, color: "#666" }}># {data.title}</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#111", marginTop: 2 }}>{data.name}</div>
          <div style={{ fontSize: 9, color: "#666", marginTop: 6, marginBottom: 12 }}>
            {data.email} / {data.phone} / {data.location}
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color: t.accent, marginBottom: 4 }}>// summary</div>
          <div style={{ fontSize: 9.5, lineHeight: 1.6, color: "#222", marginBottom: 14 }}>{data.summary}</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: t.accent, marginBottom: 4 }}>// experience</div>
          {data.experience.map((e,i)=><ExpItem key={i} e={e} mono/>)}
          <div style={{ fontSize: 10, fontWeight: 700, color: t.accent, marginTop: 8, marginBottom: 4 }}>// skills</div>
          <div style={{ fontSize: 9, color: "#222" }}>[{data.skills.map(s=>`"${s}"`).join(", ")}]</div>
        </div>
      );
      case "Minimal": return (
        <div>
          <div style={{ fontSize: 30, fontWeight: 300, color: "#111", letterSpacing: "-0.02em" }}>{data.name}</div>
          <div style={{ fontSize: 10.5, color: "#666", marginTop: 2, marginBottom: 2 }}>{data.title}</div>
          <div style={{ fontSize: 9, color: "#999", marginBottom: 18 }}>{data.email} · {data.phone} · {data.location}</div>
          <div style={{ fontSize: 9.5, lineHeight: 1.7, color: "#444", marginBottom: 18 }}>{data.summary}</div>
          <div style={{ fontSize: 10, fontWeight: 500, color: "#111", marginBottom: 6, letterSpacing: "0.02em" }}>Experience</div>
          {data.experience.map((e,i)=><ExpItem key={i} e={e} minimal/>)}
          <div style={{ fontSize: 10, fontWeight: 500, color: "#111", marginTop: 12, marginBottom: 4 }}>Skills</div>
          <div style={{ fontSize: 9, color: "#666" }}>{data.skills.join(" / ")}</div>
        </div>
      );
      default: return null;
    }
  };

  return (
    <div style={{
      background: "#fff",
      color: "#111",
      width: 612,
      minHeight: 792,
      padding: 36,
      boxShadow: "0 12px 40px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.06)",
      transform: `scale(${scale})`,
      transformOrigin: "top center",
      borderRadius: 2,
    }}>
      <Body />
    </div>
  );
};

const ExpItem = ({ e, serif, mono, minimal }) => (
  <div style={{ marginBottom: 8, fontFamily: mono ? '"JetBrains Mono", monospace' : serif ? '"Georgia", serif' : undefined }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
      <div style={{ fontWeight: minimal?500:700, fontSize: 10.5, color: "#111" }}>{e.role}</div>
      <div style={{ fontSize: 9, color: "#666" }}>{e.when}</div>
    </div>
    <div style={{ fontSize: 9.5, color: "#444", fontStyle: serif?"italic":"normal", marginBottom: 3 }}>{e.company} — {e.loc}</div>
    <ul style={{ margin: 0, paddingLeft: 14, fontSize: 9, lineHeight: 1.55, color: "#333" }}>
      {e.bullets.map((b,i) => <li key={i}>{b}</li>)}
    </ul>
  </div>
);

const DEFAULT_RESUME = {
  name: "Yonatan Levi",
  title: "Senior Frontend Engineer",
  email: "yonatan@pm.me",
  phone: "+972 54-123-4567",
  location: "Tel Aviv, IL",
  summary: "Senior engineer with 7+ years building data-dense B2B consoles. Owned design systems, shipped perf-critical tables, and mentored mid-level ICs. Looking for staff-track frontend work at a product-focused company.",
  experience: [
    { role: "Senior Frontend Engineer", company: "Observely", loc: "Tel Aviv", when: "2022 — Present", bullets: ["Led migration to a tokenized design system across 40+ surfaces.","Rebuilt the large-dataset table layer — p95 interaction 420ms → 90ms.","Mentored three mid-level engineers; set code-review culture."] },
    { role: "Frontend Engineer",        company: "Riskified",  loc: "Tel Aviv", when: "2019 — 2022",    bullets: ["Shipped the rules editor and policy explorer used by all tier-1 merchants.","Drove accessibility audit to WCAG AA compliance across the admin."] },
    { role: "Software Engineer",        company: "Cellebrite", loc: "Petah Tikva", when: "2017 — 2019", bullets: ["Built the forensic case-review UI in React + Redux.","Contributed to the internal component library."] },
  ],
  skills: ["React","TypeScript","Node.js","GraphQL","Design Systems","Perf","Accessibility","Figma"],
};

const ResumeEditor = () => {
  const { TEMPLATES } = window.JT_DATA;
  const [template, setTemplate] = uSR(TEMPLATES[0]);
  const [data, setData] = uSR(DEFAULT_RESUME);
  const [tab, setTab] = uSR("basics");

  const update = (k, v) => setData(d => ({ ...d, [k]: v }));
  const updateExp = (i, k, v) => setData(d => ({ ...d, experience: d.experience.map((e,idx)=> idx===i?{...e,[k]:v}:e) }));

  return (
    <div className="page">
      <Topbar crumbs={["Documents","Resume Editor"]} actions={
        <>
          <button className="btn ghost"><Icon name="sparkle" /> Tailor with Claude</button>
          <button className="btn"><Icon name="eye" /> Preview</button>
          <button className="btn primary"><Icon name="download" /> Export PDF</button>
        </>
      }/>

      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "420px 1fr", minHeight: 0 }}>
        {/* Editor */}
        <div style={{ borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", minHeight: 0, background: "var(--surface)" }}>
          <div className="tabs">
            {["basics","experience","skills","templates"].map(t=>(
              <button key={t} className={`tab${tab===t?" active":""}`} onClick={()=>setTab(t)}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>
            ))}
          </div>
          <div style={{ padding: 16, overflow: "auto", flex: 1 }}>
            {tab === "basics" && (
              <>
                <div className="form-grid">
                  <div className="field"><label className="field-label">Full name</label><input className="input" value={data.name} onChange={e=>update("name", e.target.value)} /></div>
                  <div className="field"><label className="field-label">Title</label><input className="input" value={data.title} onChange={e=>update("title", e.target.value)} /></div>
                  <div className="field"><label className="field-label">Email</label><input className="input" value={data.email} onChange={e=>update("email", e.target.value)} /></div>
                  <div className="field"><label className="field-label">Phone</label><input className="input" value={data.phone} onChange={e=>update("phone", e.target.value)} /></div>
                  <div className="field" style={{ gridColumn: "1 / -1" }}><label className="field-label">Location</label><input className="input" value={data.location} onChange={e=>update("location", e.target.value)} /></div>
                </div>
                <div className="field">
                  <label className="field-label">Summary</label>
                  <textarea className="input" rows={5} value={data.summary} onChange={e=>update("summary", e.target.value)} />
                </div>
              </>
            )}
            {tab === "experience" && (
              <div className="stack-sm">
                {data.experience.map((e, i) => (
                  <div key={i} className="panel" style={{ padding: 12 }}>
                    <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
                      <span className="mono-strong">#{i+1}</span>
                      <div className="row" style={{ gap: 2 }}>
                        <button className="icon-btn"><Icon name="copy" size={12} /></button>
                        <button className="icon-btn"><Icon name="trash" size={12} /></button>
                      </div>
                    </div>
                    <div className="form-grid">
                      <div className="field"><label className="field-label">Role</label><input className="input" value={e.role} onChange={ev=>updateExp(i,"role",ev.target.value)} /></div>
                      <div className="field"><label className="field-label">Company</label><input className="input" value={e.company} onChange={ev=>updateExp(i,"company",ev.target.value)} /></div>
                      <div className="field"><label className="field-label">Location</label><input className="input" value={e.loc} onChange={ev=>updateExp(i,"loc",ev.target.value)} /></div>
                      <div className="field"><label className="field-label">Dates</label><input className="input" value={e.when} onChange={ev=>updateExp(i,"when",ev.target.value)} /></div>
                    </div>
                    <div className="field" style={{ marginBottom: 0 }}>
                      <label className="field-label">Bullets (one per line)</label>
                      <textarea className="input" rows={4} value={e.bullets.join("\n")} onChange={ev=>updateExp(i,"bullets", ev.target.value.split("\n"))} />
                    </div>
                  </div>
                ))}
                <button className="btn ghost"><Icon name="plus" size={12} /> Add experience</button>
              </div>
            )}
            {tab === "skills" && (
              <div>
                <label className="field-label">Skills (comma-separated)</label>
                <textarea className="input" rows={4} value={data.skills.join(", ")} onChange={e=>update("skills", e.target.value.split(",").map(s=>s.trim()))}/>
                <div className="row" style={{ gap: 4, flexWrap: "wrap", marginTop: 10 }}>
                  {data.skills.map(s => <span key={s} className="chip chip-accent">{s}</span>)}
                </div>
              </div>
            )}
            {tab === "templates" && (
              <div className="template-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
                {TEMPLATES.map(t => (
                  <div key={t.id} className={`template-card${template.id===t.id?" selected":""}`} onClick={()=>setTemplate(t)}>
                    <div className="preview">
                      <div style={{ transform: "scale(0.28)", transformOrigin: "top left", pointerEvents: "none" }}>
                        <ResumePreview template={t} data={data} />
                      </div>
                    </div>
                    <div className="meta">
                      <div>
                        <div className="name">{t.name}</div>
                        <div className="style">{t.style}</div>
                      </div>
                      {template.id===t.id && <Icon name="check" size={14} />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Preview */}
        <div style={{ background: "var(--surface-2)", overflow: "auto", padding: 30, display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
          <div style={{ transform: "scale(0.82)", transformOrigin: "top center" }}>
            <ResumePreview template={template} data={data} />
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { ResumesPage, ResumeEditor, ResumePreview });
