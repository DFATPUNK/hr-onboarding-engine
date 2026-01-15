import { allowOnlyPost, assertInternal } from "../_lib/auth";
import { getSupabaseAdmin } from "../_lib/supabaseAdmin";

function safeJson(value: any) {
  if (value === undefined) return null;
  if (value === null) return null;
  if (typeof value === "string") {
    // si c'est une string JSON, on tente de parser, sinon on stocke comme texte
    try {
      return JSON.parse(value);
    } catch {
      return { raw: value };
    }
  }
  return value; // objet, array, number, etc.
}

export default async function handler(req: any, res: any) {
  if (!allowOnlyPost(req, res)) return;
  if (!assertInternal(req, res)) return;

  const { run_id, step, status, reason, input, output } = req.body ?? {};
  if (!run_id || !step || !status) {
    return res.status(400).json({ error: "Missing run_id / step / status" });
  }

  const supabase = getSupabaseAdmin();

  // ⚠️ Mets ici le nom exact de ta table :
  const STEPS_TABLE = "run_steps"; // ou "runs_steps"

  const { error } = await supabase.from(STEPS_TABLE).insert({
    run_id,
    step,
    status,
    reason: reason ?? null,
    input: safeJson(input),
    output: safeJson(output),
  });

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ ok: true });
}