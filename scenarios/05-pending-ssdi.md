---
id: "05"
title: "Pending SSDI, ABAWD clock running"
policy_zone: "ABAWD / medical exemption"
hr1_relevance: "central"
hr1_note: "Central. HR1 put James in the ABAWD cohort and made the medical exemption the only path that doesn't require work hours he physically can't produce"
interpretation_question: "Does James's documentation, a primary care letter describing functional limits, an MRI, and prescription records, but no formal disability determination and no completed state form, satisfy the medical exemption at 7 CFR 273.24(c)(2)?"

interpretations:
  - label: "PCP letter is sufficient under (c)(2)(iii)"
    gloss: "Sufficient on its face under 7 CFR 273.24(c)(2)(iii); the regulation's bar is below what the form asks for."
  - label: "Pend for the state medical statement form"
    gloss: "Pend ten days for completion of the NC medical statement form's functional questions."
  - label: "Use the discretionary 15% exemption"
    gloss: "Apply 7 CFR 273.24(g) discretionary exemption while SSDI is pending."

phrase_keys:
  - key: "ssdi"
    text: "He filed for SSDI on September 24, 2025; his attorney expects an ALJ hearing in late 2026."
  - key: "mri"
    text: "January 2026 MRI showing L4 to L5 disc herniation with bilateral foraminal stenosis"
  - key: "letter"
    text: "March 2026 letter from his primary care physician at a federally qualified health center stating, \"Mr. Holloway suffers from chronic low back pain with radiculopathy and is currently unable to perform manual labor; he should avoid lifting more than 10 pounds and prolonged standing.\""
  - key: "prior-occupation"
    text: "The letter describes limits in his prior occupation; it does not address whether James can perform any work."
  - key: "form"
    text: "state-issued medical statement form with specific functional questions including expected duration"
  - key: "exhausted"
    text: "He received SNAP in January, February, and March 2026 without meeting the 80-hour work requirement; his three countable months are exhausted."

readings:
  legal:
    persona: "Legal aid attorney"
    archetype: "The advocate"
    emphasis: "Pushes toward eligibility."
    call: "PCP letter is sufficient under (c)(2)(iii)"
    weights:
      - { interpretation: "PCP letter is sufficient under (c)(2)(iii)", value: 76 }
      - { interpretation: "Pend for the state medical statement form", value: 11 }
      - { interpretation: "Use the discretionary 15% exemption", value: 13 }
    grounded_in: ["letter", "mri", "ssdi"]
  worker:
    persona: "Eligibility worker"
    archetype: "The careful processor"
    emphasis: "Verifies before deciding."
    call: "Pend for the state medical statement form"
    weights:
      - { interpretation: "PCP letter is sufficient under (c)(2)(iii)", value: 16 }
      - { interpretation: "Pend for the state medical statement form", value: 60 }
      - { interpretation: "Use the discretionary 15% exemption", value: 24 }
    grounded_in: ["form", "prior-occupation", "exhausted"]
  director:
    persona: "SNAP director"
    archetype: "The institution"
    emphasis: "Holds federal compliance, cross-worker consistency, audit posture."
    call: "Pend for the state medical statement form"
    weights:
      - { interpretation: "PCP letter is sufficient under (c)(2)(iii)", value: 19 }
      - { interpretation: "Pend for the state medical statement form", value: 47 }
      - { interpretation: "Use the discretionary 15% exemption", value: 34 }
    grounded_in: ["form", "letter", "exhausted"]

calibration:
  baseline_single_answer: "Pend for the state medical statement form"
  baseline_confidence: 71
  baseline_note: "Asked up front, the model commits to the procedural middle: the form exists, the letter doesn't answer its questions, ten days won't hurt. Measured over five runs of Claude (Sonnet 4.6), June 2026."
  target_distribution:
    - { interpretation: "PCP letter is sufficient under (c)(2)(iii)", value: 34 }
    - { interpretation: "Pend for the state medical statement form", value: 38 }
    - { interpretation: "Use the discretionary 15% exemption", value: 28 }
  expected_targets:
    max_single_reading_confidence: 70
    min_named_readings: 3
    min_grounding_phrases_per_reading: 1
    min_factual_qa_gap_points: 20
