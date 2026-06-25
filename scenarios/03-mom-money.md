---
id: "03"
title: "Mom sends me money"
policy_zone: "Earned vs. unearned income"
hr1_relevance: "indirect"
hr1_note: "Indirect, but the new QC tolerance sharpens every dollar at sample"
interpretation_question: "Does the recurring $400 monthly transfer from Tasha's mother count as unearned income, an excluded loan, or an excluded vendor payment?"

interpretations:
  - label: "Countable as unearned income"
    gloss: "Under the 273.9(b)(2) catch-all for regular, anticipated transfers."
  - label: "Excluded as a loan or vendor payment"
    gloss: "Private loan or vendor payment in substance, regardless of form."
  - label: "Pend and verify"
    gloss: "Require a signed statement from the mother before deciding."

phrase_keys:
  - key: "venmo"
    text: "sent her $400 on the first of every month via Venmo"
  - key: "memo"
    text: "The memo line reads variously \"rent,\" \"help,\" \"love u,\" or is blank."
  - key: "commingled"
    text: "The transfers land in Tasha's personal PNC checking account, alongside her paychecks."
  - key: "no-note"
    text: "There is no promissory note and no written repayment expectation."
  - key: "mom-says"
    text: "Her mother, reached for verification, says, \"I don't expect anything back. She's my daughter.\""
  - key: "abawd"
    text: "She is in the post-HR1 expanded ABAWD cohort and is currently clearing the 80-hour work requirement at the coffee shop alone, with no margin."

readings:
  legal:
    persona: "Legal aid attorney"
    archetype: "The advocate"
    emphasis: "Pushes toward eligibility."
    call: "Excluded as a loan or vendor payment"
    weights:
      - { interpretation: "Countable as unearned income", value: 11 }
      - { interpretation: "Excluded as a loan or vendor payment", value: 71 }
      - { interpretation: "Pend and verify", value: 18 }
    grounded_in: ["no-note", "memo", "mom-says"]
  worker:
    persona: "Eligibility worker"
    archetype: "The careful processor"
    emphasis: "Verifies before deciding."
    call: "Countable as unearned income"
    weights:
      - { interpretation: "Countable as unearned income", value: 60 }
      - { interpretation: "Excluded as a loan or vendor payment", value: 8 }
      - { interpretation: "Pend and verify", value: 32 }
    grounded_in: ["mom-says", "commingled", "venmo"]
  director:
    persona: "SNAP director"
    archetype: "The institution"
    emphasis: "Holds federal compliance, cross-worker consistency, audit posture."
    call: "Countable as unearned income"
    weights:
      - { interpretation: "Countable as unearned income", value: 48 }
      - { interpretation: "Excluded as a loan or vendor payment", value: 14 }
      - { interpretation: "Pend and verify", value: 38 }
    grounded_in: ["venmo", "abawd", "no-note"]

calibration:
  baseline_single_answer: "Countable as unearned income"
  baseline_confidence: 78
  baseline_note: "Asked up front, the model treats Mom's phone statement as dispositive: no repayment expectation, no loan, count it. Measured over five runs of Claude (Sonnet 4.6), June 2026."
  target_distribution:
    - { interpretation: "Countable as unearned income", value: 40 }
    - { interpretation: "Excluded as a loan or vendor payment", value: 28 }
    - { interpretation: "Pend and verify", value: 32 }
  expected_targets:
    max_single_reading_confidence: 70
    min_named_readings: 3
    min_grounding_phrases_per_reading: 1
    min_factual_qa_gap_points: 20
---

# Mom sends me money

## Interpretation question

Does the recurring $400 monthly transfer from Tasha's mother count as unearned income, an excluded loan, or an excluded vendor payment?

## Case facts

Tasha Williams (27) lives alone in a West Philadelphia studio and applies for SNAP on May 4, 2026, after being laid off from a logistics contractor in late March. She now works 18 to 22 hours a week at a coffee shop in Center City, grossing about $890/month, with occasional DoorDash shifts adding $140. Rent on her studio is $1,050; the lease is in her name.

Since June 2024, her mother in Harrisburg, who draws Social Security and is neither on Tasha's lease nor in her SNAP household, has sent her $400 on the first of every month via Venmo. The memo line reads variously "rent," "help," "love u," or is blank. The transfers land in Tasha's personal PNC checking account, alongside her paychecks.

There is no promissory note and no written repayment expectation. Tasha tells the worker, "She just helps me out, I'll pay her back someday if I can." Her mother, reached for verification, says, "I don't expect anything back. She's my daughter."

Tasha has no children, is not pregnant, is not an enrolled tribal member, and has no documented disability. She is in the post-HR1 expanded ABAWD cohort and is currently clearing the 80-hour work requirement at the coffee shop alone, with no margin.

## Walkthrough

### $400, regular, anticipated

Monthly, same date, same source, twenty-three months and counting. That's the textbook profile for **countable unearned income under the 273.9(b)(2) catch-all**, before any exclusion is considered. (7 CFR 273.9(b)(2)(vii))

### The memo line is inconsistent

Some months read "rent," some read "help," some are blank. **A partial paper trail that supports the vendor-payment theory in some months and undermines it in others.**

