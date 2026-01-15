function assertInternal(req: any, res: any) {
  const key = req.headers["x-internal-key"];
  if (!key || key !== process.env.INTERNAL_API_KEY) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    if (!assertInternal(req, res)) return;

    const { run_id, email } = req.body ?? {};
    if (!run_id || !email) return res.status(400).json({ error: "Missing run_id/email" });

    const username = String(email).split("@")[0].toLowerCase();

    return res.status(200).json({
      status: "SUCCESS",
      account: { username, email },
      action_id: `acct_${Math.random().toString(16).slice(2)}`,
    });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? String(e) });
  }
}