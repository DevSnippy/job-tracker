// App root — router + design_canvas wrapping
const { useState: uSA, useEffect: uEA } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "dark",
  "accentHue": 265
}/*EDITMODE-END*/;

const AppRoot = () => {
  const [tweaks, setTweaks] = useTweaks(TWEAK_DEFAULTS);

  uEA(() => {
    document.documentElement.setAttribute("data-theme", tweaks.theme);
    document.documentElement.style.setProperty("--accent-h", String(tweaks.accentHue));
  }, [tweaks.theme, tweaks.accentHue]);

  return (
    <>
      <DesignCanvas title="Job Tracker — prototype" initialZoom={0.7}>
        <DCSection id="main" title="Main prototype" subtitle="Jobs-first IA · tailoring is the headline feature">
          <DCArtboard id="app-jobs" label="Home · Jobs list (dense table)" width={1360} height={840}>
            <div className="dc-artboard-body" style={{ width: "100%", height: "100%" }}><AppShell initialRoute="jobs" /></div>
          </DCArtboard>
        </DCSection>

        <DCSection id="tailor" title="AI Tailor flow — the headline feature" subtitle="Paste URL → extract JD → ask clarifying Qs → rewrite resume → export">
          <DCArtboard id="paste-url" label="1 · Paste job URL" width={1360} height={840}>
            <div className="dc-artboard-body" style={{ width: "100%", height: "100%" }}><AppShell initialRoute="jobs" showPaste /></div>
          </DCArtboard>
          <DCArtboard id="tailor-analyze" label="2 · JD analyzed" width={1360} height={840}>
            <div className="dc-artboard-body" style={{ width: "100%", height: "100%" }}><AppShell initialRoute="jobs" tailorStart="analyze" /></div>
          </DCArtboard>
          <DCArtboard id="tailor-qa" label="3 · Clarifying questions" width={1360} height={840}>
            <div className="dc-artboard-body" style={{ width: "100%", height: "100%" }}><AppShell initialRoute="jobs" tailorStart="qa" /></div>
          </DCArtboard>
          <DCArtboard id="tailor-review" label="4 · Review tailored resume (diff)" width={1360} height={840}>
            <div className="dc-artboard-body" style={{ width: "100%", height: "100%" }}><AppShell initialRoute="jobs" tailorStart="review" /></div>
          </DCArtboard>
        </DCSection>

        <DCSection id="jobs-variants" title="Jobs list — 3 variants" subtitle="Dense table is primary; split and grid as alternatives">
          <DCArtboard id="jobs-table" label="A · Dense table (primary)" width={1360} height={840}>
            <div className="dc-artboard-body" style={{ width: "100%", height: "100%" }}><AppShell initialRoute="jobs" initialJobsView="table"/></div>
          </DCArtboard>
          <DCArtboard id="jobs-split" label="B · Split view (list + detail)" width={1360} height={840}>
            <div className="dc-artboard-body" style={{ width: "100%", height: "100%" }}><AppShell initialRoute="jobs" initialJobsView="split"/></div>
          </DCArtboard>
          <DCArtboard id="jobs-grid" label="C · Card grid" width={1360} height={840}>
            <div className="dc-artboard-body" style={{ width: "100%", height: "100%" }}><AppShell initialRoute="jobs" initialJobsView="grid"/></div>
          </DCArtboard>
        </DCSection>

        <DCSection id="flows" title="Other flows">
          <DCArtboard id="job-detail" label="Job detail + apply" width={1360} height={840}>
            <div className="dc-artboard-body" style={{ width: "100%", height: "100%" }}><AppShell initialRoute="jobDetail" /></div>
          </DCArtboard>
          <DCArtboard id="tracker" label="Tracker — kanban" width={1360} height={840}>
            <div className="dc-artboard-body" style={{ width: "100%", height: "100%" }}><AppShell initialRoute="tracker" /></div>
          </DCArtboard>
          <DCArtboard id="dashboard" label="Dashboard (secondary)" width={1360} height={840}>
            <div className="dc-artboard-body" style={{ width: "100%", height: "100%" }}><AppShell initialRoute="dashboard" /></div>
          </DCArtboard>
        </DCSection>

        <DCSection id="docs" title="Documents">
          <DCArtboard id="resumes" label="Resume manager · multi-upload" width={1360} height={840}>
            <div className="dc-artboard-body" style={{ width: "100%", height: "100%" }}><AppShell initialRoute="resumes" /></div>
          </DCArtboard>
          <DCArtboard id="editor" label="Resume editor · form + live preview" width={1360} height={840}>
            <div className="dc-artboard-body" style={{ width: "100%", height: "100%" }}><AppShell initialRoute="editor" /></div>
          </DCArtboard>
        </DCSection>

        <DCSection id="account" title="Account">
          <DCArtboard id="profile" label="My Profile" width={1360} height={840}>
            <div className="dc-artboard-body" style={{ width: "100%", height: "100%" }}><AppShell initialRoute="profile" /></div>
          </DCArtboard>
          <DCArtboard id="n8n" label="n8n webhooks / integrations" width={1360} height={840}>
            <div className="dc-artboard-body" style={{ width: "100%", height: "100%" }}><AppShell initialRoute="integrations" /></div>
          </DCArtboard>
          <DCArtboard id="settings" label="Settings" width={1360} height={840}>
            <div className="dc-artboard-body" style={{ width: "100%", height: "100%" }}><AppShell initialRoute="settings" /></div>
          </DCArtboard>
        </DCSection>
      </DesignCanvas>

      <TweaksPanel title="Tweaks">
        <TweakSection title="Appearance">
          <TweakRadio
            label="Theme"
            value={tweaks.theme}
            onChange={v=>setTweaks({theme: v})}
            options={[{value:"dark", label:"Dark"},{value:"light", label:"Light"}]}
          />
          <TweakSlider
            label="Accent hue"
            value={tweaks.accentHue}
            min={0} max={360} step={1}
            onChange={v=>setTweaks({accentHue: v})}
            suffix="°"
          />
          <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
            {[
              { n: "Indigo", h: 265 },
              { n: "Violet", h: 295 },
              { n: "Blue",   h: 235 },
              { n: "Teal",   h: 190 },
              { n: "Green",  h: 150 },
              { n: "Orange", h: 50  },
              { n: "Rose",   h: 10  },
            ].map(p => (
              <button key={p.n} onClick={()=>setTweaks({accentHue: p.h})}
                style={{
                  width: 24, height: 24, borderRadius: "50%",
                  background: `oklch(58% 0.18 ${p.h})`,
                  border: tweaks.accentHue===p.h ? "2px solid var(--text)" : "1px solid var(--border)",
                  cursor: "pointer",
                }}
                title={p.n}
              />
            ))}
          </div>
        </TweakSection>
      </TweaksPanel>
    </>
  );
};

