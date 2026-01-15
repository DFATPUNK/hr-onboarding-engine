import { allowOnlyPost, assertInternal } from "../_lib/auth";

function accessPolicy(department: string) {
  const base = ["Email", "Calendar", "SSO"];
  if (department === "Engineering") return [...base, "GitHub", "CI", "Cloud Console"];
  if (department === "People") return [...base, "HRIS", "Payroll"];
  if (department === "Sales") return [...base, "CRM", "Dialer"];
  return base;
}

export default async function handler(req: any, res: any) {
  if (!allowOnlyPost(req, res)) return;
  if (!assertInternal(req, res)) return;

  const { run_id, department } = req.body ?? {};
  if (!run_id || !department) return res.status(400).json({ error: "Missing run_id/department" });

  return res.status(200).json({
    status: "SUCCESS",
    accesses: accessPolicy(String(department)),
  });
}