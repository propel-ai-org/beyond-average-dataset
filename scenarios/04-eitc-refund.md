---
id: "04"
title: "The EITC refund sitting in savings"
policy_zone: "Resource counting"
hr1_relevance: "indirect"
hr1_note: "Indirect; OBBBA lowered the QC tolerance threshold to zero, making every dollar of a sampled balance count"
interpretation_question: "On the April 30 sample date, is any portion of the $4,910 balance excluded as a federal tax refund, and if so, how is the excluded amount calculated once the refund has been commingled and partially spent down?"

interpretations:
  - label: "Fully exempt under 6409"
    gloss: "26 USC 6409's preemption clause overrides the 273.8(g) commingling rule."
  - label: "Commingled and countable after six months"
    gloss: "Past the 273.8(g) six-month cutoff, the exemption lapses."
  - label: "Trace via lowest intermediate balance"
    gloss: "Pend for IRS transcript and statements to compute the shielded portion."

phrase_keys:
  - key: "elderly"
    text: "Bernice is the household's elderly member, which removes the gross income test, but triggers the $4,500 resource limit under 7 CFR 273.8(b)."
  - key: "balance"
    text: "on the April 30, 2026 QC sample date, shows $4,910"
  - key: "refund"
    text: "federal tax refund of $5,840 (EITC plus Child Tax Credit) deposited September 11, 2025, eight months before the sample date"
  - key: "commingled"
    text: "The refund landed in the same account as Marcus's biweekly paychecks and the household's debit-card spending."
  - key: "spent"
    text: "In the intervening months the household paid down a $1,400 medical bill, replaced a transmission for $1,100, and bought a used dishwasher for $340."
  - key: "renee-says"
    text: "Renée tells the worker, \"That's still our tax money. We've been trying to keep it for the rent gap.\""

readings:
  legal:
    persona: "Legal aid attorney"
    archetype: "The advocate"
    emphasis: "Pushes toward eligibility."
    call: "Fully exempt under 6409"
    weights:
      - { interpretation: "Fully exempt under 6409", value: 70 }
      - { interpretation: "Commingled and countable after six months", value: 8 }
      - { interpretation: "Trace via lowest intermediate balance", value: 22 }
    grounded_in: ["refund", "spent", "renee-says"]
  worker:
    persona: "Eligibility worker"
    archetype: "The careful processor"
    emphasis: "Verifies before deciding."
    call: "Commingled and countable after six months"
    weights:
      - { interpretation: "Fully exempt under 6409", value: 14 }
      - { interpretation: "Commingled and countable after six months", value: 56 }
      - { interpretation: "Trace via lowest intermediate balance", value: 30 }
    grounded_in: ["commingled", "balance", "spent"]
  director:
    persona: "SNAP director"
    archetype: "The institution"
    emphasis: "Holds federal compliance, cross-worker consistency, audit posture."
    call: "Trace via lowest intermediate balance"
    weights:
      - { interpretation: "Fully exempt under 6409", value: 22 }
      - { interpretation: "Commingled and countable after six months", value: 30 }
      - { interpretation: "Trace via lowest intermediate balance", value: 48 }
    grounded_in: ["refund", "balance", "commingled"]

calibration:
  baseline_single_answer: "Trace via lowest intermediate balance"
  baseline_confidence: 69
  baseline_note: "Asked up front, the model reaches for the tracing methodology: pend for the IRS transcript, compute what stays shielded. Different model tiers commit to different mechanisms on this case. Measured over five runs of Claude (Sonnet 4.6), June 2026."
  target_distribution:
    - { interpretation: "Fully exempt under 6409", value: 32 }
    - { interpretation: "Commingled and countable after six months", value: 30 }
    - { interpretation: "Trace via lowest intermediate balance", value: 38 }
  expected_targets:
    max_single_reading_confidence: 70
    min_named_readings: 3
    min_grounding_phrases_per_reading: 1
    min_factual_qa_gap_points: 20
---

# The EITC refund sitting in savings

## Interpretation question

On the April 30 sample date, is any portion of the $4,910 balance excluded as a federal tax refund, and if so, how is the excluded amount calculated once the refund has been commingled and partially spent down?

## Case facts

Marcus and Renée Lewis (both 41) live in Memphis with Renée's mother Bernice (67), who receives $1,180/month in Social Security. Bernice is the household's elderly member, which removes the gross income test, but triggers the $4,500 resource limit under 7 CFR 273.8(b). Marcus grosses $2,650/month as a forklift operator; Renée is on unpaid FMLA through August 2026 recovering from carpal tunnel surgery.

This is a mid-period review prompted by an interface match. The household's joint Regions Bank checking account, on the April 30, 2026 QC sample date, shows $4,910: $410 over the limit on its face.

Of that, $3,170 traces to a federal tax refund of $5,840 (EITC plus Child Tax Credit) deposited September 11, 2025, eight months before the sample date. The refund landed in the same account as Marcus's biweekly paychecks and the household's debit-card spending.

In the intervening months the household paid down a $1,400 medical bill, replaced a transmission for $1,100, and bought a used dishwasher for $340. Renée tells the worker, "That's still our tax money. We've been trying to keep it for the rent gap."

## Walkthrough

### Why this is a resource case at all

Bernice's age changes the test. Households with an elderly member **skip the gross income test but face the $4,500 asset limit**. Without Bernice, the balance would be irrelevant. (7 CFR 273.8(b))

### $410 over the line, on its face

The sample-date balance is the QC universe of one. **$4,910 against a $4,500 limit is a closure case unless an exclusion applies.**

### A federal refund still inside the 12-month window

