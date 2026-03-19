import { useMemo, useState } from "react";
import { postOfferSigned, fetchRun, type OfferSignedPayload, type RunStep } from "../lib/api";
import { statusBadge, toneStyle } from "../lib/rh";

type ScenarioKind = "standard" | "flagged" | "partial";
type RightTab = "candidate" | "onboarding" | "audit";

type Alignment = {
  label: string;
  value: string;
  aligns: "yes" | "no" | "risk";
  reason: string;
};

type AshbyCandidate = {
  name: string;
  email: string;
  phone: string;
  location: string;
  citizenship: string;
  work_authorization: string;
  years_experience: string;
  primary_stack: string;
  languages: string;
  notice_period: string;
};

type AshbyApplication = {
  event: string;
  occurred_at: string;
  candidate: AshbyCandidate;
  job: { title: string; department: string; level: string };
  start_date: string;
  contract_type: string;
  country: string;
  work_model: string;
  requisition_id: string;
  source: string;
};

type ScenarioDefinition = {
  title: string;
  subtitle: string;
  icon: string;
  expectedOutcome: string;
  runSummaryHint: string;
  job: { title: string; department: string; level: string };
  candidatePayload: { first_name: string; last_name: string; email: string };
  ashby: AshbyApplication;
  alignments: Alignment[];
};

const BASE_ANA_CANDIDATE: AshbyCandidate = {
  name: "Ana Lopez",
  email: "ana.lopez@alan-demo.com",
  phone: "+33 6 44 92 10 12",
  location: "Paris, FR",
  citizenship: "Spanish",
  work_authorization: "EU citizen - authorized in FR",
  years_experience: "6 years",
  primary_stack: "TypeScript, Node.js, PostgreSQL",
  languages: "Spanish (native), English (fluent), French (professional)",
  notice_period: "1 month",
};

