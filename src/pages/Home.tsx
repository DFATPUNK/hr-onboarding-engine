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
  const [lastRunId, setLastRunId] = useState<string | null>(null);
  const [lastStatus, setLastStatus] = useState<string | null>(null);
  const [lastSummary, setLastSummary] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(LS_LAST_RUN);
    if (saved) {
      setLastRunId(saved);
      // best-effort fetch to show status/summary
      fetchRun(saved)
        .then(({ run }) => {
          setLastStatus(run.status);
          setLastSummary(run.summary);
        })
        .catch(() => {
          // ignore; the run may have expired/been cleaned
        });
    }
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

      localStorage.setItem(LS_LAST_RUN, r.run_id);
      setLastRunId(r.run_id);
      setLastStatus(r.status);
      setLastSummary(r.summary ?? null);
    } catch (e: any) {
      setErr(e?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const badge = statusBadge(lastStatus ?? undefined);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 18 }}>
      {/* Left: Latest decision */}
      <div style={cardStyle()}>
        <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 6 }}>Latest onboarding decision</div>
        <div style={{ fontSize: 14, opacity: 0.8, marginBottom: 14 }}>
          A new hire just signed their offer. The system decides and executes deterministic onboarding actions automatically.
        </div>

        {/* Employee card (static for demo) */}
        <div style={{ display: "grid", gap: 4, marginBottom: 12 }}>
          <div style={{ fontWeight: 900, fontSize: 16 }}>Ana Lopez</div>
          <div style={{ fontSize: 13, opacity: 0.75 }}>Backend Engineer · France · Permanent</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <span style={toneStyle(badge.tone)}>{badge.label}</span>
          {loading && <span style={{ fontSize: 13, opacity: 0.75 }}>Running…</span>}
        </div>

        <div style={{ marginTop: 12, padding: 12, borderRadius: 14, background: "rgba(0,0,0,0.04)" }}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>What this means</div>
          <div style={{ fontSize: 14, opacity: 0.9, whiteSpace: "pre-wrap" }}>
            {lastSummary ??
              "Trigger a scenario to see how the system behaves. The goal is simple: be Day 1 ready with no manual coordination."}
          </div>
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          {lastRunId ? (
            <>
              <Link to={`/onboarding/${lastRunId}`} style={primaryLink}>
                View onboarding details →
              </Link>
              <Link to={`/audit/${lastRunId}`} style={secondaryLink}>
                View execution log
              </Link>
            </>
          ) : (
            <span style={{ fontSize: 13, opacity: 0.75 }}>No run yet.</span>
          )}
        </div>

        {err && (
          <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: "rgba(255,0,0,0.08)" }}>
            <b>Error:</b> {err}
          </div>
        )}

        <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(0,0,0,0.08)" }}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>Key outcomes</div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, opacity: 0.9 }}>
            <li>✅ Work account created</li>
            <li>✅ Hardware ordered</li>
            <li>✅ Access rights configured</li>
          </ul>
        </div>
      </div>

      {/* Right: simulations */}
      <div style={cardStyle()}>
        <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 6 }}>Simulate other situations</div>
        <div style={{ fontSize: 13, opacity: 0.75, marginBottom: 12 }}>
          See how the system behaves when ambiguity or failures occur.
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