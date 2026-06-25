# designing your own three-readings dataset

This is the build-your-own track. The reader's goal: take the methodology that produced the SNAP dataset in this repo and apply it to a contested-determination problem in their own domain, producing a dataset in the same shape. The output is a set of scenario files that validate against [`SCHEMA.md`](./SCHEMA.md) and can be scored by the procedure in [`EVALUATING.md`](./EVALUATING.md).

This is a methodology document, not a tutorial. It tells you what decisions to make, how to make them, and which decisions are load-bearing. It does not walk you through writing a specific case end to end.

The sequence below is roughly the order to make the decisions in. Personas before interpretations; interpretations before phrase keys; phrase keys before the calibration target. Each later decision constrains itself against the earlier ones, and reversing the order tends to produce a dataset that looks well-formed and reads hollow.

## 1. when this methodology fits

The decision criteria are in two parts. The quick test, in plain prose:

> If three competent professionals from different roles read the same case, would they land in different places with reasons? If yes, this methodology may fit your problem. If no (the question has a single ground-truth answer that a domain expert would simply know), this isn't the right tool. You have factual QA.

Concrete fits, with one-line gloss for each:

- **Eligibility determinations.** Benefits, licenses, exemptions. The SNAP dataset's home ground. The contested axis is usually how regulatory categories apply to a specific household or applicant.
- **Diagnosis triage.** Same set of findings, three clinical roles (primary care, specialist, case management) reading toward different next steps. The contested axis is what risk threshold each role carries.
- **Claim adjudication.** Insurance, unemployment, disability. Same claim file, different roles weighing the documentary record against the policy language differently.
- **Hiring screens.** Same résumé, different roles in a hiring committee weighing signal against fit, signal against risk, signal against pipeline pressure.
- **Admissions reviews.** Same applicant, admissions officers vs. faculty readers vs. financial aid weighing the file against different institutional needs.
- **Content moderation appeals.** Same post, different reviewer roles weighing the policy language against the context, the platform's stated rules against its lived ones.

The common shape across these is that competent people, under the same facts, produce different defensible calls, and the divergence tracks institutional role rather than personal disposition.

Anti-fits, named explicitly: math problems, code correctness, factual recall, anything with a single defensible answer. A dataset built in this shape over those problems is a category error. A model returning a single high-confidence answer on "what is 47 squared" is doing the right thing; the methodology here is for cases where that same shape of output conceals a real disagreement.

The quick distinguishing question: if you can describe your problem cleanly as "given these facts, find the answer," this isn't your tool. If you can describe it as "given these facts, defend a call," it may be.

## 2. the shape of a contested case

A good contested case has four properties:

- Enough fact for the question to be answerable: a worker, reviewer, or underwriter could actually act on it. If the case body reads like a thought experiment, it isn't a case.
- Enough ambiguity that no path is closed off: at least two interpretations are defensible from the facts as written. If one reading is obviously stronger to a domain expert, the case isn't contested.
- Anchored in real regulatory, policy, or practice ambiguity, not invented for the example. The SNAP cases are synthetic in their facts, but the ambiguity in each case is drawn from real federal regulations, real state manual language, and real practitioner disagreement.
- The interpretation question is phrased the way a practitioner would phrase it, not the way a textbook would. "Is Jordan part of Maria's SNAP household for this application?" is a question a worker actually has to answer. "Does the regulation in 7 CFR 273.1(a) apply?" is the same question dressed up.

One sentence on the case body's voice: case files read as documents, not as test prompts. The reader should be able to imagine an actual worker holding this paper. The SNAP cases include interview notes, household composition rosters, income amounts with dates, manual citations: the texture a real case file carries. The texture isn't decoration. It is what gives the personas something specific to disagree about.

A note on length. Three to seven short paragraphs of body, plus the formal payload (interpretation question, named interpretations, persona readings) is the working range for these. Longer cases dilute the contested phrases; shorter cases force the disagreement to rest on too narrow a base.

## 3. designing personas

The personas are not the prose around the cases; they are the lenses that produce the disagreement. If the personas are wrong, the dataset is wrong, regardless of how well the cases are written.

