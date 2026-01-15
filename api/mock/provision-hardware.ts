function assertInternal(req: any, res: any) {
  const key = req.headers["x-internal-key"];
  if (!key || key !== process.env.INTERNAL_API_KEY) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

function hardwareBundle(country: string) {
  if (country === "FR") return "MacBook Pro + YubiKey";
  if (country === "BE") return "MacBook Air + YubiKey";
  if (country === "ES") return "MacBook Air";
  if (country === "CA") return "MacBook Pro";
  return "Standard Laptop Bundle";
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    if (!assertInternal(req, res)) return;

    const { run_id, country, scenario } = req.body ?? {};
    if (!run_id || !country) return res.status(400).json({ error: "Missing run_id/country" });

    if (scenario?.simulate_it_failure) {
      return res.status(503).json({ status: "FAILED", reason: "Hardware vendor API timeout" });
    }

    return res.status(200).json({
      status: "SUCCESS",
      bundle: hardwareBundle(String(country)),
      ticket_id: `hw_${Math.random().toString(16).slice(2)}`,
    });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? String(e) });
  }
}