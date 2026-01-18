import { useEffect, useMemo, useState } from "react";
import { postOfferSigned, fetchRun, type OfferSignedPayload, type RunStep } from "../lib/api";
import { statusBadge, toneStyle } from "../lib/rh";

type ScenarioKind = "standard" | "flagged" | "partial";
type RightTab = "candidate" | "onboarding" | "audit";

const LS_LAST_RUN = "hr_onboarding_last_run_id";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [activeScenario, setActiveScenario] = useState<ScenarioKind | null>(null);

  const [rightTab, setRightTab] = useState<RightTab>("candidate");

  const [lastRunId, setLastRunId] = useState<string | null>(null);

  // Displayed run (the one we are currently showing in the UI)
  const [runId, setRunId] = useState<string | null>(null);
  const [runStatus, setRunStatus] = useState<string | null>(null);
  const [runSummary, setRunSummary] = useState<string | null>(null);
  const [runInput, setRunInput] = useState<any>(null);
  const [runSteps, setRunSteps] = useState<RunStep[]>([]);
  const [error, setError] = useState<string | null>(null);

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

  // on load: keep last run id only (no auto-display)
  useEffect(() => {
    const saved = localStorage.getItem(LS_LAST_RUN);
    if (saved) setLastRunId(saved);
  }, []);

  async function runScenario(kind: ScenarioKind) {
    setLoading(true);
    setActiveScenario(kind);
    setError(null);

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

      // Persist last run id
      localStorage.setItem(LS_LAST_RUN, r.run_id);
      setLastRunId(r.run_id);

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
      setError(e?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
      setActiveScenario(null);
    }
  }

  async function showLastRun() {
    if (!lastRunId) return;
    setLoading(true);
    setActiveScenario(null);
    setError(null);

    try {
      const full = await fetchRun(lastRunId);
      setRunId(lastRunId);
      setRunStatus(full.run.status);
      setRunSummary(full.run.summary ?? null);
      setRunInput(full.run.input ?? null);
      setRunSteps(full.steps ?? []);
      setRightTab("onboarding");
    } catch (e: any) {
      setError(e?.message ?? "Failed to load last run");
    } finally {
      setLoading(false);
    }
  }

  // Derived: RH-friendly “meaning”
  const whatThisMeans = rhMeaning(runStatus ?? undefined, runInput);

  const badge = statusBadge(runStatus ?? undefined);

  // Evidence extraction from steps (proofs)
  const accountsStep = findStep(runSteps, "PROVISION_ACCOUNTS");
  const hardwareStep = findStep(runSteps, "PROVISION_HARDWARE");
  const accessStep = findStep(runSteps, "PROVISION_ACCESS");

  const evidence = {
    accounts: {
      status: accountsStep?.status?.toUpperCase() ?? null,
      output: accountsStep?.output ?? null,
    },
    hardware: {
      status: hardwareStep?.status?.toUpperCase() ?? null,
      output: hardwareStep?.output ?? null,
    },
    access: {
      status: accessStep?.status?.toUpperCase() ?? null,
      output: accessStep?.output ?? null,
    },
  };

  // Human involvement must be driven by run.status (robust)
  const humanInvolvement =
    (runStatus ?? "").toUpperCase() === "FLAGGED" ? "Required (ambiguity detected)" : "Not required";

  // Decision rules (from input)
  const rules = {
    country: runInput?.employment?.country ?? "—",
    department: runInput?.job?.department ?? "—",
    contractType: runInput?.employment?.contract_type ?? "—",
    role: runInput?.job?.title ?? "—",
  };

  // Layout: 3 columns (1/4, 1/4, 1/2)
  return (
    <div style={{ width: "100%" }}>
      {/* Page-level narrative (outside containers) */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 20, fontWeight: 950 }}>Automated onboarding — Zero Touch</div>
        <div style={{ fontSize: 13, opacity: 0.75 }}>
          From offer signed to Day 1 readiness — without manual coordination.
        </div>
        <div style={{ fontSize: 14, opacity: 0.9, marginTop: 8, maxWidth: 980, lineHeight: 1.45 }}>
          This demo simulates what happens after a new hire signs an offer. The system executes deterministic onboarding
          actions automatically, and escalates to HR only when ambiguity is detected.
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 2fr",
          gap: 16,
          alignItems: "stretch",
          height: "calc(100vh - 170px)",
        }}
      >
        {/* LEFT CONTAINER (Run summary) */}
        <section style={panel()}>
          <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 10 }}>Run summary</div>

          <div style={{ padding: 12, borderRadius: 14, background: "rgba(0,0,0,0.04)" }}>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>Demo context</div>
            <div style={{ fontSize: 13, opacity: 0.9, lineHeight: 1.45 }}>
              You are viewing a simulated onboarding aftermath for a new hire.
              <br />
              <b>Ana Lopez</b> is joining <b>Engineering</b> as <b>Backend Engineer</b> in <b>FR</b> (Permanent).
              <br />
              Start date: <b>2026-02-03</b>.
            </div>
          </div>

          <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <span style={toneStyle(badge.tone)}>{badge.label}</span>

            {!runId && lastRunId && (
              <button onClick={showLastRun} disabled={loading} style={smallBtn}>
                Show last run
              </button>
            )}
          </div>

          <div style={{ marginTop: 12, padding: 12, borderRadius: 14, background: "rgba(0,0,0,0.04)" }}>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>What this means</div>
            <div style={{ fontSize: 13, opacity: 0.92, lineHeight: 1.45, whiteSpace: "pre-wrap" }}>
              {whatThisMeans}
            </div>
            {runSummary && (
              <div style={{ marginTop: 8, fontSize: 12, opacity: 0.72, whiteSpace: "pre-wrap" }}>{runSummary}</div>
            )}
          </div>

          {/* Decision rules */}
          <div style={{ marginTop: 12, padding: 12, borderRadius: 14, border: "1px solid rgba(0,0,0,0.10)" }}>
            <div style={{ fontWeight: 900, marginBottom: 8 }}>Decision rules applied</div>
            <div style={{ display: "grid", gap: 8, fontSize: 13, opacity: 0.92 }}>
              <RuleRow label="Country" value={rules.country} />
              <RuleRow label="Department" value={rules.department} />
              <RuleRow label="Contract type" value={rules.contractType} />
              <RuleRow label="Role" value={rules.role} />
              <RuleRow label="Human involvement" value={humanInvolvement} />
            </div>
          </div>

          {/* Evidence */}
          <div style={{ marginTop: 12, padding: 12, borderRadius: 14, border: "1px solid rgba(0,0,0,0.10)" }}>
            <div style={{ fontWeight: 900, marginBottom: 8 }}>Evidence</div>

            <EvidenceBlock
              title="Work account"
              status={evidenceStatusLabel(evidence.accounts.status)}
              lines={[
                evidence.accounts.output?.account?.username ? `Username: ${evidence.accounts.output.account.username}` : null,
                evidence.accounts.output?.action_id ? `Action ID: ${evidence.accounts.output.action_id}` : null,
              ]}
            />

            <EvidenceBlock
              title="Hardware"
              status={evidenceStatusLabel(evidence.hardware.status)}
              lines={[
                evidence.hardware.output?.bundle ? `Bundle: ${evidence.hardware.output.bundle}` : null,
                evidence.hardware.output?.ticket_id ? `Order/Ticket: ${evidence.hardware.output.ticket_id}` : null,
                evidence.hardware.status === "FAILED" && !evidence.hardware.output
                  ? "Hardware ordering failed (simulated provider outage)."
                  : null,
              ]}
            />

            <EvidenceBlock
              title="Access rights"
              status={evidenceStatusLabel(evidence.access.status)}
              lines={[
                Array.isArray(evidence.access.output?.accesses)
                  ? `Services: ${evidence.access.output.accesses.join(", ")}`
                  : null,
              ]}
            />
          </div>

          {error && (
            <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: "rgba(255,0,0,0.08)" }}>
              <b>Error:</b> {error}
            </div>
          )}
        </section>

        {/* CENTER CONTAINER (Simulation + Ashby trigger mock placeholder) */}
        <section style={panel()}>
          <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 6 }}>Simulate situations</div>

          {/* How this demo works belongs here (per your request) */}
          <div style={{ marginTop: 10, padding: 12, borderRadius: 14, background: "rgba(0,0,0,0.04)" }}>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>How this demo works</div>
            <div style={{ fontSize: 13, opacity: 0.9, lineHeight: 1.5 }}>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                <li>
                  You trigger an <b>Ashby-like</b> event (<b>Candidate hired</b>) for Ana Lopez.
                </li>
                <li>The system executes deterministic onboarding actions automatically.</li>
                <li>HR is involved only when ambiguity is detected (FLAGGED).</li>
              </ul>
            </div>
          </div>

          {/* Placeholder for Ashby JSON (we’ll implement next) */}
          <div style={{ marginTop: 10, padding: 12, borderRadius: 14, border: "1px solid rgba(0,0,0,0.10)" }}>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>Ashby event payload (preview)</div>
            <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 8 }}>
              Next step: we’ll replace this with a clean, RH-readable “Candidate hired” object for Ana.
            </div>
            <pre style={preStyle}>
{`{
  "event": "candidate.hired",
  "candidate": { "name": "Ana Lopez", "email": "ana.lopez@alan-demo.com" },
  "job": { "title": "Backend Engineer", "department": "Engineering" },
  "start_date": "2026-02-03",
  "country": "FR",
  "contract_type": "Permanent"
}`}
            </pre>
          </div>

          <div style={{ marginTop: 12, fontSize: 13, opacity: 0.8 }}>
            Run one scenario to generate an onboarding decision.
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

      <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
        Demo — Serverless APIs (Vercel) + Activepieces + Supabase.
      </div>
    </div>
  );
}