The core principle: pick three roles with **distinct institutional pressures**, not demographic difference. The disagreement is structural, not personal. A persona is doing its job when its reading is recognizably the product of where it sits in the institution, what it is held accountable to, and what kind of error it is structured to avoid.

Each persona needs four things stated explicitly:

- **Default frame.** What they bring to the case before reading it. The institutional reflex.
- **What they push toward.** Their bias, declared explicitly. Not as a flaw, as a structural feature.
- **What they're cautious about.** Their risk model. Which kind of error costs them, and which doesn't.
- **Audit posture.** Who reviews their decisions, and what those reviewers care about. This is often the cleanest single explanation for why a persona reads a case the way it does.

The SNAP dataset's three personas, worked through this template:

**Legal aid attorney.**
- *Default frame:* the applicant is trying to access a benefit they may be entitled to, and procedural error is more likely to deny than to wrongly approve.
- *Pushes toward:* eligibility, narrow reading of disqualifying provisions, broad reading of carve-outs.
- *Cautious about:* administrative error denying benefits to people who qualify, retroactive recoupment, language that lets a worker default to denial.
- *Audit posture:* reviewed by clients (do they get the benefit) and by appeals proceedings (does the denial survive review). Wrong denials cost; wrong approvals do not, structurally.

**Eligibility worker.**
- *Default frame:* the case file is what they can defend. Verify what's verifiable, document what's not, escalate when the call is above their pay grade.
- *Pushes toward:* whichever call the documentation supports. When documentation is thin, toward "verify further before deciding."
- *Cautious about:* both denial-in-error (appeal reversal, ombudsman complaint) and approval-in-error (audit finding, payment error). The worker carries both error budgets.
- *Audit posture:* reviewed by supervisors (case-by-case) and by quality-control audits (sampled across worker caseloads). The worker's caseload is graded against an error rate.

**SNAP director.**
- *Default frame:* the agency's aggregate behavior matters more than any single case. Consistency, defensibility, federal compliance.
- *Pushes toward:* whichever call holds up under audit, under federal review, and across cases handled by other workers in the agency.
- *Cautious about:* audit findings, federal disallowance, payment-error-rate (PER) tolerances tightening under HR1.
- *Audit posture:* reviewed by FNS and state inspectors general. Failure modes are institutional and slow; the costs are large and the time horizons are months to years.

Notice the asymmetry: each persona's caution is shaped by who can punish them and for what. The legal aid attorney loses if their client loses an appeal; the worker loses if their case file fails an audit; the director loses if the agency's error rate triggers federal action. Those are different incentive landscapes, and the readings follow. When you write your own three personas, you should be able to write the equivalent four bullets for each, and the reviewer column (audit posture) should be different for each.

A note on naming. The persona slugs in the schema (`legal`, `worker`, `director` in the SNAP dataset) are arbitrary identifiers, and adapters can use any string keys: `manager` / `recruiter` / `partner` for a hiring panel, `physician` / `specialist` / `case-manager` for clinical triage, `underwriter` / `claims-adjuster` / `medical-director` for insurance review. The scorer takes them as `Record<string, ScorerReading>` so nothing about the codebase cares what you name them. The `archetype` string ("The advocate", "The careful processor", "The institution") is what the scorer's persona-mapping heuristic reads. Pick archetypes that capture the role's structural posture, not its temperament.

Anti-patterns to refuse:

- **Caricature personas.** The bureaucrat as villain, the activist as bleeding-heart, the boss as cynical. Caricature reads as op-ed, not as a case. The reader sees the author's hand and stops trusting the dataset. Personas should feel like people doing their actual jobs, including the parts of the job that look unflattering when written down.
- **Good-cop / bad-cop / neutral-cop triangulation.** Three personas arranged so one is for, one is against, and one is in the middle. This produces a synthetic balance that isn't institutionally real. Personas should disagree because of what they are accountable to, not so the dataset can claim neutrality.
- **Three flavors of the same role.** Three eligibility workers with different temperaments is not three lenses. It's one lens with variance. The disagreement collapses to disposition, and the methodology's claim that the disagreement is structural collapses with it.
- **Demographic difference as persona.** A black worker, a white worker, and a brown worker is not three lenses; it's a different study. The methodology is about institutional position, not identity. If you want to study how identity shapes determination, that's a real and important study, and it isn't this one.

