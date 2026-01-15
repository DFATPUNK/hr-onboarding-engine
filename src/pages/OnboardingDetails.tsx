import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchRun, type RunStep } from "../lib/api";
import { humanOutcomeFromSteps, statusBadge, toneStyle } from "../lib/rh";

function fmt(ts?: string | null) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString();
}

function card(): React.CSSProperties {
  return { border: "1px solid rgba(0,0,0,0.12)", borderRadius: 18, padding: 18, background: "white" };
}

export default function OnboardingDetails() {
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

  const badge = statusBadge(run?.status);
  const outcomes = humanOutcomeFromSteps(steps);

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <Link to="/" style={{ fontSize: 14 }}>← Back</Link>
        {runId && <Link to={`/audit/${runId}`} style={{ fontSize: 14 }}>View execution log</Link>}
      </div>

      <div style={card()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900 }}>Onboarding details</div>
            <div style={{ fontSize: 13, opacity: 0.75 }}>
              What the system did — and whether HR needs to act.
            </div>
          </div>
          <span style={toneStyle(badge.tone)}>{badge.label}</span>
        </div>

        {loading && <div style={{ marginTop: 12 }}>Loading…</div>}
        {err && (
          <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: "rgba(255,0,0,0.08)" }}>
            <b>Error:</b> {err}
          </div>
        )}

        {!loading && !err && run && (
          <>
            {/* Employee card (read from run input if present; fallback to demo persona) */}
            <div style={{ marginTop: 14, padding: 12, borderRadius: 14, background: "rgba(0,0,0,0.04)" }}>
              <div style={{ fontWeight: 900, fontSize: 16 }}>
                {run?.input?.candidate?.first_name ?? "Ana"} {run?.input?.candidate?.last_name ?? "Lopez"}
              </div>
              <div style={{ fontSize: 13, opacity: 0.75, marginTop: 2 }}>
                {run?.input?.job?.title ?? "Backend Engineer"} — {run?.input?.employment?.country ?? "FR"} ·{" "}
                {run?.input?.employment?.contract_type ?? "Permanent"}
              </div>
              <div style={{ fontSize: 13, opacity: 0.75, marginTop: 2 }}>
                Start date: {run?.input?.employment?.start_date ?? "—"}
              </div>
            </div>

            {/* Decision block */}
            <div style={{ marginTop: 14 }}>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>Decision</div>
              <div style={{ fontSize: 14, opacity: 0.9, whiteSpace: "pre-wrap" }}>
                {run.summary ?? "—"}
              </div>
              <div style={{ marginTop: 8, fontSize: 13, opacity: 0.75 }}>
                Started: {fmt(run.started_at)} · Finished: {fmt(run.finished_at)}
              </div>
            </div>

            {/* Actions executed */}
            <div style={{ marginTop: 14 }}>
              <div style={{ fontWeight: 900, marginBottom: 8 }}>Actions executed by the system</div>
              <div style={{ display: "grid", gap: 8 }}>
                <ActionRow label="Create work account" done={outcomes.account} />
                <ActionRow label="Order hardware" done={outcomes.hardware} />
                <ActionRow label="Configure access rights" done={outcomes.access} />
              </div>
            </div>

            {/* Zero-touch explanation */}
            <div style={{ marginTop: 16, padding: 12, borderRadius: 14, border: "1px solid rgba(0,0,0,0.10)" }}>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>Why this is Zero-Touch</div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, opacity: 0.9 }}>
                <li>No checklists as the primary mechanism.</li>
                <li>No manual ticket assignment required to progress.</li>
                <li>Humans intervene only when ambiguity is detected (FLAGGED / anomalies).</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ActionRow({ label, done }: { label: string; done: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: 12, borderRadius: 14, border: "1px solid rgba(0,0,0,0.10)" }}>
      <div style={{ fontWeight: 900 }}>{label}</div>
      <div style={{ fontWeight: 900, opacity: 0.9 }}>{done ? "Completed" : "Not completed"}</div>
    </div>
  );
}