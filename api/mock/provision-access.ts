function assertInternal(req: any, res: any) {
  const key = req.headers["x-internal-key"];
  if (!key || key !== process.env.INTERNAL_API_KEY) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

function accessPolicy(department: string) {
  const base = ["Email", "Calendar", "SSO"];
  if (department === "Engineering") return [...base, "GitHub", "CI", "Cloud Console"];
  if (department === "People") return [...base, "HRIS", "Payroll"];
  if (department === "Sales") return [...base, "CRM", "Dialer"];
  return base;
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    if (!assertInternal(req, res)) return;

    const { run_id, department } = req.body ?? {};
    if (!run_id || !department) return res.status(400).json({ error: "Missing run_id/department" });

    return res.status(200).json({
      status: "SUCCESS",
      accesses: accessPolicy(String(department)),
    });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? String(e) });
  }
}