const SCENARIOS: Record<ScenarioKind, ScenarioDefinition> = {
  standard: {
    title: "Standard onboarding",
    subtitle: "Expected: no action required",
    icon: "▶️",
    expectedOutcome: "Expected outcome: Full zero-touch onboarding (SUCCESS).",
    runSummaryHint: "All key details align with the Backend Engineer requirements.",
    job: { title: "Backend Engineer", department: "Engineering", level: "B2" },
    candidatePayload: { first_name: "Ana", last_name: "Lopez", email: "ana.lopez@alan-demo.com" },
    ashby: {
      event: "candidate.hired",
      occurred_at: "2026-02-01T09:12:00Z",
      candidate: BASE_ANA_CANDIDATE,
      job: { title: "Backend Engineer", department: "Engineering", level: "B2" },
      start_date: "2026-02-03",
      contract_type: "Permanent",
      country: "FR",
      work_model: "Hybrid (Paris office)",
      requisition_id: "req_alan_1432",
      source: "Inbound",
    },
    alignments: [
      { label: "Role", value: "Backend Engineer", aligns: "yes", reason: "Direct match with the open position." },
      { label: "Department", value: "Engineering", aligns: "yes", reason: "Matches the team owning this requisition." },
      { label: "Level", value: "B2", aligns: "yes", reason: "Falls inside approved leveling for this role." },
      { label: "Work authorization", value: "EU citizen - authorized in FR", aligns: "yes", reason: "Compliant with French employment requirements." },
      { label: "Contract type", value: "Permanent", aligns: "yes", reason: "Compliant contract type for automated onboarding." },
      { label: "Start date", value: "2026-02-03", aligns: "yes", reason: "Timeline is valid for provisioning lead times." },
    ],
  },
  flagged: {
    title: "Unknown role → requires HR review",
    subtitle: "Expected: Human review required",
    icon: "⚠️",
    expectedOutcome: "Expected outcome: Ambiguity detected (FLAGGED).",
    runSummaryHint: "The role metadata is not recognized by the onboarding rules.",
    job: { title: "Quantum HR Wizard", department: "People", level: "C1" },
    candidatePayload: { first_name: "Ana", last_name: "Lopez", email: "ana+alt-role@alan-demo.com" },
    ashby: {
      event: "candidate.hired",
      occurred_at: "2026-02-01T09:12:00Z",
      candidate: {
        ...BASE_ANA_CANDIDATE,
        email: "ana+alt-role@alan-demo.com",
        years_experience: "11 years",
        primary_stack: "Org design, compensation frameworks, HR tooling",
      },
      job: { title: "Quantum HR Wizard", department: "People", level: "C1" },
      start_date: "2026-02-03",
      contract_type: "Permanent",
      country: "FR",
      work_model: "Hybrid (Paris office)",
      requisition_id: "req_alan_1432",
      source: "Referral",
    },
    alignments: [
      { label: "Role", value: "Quantum HR Wizard", aligns: "no", reason: "Role is unknown to the access and provisioning matrix." },
      { label: "Department", value: "People", aligns: "no", reason: "Department does not match the Engineering requisition." },
      { label: "Level", value: "C1", aligns: "risk", reason: "Out-of-band seniority likely needs manual compensation review." },
      { label: "Primary expertise", value: "Org design, compensation frameworks", aligns: "risk", reason: "Profile focus differs from Backend Engineer requirements." },
      { label: "Contract type", value: "Permanent", aligns: "yes", reason: "Contract setup can still be processed." },
      { label: "Start date", value: "2026-02-03", aligns: "yes", reason: "No scheduling conflict detected." },
    ],
  },
  partial: {
    title: "IT issue → partial completion",
    subtitle: "Expected: Partial completion",
    icon: "🔧",
    expectedOutcome: "Expected outcome: Partial automation (PARTIAL).",
    runSummaryHint: "Candidate details align, but provisioning cannot fully complete because of an IT outage.",
    job: { title: "Backend Engineer", department: "Engineering", level: "B2" },
    candidatePayload: { first_name: "Ana", last_name: "Lopez", email: "ana.lopez@alan-demo.com" },
    ashby: {
      event: "candidate.hired",
      occurred_at: "2026-02-01T09:12:00Z",
      candidate: {
        ...BASE_ANA_CANDIDATE,
        notice_period: "Immediate",
      },
      job: { title: "Backend Engineer", department: "Engineering", level: "B2" },
      start_date: "2026-02-03",
      contract_type: "Permanent",
      country: "FR",
      work_model: "Remote-first",
      requisition_id: "req_alan_1432",
      source: "Inbound",
    },
    alignments: [
      { label: "Role", value: "Backend Engineer", aligns: "yes", reason: "Role is recognized by onboarding templates." },
      { label: "Department", value: "Engineering", aligns: "yes", reason: "Matches the target team configuration." },
      { label: "Level", value: "B2", aligns: "yes", reason: "Level is compatible with default access bundles." },
      { label: "Work authorization", value: "EU citizen - authorized in FR", aligns: "yes", reason: "Entity and payroll setup are valid." },
      { label: "Contract type", value: "Permanent", aligns: "yes", reason: "Contract path is fully supported." },
      { label: "IT systems readiness", value: "Provisioning API unavailable", aligns: "risk", reason: "Operational dependency blocks full completion despite matching profile." },
    ],
  },
};

