import { allowOnlyPost, assertInternal } from "../_lib/auth";
import { getSupabaseAdmin } from "../_lib/supabaseAdmin";

export default async function handler(req: any, res: any) {
  if (!allowOnlyPost(req, res)) return;
  if (!assertInternal(req, res)) return;

  const { run_id, step, status, reason, input, output } = req.body ?? {};
  if (!run_id || !step || !status) {
    return res.status(400).json({ error: "Missing run_id / step / status" });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("run_steps").insert({
    run_id,
    step,
    status,
    reason: reason ?? null,
    input: input ?? null,
    output: output ?? null,
  });

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ ok: true });
}