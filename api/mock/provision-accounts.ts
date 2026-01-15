import { allowOnlyPost, assertInternal } from "../_lib/auth";

export default async function handler(req: any, res: any) {
  if (!allowOnlyPost(req, res)) return;
  if (!assertInternal(req, res)) return;

  const { run_id, email } = req.body ?? {};
  if (!run_id || !email) return res.status(400).json({ error: "Missing run_id/email" });

  // Simulation simple : crée des identifiants
  const username = String(email).split("@")[0].toLowerCase();

  return res.status(200).json({
    status: "SUCCESS",
    account: { username, email },
    action_id: `acct_${Math.random().toString(16).slice(2)}`,
  });
}