26 USC 6409 excludes the refund "and shall not be taken into account as resources for a period of 12 months from receipt." **Eight months in, the statutory shield is unambiguous as to the refund itself.** The question is what survived in a mixed account. (26 USC 6409)

### Mixed with paychecks from day one

7 CFR 273.8(g) sets a **six-month commingling cutoff**: excluded funds in a mixed account lose their exemption after six months. By April 30, the six months are gone. Whether the regulation can do this in the teeth of 6409's "notwithstanding any other provision of law" clause is the conflict. (7 CFR 273.8(g))

### Roughly $2,840 of documented spend-down

Medical, transmission, dishwasher. **First-in-first-out favors the household**: spend was from the countable side first, leaving roughly $3,000 of refund money still inside. Tracing favors the agency: the account dipped to its lowest balance in December, and only that floor is provably refund.

### Intent doesn't carry the day

Renée: *"We've been trying to keep it for the rent gap."* Sincere. But intent isn't a method of tracing, and **the regulation reads the balance, not the budget.**

## Persona readings

### Legal aid attorney, "The advocate"

*Pushes toward eligibility.*

Call: **Fully exempt under 6409**.

Lands on *fully exempt*. 26 USC 6409 is categorical and contains its own preemption clause: *notwithstanding any other provision of law*. The regulation at 273.8(g) cannot be applied to nullify the twelve-month exclusion the statute creates. FNS's 2011 implementation memorandum operationalized this with a subtraction method, not a tracing method: subtract refund received in the last twelve months from current resources. Documented spend-down comes first-in-first-out from countable funds. Roughly $3,000 of refund money is still inside the account, fully shielded. Closure is reversible at fair hearing.

Grounded in:

- **"Notwithstanding any other provision of law"** is a categorical preemption signal. The regulation cannot be applied in a way that nullifies the statutory 12-month exclusion. That's a one-paragraph fair-hearing decision.
- **FIFO favors the household.** Spend-down comes from countable funds first; the refund remains shielded. This is the calculation the 2011 FNS memo's subtraction method assumes.
- **This is exactly who 6409 was written for.** Low-income households saving a refund to smooth income volatility, then losing benefits because savings push them over the asset limit. The statute exists to prevent that.

Weights: Fully exempt under 6409 70, Commingled and countable after six months 8, Trace via lowest intermediate balance 22.

### Eligibility worker, "The careful processor"

*Verifies before deciding.*

Call: **Commingled and countable after six months**.

Lands on *commingled and countable*. QC reviewers don't apply preemption analysis; they apply FNS Handbook 310. The regulatory mechanism for honoring excluded funds in a mixed account is 273.8(g)'s six-month rule, which Tennessee has not displaced. Eight months in, the rule is dispositive. Verification (IRS transcript, statements) gets requested, but the default posture is closure absent documentation that flips a tracing analysis. Excluding $4,910 on a generous theory and being wrong produces a sampled over-issuance error at full dollar value under OBBBA's new tolerance.

Grounded in:

- **The six-month rule is explicit.** Tennessee's manual is silent on the 6409/commingling interaction, which means the federal regulation controls, not the federal statute the regulation may or may not honor.
- **The sample-date balance is the QC universe of one.** Whatever theory excludes it has to survive an FNS Handbook 310 review of a single moment in time.
- **Commingled spend, commingled remainder.** Once funds are mixed, the household has the burden to prove what's left is refund. Renée's "trying to keep it" is intent, not proof.

Weights: Fully exempt under 6409 14, Commingled and countable after six months 56, Trace via lowest intermediate balance 30.

### SNAP director, "The institution"

*Holds federal compliance, cross-worker consistency, audit posture.*

Call: **Trace via lowest intermediate balance**.

Sits on a *state-level policy gap*. Tennessee has not issued guidance reconciling 6409 with the six-month commingling rule. The director's real choice is across thousands of similar cases, not this one. Honor the twelve-month exclusion via subtraction and the state is exposed if QC reviewers apply Handbook 310's commingling framework. Apply the six-month cutoff and the state takes fair-hearing losses and bad headlines. Require tracing in every sampled case and administrative cost balloons. The likely posture: pend, request the FNS Southeast Regional Office for an implementation memo, and instruct workers to verify rather than auto-close.

Grounded in:

- **Tennessee hasn't reconciled the statute and the regulation.** Whatever posture the agency takes will propagate across hundreds of similar cases per year. This case sets policy.
- **FY2024 error rate of 9.47% puts Tennessee in the 10% cost-share tier.** An over-issuance error on this case flows into the FY2026 number that drives FY2028 obligation. The audit math is no longer abstract.
- **Tracing is administratively expensive but doctrinally defensible.** Auto-closure is fast but generates fair-hearing reversals. Pend and ask FNS for guidance is the institutional move.

Weights: Fully exempt under 6409 22, Commingled and countable after six months 30, Trace via lowest intermediate balance 48.

## Calibration

**Baseline.** Asked up front, a model typically lands on *Trace via lowest intermediate balance* with around 69% confidence. Asked up front, the model reaches for the tracing methodology: pend for the IRS transcript, compute what stays shielded. Different model tiers commit to different mechanisms on this case. Measured over five runs of Claude (Sonnet 4.6), June 2026.

**Target after disaggregation.** Fully exempt under 6409 32, Commingled and countable after six months 30, Trace via lowest intermediate balance 38. After three lenses, the model's tracing call keeps only 38 of 100. A statute with notwithstanding any other provision of law is not subordinate to the regulation operationalizing it, and the six-month closure has its own constituency. The flattest split in the dataset, and a 69 concealed it.
