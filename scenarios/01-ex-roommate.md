---
id: "01"
title: "The ex-roommate on the lease"
policy_zone: "Household composition"
hr1_relevance: "limited"
hr1_note: "Limited bearing, but heightens stakes at the margin"
interpretation_question: "Is Jordan part of Maria's SNAP household for this application?"

interpretations:
  - label: "Not in household"
    gloss: "NC carve-out applies; purchase and prepare is separate."
  - label: "In household"
    gloss: "Functional-household test under 7 CFR 273.1(a)."
  - label: "Verify further before deciding"
    gloss: "Diligent check before a determination."

phrase_keys:
  - key: "cohabit"
    text: "She shares a two-bedroom apartment with Jordan (34), her ex-boyfriend of two years."
  - key: "prep"
    text: "\"don't really eat together anymore\": she buys groceries and cooks for herself and the kids, Jordan eats takeout or at his mother's nearby"
  - key: "kitchen"
    text: "They share the fridge and the kitchen."
  - key: "rent"
    text: "Jordan has covered her half, roughly $150 to $200 each time"
  - key: "streaming"
    text: "He still pays for her streaming on his account."
  - key: "income"
    text: "Jordan works full time as a warehouse supervisor at $3,800/month gross. Maria earns $1,450/month part time."
  - key: "carve"
    text: "NC manual: \"Unmarried couples who live together and do not have common children are not required to be included in the same FNS unit.\""

readings:
  legal:
    persona: "Legal aid attorney"
    archetype: "The advocate"
    emphasis: "Pushes toward eligibility."
    call: "Not in household"
    weights:
      - { interpretation: "Not in household", value: 80 }
      - { interpretation: "In household", value: 6 }
      - { interpretation: "Verify further before deciding", value: 14 }
    grounded_in: ["carve", "prep", "rent"]
  worker:
    persona: "Eligibility worker"
    archetype: "The careful processor"
    emphasis: "Verifies before deciding."
    call: "Verify further before deciding"
    weights:
      - { interpretation: "Not in household", value: 22 }
      - { interpretation: "In household", value: 28 }
      - { interpretation: "Verify further before deciding", value: 50 }
    grounded_in: ["kitchen", "rent", "cohabit"]
  director:
    persona: "SNAP director"
    archetype: "The institution"
    emphasis: "Holds federal compliance, cross-worker consistency, audit posture."
    call: "Verify further before deciding"
    weights:
      - { interpretation: "Not in household", value: 36 }
      - { interpretation: "In household", value: 18 }
      - { interpretation: "Verify further before deciding", value: 46 }
    grounded_in: ["carve", "income", "prep"]

calibration:
  baseline_single_answer: "Not in household"
  baseline_confidence: 74
  baseline_note: "Asked to pick a single answer up front, the model picks the same one and commits, every run. Measured over five runs of Claude (Sonnet 4.6), June 2026."
  target_distribution:
    - { interpretation: "Not in household", value: 40 }
    - { interpretation: "In household", value: 17 }
    - { interpretation: "Verify further before deciding", value: 43 }
  expected_targets:
    max_single_reading_confidence: 70
    min_named_readings: 3
    min_grounding_phrases_per_reading: 1
    min_factual_qa_gap_points: 20
---

# The ex-roommate on the lease

## Interpretation question

Is Jordan part of Maria's SNAP household for this application?

## Case facts

Maria (31) applies for SNAP in North Carolina for herself and her two kids (ages 4 and 7), both from a prior relationship. She shares a two-bedroom apartment with Jordan (34), her ex-boyfriend of two years. They broke up eight months ago but both names are on the lease, which has five months left to run; neither can afford to move.

Maria sleeps in one bedroom with the kids, Jordan in the other. She says they "don't really eat together anymore": she buys groceries and cooks for herself and the kids, Jordan eats takeout or at his mother's nearby. They share the fridge and the kitchen.

When Maria has fallen short on rent (three or four times in the past year), Jordan has covered her half, roughly $150 to $200 each time. He still pays for her streaming on his account.