const LS_LAST_RUN = "hr_onboarding_last_run_id";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [activeScenario, setActiveScenario] = useState<ScenarioKind | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioKind | null>(null);

  const [rightTab, setRightTab] = useState<RightTab>("candidate");

  // Displayed run (the one we are currently showing in the UI)
  const [runId, setRunId] = useState<string | null>(null);
  const [runStatus, setRunStatus] = useState<string | null>(null);
  const [runSummary, setRunSummary] = useState<string | null>(null);
  const [runInput, setRunInput] = useState<any>(null);
  const [runSteps, setRunSteps] = useState<RunStep[]>([]);

  const basePayload: OfferSignedPayload = useMemo(
    () => ({
      event_id: `evt_demo_${Date.now()}`,
      candidate: SCENARIOS.standard.candidatePayload,
      job: { title: "Backend Engineer", department: "Engineering", level: "B2" },
      employment: { country: "FR", contract_type: "Permanent", start_date: "2026-02-03" },
      scenario: { standard: true, unknown_role: false, simulate_it_failure: false },
    }),
    []
  );

  async function runScenario(kind: ScenarioKind) {
    setLoading(true);
    setActiveScenario(kind);

    try {
      const payload: OfferSignedPayload = {
        ...basePayload,
        event_id: `evt_demo_${Date.now()}`,
        scenario:
          kind === "standard"
            ? { standard: true, unknown_role: false, simulate_it_failure: false }
            : kind === "flagged"
              ? { unknown_role: true, simulate_it_failure: false }
              : { standard: true, simulate_it_failure: true },
      };

      // flagged scenario: deliberately weird role + People department
      payload.job = SCENARIOS[kind].job;
      payload.candidate = SCENARIOS[kind].candidatePayload;

      const r = await postOfferSigned(payload);

      // Save last run in localStorage ICO
      localStorage.setItem(LS_LAST_RUN, r.run_id);

      // Fetch full run to display evidence and embedded panels
      const full = await fetchRun(r.run_id);

      setRunId(r.run_id);
      setRunStatus(full.run.status);
      setRunSummary(full.run.summary ?? r.summary ?? null);
      setRunInput(full.run.input ?? null);
      setRunSteps(full.steps ?? []);

      // After a run, default to onboarding details tab
      setRightTab("onboarding");
    } catch {
      setRunSummary("Unable to run this scenario. Please retry.");
    } finally {
      setLoading(false);
      setActiveScenario(null);
    }
  }

  // Layout: 3 columns (1/4, 1/4, 1/2)
  return (
    <div style={{ width: "100%", minHeight: 0 }}>
      <div
        style={{
            display: "grid",
            gridTemplateColumns: "1fr 2fr",
            gap: 16,
            width: "100%",
            maxWidth: "100vw",
            minHeight: 0
          }}
      >

        {/* CENTER CONTAINER (Simulation + Ashby trigger mock placeholder) */}
        <section style={panel()}>
          <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 6 }}>Simulate situations</div>

          {/* How this demo works belongs here (per your request) */}
          <div style={{ marginTop: 10, padding: 12, borderRadius: 14, background: "rgba(0,0,0,0.04)" }}>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>How this demo works</div>
            <div style={{ fontSize: 13, opacity: 0.9, lineHeight: 1.5 }}>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                <li>
                  You trigger an <b>Ashby-like</b> event (<b>Candidate hired</b>) for our fictional candidate <b>Ana Lopez</b>.
                </li>
                <li>The system executes deterministic onboarding actions automatically.</li>
                <li>HR is involved only when ambiguity is detected (FLAGGED).</li>
              </ul>
            </div>
          </div>

          <div style={{ marginTop: 12, fontSize: 13, opacity: 0.8 }}>
            Click on one scenario below to generate an onboarding decision.
          </div>

          <div style={{ marginTop: 12 }}>
            <ScenarioButton
              title={SCENARIOS.standard.title}
              subtitle={SCENARIOS.standard.subtitle}
              icon={SCENARIOS.standard.icon}
              disabled={loading}
              active={selectedScenario === "standard"}
              onClick={() => {
                setSelectedScenario("standard");
                setRightTab("candidate");
              }}
            />

            <ScenarioButton
              title={SCENARIOS.flagged.title}
              subtitle={SCENARIOS.flagged.subtitle}
              icon={SCENARIOS.flagged.icon}
              disabled={loading}
              active={selectedScenario === "flagged"}
              onClick={() => {
                setSelectedScenario("flagged");
                setRightTab("candidate");
              }}
            />

            <ScenarioButton
              title={SCENARIOS.partial.title}
              subtitle={SCENARIOS.partial.subtitle}
              icon={SCENARIOS.partial.icon}
              disabled={loading}
              active={selectedScenario === "partial"}
              onClick={() => {
                setSelectedScenario("partial");
                setRightTab("candidate");
              }}
            />

            {selectedScenario && (
              <button
                onClick={() => runScenario(selectedScenario)}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 14,
                  border: "1px solid rgba(0,0,0,0.18)",
                  background: "rgba(0,0,0,0.06)",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontWeight: 900,
                }}
              >
                {loading && activeScenario === selectedScenario
                  ? `Running ${SCENARIOS[selectedScenario].title}…`
                  : `Run ${SCENARIOS[selectedScenario].title}`}
              </button>
            )}
          </div>
        </section>

        {/* RIGHT CONTAINER (Tabbed, 50%) */}
        <section style={panel()}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 900 }}>Details</div>
            {runId && (
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                Run: <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>{runId.slice(0, 8)}…</span>
              </div>
            )}
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
            <button style={tabBtn(rightTab === "candidate")} onClick={() => setRightTab("candidate")}>
              Candidate application
            </button>
            <button style={tabBtn(rightTab === "onboarding")} onClick={() => setRightTab("onboarding")} disabled={!runId}>
              Onboarding details
            </button>
            <button style={tabBtn(rightTab === "audit")} onClick={() => setRightTab("audit")} disabled={!runId}>
              Audit log
            </button>
          </div>

          <div style={{ marginTop: 12, height: "100%", overflow: "auto" }}>
            {rightTab === "candidate" && <CandidateApplicationPanel scenario={selectedScenario} />}
            {rightTab === "onboarding" && <OnboardingDetailsEmbedded runId={runId} runInput={runInput} steps={runSteps} status={runStatus} summary={runSummary} />}
            {rightTab === "audit" && <AuditLogEmbedded steps={runSteps} status={runStatus} />}
          </div>
        </section>
      </div>

    </div>
  );
}

