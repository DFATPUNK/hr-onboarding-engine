import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchRun, type RunStep } from "../lib/api";
import { stepLabel } from "../lib/rh";

function fmt(ts?: string | null) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString();
}

export default function AuditLog() {
  const { runId } = useParams();
  return <AuditLogView runId={runId} />;
}

/**
 * Reusable view used both as a standalone page and as an embedded panel on the Home screen.
 * IMPORTANT: keep the UI identical to preserve the "perfect" look of the page.
 */
export function AuditLogView({ runId, embedded }: { runId?: string; embedded?: boolean }) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [run, setRun] = useState<any>(null);
  const [steps, setSteps] = useState<RunStep[]>([]);

  useEffect(() => {
    if (!runId) return;
    setLoading(true);
    setErr(null);

    fetchRun(runId)
      .then((data) => {
        setRun(data.run);
        setSteps(data.steps);
      })
      .catch((e: any) => setErr(e?.message ?? "Failed to load"))
      .finally(() => setLoading(false));
  }, [runId]);

  return (
    <div style={{ display: "grid", gap: 18 }}>
      {!embedded && (
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Link to="/" style={{ fontSize: 14 }}>
            ← Back
          </Link>
          {runId && (
            <Link to={`/onboarding/${runId}`} style={{ fontSize: 14 }}>
              View onboarding details
            </Link>
          )}
        </div>
      )}

      <section
        style={{
          border: "1px solid rgba(0,0,0,0.12)",
          borderRadius: 18,
          padding: 18,
          background: "white",
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 6 }}>Execution log</div>
        <div style={{ fontSize: 13, opacity: 0.75 }}>
          Full traceability for audit & compliance. Human-readable labels by default.
        </div>

        {loading && <div style={{ marginTop: 12 }}>Loading…</div>}
        {err && (
          <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: "rgba(255,0,0,0.08)" }}>
            <b>Error:</b> {err}
          </div>
        )}

        {!loading && !err && run && (
          <>
            <div style={{ marginTop: 12, fontSize: 14, opacity: 0.9 }}>
              <b>Status:</b> {run.status} · <b>Started:</b> {fmt(run.started_at)} · <b>Finished:</b>{" "}
              {fmt(run.finished_at)}
            </div>

            <div style={{ marginTop: 14, overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ textAlign: "left" }}>
                    <th style={th}>Time</th>
                    <th style={th}>Event</th>
                    <th style={th}>Status</th>
                    <th style={th}>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {steps.map((s) => (
                    <tr key={s.id}>
                      <td style={td}>{fmt(s.created_at)}</td>
                      <td style={td}>{stepLabel(s.step)}</td>
                      <td style={td}>{s.status}</td>
                      <td style={td}>{s.reason ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

const th: React.CSSProperties = {
  padding: "10px 8px",
  borderBottom: "1px solid rgba(0,0,0,0.12)",
  fontWeight: 900,
  opacity: 0.85,
};

const td: React.CSSProperties = {
  padding: "10px 8px",
  borderBottom: "1px solid rgba(0,0,0,0.08)",
  verticalAlign: "top",
};
