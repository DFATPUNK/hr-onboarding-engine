export type OfferSignedPayload = {
  event_id: string;
  candidate: { first_name: string; last_name: string; email: string };
  job: { title: string; department: string; level?: string };
  employment: { country: string; contract_type: string; start_date: string };
  scenario?: { standard?: boolean; unknown_role?: boolean; simulate_it_failure?: boolean };
};

export type DemoResponse = {
  run_id: string;
  status: string;
  summary: string | null;
  anomalies?: any;
  deduped?: boolean;
};

export type RunStep = {
  id: number;
  run_id: string;
  step: string;
  status: string;
  reason: string | null;
  input: any;
  output: any;
  created_at: string;
};

export type RunRecord = {
  run_id: string;
  event_id: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  input: any;
  summary: string | null;
  anomalies: any;
};

export async function postOfferSigned(payload: OfferSignedPayload): Promise<DemoResponse> {
  const res = await fetch("/api/demo/offersigned", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error ?? "Request failed");
  }
  return data;
}

export async function fetchRun(runId: string): Promise<{ run: RunRecord; steps: RunStep[] }> {
  const res = await fetch(`/api/runs/${encodeURIComponent(runId)}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error ?? "Failed to load run");
  }
  return data;
}