/* ----------------------------- Embedded panels ---------------------------- */

function CandidateApplicationPanel({ scenario }: { scenario: ScenarioKind | null }) {
  const [mode, setMode] = useState<"text" | "json">("text");

  const scenarioInfo = scenario ? SCENARIOS[scenario] : null;
  const ashby = scenarioInfo?.ashby ?? SCENARIOS.standard.ashby;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {/* <div style={{ padding: 12, borderRadius: 14, border: "1px solid rgba(0,0,0,0.10)" }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>Application questions</div>
        <QA q={q1} a={a1} />
        <div style={{ height: 10 }} />
        <QA q={q2} a={a2} />
      </div> */}

      <div style={{ padding: 12, borderRadius: 14, border: "1px solid rgba(0,0,0,0.10)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900 }}>Candidate application</div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>
              Full Ashby-style profile used to evaluate alignment with Alan's job offer.
            </div>
          </div>

          <div style={segmentedWrap}>
            <button onClick={() => setMode("text")} style={segmentedBtn(mode === "text", "left")}>Text</button>
            <button onClick={() => setMode("json")} style={segmentedBtn(mode === "json", "right")}>JSON</button>
          </div>
        </div>

        {mode === "text" ? (
          <div style={{ marginTop: 10, fontSize: 13, opacity: 0.92, lineHeight: 1.5 }}>
            <div>
              <b>{ashby.candidate.name}</b> (<b>{ashby.candidate.email}</b>) — {ashby.candidate.phone}
            </div>
            <div>
              Location: <b>{ashby.candidate.location}</b> · Citizenship: <b>{ashby.candidate.citizenship}</b>
            </div>
            <div>
              Work authorization: <b>{ashby.candidate.work_authorization}</b>
            </div>
            <div>
              Experience: <b>{ashby.candidate.years_experience}</b> · Stack: <b>{ashby.candidate.primary_stack}</b>
            </div>
            <div>
              Languages: <b>{ashby.candidate.languages}</b> · Notice period: <b>{ashby.candidate.notice_period}</b>
            </div>
            <div style={{ marginTop: 6 }}>
              Candidate hired for <b>{ashby.job.title}</b> ({ashby.job.department}, {ashby.job.level}) starting <b>{formatMDY(ashby.start_date)}</b> · {ashby.contract_type} · {ashby.country} · {ashby.work_model}.
            </div>
          </div>
        ) : (
          <pre style={preStyleTight}>{JSON.stringify(ashby, null, 2)}</pre>
        )}

        <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <a
            href={`${import.meta.env.BASE_URL}assets/ana-lopez-resume.pdf`}
            target="_blank"
            rel="noreferrer"
            style={downloadBtn}
          >
            Download resume (PDF)
          </a>
          <span style={{ fontSize: 12, opacity: 0.7 }}>
            (Fictional resume for demo purposes)
          </span>
        </div>
      </div>

      <div style={{ padding: 12, borderRadius: 14, border: "1px solid rgba(0,0,0,0.10)" }}>
        <div style={{ fontWeight: 900, marginBottom: 6 }}>Position requirement alignment</div>
        {!scenarioInfo && (
          <div style={{ fontSize: 13, opacity: 0.78 }}>
            Select a scenario to preview why onboarding is expected to fully succeed, partially succeed, or need HR review.
          </div>
        )}
        {scenarioInfo && (
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ fontSize: 13, opacity: 0.88 }}>
              <b>{scenarioInfo.expectedOutcome}</b> {scenarioInfo.runSummaryHint}
            </div>
            {scenarioInfo.alignments.map((item) => (
              <div
                key={item.label}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: 8,
                  padding: 10,
                  borderRadius: 10,
                  background: "rgba(0,0,0,0.04)",
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: 13 }}>{item.label}: {item.value}</div>
                  <div style={{ fontSize: 12, opacity: 0.75 }}>{item.reason}</div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 900, opacity: 0.9 }}>{alignmentLabel(item.aligns)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatMDY(iso: string) {
  const [y, m, d] = String(iso).split("-");
  if (!y || !m || !d) return iso;
  return `${m}/${d}/${y}`;
}

const downloadBtn: React.CSSProperties = {
  display: "inline-block",
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(0,0,0,0.12)",
  textDecoration: "none",
  color: "inherit",
  fontWeight: 700,
  opacity: 0.9,
  background: "white",
};

const preStyleTight: React.CSSProperties = {
  marginTop: 10,
  marginBottom: 0,
  padding: 12,
  borderRadius: 12,
  background: "rgba(0,0,0,0.04)",
  fontSize: 12,
  lineHeight: 1.4,
  whiteSpace: "pre-wrap",
  overflow: "hidden",
};

function OnboardingDetailsEmbedded({
  runId,
  runInput,
  steps,
  status,
  summary,
}: {
  runId: string | null;
  runInput: any;
  steps: RunStep[];
  status: string | null;
  summary: string | null;
}) {
  if (!runId) {
    return (
      <div style={{ fontSize: 13, opacity: 0.8 }}>
        Run a scenario to generate onboarding details.
      </div>
    );
  }

  const badge = statusBadge(status ?? undefined);
  const name = `${runInput?.candidate?.first_name ?? "Ana"} ${runInput?.candidate?.last_name ?? "Lopez"}`;
  const title = runInput?.job?.title ?? "—";
  const country = runInput?.employment?.country ?? "—";
  const contract = runInput?.employment?.contract_type ?? "—";
  const start = runInput?.employment?.start_date ?? "—";

  const accounts = findStep(steps, "PROVISION_ACCOUNTS");
  const hardware = findStep(steps, "PROVISION_HARDWARE");
  const access = findStep(steps, "PROVISION_ACCESS");

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ padding: 12, borderRadius: 14, border: "1px solid rgba(0,0,0,0.10)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900 }}>Onboarding details</div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>What the system did — and whether HR needs to act.</div>
          </div>
          <span style={toneStyle(badge.tone)}>{badge.label}</span>
        </div>

        <div style={{ marginTop: 10, padding: 12, borderRadius: 12, background: "rgba(0,0,0,0.04)" }}>
          <div style={{ fontWeight: 900 }}>{name}</div>
          <div style={{ fontSize: 13, opacity: 0.8, marginTop: 2 }}>
            {title} — {country} · {contract}
          </div>
          <div style={{ fontSize: 13, opacity: 0.8, marginTop: 2 }}>Start date: {start}</div>
        </div>

        <div style={{ marginTop: 10 }}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>Decision</div>
          <div style={{ fontSize: 13, opacity: 0.9, lineHeight: 1.45, whiteSpace: "pre-wrap" }}>
            {rhMeaning(status ?? undefined, runInput)}
          </div>
          {summary && (
            <div style={{ marginTop: 8, fontSize: 12, opacity: 0.72, whiteSpace: "pre-wrap" }}>{summary}</div>
          )}
        </div>
      </div>

      <div style={{ padding: 12, borderRadius: 14, border: "1px solid rgba(0,0,0,0.10)" }}>
        <div style={{ fontWeight: 900, marginBottom: 8 }}>Actions executed by the system</div>
        <ActionRow label="Create work account" status={stepStatusOrFallback(accounts, status)} />
        <ActionRow label="Order hardware" status={stepStatusOrFallback(hardware, status)} />
        <ActionRow label="Configure access rights" status={stepStatusOrFallback(access, status)} />
      </div>

      <div style={{ padding: 12, borderRadius: 14, border: "1px solid rgba(0,0,0,0.10)" }}>
        <div style={{ fontWeight: 900, marginBottom: 6 }}>Why this is Zero-Touch</div>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, opacity: 0.9, lineHeight: 1.5 }}>
          <li>No checklists as the primary mechanism.</li>
          <li>No manual ticket assignment required to progress.</li>
          <li>Humans intervene only when ambiguity is detected (FLAGGED / anomalies).</li>
        </ul>
      </div>
    </div>
  );
}