/* ----------------------------- Embedded panels ---------------------------- */

function CandidateApplicationPanel() {
  // Placeholder: next step we will replace by an Ashby-style application mock + CV link
  return (
    <div style={{ padding: 12, borderRadius: 14, border: "1px solid rgba(0,0,0,0.10)" }}>
      <div style={{ fontWeight: 900, marginBottom: 6 }}>Candidate application</div>
      <div style={{ fontSize: 13, opacity: 0.9, lineHeight: 1.5 }}>
        This tab will display Ana’s (mocked) Ashby application: key answers + attachments (CV).
      </div>
      <div style={{ marginTop: 10, padding: 12, borderRadius: 12, background: "rgba(0,0,0,0.04)", fontSize: 13, opacity: 0.9 }}>
        Coming next: beautified Ashby JSON → “Candidate hired” payload + application answers.
      </div>
    </div>
  );
}

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
        <ActionRow label="Create work account" status={accounts?.status ?? "—"} />
        <ActionRow label="Order hardware" status={hardware?.status ?? "—"} />
        <ActionRow label="Configure access rights" status={access?.status ?? "—"} />
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
  return (
    <div style={{ padding: 12, borderRadius: 14, border: "1px solid rgba(0,0,0,0.10)" }}>
      <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 6 }}>Audit log</div>
      <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 10 }}>
        Full traceability for audit & compliance. Status: <b>{status ?? "—"}</b>
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        {steps.length === 0 && <div style={{ fontSize: 13, opacity: 0.8 }}>No steps logged yet.</div>}
        {steps.map((s) => (
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
    padding: 16,
    background: "white",
    overflow: "auto",
  };
}

const smallBtn: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 12,
  border: "1px solid rgba(0,0,0,0.12)",
  background: "white",
  cursor: "pointer",
  fontWeight: 800,
  fontSize: 12,
};

