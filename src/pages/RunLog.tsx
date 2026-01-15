import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchRun, type RunStep } from "../lib/api";

function fmt(ts?: string | null) {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleString();
}

function stepRowStyle(status: string): React.CSSProperties {
  const s = status.toUpperCase();
  if (s === "SUCCESS") return { background: "rgba(0, 200, 0, 0.08)" };
  if (s === "FAILED") return { background: "rgba(255, 0, 0, 0.08)" };
  if (s === "SKIPPED") return { background: "rgba(0, 0, 0, 0.04)" };
  return {};
}

export default function RunLog() {
  const { runId } = useParams();
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
    <div>
      <div style={{ marginBottom: 14 }}>
        <Link to="/" style={{ fontSize: 14 }}>
          ← Back
        </Link>
      </div>

      <section style={{ border: "1px solid rgba(0,0,0,0.12)", borderRadius: 16, padding: 18 }}>
        <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>Run log</div>
        <div style={{ fontSize: 13, opacity: 0.75 }}>
          This is an append-only audit trail of what the system did and why.
        </div>

        {loading && <div style={{ marginTop: 12 }}>Loading…</div>}
        {err && (
          <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: "rgba(255,0,0,0.08)" }}>
            <b>Error:</b> {err}
          </div>
        )}

        {!loading && !err && run && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: "grid", gap: 6, fontSize: 14 }}>
              <div><b>Run ID:</b> {run.run_id}</div>
              <div><b>Status:</b> {run.status}</div>
              <div><b>Started:</b> {fmt(run.started_at)}</div>
              <div><b>Finished:</b> {fmt(run.finished_at)}</div>
              <div><b>Event:</b> {run.event_id}</div>
            </div>

            <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: "rgba(0,0,0,0.04)" }}>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>Summary</div>
              <div style={{ whiteSpace: "pre-wrap" }}>{run.summary ?? "—"}</div>
            </div>

            <div style={{ marginTop: 16, overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ textAlign: "left" }}>
                    <th style={th}>Time</th>
                    <th style={th}>Step</th>
                    <th style={th}>Status</th>
                    <th style={th}>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {steps.map((s) => (
                    <tr key={s.id} style={{ ...stepRowStyle(s.status) }}>
                      <td style={td}>{fmt(s.created_at)}</td>
                      <td style={tdMono}>{s.step}</td>
                      <td style={td}><b>{s.status}</b></td>
                      <td style={td}>{s.reason ?? "—"}</td>
                    </tr>
                  ))}
                  {steps.length === 0 && (
                    <tr>
                      <td style={td} colSpan={4}>
                        No steps logged yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 16, padding: 12, borderRadius: 12, border: "1px solid rgba(0,0,0,0.10)" }}>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>Why this is Zero-Touch</div>
              <ul style={{ margin: 0, paddingLeft: 18, opacity: 0.9 }}>
                <li>No checklists or task assignment as the primary mechanism.</li>
                <li>Deterministic actions are executed automatically by the system.</li>
                <li>Humans are involved only when ambiguity is detected (FLAGGED / anomalies).</li>
              </ul>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

const th: React.CSSProperties = {
  padding: "10px 10px",
  borderBottom: "1px solid rgba(0,0,0,0.12)",
  whiteSpace: "nowrap",
};

const td: React.CSSProperties = {
  padding: "10px 10px",
  borderBottom: "1px solid rgba(0,0,0,0.08)",
  verticalAlign: "top",
};

const tdMono: React.CSSProperties = {
  ...td,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
};