This section gets a persona from description to design. Making it operational, writing the persona down as a spec a model can run, and calibrating that spec against evals before trusting it, is its own track: [`PERSONAS.md`](./PERSONAS.md). The SNAP dataset's three specs live in [`personas/`](./personas/), versioned, each with a card carrying its eval receipts.

## 4. picking interpretations

For each scenario, name two to four outcomes the case can land on. Three is the usual count. Each interpretation is a label (short, canonical, referenced by everything else in the schema) plus a one-sentence gloss.

Labels are string-matched across the schema (see [`SCHEMA.md`](./SCHEMA.md) for the invariants). Pick labels that read as outcomes a practitioner would actually use, and keep them stable once you've picked them. Examples from the SNAP dataset: "Not in household", "In household", "Verify further before deciding". Examples translated to other domains: "Approve at requested level" / "Approve with conditions" / "Send back for documentation" for an underwriting case; "Advance to onsite" / "No advance" / "Refer to a different role" for a hiring screen; "Acute" / "Watchful waiting" / "Refer to specialist" for a triage case. The labels are short because they are referenced from many places in the schema and need to round-trip cleanly.

**Strong pattern: include the not-yet-decided call.** One interpretation should be the "verify further," "escalate," "send back," or "request additional documentation" outcome. Most contested cases in real practice have this as a real call: the case is not yet ripe for a final determination, and the right move is to gather more before deciding. Excluding it from your interpretation set forces false confidence. The model (and the personas) are denied the move a practitioner would actually make. The SNAP dataset uses "Verify further before deciding" in most scenarios for this reason; it shows up in the persona readings whenever the documentation in the case is thin enough that a careful worker would not commit.

Two checks on your interpretation set before you commit to it. First, can a single defensible reading land on each one? If not, the interpretation isn't real, it's a strawman, and the model will correctly assign it near-zero weight. Second, do the three interpretations partition the case space? If two of them overlap heavily (a worker reading one as approval and another as conditional approval would shrug and pick either), collapse them. The interpretations need to be distinct enough that a model surfacing all three is doing actual work, not paraphrasing the same call three times.

## 5. identifying load-bearing phrases

The phrase keys are the dataset's grounding mechanism. Find the phrases in your case body that a persona would *quote* to defend a reading. Tag each with a short slug (the `key` in `phrase_keys`). The schema requires that every persona's `grounded_in` list references real phrase keys.

Cross-check, both directions: every persona's `call` should be anchored in at least one phrase from their `grounded_in` list, and every phrase you tag should be cited by at least one persona's reading. The validator in this repo enforces the first direction and reports the second as notes: a few of the SNAP set's tagged phrases (scenario 01's `streaming`, for instance) anchor the walkthrough's annotations rather than any persona's reading. Keys like that are inert for scoring, legitimate as document annotation, and worth keeping distinct in your head from the load-bearing ones.

A practical test for whether a phrase is actually load-bearing: would the persona's reading still make sense if you removed this phrase from the case? If yes, the phrase is decorative. If no, the phrase is load-bearing and earns its key. A case full of decorative tags is a case that doesn't quite know what it's arguing about.

A second practical test: when you read the case aloud, which phrases do you find yourself stressing? The ones you stress are the ones the personas will fight over.

A worked example from scenario 01 in the SNAP dataset. The phrase tagged `carve` is the verbatim text "Unmarried couples who live together and do not have common children are not required to be included in the same FNS unit," lifted from the NC eligibility manual. The legal aid attorney's reading cites this phrase to support the call "Not in household." Strip the phrase out of the case body and the legal aid attorney's reading loses its primary anchor; she still has practice arguments, but the manual citation is what gives the call its policy backing. Conversely, the director cites the same phrase but reaches a different call ("Verify further before deciding") because she is reading the carve-out against the federal functional-household test, which the case body also references. One phrase, two readings, two different calls, both grounded. That's the phrase working.

