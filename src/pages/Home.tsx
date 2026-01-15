import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { postOfferSigned, fetchRun, type OfferSignedPayload } from "../lib/api";
import { statusBadge, toneStyle } from "../lib/rh";

const LS_LAST_RUN = "hr_onboarding_last_run_id";

function cardStyle(): React.CSSProperties {
  return {
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: 18,
    padding: 18,
    background: "white",
  };
}

export default function Home() {
  const [loading, setLoading] = useState(false);

  // "result" = le run déclenché pendant cette session (après click)
  const [resultRunId, setResultRunId] = useState<string | null>(null);
  const [resultStatus, setResultStatus] = useState<string | null>(null);
  const [resultSummary, setResultSummary] = useState<string | null>(null);

  // last run = persistance, mais on ne l'affiche pas automatiquement
  const [lastRunId, setLastRunId] = useState<string | null>(null);
  const [lastStatus, setLastStatus] = useState<string | null>(null);
  const [lastSummary, setLastSummary] = useState<string | null>(null);

  const [showLast, setShowLast] = useState(false);
  const [err, setErr] = useState<string | null>(null);

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

  async function runScenario(kind: "standard" | "flagged" | "partial") {
    setLoading(true);
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

      // store as "last run"
      localStorage.setItem(LS_LAST_RUN, r.run_id);
      setLastRunId(r.run_id);

      // show session result immediately
      setResultRunId(r.run_id);
      setResultStatus(r.status);
      setResultSummary(r.summary ?? null);

      // reveal the decision card
      setShowLast(false);
    } catch (e: any) {
      setErr(e?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function loadLastRun() {
    if (!lastRunId) return;
    setLoading(true);
    setErr(null);

    try {
      const { run } = await fetchRun(lastRunId);
      setLastStatus(run.status);
      setLastSummary(run.summary ?? null);
      setShowLast(true);

      // Clear session result view (optional)
      setResultRunId(null);
      setResultStatus(null);
      setResultSummary(null);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load last run");
    } finally {
      setLoading(false);
    }
  }

  const isShowingSessionResult = Boolean(resultRunId);
  const isShowingLast = showLast && Boolean(lastRunId);

  // Data currently displayed in the big decision card
  const displayedRunId = isShowingSessionResult ? resultRunId : isShowingLast ? lastRunId : null;
  const displayedStatus = isShowingSessionResult ? resultStatus : isShowingLast ? lastStatus : null;
  const displayedSummary = isShowingSessionResult ? resultSummary : isShowingLast ? lastSummary : null;

  const badge = statusBadge(displayedStatus ?? undefined);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 18 }}>
      {/* Left: RH-friendly narrative */}
      <div style={cardStyle()}>
        <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 6 }}>Automated onboarding decision</div>
        <div style={{ fontSize: 14, opacity: 0.8, marginBottom: 14 }}>
          This demo simulates what happens after a new hire signs an offer. The system executes deterministic onboarding
          actions automatically, and escalates to HR only when ambiguity is detected.
        </div>

        {/* EMPTY STATE */}
        {!displayedRunId && (
          <div style={{ padding: 14, borderRadius: 14, background: "rgba(0,0,0,0.04)" }}>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>No onboarding yet</div>
            <div style={{ fontSize: 14, opacity: 0.9 }}>
              Start by running a scenario on the right.
              <br />
              You’ll see whether HR needs to act, what was executed automatically, and the audit trail.
            </div>

            {lastRunId && (
              <div style={{ marginTop: 12 }}>
                <button onClick={loadLastRun} disabled={loading} style={ghostBtn}>
                  Show last run →
                </button>
              </div>
            )}
          </div>
        )}

        {/* DECISION CARD (only after user action OR explicit "show last") */}
        {displayedRunId && (
          <>
            <div style={{ display: "grid", gap: 4, marginTop: 10 }}>
              <div style={{ fontWeight: 900, fontSize: 16 }}>Ana Lopez</div>
              <div style={{ fontSize: 13, opacity: 0.75 }}>Backend Engineer · France · Permanent</div>
            </div>

            <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <span style={toneStyle(badge.tone)}>{badge.label}</span>
              {loading && <span style={{ fontSize: 13, opacity: 0.75 }}>Loading…</span>}
            </div>

            <div style={{ marginTop: 12, padding: 12, borderRadius: 14, background: "rgba(0,0,0,0.04)" }}>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>What this means</div>
              <div style={{ fontSize: 14, opacity: 0.9, whiteSpace: "pre-wrap" }}>
                {displayedSummary ?? "—"}
              </div>
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <Link to={`/onboarding/${displayedRunId}`} style={primaryLink}>
                View onboarding details →
              </Link>
              <Link to={`/audit/${displayedRunId}`} style={secondaryLink}>
                View execution log
              </Link>
            </div>

            <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(0,0,0,0.08)" }}>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>Key outcomes</div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, opacity: 0.9 }}>
                <li>✅ Work account created</li>
                <li>✅ Hardware ordered</li>
                <li>✅ Access rights configured</li>
              </ul>
            </div>
          </>
        )}

        {err && (
          <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: "rgba(255,0,0,0.08)" }}>
            <b>Error:</b> {err}
          </div>
        )}
      </div>

      {/* Right: simulations */}
      <div style={cardStyle()}>
        <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 6 }}>Simulate situations</div>
        <div style={{ fontSize: 13, opacity: 0.75, marginBottom: 12 }}>
          Run one scenario to generate an onboarding decision.
        </div>

        <button style={scenarioBtn} disabled={loading} onClick={() => runScenario("standard")}>
          ▶️ Standard onboarding
          <div style={scenarioSub}>Expected: no action required</div>
        </button>

        <button style={scenarioBtn} disabled={loading} onClick={() => runScenario("flagged")}>
          ⚠️ Unknown role → requires HR review
          <div style={scenarioSub}>Expected: Human review required</div>
        </button>

        <button style={scenarioBtn} disabled={loading} onClick={() => runScenario("partial")}>
          🔧 IT issue → partial completion
          <div style={scenarioSub}>Expected: Partial completion</div>
        </button>

        <div style={{ marginTop: 12, fontSize: 12, opacity: 0.7 }}>
          Tip: The execution log is available after running a scenario, but it’s secondary. The main goal is clarity: do
          you need to act, or did the system handle everything?
        </div>
      </div>
    </div>
  );
}

const primaryLink: React.CSSProperties = {
  display: "inline-block",
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(0,0,0,0.12)",
  textDecoration: "none",
  color: "inherit",
  fontWeight: 900,
  background: "white",
};

const secondaryLink: React.CSSProperties = {
  display: "inline-block",
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(0,0,0,0.12)",
  textDecoration: "none",
  color: "inherit",
  fontWeight: 800,
  opacity: 0.9,
};

const ghostBtn: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(0,0,0,0.12)",
  background: "white",
  cursor: "pointer",
  fontWeight: 800,
};

const scenarioBtn: React.CSSProperties = {
  width: "100%",
  textAlign: "left",
  padding: 14,
  borderRadius: 14,
  border: "1px solid rgba(0,0,0,0.12)",
  background: "white",
  cursor: "pointer",
  fontWeight: 900,
  marginBottom: 10,
};

const scenarioSub: React.CSSProperties = {
  fontSize: 12,
  opacity: 0.7,
  fontWeight: 700,
  marginTop: 6,
};