---

# Pending SSDI, ABAWD clock running

## Interpretation question

Does James's documentation, a primary care letter describing functional limits, an MRI, and prescription records, but no formal disability determination and no completed state form, satisfy the medical exemption at 7 CFR 273.24(c)(2)?

## Case facts

James Holloway (58) lives alone in Charlotte, North Carolina and applies for SNAP recertification on May 7, 2026. He worked in residential roofing and framing for 32 years; his last employer let him go in August 2025 after he could no longer climb a ladder reliably.

He filed for SSDI on September 24, 2025; his attorney expects an ALJ hearing in late 2026. The Charlotte hearing office averaged about six months wait in late 2025; the national average is closer to eight and a half.

His medical record includes a January 2026 MRI showing L4 to L5 disc herniation with bilateral foraminal stenosis, prescriptions for gabapentin, tramadol, and methocarbamol, and a March 2026 letter from his primary care physician at a federally qualified health center stating, "Mr. Holloway suffers from chronic low back pain with radiculopathy and is currently unable to perform manual labor; he should avoid lifting more than 10 pounds and prolonged standing."

The letter describes limits in his prior occupation; it does not address whether James can perform any work. North Carolina, like Pennsylvania and New York, channels the medical exemption through a state-issued medical statement form with specific functional questions including expected duration. He has not completed it.

James is in the post-HR1 expanded ABAWD cohort. He received SNAP in January, February, and March 2026 without meeting the 80-hour work requirement; his three countable months are exhausted. He has $48 in checking and no other resources.

## Walkthrough

### The clock is already at zero

Three countable months consumed. **If the exemption isn't granted, the case closes at the next adverse-action notice cycle, and James cannot regain eligibility without 30 consecutive days of 80+ work hours.** Which is the thing he physically cannot do. (7 CFR 273.24)

### What the regulation actually requires

7 CFR 273.24(c)(2)(iii) accepts *"a statement from a physician, physician's assistant, nurse, nurse practitioner...or any other medical personnel the State agency determines appropriate."* No form, no magic words. **James has a PCP letter that names the condition, prescribes the limits, and identifies the signing provider.** (7 CFR 273.24(c)(2)(iii))

### The corroborating record is qualitatively strong

MRI findings, multiple controlled prescriptions, pain management consult. **Far above the regulatory minimum.** Whatever evidentiary bar exists, this case clears it on substance.

### The letter speaks to one job, not all work

The PCP wrote what a treating physician writes: *can no longer do manual labor*. The regulation reads *unfit for employment*, which workers train to read against **any work**, not just prior occupation. The letter's silence on transferable work is the seam.

### The state operationalizes through a form

NC FNS Manual §260 accepts self-attestation as the default for ABAWD exemptions, and PCP letters meet the regulatory text. But the state's medical statement form asks the specific questions (lift, stand, expected duration), and **a sampled case without the form is the kind of file QC reviewers flag.** (NC FNS Manual §260)

### The other path is too slow

(c)(2)(i) recognizes anyone *receiving* temporary or permanent disability benefits. **James filed in September; the Charlotte hearing office is six months out at the soonest, the national average closer to eight and a half.** At least one and likely two SNAP cycles in coverage gap, waiting for the determination that would automatically restore the exemption.

## Persona readings

### Legal aid attorney, "The advocate"

*Pushes toward eligibility.*

Call: **PCP letter is sufficient under (c)(2)(iii)**.

Lands on *sufficient on its face*. 273.24(c)(2)(iii) sets a deliberately low evidentiary bar, listing a broad set of providers and requiring no particular form. NC FNS Manual §260 affirmatively accepts self-attestation; a treating physician's letter is qualitatively stronger than self-attestation. The SNAP medical exemption was written more permissively than the SSA disability standard for a reason: this is a food program, not a disability program. Requiring a state form on top of regulation-compliant evidence is adding a rule the federal regulation doesn't impose.

Grounded in:

