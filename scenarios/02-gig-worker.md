---
id: "02"
title: "The gig worker hours"
policy_zone: "ABAWD / work requirements"
hr1_relevance: "central"
hr1_note: "Central. HR1 expanded ABAWD to age 64 and tightened verification posture."
interpretation_question: "Does Marcus's self-attested hours log, combined with platform earnings records, satisfy ABAWD work verification?"

interpretations:
  - label: "Hours are verified"
    gloss: "Notebook plus earnings meets the evidentiary threshold."
  - label: "Hours are not verified"
    gloss: "Earnings are not hours; deny or pend."
  - label: "Pend with specific request"
    gloss: "A documented request for platform activity reports before deciding."

phrase_keys:
  - key: "age"
    text: "Marcus (58)"
  - key: "hours"
    text: "22 hours per week across both platforms"
  - key: "docs"
    text: "neither provides him with a report of logged hours"
  - key: "notebook"
    text: "He estimates hours by adding up dash windows and shopping trips in a spiral notebook he keeps in his truck."
  - key: "hr1"
    text: "Under HR1 he is newly subject to ABAWD; the expansion to age 64 reached him in 2026."

readings:
  legal:
    persona: "Legal aid attorney"
    archetype: "The advocate"
    emphasis: "Pushes toward eligibility."
    call: "Hours are verified"
    weights:
      - { interpretation: "Hours are verified", value: 55 }
      - { interpretation: "Hours are not verified", value: 8 }
      - { interpretation: "Pend with specific request", value: 37 }
    grounded_in: ["docs", "notebook"]
  worker:
    persona: "Eligibility worker"
    archetype: "The careful processor"
    emphasis: "Verifies before deciding."
    call: "Hours are not verified"
    weights:
      - { interpretation: "Hours are verified", value: 12 }
      - { interpretation: "Hours are not verified", value: 53 }
      - { interpretation: "Pend with specific request", value: 35 }
    grounded_in: ["notebook", "hr1"]
  director:
    persona: "SNAP director"
    archetype: "The institution"
    emphasis: "Holds federal compliance, cross-worker consistency, audit posture."
    call: "Pend with specific request"
    weights:
      - { interpretation: "Hours are verified", value: 18 }
      - { interpretation: "Hours are not verified", value: 28 }
      - { interpretation: "Pend with specific request", value: 54 }
    grounded_in: ["docs", "hr1"]

calibration:
  baseline_single_answer: "Pend with specific request"
  baseline_confidence: 74
  baseline_note: "Asked up front, the model commits to the procedural middle path with conviction, every run. Measured over five runs of Claude (Sonnet 4.6), June 2026."
  target_distribution:
    - { interpretation: "Hours are verified", value: 28 }
    - { interpretation: "Hours are not verified", value: 30 }
    - { interpretation: "Pend with specific request", value: 42 }
  expected_targets:
    max_single_reading_confidence: 70
    min_named_readings: 3
    min_grounding_phrases_per_reading: 1
    min_factual_qa_gap_points: 20
---

# The gig worker hours

## Interpretation question

Does Marcus's self-attested hours log, combined with platform earnings records, satisfy ABAWD work verification?

## Case facts

Marcus (58) applies for SNAP in Georgia as a single-person household after losing his warehouse job in December 2025. He's been doing DoorDash and Instacart since January, his primary income now, and self-reports averaging 22 hours per week across both platforms.

His bank statements show $1,400 to $1,700 per month in platform payouts across the last three months. He has in-app earnings summaries from both platforms but neither provides him with a report of logged hours.

He estimates hours by adding up dash windows and shopping trips in a spiral notebook he keeps in his truck. No dependents, no disability determination, not in any of the codified exemption categories added by HR1.

Under HR1 he is newly subject to ABAWD; the expansion to age 64 reached him in 2026. Georgia does not hold a statewide ABAWD waiver, and the county he lives in is not on the narrowed high-unemployment list.

## Walkthrough

### Newly subject to ABAWD at 58

Pre-HR1, the ABAWD age band ended at 54. **Marcus would not have been subject to work requirements at all.** The post-HR1 expansion to 64 reaches him directly.

### 22 hours per week clears 80/month

**The numbers work, if you believe them.** The question is no longer eligibility on the merits; it's whether the hours are documented to the state's satisfaction.

### Platforms don't produce hours reports by default

**A documentation gap by design, not by the claimant.** Earnings reports exist; hours reports require a specific request and take roughly 30 days.

### Spiral notebook hour log

**A good-faith estimate is not verification.** Or it is, depending on which precedent you cite. Informal labor verification accepts contemporaneous logs; ABAWD post-HR1 may not.

### Post-November 2025 QC counts these errors

Starting Nov 1, 2025, **incorrect determinations on the expanded ABAWD population count toward state QC error rates**, which under HR1 drive FY2028 state cost-sharing.

## Persona readings

### Legal aid attorney, "The advocate"

*Pushes toward eligibility.*

Call: **Hours are verified**.

Lands on *hours are verified*, or failing that, on *pend with a specific, documented request*. Denying a gig worker for not having data the platform doesn't produce by default is a systemic failure the state imposed, not a compliance failure the claimant created.

Grounded in:

- **The documentation gap is the platform's design choice,** not Marcus's. He can't surface what they don't produce.
- **Contemporaneous personal logs are accepted** for informal labor, domestic work, self-employment. ABAWD shouldn't apply a stricter test.

Weights: Hours are verified 55, Hours are not verified 8, Pend with specific request 37.

### Eligibility worker, "The careful processor"

*Verifies before deciding.*

Call: **Hours are not verified**.

Pulled toward *not verified*. ABAWD determinations are among the most audited work-requirement categories. After November 2025, accepting the notebook is procedurally exposed. Pending the case is the safe move.

Grounded in:

- **A claimant-produced estimate is not verification** by the standard the manual applies to other earned-income documentation.
- **QC sampling on the expanded population now counts.** A wrong call costs the state under the new error-rate exposure.

Weights: Hours are verified 12, Hours are not verified 53, Pend with specific request 35.

### SNAP director, "The institution"

*Holds federal compliance, cross-worker consistency, audit posture.*

Call: **Pend with specific request**.

Most state manuals don't address platform gig work for ABAWD verification, because the chapters were written for pre-platform independent contractor work. *Cross-worker consistency* is the dominant concern. Director likely issues standing guidance to require platform-sourced activity reports, which compresses to pending in practice and which advocacy will call a soft denial.

Grounded in:

- **State guidance is silent on gig hour verification.** The director's call here becomes office precedent.
- **Cost-sharing exposure starts FY2028.** Permissive guidance now compounds across thousands of similar cases.

Weights: Hours are verified 18, Hours are not verified 28, Pend with specific request 54.

## Calibration

**Baseline.** Asked up front, a model typically lands on *Pend with specific request* with around 74% confidence. Asked up front, the model commits to the procedural middle path with conviction, every run. Measured over five runs of Claude (Sonnet 4.6), June 2026.

**Target after disaggregation.** Hours are verified 28, Hours are not verified 30, Pend with specific request 42. After reading through all three lenses, the model recognizes the procedural middle path becomes the substantive denial in practice. Confidence drops; framing sharpens.