function AuditLogEmbedded({ steps, status }: { steps: RunStep[]; status: string | null }) {
  
  const hasFailedStep = steps.some(s => (s.status ?? "").toUpperCase() === "FAILED");
  const statusIsFailed = (status ?? "").toUpperCase() === "FAILED";
  const displaySteps = (statusIsFailed && !hasFailedStep)
    ? [...steps, { id: -1, step: "RUN_FAILED", status: "FAILED", reason: "Flow terminated before logging failure", created_at: new Date().toISOString() } as any]
    : steps;

  return (
    <div style={{ padding: 12, borderRadius: 14, border: "1px solid rgba(0,0,0,0.10)" }}>
      <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 6 }}>Audit log</div>
      <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 10 }}>
        Full traceability for audit & compliance. Status: <b>{status ?? "—"}</b>
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        {displaySteps.length === 0 && <div style={{ fontSize: 13, opacity: 0.8 }}>No steps logged yet.</div>}
        {displaySteps.map((s) => (
          <div key={s.id} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <div style={{ fontWeight: 800, opacity: 0.9 }}>{humanLabel(s.step)}</div>
            <div style={{ fontWeight: 900 }}>{s.status}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: "rgba(0,0,0,0.04)" }}>
        <div style={{ fontWeight: 900, marginBottom: 6 }}>Why this is Zero-Touch</div>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, opacity: 0.9, lineHeight: 1.5 }}>
          <li>Deterministic steps are executed automatically by the system.</li>
          <li>Humans intervene only when ambiguity is detected (FLAGGED).</li>
          <li>Every action is logged for traceability.</li>
        </ul>
      </div>
    </div>
  );
}

