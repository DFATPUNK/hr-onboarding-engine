import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key);
}

function nowIso() {
  return new Date().toISOString();
}

function validateEvent(evt: any) {
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
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const evt = req.body ?? {};
    const err = validateEvent(evt);
    if (err) return res.status(400).json({ error: err });

    const supabase = getSupabaseAdmin();

    // Idempotence
    const existing = await supabase
      .from("runs")
      .select("run_id,status,summary,anomalies")
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

    // Create run first (needed for FK)
    const ins = await supabase.from("runs").insert({
      run_id,
      event_id: evt.event_id,
      status: "RUNNING",
      started_at: nowIso(),
      input: { ...evt, run_id },
    });

    if (ins.error) return res.status(500).json({ error: ins.error.message });

    // If webhook not configured yet, still return run_id so you can test logs manually
    const apUrl = process.env.ACTIVEPIECES_WEBHOOK_URL_SYNC;
    if (!apUrl) {
      return res.status(200).json({
        run_id,
        status: "RUNNING",
        summary: "Run created. ACTIVEPIECES_WEBHOOK_URL_SYNC not configured yet.",
        note: "Set ACTIVEPIECES_WEBHOOK_URL_SYNC in Vercel to execute the flow.",
      });
    }

    // Call Activepieces /sync
    const apResp = await fetch(apUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...evt,
        run_id,
        internal_api_key: process.env.INTERNAL_API_KEY,
        occurred_at: evt.occurred_at ?? nowIso(),
      }),
    });

    let apJson: any = {};
    try {
      apJson = await apResp.json();
    } catch {
      apJson = {};
    }

    const status = apJson?.status ?? (apResp.ok ? "SUCCESS" : "FAILED");
    const summary = apJson?.summary ?? null;
    const anomalies = apJson?.anomalies ?? null;

    await supabase
      .from("runs")
      .update({ status, summary, anomalies, finished_at: nowIso() })
      .eq("run_id", run_id);

    return res.status(200).json({ run_id, status, summary, anomalies });
  } catch (e: any) {
    // Make the error visible instead of FUNCTION_INVOCATION_FAILED
    return res.status(500).json({ error: e?.message ?? String(e) });
  }
}