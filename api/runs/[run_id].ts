import { getSupabaseAdmin } from "../_lib/supabaseAdmin";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const run_id = req.query?.run_id;
  if (!run_id) return res.status(400).json({ error: "Missing run_id" });

  const supabase = getSupabaseAdmin();

  const run = await supabase.from("runs").select("*").eq("run_id", run_id).maybeSingle();
  if (run.error) return res.status(500).json({ error: run.error.message });
  if (!run.data) return res.status(404).json({ error: "Run not found" });

  const steps = await supabase
    .from("run_steps")
    .select("*")
    .eq("run_id", run_id)
    .order("created_at", { ascending: true });

  if (steps.error) return res.status(500).json({ error: steps.error.message });

  return res.status(200).json({ run: run.data, steps: steps.data ?? [] });
}