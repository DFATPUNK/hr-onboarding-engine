import { useEffect, useMemo, useState } from "react";
import { postOfferSigned, fetchRun, type OfferSignedPayload, type RunStep } from "../lib/api";
import { statusBadge, toneStyle } from "../lib/rh";
import { findStep, getEvidence } from "../lib/steps";
import { OnboardingDetailsView } from "./OnboardingDetails";
import { AuditLogView } from "./AuditLog";

const LS_LAST_RUN = "hr_onboarding_last_run_id";

type ScenarioKind = "standard" | "flagged" | "partial";

function cardStyle(): React.CSSProperties {
  return {
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: 18,
    padding: 18,
    background: "white",
  };
}

function pill(tone: "success" | "warning" | "danger" | "neutral") {
  return toneStyle(tone);
}

function rhMeaning(status?: string, input?: any) {
  const s = (status ?? "").toUpperCase();
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
    return "❌ Failed. The system could not complete the onboarding run. Please inspect the journal for details.";
  }
  return "Run a scenario to generate an onboarding decision.";
}

function DemoContext({ input }: { input?: any }) {
  const first = input?.candidate?.first_name ?? "Ana";
  const last = input?.candidate?.last_name ?? "Lopez";
  const title = input?.job?.title ?? "Backend Engineer";
  const dept = input?.job?.department ?? "Engineering";
  const country = input?.employment?.country ?? "FR";
  const contract = input?.employment?.contract_type ?? "Permanent";
  const start = input?.employment?.start_date ?? "2026-02-03";

  return (
    <div style={{ padding: 14, borderRadius: 14, background: "rgba(0,0,0,0.04)" }}>
      <div style={{ fontWeight: 900, marginBottom: 6 }}>Demo context</div>
      <div style={{ fontSize: 14, opacity: 0.9, lineHeight: 1.45 }}>
        You are viewing a simulated onboarding aftermath for a new hire.
        <br />
        <b>
          {first} {last}
        </b>{" "}
        is joining <b>{dept}</b> as <b>{title}</b> in <b>{country}</b> ({contract}).
        <br />
        Start date: <b>{start}</b>.
      </div>
    </div>
  );
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [activeScenario, setActiveScenario] = useState<ScenarioKind | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioKind | null>(null);

  const [leftPanelView, setLeftPanelView] = useState<"none" | "onboarding" | "audit">("none");

  // we don’t auto-show last run anymore
  const [lastRunId, setLastRunId] = useState<string | null>(null);

  // displayed run data
  const [displayedRunId, setDisplayedRunId] = useState<string | null>(null);
  const [displayedStatus, setDisplayedStatus] = useState<string | null>(null);
  const [displayedSummary, setDisplayedSummary] = useState<string | null>(null);
  const [displayedInput, setDisplayedInput] = useState<any>(null);
  const [displayedSteps, setDisplayedSteps] = useState<RunStep[]>([]);

  const [err, setErr] = useState<string | null>(null);

  // right panel tab
  const [tab, setTab] = useState<"overview" | "journal">("overview");

  useEffect(() => {
    const saved = localStorage.getItem(LS_LAST_RUN);
    if (saved) setLastRunId(saved);
  }, []);

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
    setSelectedScenario(kind);
    setErr(null);

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

      if (kind === "flagged") {
        payload.job = { title: "Quantum HR Wizard", department: "People", level: "C1" };
      }

      const r = await postOfferSigned(payload);

      // store last run id
      localStorage.setItem(LS_LAST_RUN, r.run_id);
      setLastRunId(r.run_id);

      // fetch full run to get steps + input + evidence
      const full = await fetchRun(r.run_id);

      setDisplayedRunId(r.run_id);
      setDisplayedStatus(full.run.status);
      setDisplayedSummary(full.run.summary ?? r.summary ?? null);
      setDisplayedInput(full.run.input ?? null);
      setDisplayedSteps(full.steps ?? []);
      setTab("overview");

      // After a run, default the left panel to the most HR-friendly view.
      setLeftPanelView("onboarding");
    } catch (e: any) {
      setErr(e?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
      setActiveScenario(null);
    }
  }

  async function showLastRun() {
    if (!lastRunId) return;
    setLoading(true);
    setActiveScenario(null);
    setErr(null);

    try {
      const full = await fetchRun(lastRunId);
      setDisplayedRunId(lastRunId);
      setDisplayedStatus(full.run.status);
      setDisplayedSummary(full.run.summary ?? null);
      setDisplayedInput(full.run.input ?? null);
      setDisplayedSteps(full.steps ?? []);
      setTab("overview");
      setLeftPanelView("onboarding");
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load last run");
    } finally {
      setLoading(false);
    }
  }

  const badge = statusBadge(displayedStatus ?? undefined);

  // Human involvement is purely driven by run.status (robust)
  const humanInvolvement =
    (displayedStatus ?? "").toUpperCase() === "FLAGGED" ? "Required (ambiguity detected)" : "Not required";

  const evidence = getEvidence(displayedSteps);

  const accountsStep = findStep(displayedSteps, "PROVISION_ACCOUNTS");
  const hardwareStep = findStep(displayedSteps, "PROVISION_HARDWARE");
  const accessStep = findStep(displayedSteps, "PROVISION_ACCESS");

  function stepOutcomeLabel(step?: RunStep | null) {
    const s = (step?.status ?? "").toUpperCase();
    if (!s) return "—";
    if (s === "SUCCESS" || s === "COMPLETED") return "Completed";
    if (s === "FAILED" || s === "FAILURE") return "Failed";
    if (s === "SKIPPED") return "Skipped";
    return s;
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "0.9fr 0.95fr 1.15fr", gap: 18 }}>
      {/* LEFT: Inline details/log viewer */}
      <div style={cardStyle()}>
        <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 10 }}>Details</div>

        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          <button
            onClick={() => setLeftPanelView("onboarding")}
            style={tabBtn(leftPanelView === "onboarding")}
            disabled={!displayedRunId}
            title={!displayedRunId ? "Run a scenario first" : ""}
          >
            Open onboarding details
          </button>
          <button
            onClick={() => setLeftPanelView("audit")}
            style={tabBtn(leftPanelView === "audit")}
            disabled={!displayedRunId}
            title={!displayedRunId ? "Run a scenario first" : ""}
          >
            Log journal
          </button>
        </div>

        {!displayedRunId && (
          <div style={{ fontSize: 13, opacity: 0.8 }}>
            Run a scenario to display onboarding details and the execution log here.
          </div>
        )}

        {displayedRunId && leftPanelView === "onboarding" && (
          <OnboardingDetailsView runId={displayedRunId} embedded />
        )}

        {displayedRunId && leftPanelView === "audit" && (
          <AuditLogView runId={displayedRunId} embedded />
        )}
      </div>

      {/* MIDDLE: Scenario runner */}
      <div style={cardStyle()}>
        <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 6 }}>Simulate situations</div>
        <div style={{ fontSize: 13, opacity: 0.75, marginBottom: 12 }}>
          Run one scenario to generate an onboarding decision.
        </div>

        <div style={{ marginBottom: 12, padding: 14, borderRadius: 14, background: "rgba(0,0,0,0.04)" }}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>How this demo works</div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, opacity: 0.9, lineHeight: 1.5 }}>
            <li>
              You trigger an <b>offer signed</b> event.
            </li>
            <li>The system executes deterministic onboarding actions automatically.</li>
            <li>HR is involved only when ambiguity is detected (FLAGGED).</li>
          </ul>
        </div>

        <ScenarioButton
          title="Standard onboarding"
          subtitle="Expected: no action required"
          icon="▶️"
          disabled={loading}
          active={activeScenario === "standard"}
          selected={selectedScenario === "standard"}
          onClick={() => runScenario("standard")}
        />

        <ScenarioButton
          title="Unknown role → requires HR review"
          subtitle="Expected: Human review required"
          icon="⚠️"
          disabled={loading}
          active={activeScenario === "flagged"}
          selected={selectedScenario === "flagged"}
          onClick={() => runScenario("flagged")}
        />

        <ScenarioButton
          title="IT issue → partial completion"
          subtitle="Expected: Partial completion"
          icon="🔧"
          disabled={loading}
          active={activeScenario === "partial"}
          selected={selectedScenario === "partial"}
          onClick={() => runScenario("partial")}
        />

        {!displayedRunId && lastRunId && (
          <div style={{ marginTop: 10 }}>
            <button onClick={showLastRun} disabled={loading} style={ghostBtn}>
              Show last run →
            </button>
          </div>
        )}
      </div>

      {/* RIGHT: Decision + evidence */}
      <div style={cardStyle()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ fontSize: 18, fontWeight: 900 }}>Decision</div>
          {displayedRunId ? <span style={pill(badge.tone)}>{badge.label}</span> : null}
        </div>

        <div style={{ marginTop: 10 }}>
          <DemoContext input={displayedInput ?? basePayload} />
        </div>

        {!displayedRunId && (
          <div style={{ marginTop: 12, fontSize: 13, opacity: 0.8 }}>
            Run a scenario to generate an onboarding decision.
          </div>
        )}

        {displayedRunId && (
          <>
            <div style={{ marginTop: 12, padding: 12, borderRadius: 14, background: "rgba(0,0,0,0.04)" }}>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>What this means</div>
              <div style={{ fontSize: 14, opacity: 0.92, whiteSpace: "pre-wrap" }}>
                {rhMeaning(displayedStatus ?? undefined, displayedInput)}
              </div>
              {displayedSummary && (
                <div style={{ marginTop: 8, fontSize: 13, opacity: 0.75, whiteSpace: "pre-wrap" }}>
                  {displayedSummary}
                </div>
              )}
            </div>

            <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
              <button onClick={() => setTab("overview")} style={tabBtn(tab === "overview")}>
                Overview
              </button>
              <button onClick={() => setTab("journal")} style={tabBtn(tab === "journal")}>
                Journal
              </button>
            </div>

            <div style={{ marginTop: 12 }}>
              {tab === "overview" && (
                <div style={{ display: "grid", gap: 12 }}>
                  <div style={{ padding: 12, borderRadius: 14, border: "1px solid rgba(0,0,0,0.10)" }}>
                    <div style={{ fontWeight: 900, marginBottom: 6 }}>Decision rules applied</div>
                    <div style={{ display: "grid", gap: 8, fontSize: 13, opacity: 0.9 }}>
                      <RuleRow label="Country" value={displayedInput?.employment?.country ?? "—"} />
                      <RuleRow label="Department" value={displayedInput?.job?.department ?? "—"} />
                      <RuleRow label="Contract type" value={displayedInput?.employment?.contract_type ?? "—"} />
                      <RuleRow label="Role" value={displayedInput?.job?.title ?? "—"} />
                      <RuleRow label="Human involvement" value={humanInvolvement} />
                    </div>
                  </div>

                  <div style={{ padding: 12, borderRadius: 14, border: "1px solid rgba(0,0,0,0.10)" }}>
                    <div style={{ fontWeight: 900, marginBottom: 6 }}>Evidence</div>

                    <EvidenceBlock
                      title="Work account"
                      status={stepOutcomeLabel(accountsStep)}
                      lines={[
                        evidence.accounts?.account?.username ? `Username: ${evidence.accounts.account.username}` : null,
                        evidence.accounts?.action_id ? `Action ID: ${evidence.accounts.action_id}` : null,
                      ]}
                    />

                    <EvidenceBlock
                      title="Hardware"
                      status={stepOutcomeLabel(hardwareStep)}
                      lines={[
                        evidence.hardware?.bundle ? `Bundle: ${evidence.hardware.bundle}` : null,
                        evidence.hardware?.ticket_id ? `Order/Ticket: ${evidence.hardware.ticket_id}` : null,
                      ]}
                    />

                    <EvidenceBlock
                      title="Access rights"
                      status={stepOutcomeLabel(accessStep)}
                      lines={[
                        Array.isArray(evidence.access?.accesses)
                          ? `Services: ${evidence.access.accesses.join(", ")}`
                          : null,
                      ]}
                    />
                  </div>
                </div>
              )}

              {tab === "journal" && (
                <div style={{ padding: 12, borderRadius: 14, border: "1px solid rgba(0,0,0,0.10)" }}>
                  <div style={{ fontWeight: 900, marginBottom: 6 }}>Journal</div>
                  <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 10 }}>
                    Human-readable timeline of what happened.
                  </div>

                  <div style={{ display: "grid", gap: 8 }}>
                    {displayedSteps.length === 0 && (
                      <div style={{ fontSize: 13, opacity: 0.8 }}>No steps logged yet.</div>
                    )}
                    {displayedSteps.map((s) => (
                      <div key={s.id} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                        <div style={{ fontWeight: 800 }}>{s.step}</div>
                        <div style={{ fontWeight: 900 }}>{s.status}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
                    (Full audit labels are available in the Log Journal panel.)
                  </div>
                </div>
              )}
            </div>

            {err && (
              <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: "rgba(255,0,0,0.08)" }}>
                <b>Error:</b> {err}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ScenarioButton({
  title,
  subtitle,
  icon,
  disabled,
  active,
  selected,
  onClick,
}: {
  title: string;
  subtitle: string;
  icon: string;
  disabled: boolean;
  active: boolean;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      style={{
        width: "100%",
        textAlign: "left",
        padding: 14,
        borderRadius: 14,
        border: selected ? "1px solid rgba(0,0,0,0.32)" : "1px solid rgba(0,0,0,0.12)",
        background: selected ? "rgba(0,0,0,0.04)" : "white",
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
        <div style={{ fontSize: 12, opacity: 0.85, fontWeight: 900 }}>
          {active ? "Running…" : selected ? "✓ Selected" : ""}
        </div>
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
        <div style={{ fontWeight: 900, opacity: 0.85 }}>{status}</div>
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

const ghostBtn: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(0,0,0,0.12)",
  background: "white",
  cursor: "pointer",
  fontWeight: 800,
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
  };
}