const preStyle: React.CSSProperties = {
  margin: 0,
  padding: 12,
  borderRadius: 12,
  background: "rgba(0,0,0,0.04)",
  overflow: "auto",
  fontSize: 12,
  lineHeight: 1.4,
};

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

function RuleRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
      <div style={{ fontWeight: 800, opacity: 0.85 }}>{label}</div>
      <div style={{ fontWeight: 900, textAlign: "right" }}>{value}</div>
    </div>
  );
}

function EvidenceBlock({ title, status, lines }: { title: string; status: string; lines: Array<string | null> }) {
  const filtered = lines.filter(Boolean) as string[];

  return (
    <div style={{ padding: 10, borderRadius: 12, background: "rgba(0,0,0,0.04)", marginTop: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <div style={{ fontWeight: 900 }}>{title}</div>
        <div style={{ fontWeight: 900, opacity: 0.9 }}>{status}</div>
      </div>
      {filtered.length > 0 && (
        <ul style={{ margin: "8px 0 0 0", paddingLeft: 18, fontSize: 13, opacity: 0.9 }}>
          {filtered.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ActionRow({ label, status }: { label: string; status: string }) {
  const s = (status ?? "").toUpperCase();
  const human =
    s === "SUCCESS" ? "Completed" : s === "FAILED" ? "Failed" : s === "SKIPPED" ? "Skipped" : "—";

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

function evidenceStatusLabel(stepStatus: string | null) {
  if (!stepStatus) return "—";
  if (stepStatus === "SUCCESS") return "Completed";
  if (stepStatus === "FAILED") return "Failed";
  if (stepStatus === "SKIPPED") return "Skipped";
  return stepStatus;
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