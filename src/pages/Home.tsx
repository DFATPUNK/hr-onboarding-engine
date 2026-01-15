import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { postOfferSigned, type DemoResponse, type OfferSignedPayload } from "../lib/api";

function badgeStyle(status?: string) {
  const base: React.CSSProperties = {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    border: "1px solid rgba(0,0,0,0.12)",
  };
  if (!status) return base;
  const s = status.toUpperCase();
  if (s === "SUCCESS") return { ...base, background: "rgba(0, 200, 0, 0.10)" };
  if (s === "FLAGGED") return { ...base, background: "rgba(255, 180, 0, 0.18)" };
  if (s === "PARTIAL") return { ...base, background: "rgba(255, 180, 0, 0.18)" };
  if (s === "FAILED") return { ...base, background: "rgba(255, 0, 0, 0.10)" };
  return base;
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DemoResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const basePayload: OfferSignedPayload = useMemo(
    () => ({
      // event_id unique à chaque click (évite l’idempotence)
      event_id: `evt_demo_${Date.now()}`,
      candidate: { first_name: "Ana", last_name: "Lopez", email: "ana.lopez@alan-demo.com" },
      job: { title: "Backend Engineer", department: "Engineering", level: "B2" },
      employment: { country: "FR", contract_type: "Permanent", start_date: "2026-02-03" },
      scenario: { standard: true, unknown_role: false, simulate_it_failure: false },
    }),
    []
  );

  async function runScenario(scenario: OfferSignedPayload["scenario"]) {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const payload: OfferSignedPayload = {
        ...basePayload,
        event_id: `evt_demo_${Date.now()}`, // unique
        scenario: scenario ?? {},
      };

      // Pour unknown role, on rend le titre volontairement "weird"
      if (scenario?.unknown_role) {
        payload.job = { ...payload.job, title: "Quantum HR Wizard", department: "People", level: "C1" };
      }

      const r = await postOfferSigned(payload);
      setResult(r);
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <section
        style={{
          border: "1px solid rgba(0,0,0,0.12)",
          borderRadius: 16,
          padding: 18,
          marginBottom: 18,
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Run the demo</div>
        <div style={{ fontSize: 14, opacity: 0.8, marginBottom: 14 }}>
          This triggers an <b>OfferSigned</b> event. The system decides and executes deterministic onboarding actions automatically, then writes an audit log.
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          <button
            onClick={() => runScenario({ standard: true, unknown_role: false, simulate_it_failure: false })}
            disabled={loading}
            style={btnStyle}
          >
            ▶️ Standard onboarding
            <div style={btnSub}>Expected: SUCCESS</div>
          </button>

          <button
            onClick={() => runScenario({ unknown_role: true, simulate_it_failure: false })}
            disabled={loading}
            style={btnStyle}
          >
            ⚠️ Unknown role → flagged
            <div style={btnSub}>Expected: FLAGGED</div>
          </button>

          <button
            onClick={() => runScenario({ standard: true, simulate_it_failure: true })}
            disabled={loading}
            style={btnStyle}
          >
            🔧 IT failure → partial
            <div style={btnSub}>Expected: PARTIAL</div>
          </button>
        </div>
      </section>

      <section style={{ border: "1px solid rgba(0,0,0,0.12)", borderRadius: 16, padding: 18 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 800 }}>Result</div>
          {result?.status && <span style={badgeStyle(result.status)}>{result.status}</span>}
        </div>

        {loading && <div style={{ marginTop: 12, opacity: 0.75 }}>Running…</div>}

        {error && (
          <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: "rgba(255,0,0,0.08)" }}>
            <b>Error:</b> {error}
          </div>
        )}

        {!loading && !error && !result && (
          <div style={{ marginTop: 12, opacity: 0.7 }}>
            Click a scenario above to trigger an onboarding run.
          </div>
        )}

        {result && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 14, opacity: 0.85 }}>
              <b>Run ID:</b> {result.run_id}
            </div>

            <div style={{ marginTop: 10, padding: 12, borderRadius: 12, background: "rgba(0,0,0,0.04)" }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Summary</div>
              <div style={{ whiteSpace: "pre-wrap" }}>{result.summary ?? "—"}</div>
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 12, alignItems: "center" }}>
              <Link to={`/runs/${result.run_id}`} style={linkBtnStyle}>
                View run log →
              </Link>
              {result.deduped && <span style={{ fontSize: 12, opacity: 0.75 }}>Deduped by event_id</span>}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  textAlign: "left",
  padding: 14,
  borderRadius: 14,
  border: "1px solid rgba(0,0,0,0.12)",
  background: "white",
  cursor: "pointer",
  fontWeight: 800,
};

const btnSub: React.CSSProperties = {
  fontSize: 12,
  opacity: 0.7,
  fontWeight: 600,
  marginTop: 6,
};

const linkBtnStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(0,0,0,0.12)",
  textDecoration: "none",
  color: "inherit",
  fontWeight: 800,
};