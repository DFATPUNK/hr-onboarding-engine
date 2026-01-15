import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key);
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

    const run_id = req.query?.run_id;
    if (!run_id) return res.status(400).json({ error: "Missing run_id" });

    const supabase = getSupabaseAdmin();

    const run = await supabase.from("runs").select("*").eq("run_id", run_id).maybeSingle();
    if (run.error) return res.status(500).json({ error: run.error.message });
    if (!run.data) return res.status(404).json({ error: "Run not found" });

    const STEPS_TABLE = "run_steps";

    const steps = await supabase
      .from(STEPS_TABLE)
      .select("*")
      .eq("run_id", run_id)
      .order("created_at", { ascending: true });

    if (steps.error) return res.status(500).json({ error: steps.error.message });

    return res.status(200).json({ run: run.data, steps: steps.data ?? [] });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? String(e) });
  }
}