/* ------------------------------- UI helpers ------------------------------- */

function panel(): React.CSSProperties {
  return {
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: 18,
    padding: 14,
    background: "white",
    minWidth: 0,
    minHeight: 0,
    overflow: "hidden"
  };
}

function tabBtn(active: boolean): React.CSSProperties {
  return {
    flex: 1,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.12)",
    background: active ? "rgba(0,0,0,0.06)" : "white",
    cursor: "pointer",
    fontWeight: 900,
    fontSize: 13,
    opacity: active ? 1 : 0.9,
  };
}

function ScenarioButton({
  title,
  subtitle,
  icon,
  disabled,
  active,
  onClick,
}: {
  title: string;
  subtitle: string;
  icon: string;
  disabled: boolean;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      style={{
        width: "100%",
        textAlign: "left",
        padding: 14,
        borderRadius: 14,
        border: "1px solid rgba(0,0,0,0.12)",
        background: "white",
        cursor: disabled ? "not-allowed" : "pointer",
        fontWeight: 900,
        marginBottom: 10,
        opacity: disabled && !active ? 0.7 : 1,
      }}
      disabled={disabled}
      onClick={onClick}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div>
          <span style={{ marginRight: 8 }}>{icon}</span>
          {title}
          <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 700, marginTop: 6 }}>{subtitle}</div>
        </div>
        {active && <div style={{ fontSize: 12, opacity: 0.85, fontWeight: 900 }}>Selected</div>}
      </div>
    </button>
  );
}

