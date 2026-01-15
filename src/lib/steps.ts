import type { RunStep } from "./api";

export function findStep(steps: RunStep[], name: string) {
  const n = name.toUpperCase();
  return steps.find((s) => (s.step ?? "").toUpperCase() === n) ?? null;
}

export function getEvidence(steps: RunStep[]) {
  const accounts = findStep(steps, "PROVISION_ACCOUNTS");
  const hardware = findStep(steps, "PROVISION_HARDWARE");
  const access = findStep(steps, "PROVISION_ACCESS");

  return {
    accounts: accounts?.output ?? null,
    hardware: hardware?.output ?? null,
    access: access?.output ?? null,
  };
}