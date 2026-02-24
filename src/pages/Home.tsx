import { useMemo, useState } from "react";
import { postOfferSigned, fetchRun, type OfferSignedPayload, type RunStep } from "../lib/api";
import { statusBadge, toneStyle } from "../lib/rh";

type ScenarioKind = "standard" | "flagged" | "partial";
type RightTab = "candidate" | "onboarding" | "audit";

const LS_LAST_RUN = "hr_onboarding_last_run_id";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [activeScenario, setActiveScenario] = useState<ScenarioKind | null>(null);

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
      candidate: { first_name: "Ana", last_name: "Lopez", email: "ana.lopez@alan-demo.com" },
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
      if (kind === "flagged") {
        payload.job = { title: "Quantum HR Wizard", department: "People", level: "C1" };
      }

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
    } catch (e: any) {
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
              title="Standard onboarding"
              subtitle="Expected: no action required"
              icon="▶️"
              disabled={loading}
              active={activeScenario === "standard"}
              onClick={() => runScenario("standard")}
            />

            <ScenarioButton
              title="Unknown role → requires HR review"
              subtitle="Expected: Human review required"
              icon="⚠️"
              disabled={loading}
              active={activeScenario === "flagged"}
              onClick={() => runScenario("flagged")}
            />

            <ScenarioButton
              title="IT issue → partial completion"
              subtitle="Expected: Partial completion"
              icon="🔧"
              disabled={loading}
              active={activeScenario === "partial"}
              onClick={() => runScenario("partial")}
            />
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
            {rightTab === "candidate" && <CandidateApplicationPanel />}
            {rightTab === "onboarding" && <OnboardingDetailsEmbedded runId={runId} runInput={runInput} steps={runSteps} status={runStatus} summary={runSummary} />}
            {rightTab === "audit" && <AuditLogEmbedded steps={runSteps} status={runStatus} />}
          </div>
        </section>
      </div>

    </div>
  );
}

/* ----------------------------- Embedded panels ---------------------------- */

function CandidateApplicationPanel() {
  const [mode, setMode] = useState<"text" | "json">("text");

  // Mock Ashby-like event payload for Alan-style context
  const ashby = {
    event: "candidate.hired",
    occurred_at: "2026-02-01T09:12:00Z",
    candidate: {
      name: "Ana Lopez",
      email: "ana.lopez@alan-demo.com",
      location: "Paris, FR",
    },
    job: {
      title: "Backend Engineer",
      department: "Engineering",
      level: "B2",
    },
    start_date: "2026-02-03",
    contract_type: "Permanent",
    country: "FR",
    requisition_id: "req_alan_1432",
    source: "Inbound",
  };

  const q1 =
    "Share a specific example of a manual internal process you fully automated using low-code tools or APIs. What was the 'Before' vs 'After' impact?";
  const a1 =
    "Before: onboarding required HR to copy-paste details across tools (HRIS, Slack, IT) and manually chase confirmations using checklists. This created delays, inconsistent access setups, and fragile handovers.\n\nAfter: I designed an event-driven onboarding flow triggered by “candidate.hired”. Deterministic actions (account creation, hardware order, access provisioning) ran automatically via API calls, while ambiguous cases were flagged for human review. The system wrote an audit trail for each action.\n\nImpact: onboarding lead time decreased from “hours spread over multiple handoffs” to “minutes with zero manual coordination” for standard cases, with fewer errors and higher traceability.";

  const q2 =
    "Part of this role involves modeling Compensation Strategy. Please describe your experience with salary grids or budget modeling. How do you approach the trade-off between market competitiveness and budget constraints?";
  const a2 =
    "I treat compensation as a system: internal fairness, market competitiveness, and budget sustainability must be modeled together. My approach is to build a clear grid (levels, roles, ranges) and make exceptions explicit and documented.\n\nI start by defining the compensation philosophy (target percentile and consistency rules), then I model budget impact under multiple scenarios (e.g., +3% uplift for specific families, re-leveling, targeted adjustments). Market data is a signal, not a mandate: I prioritize internal coherence and retention risk, then phase changes with clear guardrails.\n\nWhen constraints are tight, I prefer targeted, transparent adjustments over broad, uneven increases, and I always track downstream effects (compression, equity across teams, and hiring competitiveness).";

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ padding: 12, borderRadius: 14, border: "1px solid rgba(0,0,0,0.10)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900 }}>Candidate application</div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>
              Simulated Ashby “Candidate hired” payload + answers to application questions.
            </div>
          </div>

          <div style={segmentedWrap}>
            <button onClick={() => setMode("text")} style={segmentedBtn(mode === "text", "left")}>Text</button>
            <button onClick={() => setMode("json")} style={segmentedBtn(mode === "json", "right")}>JSON</button>
          </div>
        </div>

        {mode === "text" ? (
          <div style={{ marginTop: 10, fontSize: 13, opacity: 0.92, lineHeight: 1.5 }}>
            Our candidate <b>{ashby.candidate.name}</b> (<b>{ashby.candidate.email}</b>) has been{" "}
            <b>hired</b>. {ashby.candidate.name} will join our <b>{ashby.job.department}</b> team as{" "}
            <b>{ashby.job.title}</b>, starting on <b>{formatMDY(ashby.start_date)}</b>. Contract type:{" "}
            <b>{ashby.contract_type}</b>.
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
        <div style={{ fontWeight: 700, marginBottom: 10 }}>Application questions</div>

        <QA q={q1} a={a1} />
        <div style={{ height: 10 }} />
        <QA q={q2} a={a2} />
      </div>
    </div>
  );
}

function QA({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ padding: 12, borderRadius: 12, background: "rgba(0,0,0,0.04)" }}>
      <div style={{ fontWeight: 900, marginBottom: 8 }}>{q}</div>

      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          padding: 0,
          border: "none",
          background: "transparent",
          cursor: "pointer",
          fontWeight: 900,
          fontSize: 12,
          opacity: 0.7,
        }}
        aria-expanded={open}
      >
        {open ? "Hide Ana's answer" : "Read Ana's answer"}
      </button>

      {open && (
        <div style={{ marginTop: 10, fontSize: 13, opacity: 0.92, whiteSpace: "pre-wrap", lineHeight: 1.45 }}>
          {a}
        </div>
      )}
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
        {active && <div style={{ fontSize: 12, opacity: 0.85, fontWeight: 900 }}>Running…</div>}
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