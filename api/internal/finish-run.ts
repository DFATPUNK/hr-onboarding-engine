import { allowOnlyPost, assertInternal } from "../_lib/auth";
import { getSupabaseAdmin } from "../_lib/supabaseAdmin";

export default async function handler(req: any, res: any) {
  if (!allowOnlyPost(req, res)) return;
  if (!assertInternal(req, res)) return;

  const { run_id, status, summary, anomalies } = req.body ?? {};
  if (!run_id || !status) {
    return res.status(400).json({ error: "Missing run_id / status" });
  }

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