- **The letter satisfies the text.** The regulation lists physicians, NPs, social workers, "any other medical personnel the State agency determines appropriate." A PCP letter at an FQHC isn't a marginal case. It's the central case.
- **The corroborating record is overwhelming.** MRI, prescriptions, pain management consult. Whatever evidentiary bar exists, this is well past it. Stacking process on top is friction in service of nothing.
- **The (c)(2)(i) path is too slow to mean anything.** Six to eight months of coverage gap while waiting for an ALJ decision is closure in everything but name. The (c)(2)(iii) path exists for exactly this case.

Weights: PCP letter is sufficient under (c)(2)(iii) 76, Pend for the state medical statement form 11, Use the discretionary 15% exemption 13.

### Eligibility worker, "The careful processor"

*Verifies before deciding.*

Call: **Pend for the state medical statement form**.

Lands on *complete the state form*. Granting a medical exemption is one of the highest-scrutiny determinations in the system; it pauses the ABAWD clock indefinitely and is reviewed in detail when sampled. The state form exists precisely to capture the questions the regulation contemplates: functional capacity, expected duration, signing provider's credentials. A letter describing limits in prior occupation, without addressing other work, creates ambiguity the worker cannot resolve unilaterally. Pend ten days, send the form, and tell James clearly that on return the exemption attaches.

Grounded in:

- **The form is the operational instrument.** Verification authority at 273.2(f)(1)(i) lets the worker require what's reasonably necessary. The form is reasonably necessary; it's what QC reviewers look for in a sampled case.
- **The letter speaks to one job, not all work.** "Unfit for employment" reads against any work, and the letter is silent there. The form asks; the letter doesn't.
- **The stakes argue for procedural care, not against it.** An incorrectly granted exemption is a QC error at full dollar value; an incorrectly denied one is a fair-hearing reversal. Both matter, but only one counts toward the state error rate.

Weights: PCP letter is sufficient under (c)(2)(iii) 16, Pend for the state medical statement form 60, Use the discretionary 15% exemption 24.

### SNAP director, "The institution"

*Holds federal compliance, cross-worker consistency, audit posture.*

Call: **Pend for the state medical statement form**.

Sits with a *precedent problem*. North Carolina has tens of thousands in the 55-to-64 cohort newly subject to ABAWD; medical-exemption volume is up sharply. Treating one-paragraph letters as sufficient brings exemption rates up and FNS Management Evaluations down on the state. Requiring the form rigidly produces fair-hearing losses and likely advocacy litigation. The institutional move is to require the form, but with a clear case-aide protocol: FQHC referrals, secure portal submission, equivalent documents accepted, good-cause extensions granted liberally. NC's FY2024 payment error rate of 10.21% places the state in the maximum 15% cost-share tier; the protocol has to thread the needle.

Grounded in:

- **The form sets the precedent for thousands of cases.** The director isn't deciding for James; she's deciding for the cohort. Sustainability of either posture is the real test.
- **A case-aide protocol can route around the cliff.** Workers refer to FQHC providers, accept equivalent documents, grant extensions. The form becomes a coordination mechanism, not a gate.
- **A fair-hearing reversal favoring the household doesn't count toward QC.** A wrongful grant in a sampled case does. That asymmetry, more than any reg, sets the agency's default posture.

Weights: PCP letter is sufficient under (c)(2)(iii) 19, Pend for the state medical statement form 47, Use the discretionary 15% exemption 34.

## Calibration

**Baseline.** Asked up front, a model typically lands on *Pend for the state medical statement form* with around 71% confidence. Asked up front, the model commits to the procedural middle: the form exists, the letter doesn't answer its questions, ten days won't hurt. Measured over five runs of Claude (Sonnet 4.6), June 2026.

**Target after disaggregation.** PCP letter is sufficient under (c)(2)(iii) 34, Pend for the state medical statement form 38, Use the discretionary 15% exemption 28. After three lenses, the model recognizes that ten days won't hurt is wrong when the clock is already at zero, that the regulation's bar is below what the form asks for, and that the discretionary 15% has been sitting on the shelf the whole time.
