import { createClient } from "@supabase/supabase-js";

function assertInternal(req: any, res: any) {
  const key = req.headers["x-internal-key"];
  if (!key || key !== process.env.INTERNAL_API_KEY) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key);
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!assertInternal(req, res)) return;

  const { run_id, status, summary, anomalies } = req.body ?? {};
  if (!run_id || !status) return res.status(400).json({ error: "Missing run_id/status" });

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("runs")
    .update({
      status,
      summary: summary ?? null,
      anomalies: anomalies ?? null,
      finished_at: new Date().toISOString(),
    })
    .eq("run_id", run_id);

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ ok: true });
}