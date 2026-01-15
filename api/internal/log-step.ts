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
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY; // (= secret_key Supabase)
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key);
}

function safeJson(value: any) {
  if (value === undefined || value === null) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return { raw: value };
    }
  }
  return value;
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!assertInternal(req, res)) return;

  const { run_id, step, status, reason, input, output } = req.body ?? {};
  if (!run_id || !step || !status) {
    return res.status(400).json({ error: "Missing run_id / step / status" });
  }

  const supabase = getSupabaseAdmin();
  const STEPS_TABLE = "run_steps";

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
