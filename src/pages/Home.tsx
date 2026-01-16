import { useEffect, useMemo, useState } from "react";
import { postOfferSigned, fetchRun, type OfferSignedPayload, type RunStep } from "../lib/api";
import { statusBadge, toneStyle } from "../lib/rh";
import { findStep, getEvidence } from "../lib/steps";
import { OnboardingDetailsView } from "./OnboardingDetails";
import { AuditLogView } from "./AuditLog";

type ScenarioKind = "standard" | "flagged" | "partial";
type LeftPanelView = "onboarding" | "audit";

const LS_LAST_RUN = "hr_onboarding_last_run_id";

/* ---------------------------------- helpers ---------------------------------- */

function cardStyle(): React.CSSProperties {
  return {
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: 18,
    padding: 18,
    background: "white",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
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
  };
}

function ScenarioButton({
  title,
  subtitle,
  icon,
  selected,
  loading,
  onClick,
}: {
  title: string;
  subtitle: string;
  icon: string;
  selected: boolean;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      disabled={loading}
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "left",
        padding: 14,
        borderRadius: 14,
        border: selected ? "1px solid rgba(0,0,0,0.35)" : "1px solid rgba(0,0,0,0.12)",
        background: selected ? "rgba(0,0,0,0.04)" : "white",
        fontWeight: 900,
        cursor: loading ? "not-allowed" : "pointer",
        marginBottom: 10,
      }}
    >
      <div>
        <span style={{ marginRight: 8 }}>{icon}</span>
        {title}
      </div>
      <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>{subtitle}</div>
    </button>
  );
}

/* ---------------------------------- page ---------------------------------- */

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioKind | null>(null);

  const [detailsOpen, setDetailsOpen] = useState(true);
  const [leftView, setLeftView] = useState<LeftPanelView>("onboarding");

  const [runId, setRunId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [input, setInput] = useState<any>(null);
  const [steps, setSteps] = useState<RunStep[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(LS_LAST_RUN);
    if (saved) setRunId(saved);
  }, []);

  const basePayload: OfferSignedPayload = useMemo(
    () => ({
      event_id: `evt_${Date.now()}`,
      candidate: { first_name: "Ana", last_name: "Lopez", email: "ana@alan-demo.com" },
      job: { title: "Backend Engineer", department: "Engineering", level: "B2" },
      employment: { country: "FR", contract_type: "Permanent", start_date: "2026-02-03" },
      scenario: { standard: true },
    }),
    []
  );

  async function runScenario(kind: ScenarioKind) {
    setLoading(true);
    setSelectedScenario(kind);

    const payload: OfferSignedPayload = {
      ...basePayload,
      event_id: `evt_${Date.now()}`,
      scenario:
        kind === "standard"
          ? { standard: true }
          : kind === "flagged"
          ? { unknown_role: true }
          : { standard: true, simulate_it_failure: true },
    };

    if (kind === "flagged") {
      payload.job.title = "Quantum HR Wizard";
    }

    try {
      const res = await postOfferSigned(payload);
      localStorage.setItem(LS_LAST_RUN, res.run_id);
      const full = await fetchRun(res.run_id);

      setRunId(res.run_id);
      setStatus(full.run.status);
      setInput(full.run.input);
      setSteps(full.steps);
      setDetailsOpen(true);
      setLeftView("onboarding");
    } finally {
      setLoading(false);
    }
  }

  const badge = statusBadge(status ?? undefined);
  const evidence = getEvidence(steps);

  const hardwareStep = findStep(steps, "PROVISION_HARDWARE");
  const hardwareStatus =
    hardwareStep?.status === "FAILED" || hardwareStep?.status === "FAILURE"
      ? "Failed"
      : "Completed";

  /* ---------------------------------- layout ---------------------------------- */

  return (
    <div style={{ height: "100vh", padding: 24, boxSizing: "border-box" }}>
      <div
        style={{
          height: "100%",
          display: "grid",
          gap: 18,
          gridTemplateColumns: detailsOpen ? "1fr 1fr 2fr" : "1fr 1fr 0px",
          transition: "grid-template-columns 220ms ease",
        }}
      >
        {/* ---------------- Simulate situations ---------------- */}
        <div style={cardStyle()}>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>Simulate situations</div>

          <div style={{ fontSize: 13, opacity: 0.75, marginBottom: 12 }}>
            Trigger an <b>offer signed</b> event and observe the system decision.
          </div>

          <div style={{ marginBottom: 14 }}>
            <ScenarioButton
              icon="▶️"
              title="Standard onboarding"
              subtitle="Expected: no action required"
              selected={selectedScenario === "standard"}
              loading={loading}
              onClick={() => runScenario("standard")}
            />
            <ScenarioButton
              icon="⚠️"
              title="Unknown role → HR review"
              subtitle="Expected: human review required"
              selected={selectedScenario === "flagged"}
              loading={loading}
              onClick={() => runScenario("flagged")}
            />
            <ScenarioButton
              icon="🔧"
              title="IT issue → partial completion"
              subtitle="Expected: partial completion"
              selected={selectedScenario === "partial"}
              loading={loading}
              onClick={() => runScenario("partial")}
            />
          </div>

          <div style={{ fontSize: 12, opacity: 0.7 }}>
            The system escalates to humans only when ambiguity or failure is detected.
          </div>
        </div>

        {/* ---------------- Decision ---------------- */}
        <div style={cardStyle()}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontWeight: 900 }}>Decision</div>
            {status && <span style={toneStyle(badge.tone)}>{badge.label}</span>}
          </div>

          {!status && (
            <div style={{ marginTop: 24, fontSize: 13, opacity: 0.7 }}>
              Run a scenario to generate an onboarding decision.
            </div>
          )}

          {status && (
            <div style={{ marginTop: 14, fontSize: 14, opacity: 0.9 }}>
              {status === "SUCCESS" && "No human action required."}
              {status === "FLAGGED" && "Human review required due to ambiguity."}
              {status === "PARTIAL" && "Partial completion. Follow-up required."}
            </div>
          )}
        </div>

        {/* ---------------- Details (slide-out) ---------------- */}
        <div style={{ position: "relative", height: "100%" }}>
          {!detailsOpen && (
            <button
              onClick={() => setDetailsOpen(true)}
              style={{
                position: "absolute",
                left: -36,
                top: 40,
                height: 140,
                width: 36,
                writingMode: "vertical-rl",
                borderRadius: "12px 0 0 12px",
                border: "1px solid rgba(0,0,0,0.12)",
                background: "white",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              Details
            </button>
          )}

          {detailsOpen && (
            <div style={cardStyle()}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ fontWeight: 900 }}>Details</div>
                <button onClick={() => setDetailsOpen(false)} style={tabBtn(false)}>
                  →
                </button>
              </div>

              <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                <button
                  style={tabBtn(leftView === "onboarding")}
                  onClick={() => setLeftView("onboarding")}
                  disabled={!runId}
                >
                  Onboarding details
                </button>
                <button
                  style={tabBtn(leftView === "audit")}
                  onClick={() => setLeftView("audit")}
                  disabled={!runId}
                >
                  Log journal
                </button>
              </div>

              <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
                {!runId && (
                  <div style={{ fontSize: 13, opacity: 0.7 }}>
                    Run a scenario to inspect execution details.
                  </div>
                )}

                {runId && leftView === "onboarding" && (
                  <OnboardingDetailsView runId={runId} embedded />
                )}

                {runId && leftView === "audit" && <AuditLogView runId={runId} embedded />}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