Decorative phrases look different. If a phrase shows up in `grounded_in` but the reading's reasoning would survive its removal, the dataset is paying citation cost (the model has to find it, quote it, and attribute it) for no information return. Cut decorative tags. The phrase-grounding eval is the dataset's strongest signal against confabulation; weakening it with decoration leaves model behavior less observable.

## 6. setting the target distribution

**Lead with this honestly.**

> The target distribution is an opinionated read of practice, not a measurement. State that plainly when you publish, and do not claim more rigor than you have.

The target distribution in the calibration payload is what the methodology asks the model to converge to. It is not derived from a survey, it is not the empirical frequency of outcomes in any production system, and it is not validated against ground truth (the whole point is that there isn't one). It is your considered read of how the disagreement actually distributes among competent practitioners, expressed as percentages. Be honest about that when you ship. The SNAP dataset's target distributions are Keith's read after conversations with practitioners and a close look at the manual language; they are not a survey result, and the dataset's published notes say so.

The practical method is a practitioner poll, run carefully.

Ask several practitioners independently to read the case and give a distribution. Independently is load-bearing: a group discussion produces a group answer, not the raw distribution. Ask for percentages, not votes for a single call. Ask each practitioner to also state what they'd push toward if forced to commit, but the percentages are the primary output. A useful frame in the ask: "Out of one hundred competent reviewers in your role reading this case, how many would land on each call?"

Do not average mechanically. Look at the spread. The mean across practitioners can hide the shape of the disagreement. If half of legal aid attorneys read a case at 80/10/10 and the other half at 50/30/20, the mean (65/20/15) describes neither group. A target set to the mean tells the model "the answer is in the middle" when the practitioner reality is two camps. Preserve the shape of the disagreement when you set the target. Sometimes that means picking a distribution that sits inside one camp's read with a nod to the other; sometimes that means a flatter distribution to reflect that practice is genuinely split.

A worked example. Suppose three practitioners in the same role give you 75/15/10, 70/20/10, and 45/35/20 on a case. The mean is roughly 63/23/13. The honest read is probably closer to 60/25/15, but the published notes should say "two practitioners cluster around 70-75 on the first reading; one is meaningfully more split. The target reflects the second cluster's spread because the case has features the third practitioner read more carefully than the others." Make the reasoning visible. Readers will trust the dataset more for the visible work than for a crisp number.

For `calibration.baseline_single_answer`, run your model on the case before you build the target. Use a one-shot prompt that asks for the answer, no schema in the prompt, no hint that disaggregation is wanted. See what the model commits to. That observed behavior is the baseline. The point of the calibration eval is to measure the gap between that committed single answer and the disaggregated reading the model can produce when asked properly; you need both numbers to do that, and the baseline number has to be observed rather than assumed.

A note on confidence in your own target. You will be more confident on some scenarios than others. That's expected. On the cases where you're least sure of the target, say so in your published notes, and treat those as the cases most worth running against multiple models. A target you're uncertain about is still useful if you publish the uncertainty; what is not useful is a confident-looking number that no one could defend.

## 7. a sketched example: hiring screen, same résumé

The methodology generalizes. As one example, applying it to a non-SNAP problem (a mid-level engineering résumé read by three different roles in a hiring committee: hiring manager, recruiter, engineering partner) looks like the sketch at [`examples/sketch-hiring-screen.md`](./examples/sketch-hiring-screen.md). The sketch shows the methodology's moves on a non-SNAP problem without writing a full canonical scenario. It's a demonstration of method, not a second reference dataset: the personas, the interpretation set, the phrase-key construction, and the calibration baseline are all worked through, but the file does not validate against the schema and is not scored. Treat it as a worked example you read alongside this document, not as a second instance of the dataset.

## 8. validating your dataset

Two layers, with different rigor.

**What the validator enforces.** The structural invariants, bullet list:

- All `phrase_keys[*].key` referenced by `readings[*].grounded_in` must exist in `phrase_keys`.
- All `readings[*].weights[*].interpretation` must match an `interpretations[*].label`.
- Each `readings[*].weights` array must sum to exactly 100.
- Each persona has a weight entry for every named interpretation (no gaps).
- `readings[*].call` must match one of that reading's own weight labels.
- `calibration.baseline_single_answer` must match an `interpretations[*].label`.
- `calibration.target_distribution` must sum to 100, and each entry's label must match an `interpretations[*].label`.

How to run it on the SNAP dataset:

```bash
bun install
bun run validate
```

The validator at [`scripts/validate.ts`](./scripts/validate.ts) parses the YAML frontmatter with `gray-matter` and has no SNAP-specific logic, so it runs on an adapted dataset unchanged: `bun scripts/validate.ts path/to/your/scenarios`. Beyond the seven invariants it checks one thing the schema cannot express: every `phrase_keys[*].text` must appear in the scenario body, because the phrase-grounding eval matches model citations against body text. A phrase key that drifts from the body fails silently at scoring time; the validator makes it fail loudly at build time.

**What the validator won't catch.** The semantic problems, which are the ones that actually make or break the dataset:

- Personas that read the same way (the disagreement disappears, but the schema is still valid).
- Cases where the "right answer" is obvious to a domain expert (the case validates, but it isn't contested).
- Phrase keys that don't actually anchor the reasoning (the slugs exist, the citations exist, but they're decorative).
- Calibration targets that don't match the spread of practitioner readings (the distribution sums to 100, but it doesn't describe reality).
- Interpretation labels that overlap in practice (the model surfaces all three, but two of them describe the same call under different names).

