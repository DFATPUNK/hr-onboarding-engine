# HR Onboarding Engine — Zero Touch POC

A proof of concept demonstrating how employee onboarding can be executed automatically, with human involvement only when required.

---

## One-liner

**Event-driven HR onboarding with explicit decisions, zero-touch execution, and full auditability.**

---

## The problem

Traditional onboarding processes rely on:
- Manual checklists
- Cross-team coordination
- Implicit handovers between HR, IT, and managers

As hiring scales, this approach:
- Creates operational bottlenecks
- Introduces errors and inconsistencies
- Makes accountability and auditing difficult

---

## What this POC demonstrates

### 1. Event-driven onboarding
The system reacts to a single event:
> **Offer signed / Candidate hired**

From that point, onboarding becomes a deterministic process.

---

### 2. Zero-touch by default
For standard cases:
- Accounts are created automatically
- Hardware is ordered
- Access rights are configured
- No human intervention is required

---

### 3. Explicit escalation
When ambiguity or failure occurs:
- The run is flagged (FLAGGED / PARTIAL / FAILED)
- The reason is explained in plain language
- HR is given clear next steps

No silent failures. No hidden complexity.

---

### 4. Full audit trail
Every action is:
- Logged step by step
- Timestamped
- Reviewable in an audit log

This supports compliance, debugging, and trust.

---

## Scenarios covered

- **Standard onboarding**  
  Expected outcome: SUCCESS — no action required

- **Unknown role**  
  Expected outcome: FLAGGED — human review required

- **IT issue**  
  Expected outcome: PARTIAL — follow-up required

---

## Tech stack

- **Activepieces** — workflow orchestration
- **Supabase** — data storage (runs, steps, audit logs)
- **Serverless APIs (Vercel)** — event ingestion and logging
- **React** — RH-first user interface

---

## Live demo

👉 https://demos.jeremybrunet.com

---

## What this project is not

- ❌ A production-ready system
- ❌ A full HR platform
- ❌ A generic automation tutorial

It is a **focused design and systems thinking exercise**, built to explore how HR operations can scale sustainably.

---

## Why this project was built

This project was created to explore the role of **HR Tech & Automation** as a force multiplier:
- Reducing operational toil
- Increasing clarity and trust
- Letting HR teams focus on high-impact work

---

## Author

Built by **Jérémy Brunet**  
https://www.jeremybrunet.com

If you’d like a walkthrough of the demo or the design decisions behind it, feel free to reach out.