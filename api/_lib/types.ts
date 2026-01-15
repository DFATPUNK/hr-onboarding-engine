export type Scenario = {
  standard?: boolean;
  unknown_role?: boolean;
  simulate_it_failure?: boolean;
  duplicate_event_id?: boolean;
};

export type OfferSignedEvent = {
  event_id: string;
  occurred_at?: string;
  run_id?: string;

  candidate: { first_name: string; last_name: string; email: string };
  job: { title: string; department: string; level?: string };
  employment: { country: string; contract_type: string; start_date: string };
  manager?: { email: string };

  scenario?: Scenario;
};

export type RunStatus = "RUNNING" | "SUCCESS" | "PARTIAL" | "FAILED" | "FLAGGED";
export type StepStatus = "SUCCESS" | "FAILED" | "SKIPPED";