These need human review, ideally a review by practitioners in your domain who didn't write the cases. The validator gives you "the schema is well-formed." The human review gives you "the dataset is honest." You need both. A useful checklist for the human review: hand a practitioner the case body and the interpretation question, with the named interpretations stripped out, and ask them to produce their own reading and confidence distribution. If their reading lands cleanly on one of your three interpretations, good. If they reach for an interpretation you didn't name, that's a signal your interpretation set is incomplete and worth a second pass.

## 9. common failure modes

Five patterns to refuse. Each is one to watch in your own drafts and in others' adapted datasets.

1. **Personas too similar.** Three readings that produce the same call by different routes are not three lenses. If your personas land in the same place on most of your cases, the disagreement isn't structural, it's window dressing. Rework the institutional pressures: are the three roles you've named actually accountable to different reviewers, with different error budgets? If not, you have one persona in three costumes.

2. **The "right answer" is obvious to a domain expert.** A case where a competent practitioner reads it and says "this is straightforward" is not contested. It's a hard case for someone outside the domain, which is a different problem. Run your draft cases past practitioners early; if more than one says "this one is easy," cut or rework it. A contested-readings dataset where most cases have an obvious answer trains the methodology on the wrong shape.

3. **Phrase keys that don't anchor the reasoning.** A `grounded_in` slug that's cited but isn't actually load-bearing in the reading's argument is decorative. If you remove the phrase from the case and the reading still makes sense, the phrase isn't doing work. The phrase-grounding eval will still pass the structural check, but the dataset's signal is weaker; the model can game the grounding by quoting anything tagged, regardless of relevance.

4. **Calibration targets too crisp.** A target distribution of 90/5/5 defeats the purpose. You're saying "actually we know the answer, we're just nominally allowing two other readings." If your target is that lopsided on most of your cases, either the case isn't contested or your personas haven't done their work. The target distribution is the methodology's honest statement about how split practice is; if you're shipping crisp targets, you're shipping a single-answer dataset with disaggregation theater on top.

5. **Confusing "contested" with "uncertain."** A case where you don't have enough facts to decide is not the same as a case where you have the facts and competent people still disagree. The methodology is for the latter. The first kind of case needs a "verify further" interpretation as the dominant call, not a contested-readings dataset, and it is best handled by the schema's not-yet-decided interpretation rather than by faking a disagreement between personas who would all say "I need more information."

## 10. schema reference

See [`SCHEMA.md`](./SCHEMA.md).