function ActionRow({ label, status }: { label: string; status: string }) {
  const s = (status ?? "").toUpperCase();
  const human =
    s === "SUCCESS" ? "Completed" : s === "FAILED" ? "Failed" : s === "SKIPPED" ? "Skipped" : "Safely halted";

  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: 12, borderRadius: 14, border: "1px solid rgba(0,0,0,0.10)", marginTop: 8 }}>
      <div style={{ fontWeight: 900 }}>{label}</div>
      <div style={{ fontWeight: 900, opacity: 0.9 }}>{human}</div>
    </div>
  );
}

/* ---------------------------- Domain logic helpers ------------------------ */

function findStep(steps: RunStep[], name: string) {
  const n = name.toUpperCase();
  return steps.find((s) => (s.step ?? "").toUpperCase() === n) ?? null;
}

function stepStatusOrFallback(step: RunStep | null, runStatus: string | null) {
  if (step?.status) return step.status;
  const s = (runStatus ?? "").toUpperCase();
  if (s === "FAILED") return "FAILED";
  if (s === "FLAGGED") return "SKIPPED";
  return "-";
}

function rhMeaning(status?: string, input?: any) {
  const s = (status ?? "").toUpperCase();
  if (!s) return "Run a scenario to generate an onboarding decision.";
  if (s === "SUCCESS") {
    return "✅ No action required. The system executed all deterministic onboarding actions automatically.";
  }
  if (s === "FLAGGED") {
    const role = input?.job?.title ? ` (“${input.job.title}”)` : "";
    return `⚠️ Human review required. The system detected ambiguity that needs HR input${role}.`;
  }
  if (s === "PARTIAL") {
    return "🟡 Partially completed. Most actions were executed automatically, but at least one step requires follow-up.";
  }
  if (s === "FAILED") {
    return "❌ Failed. The system could not complete the onboarding run. Please inspect the audit log.";
  }
  return s;
}

function humanLabel(step: string) {
  const s = (step ?? "").toUpperCase();
  const map: Record<string, string> = {
    RECEIVE_EVENT: "Offer signed received",
    DECISION: "Required resources identified",
    PROVISION_ACCOUNTS: "Work account created",
    PROVISION_HARDWARE: "Hardware ordered",
    PROVISION_ACCESS: "Access rights configured",
    FINISH_RUN: "Onboarding completed",
  };
  return map[s] ?? step;
}

function alignmentLabel(value: Alignment["aligns"]) {
  if (value === "yes") return "✅ Aligns";
  if (value === "no") return "❌ Does not align";
  return "⚠️ Risk";
}

const segmentedWrap: React.CSSProperties = {
  display: "inline-flex",
  border: "1px solid rgba(0,0,0,0.12)",
  borderRadius: 14,
  overflow: "hidden",
};

function segmentedBtn(active: boolean, side: "left" | "right"): React.CSSProperties {
  return {
    padding: "8px 14px",
    border: "none",
    background: active ? "rgba(0,0,0,0.06)" : "white",
    cursor: "pointer",
    fontWeight: 900,
    fontSize: 13,
    borderTopLeftRadius: side === "left" ? 14 : 0,
    borderBottomLeftRadius: side === "left" ? 14 : 0,
    borderTopRightRadius: side === "right" ? 14 : 0,
    borderBottomRightRadius: side === "right" ? 14 : 0,
    borderRight: side === "left" ? "1px solid rgba(0,0,0,0.12)" : "none",
  };
}
