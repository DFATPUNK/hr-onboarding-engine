import crypto from "crypto";
import { getSupabaseAdmin } from "../_lib/supabaseAdmin";
import type { OfferSignedEvent, RunStatus } from "../_lib/types";

function nowIso() {
  return new Date().toISOString();
}

function validateEvent(evt: OfferSignedEvent) {
  if (!evt?.event_id) return "Missing event_id";
  if (!evt?.candidate?.email) return "Missing candidate.email";
  if (!evt?.candidate?.first_name) return "Missing candidate.first_name";
  if (!evt?.candidate?.last_name) return "Missing candidate.last_name";
  if (!evt?.job?.title) return "Missing job.title";
  if (!evt?.job?.department) return "Missing job.department";
  if (!evt?.employment?.country) return "Missing employment.country";
  if (!evt?.employment?.contract_type) return "Missing employment.contract_type";
  if (!evt?.employment?.start_date) return "Missing employment.start_date";
  return null;
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const evt: OfferSignedEvent = req.body ?? {};
  const err = validateEvent(evt);
  if (err) return res.status(400).json({ error: err });

  const supabase = getSupabaseAdmin();

  // Idempotence: si event_id déjà traité → renvoyer run existant
  const existing = await supabase
    .from("runs")
    .select("run_id,status,summary,anomalies,finished_at,started_at")
    .eq("event_id", evt.event_id)
    .maybeSingle();

  if (existing.data?.run_id) {
    return res.status(200).json({
      run_id: existing.data.run_id,
      status: existing.data.status,
      summary: existing.data.summary,
      anomalies: existing.data.anomalies,
      deduped: true,
    });
  }

  const run_id = crypto.randomUUID();

  // insert run (RUNNING)
  const insert = await supabase.from("runs").insert({
    run_id,
    event_id: evt.event_id,
    status: "RUNNING",
    started_at: nowIso(),
    input: { ...evt, run_id },
  });

  if (insert.error) {
    // en cas de collision rare (race), retente lecture
    const fallback = await supabase
      .from("runs")
      .select("run_id,status,summary,anomalies")
      .eq("event_id", evt.event_id)
      .maybeSingle();

    if (fallback.data?.run_id) {
      return res.status(200).json({
        run_id: fallback.data.run_id,
        status: fallback.data.status,
        summary: fallback.data.summary,
        anomalies: fallback.data.anomalies,
        deduped: true,
      });
    }

    return res.status(500).json({ error: insert.error.message });
  }

  // Appel Activepieces /sync
  const apUrl = process.env.ACTIVEPIECES_WEBHOOK_URL_SYNC;
  if (!apUrl) return res.status(500).json({ error: "Missing ACTIVEPIECES_WEBHOOK_URL_SYNC" });

  const apResp = await fetch(apUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...evt,
      run_id,
      internal_api_key: process.env.INTERNAL_API_KEY, // Activepieces l'utilise pour appeler tes endpoints internes
      occurred_at: evt.occurred_at ?? nowIso(),
    }),
  });

  let apJson: any = {};
  try {
    apJson = await apResp.json();
  } catch {
    apJson = {};
  }

  const status: RunStatus =
    apJson?.status ??
    (apResp.ok ? "SUCCESS" : "FAILED");

  const summary = apJson?.summary ?? null;
  const anomalies = apJson?.anomalies ?? null;

  await supabase
    .from("runs")
    .update({
      status,
      summary,
      anomalies,
      finished_at: nowIso(),
    })
    .eq("run_id", run_id);

  return res.status(200).json({ run_id, status, summary, anomalies });
}