const AppShell = ({ initialRoute = "jobs", initialJobsView = "table", showPaste = false, tailorStart = null }) => {
  const [route, setRoute] = uSA(initialRoute);
  const [jobId, setJobId] = uSA("TM-8421");
  const [applyOpen, setApplyOpen] = uSA(false);
  const [tailorJobId, setTailorJobId] = uSA(tailorStart ? "elementor-fs" : null);

  const nav = (r, arg) => {
    if (r === "jobs" && arg) { setJobId(arg); setRoute("jobDetail"); return; }
    setRoute(r);
  };
  const openJob = (id) => { setJobId(id); setRoute("jobDetail"); };
  const openTailor = (id) => setTailorJobId(id || "elementor-fs");

  return (
    <div className="app">
      <Sidebar
        active={route === "jobDetail" ? "jobs" : route === "editor" ? "editor" : route}
        onNavigate={(id) => nav(id)}
      />
      <div className="main">
        {route === "dashboard" && <Dashboard onNavigate={nav} />}
        {route === "jobs" && <JobsPage onOpen={openJob} onTailor={openTailor} initialView={initialJobsView} />}
        {route === "tracker" && <TrackerPage />}
        {route === "jobDetail" && <JobDetail jobId={jobId} onBack={()=>setRoute("jobs")} onOpenApply={()=>setApplyOpen(true)} />}
        {route === "resumes" && <ResumesPage onEdit={()=>setRoute("editor")} />}
        {route === "editor" && <ResumeEditor />}
        {route === "profile" && <ProfilePage />}
        {route === "integrations" && <IntegrationsPage />}
        {route === "settings" && <SettingsPage />}
      </div>
      {applyOpen && <ApplyModal job={window.JT_DATA.JOBS.find(j=>j.id===jobId)} onClose={()=>setApplyOpen(false)} />}
      {tailorJobId && <TailorFlow jobId={tailorJobId} initialStep={tailorStart} onClose={()=>setTailorJobId(null)} onNavigateResume={()=>{setTailorJobId(null); setRoute("editor");}} />}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(<AppRoot />);