### Funds land in a personal account

Vendor-payment treatment under 273.9(c)(1) requires funds paid to the household's creditor. **Money in Tasha's account, even if intended for rent, doesn't meet the delivery test.** (7 CFR 273.9(c)(1))

### No written loan instrument

273.9(c)(4) excludes "all loans, including loans from private individuals," with no text requiring a written note. But Pennsylvania's §550.57 lets the CAO **require an affidavit on recurring transfers**, and that authority is what gets invoked here. (7 CFR 273.9(c)(4); PA §550.57)

### The phone call is dispositive, or it isn't

Mom: *"I don't expect anything back."* A worker hears that and the loan theory is over. A legal aid attorney hears that and reframes it as **willingness to forgive a debt, not an announcement that no debt exists.** The case turns on which read controls.

### Pending is not free

Tasha is in the expanded ABAWD cohort and clearing the 80-hour requirement with no buffer. **Every month the application sits pending burns a countable month against the three-month clock.** Procedural safety has a substantive cost. (7 CFR 273.24)

## Persona readings

### Legal aid attorney, "The advocate"

*Pushes toward eligibility.*

Call: **Excluded as a loan or vendor payment**.

Lands on the *loan exclusion*. The text of 273.9(c)(4) is broad and contains no documentary requirement. The Pennsylvania manual's affidavit provision is permissive ("may require"), not a precondition. Mom's statement reads in context as willingness to forgive a debt, not as a declaration that no debt ever existed. Failing that, the funds function as a vendor payment in substance even if not in form. Ambiguity resolves toward eligibility.

Grounded in:

- **The loan exclusion is text.** "All loans, including loans from private individuals" doesn't carve out unwritten ones. Adding a writing requirement adds a rule the regulation declined to add.
- **"Rent" appears repeatedly in the memo line.** Substance over delivery mechanism: the funds are routed to a household expense, the way most informal in-kind support is.
- **Forgiveness, not absence of debt.** Mothers don't write notes to their daughters. The phone call is a parent saying she won't press for repayment, not a declaration of gift.

Weights: Countable as unearned income 11, Excluded as a loan or vendor payment 71, Pend and verify 18.

### Eligibility worker, "The careful processor"

*Verifies before deciding.*

Call: **Countable as unearned income**.

Lands on *countable*. The mother's statement on the phone is the operative fact: under PA's bona-fide-loan framework, no repayment obligation means no loan. It is also not a vendor payment under §550.56 because funds didn't go to a creditor. The default posture under QC-asymmetric pressure is countable unless verification flips it. If Tasha submits a signed loan statement within ten days, exclude; if not, count and deny.

Grounded in:

- **"I don't expect anything back" defeats the loan theory.** PA §550.57 specifically contemplates this kind of recurring transfer, and the affidavit option exists precisely for cases like this. Mom didn't sign it.
- **Not a vendor payment.** §550.56 is explicit: vendor treatment is available only when funds go directly to the creditor. Personal account routing doesn't qualify, regardless of memo line intent.
- **Twenty-three months of regular, anticipated transfers** is the exact pattern the catch-all at 273.9(b)(2)(vii) was written to capture. Absent a recognized exclusion, it counts.

Weights: Countable as unearned income 60, Excluded as a loan or vendor payment 8, Pend and verify 32.

### SNAP director, "The institution"

*Holds federal compliance, cross-worker consistency, audit posture.*

Call: **Countable as unearned income**.

Sits on a *precedent gap*. The state has no formal guidance on peer-to-peer cash apps. §550.3 and §550.57 predate Venmo by two decades, and one worker excluding on the household's word while another counts is the worst possible posture for cross-worker consistency. Pennsylvania's 10.76% FY2024 payment error rate already places the state in the maximum benefit cost-share tier under OBBBA §10105. An Operations Memorandum is coming, almost certainly toward counting recurring P2P transfers absent contemporaneous written loan documentation.

Grounded in:

- **The state hasn't written this guidance.** Cross-worker consistency is the central audit risk: one worker excludes, another counts, QC samples both. An Operations Memorandum standardizes the call.
- **Cascading cost on the ABAWD side.** A pending case with the clock running compounds across thousands of similar households in the cohort. The director chooses for a population, not for Tasha.
- **The training will require written documentation going forward.** A fair-hearing reversal favoring the household doesn't count toward the state error rate. A QC finding against the state does. The asymmetry sets the policy.

Weights: Countable as unearned income 48, Excluded as a loan or vendor payment 14, Pend and verify 38.

## Calibration

**Baseline.** Asked up front, a model typically lands on *Countable as unearned income* with around 78% confidence. Asked up front, the model treats Mom's phone statement as dispositive: no repayment expectation, no loan, count it. Measured over five runs of Claude (Sonnet 4.6), June 2026.

**Target after disaggregation.** Countable as unearned income 40, Excluded as a loan or vendor payment 28, Pend and verify 32. After three lenses, the model recognizes the mother's statement as willingness to forgive, not absence of debt, which the up-front read collapsed. The confidence drops; the framing sharpens; pend stops looking neutral once ABAWD is in the picture.
