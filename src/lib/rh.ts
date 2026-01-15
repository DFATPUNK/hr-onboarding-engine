export function statusBadge(status?: string) {
  const s = (status ?? "").toUpperCase();
  if (s === "SUCCESS") return { label: "Onboarding completed automatically", tone: "success" as const };
  if (s === "FLAGGED") return { label: "Human review required", tone: "warning" as const };
  if (s === "PARTIAL") return { label: "Partially completed", tone: "warning" as const };
  if (s === "FAILED") return { label: "Failed", tone: "danger" as const };
  return { label: s || "—", tone: "neutral" as const };
}

export function toneStyle(tone: "success" | "warning" | "danger" | "neutral") {
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    border: "1px solid rgba(0,0,0,0.12)",
    background: "rgba(0,0,0,0.03)",
  };
  if (tone === "success") return { ...base, background: "rgba(0, 200, 0, 0.10)" };
  if (tone === "warning") return { ...base, background: "rgba(255, 180, 0, 0.18)" };
  if (tone === "danger") return { ...base, background: "rgba(255, 0, 0, 0.10)" };
  return base;
}

export function stepLabel(step: string) {
  const s = step.toUpperCase();
  const map: Record<string, string> = {
    "RECEIVE_EVENT": "Offer signed received",
    "DECISION": "Required resources identified",
    "PROVISION_ACCOUNTS": "Work account created",
    "PROVISION_HARDWARE": "Hardware ordered",
    "PROVISION_ACCESS": "Access rights configured",
    "FINISH_RUN": "Onboarding completed"
  };
  return map[s] ?? step;
}

export function humanOutcomeFromSteps(steps: Array<{ step: string; status: string }>) {
  const by = new Map(steps.map(s => [s.step.toUpperCase(), s.status.toUpperCase()]));

  const account = by.get("PROVISION_ACCOUNTS") === "SUCCESS";
  const hardware = by.get("PROVISION_HARDWARE") === "SUCCESS";
  const access = by.get("PROVISION_ACCESS") === "SUCCESS";

  return {
    account,
    hardware,
    access,
  };
}