Jordan works full time as a warehouse supervisor at $3,800/month gross. Maria earns $1,450/month part time.

## Walkthrough

### Cohabitation eight months after the breakup

Two unrelated adults on the same lease, no longer a couple. That's **the household-composition question**, and federal regs leave it to a functional test rather than a status test. (7 CFR 273.1(a))

### Purchase and prepare, separately

The 7 CFR 273.1(a) test is whether members **"customarily purchase food and prepare meals together"**. Maria says no. That's the cleanest argument for keeping Jordan out. (7 CFR 273.1(a))

### Shared fridge, shared kitchen

The other side. **Shared cooking infrastructure** is exactly what eligibility workers point to when arguing a functional household, regardless of whether anyone actually cooks together this week.

### Recurring rent help

Three or four times a year, $150 to $200 a pop. **Loan-like, or co-mingling?** The classification controls income treatment and the household call.

### The math that makes this stakes

If Jordan is in, combined gross is $5,250 for a household of four. That's above the 130% FPL gross income test (about $3,380 in 2026). **Eligible at the margin becomes ineligible by a lot.**

### North Carolina has an explicit carve-out

NC manual: *"Unmarried couples who live together and do not have common children are not required to be included in the same FNS unit."* The kids aren't Jordan's. The carve-out applies on its face, but only if "couple" still describes them eight months post-breakup. (NC SNAP Policy Manual)

## Persona readings

### Legal aid attorney, "The advocate"

*Pushes toward eligibility.*

Call: **Not in household**.

Lands strongly on *not in the household*. NC policy carves this fact pattern out explicitly. Occasional rent help doesn't convert separate households into a combined one. Ambiguity in the regs resolves toward the claimant.

Grounded in:

- **The NC carve-out is the move.** The text covers this fact pattern on its face; the office is being asked to add a requirement the statute doesn't impose.
- **Functionally separate purchase and prep.** The federal test is met, regardless of the kitchen sharing.
- **Loan-like, not commingled.** Three or four covers a year is exactly the pattern shared-household tests are designed not to capture.

Weights: Not in household 80, In household 6, Verify further before deciding 14.

### Eligibility worker, "The careful processor"

*Verifies before deciding.*

Call: **Verify further before deciding**.

Genuinely torn. The NC carve-out gives cover for *not in*, but shared fridge plus recurring rent help is exactly the QC-risk pattern. A worker who accepts the screening at face value can be on the wrong end of an audit. A worker who pends has a procedurally safe answer.

Grounded in:

- **The shared kitchen reads as a functional-household signal,** independent of what either party says about meals.
- **Recurring rent support is the QC red flag.** Two pages of guidance say to scrutinize patterns like this.
- **Eight months post-breakup, still cohabiting.** A reasonable worker wants documentation before calling this separate.

Weights: Not in household 22, In household 28, Verify further before deciding 50.

### SNAP director, "The institution"

*Holds federal compliance, cross-worker consistency, audit posture.*

Call: **Verify further before deciding**.

Reads through *what guidance do I issue, and how does it hold up under audit and litigation?* The NC carve-out probably makes this case more likely to survive audit as *separate* than a co-parent case would, but the worker has to document the separate-routines finding carefully. The bigger risk is inconsistency across workers in the same office.

Grounded in:

- **The explicit text is a strong audit defense,** if and only if the file documents the carve-out reasoning.
- **The income asymmetry creates litigation risk either way.** A wrongful inclusion costs the family $600 a month; a wrongful exclusion costs the state if QC samples it.
- **The separate purchase-and-prepare finding** needs to come from documented diligence, not the applicant's say-so.

Weights: Not in household 36, In household 18, Verify further before deciding 46.

## Calibration

**Baseline.** Asked up front, a model typically lands on *Not in household* with around 74% confidence. Asked to pick a single answer up front, the model picks the same one and commits, every run. Measured over five runs of Claude (Sonnet 4.6), June 2026.

**Target after disaggregation.** Not in household 40, In household 17, Verify further before deciding 43. After reading through all three lenses, the model surfaces a three-way split. The single 74% became a calibrated I'm not sure, and here's why.
