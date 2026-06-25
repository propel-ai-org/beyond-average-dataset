# personas: specifying and calibrating the three lenses

This is the persona track. [`DESIGNING.md`](./DESIGNING.md) covers choosing three roles with distinct institutional pressures; this document covers what happens after the choosing: writing each persona down as an operational spec a model can run, and calibrating that spec against evals before trusting what it produces. The specs live in [`personas/`](./personas/), one file per persona. The eval implementations live in [`scorer/persona.ts`](./scorer/persona.ts). The harness that runs them lives in [`harness/`](./harness/).

The honest verb for what happens here is **calibration**, not training. Nothing updates any weights. A persona spec is an instrument: a few hundred words of institutional description that, handed to a model as a system prompt, are supposed to produce a particular way of reading a case. Like any instrument, it is not trusted on assertion. It is run against references, measured, revised, and versioned, and it ships with its measurements attached.

## 1. what a persona is here

Three artifacts wear the word "persona" in this repo, and keeping them distinct prevents most confusions:

- **The description.** The four-bullet institutional sketch in DESIGNING.md section 3: default frame, push, caution, audit posture. This is design material, written for humans.
- **The recorded readings.** Each scenario's frontmatter records, per persona, a call, a weight distribution, and grounding (`readings.{slug}`). These are the dataset's claims about how each lens reads each case: authored, practitioner-informed, and fixed.
- **The spec.** The operational artifact in `personas/{slug}.md`: the exact text handed to a model to produce that persona's reading of a case it has not seen annotated. Versioned, with a changelog and a persona card.

The provenance, stated plainly: the recorded readings were authored first, conversationally, during the writing of the scenarios. The specs were written down afterward, as reconstructions of the reading logic those conversations used. That ordering is why the specs need calibration at all. A spec is a claim that a few hundred words capture the institutional logic; fidelity (below) measures how much of the logic the words actually carry.

## 2. two eval surfaces, kept distinct

This repo now contains two eval systems, and they point in opposite directions.

The evals in [`EVALUATING.md`](./EVALUATING.md) score a **model under test**. The model reads the case cold, with no persona, and the frontmatter is the rubric: did it disaggregate, was it calibrated, did it ground its readings? A model failing those evals tells you about the model.

The evals here score the **persona specs**. The spec is the system under test and the model is the substrate it runs on. A persona failing fidelity tells you the spec does not capture the recorded reading logic; it tells you nothing about whether the substrate model is any good as an evaluator. Mixing the two surfaces produces nonsense in both directions, so every result in `results/` is tagged with its arm, and the two never aggregate together.

## 3. anatomy of a spec

Each spec in `personas/` is a markdown file: YAML frontmatter (slug, persona, archetype, version, status, changelog), one fenced `text` block holding the spec verbatim, and a persona card. The fenced block is the artifact; everything around it is documentation. [`personas/legal.md`](./personas/legal.md) is the worked example.

The spec text runs five short sections, in fixed order:

1. **Identity line.** One sentence: role, institution, the document in hand. No name, no biography, no demographics. The methodology models institutional position, not identity; a spec that says "you are a 45-year-old former paralegal" is importing variables the evals cannot separate.
2. **Institutional position.** Where the role sits and what sample of the world it sees. The legal aid attorney meets the program where it failed someone; the worker meets it one file at a time under a deadline; the director meets it as aggregates. Position explains priors without asserting conclusions.
3. **What you are accountable to.** Who reviews this role's decisions and which kind of error costs. This is the load-bearing section. DESIGNING.md section 3 argues the audit posture is the cleanest single explanation of why a persona reads the way it does; in the spec, it is also the text doing most of the steering.
4. **How you read.** The role's procedure, written as method, not as conclusions: where this role starts (the regulation text, the manual sequence, the guidance question), and what distinctions it insists on.
5. **What you are cautious about.** The role's own discipline, including the unflattering parts. This is also where caricature is prevented from the inside: the advocate is warned against treating sympathy as citation, the worker against treating the applicant's framing as fact in either direction.

Then a closing paragraph, **what you produce**, identical word-for-word across all personas: a call, a weight distribution, verbatim citations. Two rules keep the system honest:

- **The output schema lives in the harness, not the spec.** The spec describes a way of reading; the JSON shape is the experiment's packaging. This keeps specs portable (they paste into a chat window unchanged) and keeps the ablation clean: arms differ only in institutional content.
- **No scenario content, no target coaching.** A spec never mentions a case, a weight, or an interpretation label. The fidelity eval is only meaningful if the spec could not have memorized its way through it.

## 4. the three persona evals

All three are pure functions in [`scorer/persona.ts`](./scorer/persona.ts), in the same style as the reference scorer: parsed inputs in, status plus evidence out, no model calls, no I/O. The distance underneath them is total variation distance (TVD) between weight distributions, in percentage points: half the sum of absolute differences, after renormalizing each side to 100. TVD of 0 is identical weighting; 15 points is the same posture with softer edges (80/6/14 against 70/12/18); 50-plus points is a different reading.

**Fidelity** (`scorePersonaFidelity`). Run the spec against the case (recorded readings withheld); compare the output to the persona's recorded reading. Three measurements: call match, weight TVD, and grounding recall (the fraction of the persona's `grounded_in` phrase keys the output actually cited, using the same citation matcher as the grounding eval). Pass: call matches, TVD at most 15, recall at least half. Partial: call matches, TVD at most 30. Extra citations are recorded, not penalized; a persona reaching for a phrase the dataset did not list under it is data, not error. A fidelity failure has two candidate causes and both are findings: the spec failed to capture the reading logic, or the recorded reading does not actually follow from the institutional position. The second is worth catching before a practitioner catches it.

**Separation** (`scorePersonaSeparation`). Across personas on one scenario: pairwise TVD between generated readings, anchored to the spread the recorded readings themselves carry. The score is the ratio of generated spread to recorded spread. Pass: at least 0.75, with at least as many distinct calls as the dataset records. Below 0.5: fail, which is the collapse case, three specs producing one reading, one lens in three costumes. Over-separation is flagged in the detail but does not fail: personas more divergent than the recorded readings are worth inspecting for caricature, the disagreement-as-performance failure DESIGNING.md section 3 refuses. Separation is the empirical check on that section's central claim: that the disagreement is structural and institutional, not stylistic.

**Stability** (`scorePersonaStability`). One spec, one scenario, repeated runs: modal-call consistency and mean run-to-run TVD. Pass: modal call in at least two-thirds of runs and mean drift at most 12 points. The persona-prompting literature gives reason to take this seriously rather than assume it: sociodemographic prompt effects are small and fragile under paraphrase and model change (Beck et al. 2024, below). Whether institutional-role-plus-accountability specs are more robust than demographic labels is an open question this dataset is small enough to probe and too small to settle.

What is deliberately not scored: a persona's agreement with the calibration `target_distribution`. The target describes how practice splits across all three lenses; no single lens is supposed to match it. A legal aid attorney who weights like the field average is not reading like a legal aid attorney.

## 5. the calibration loop

The loop that earns the word "calibrated" in a persona's `status` field:

1. **Draft** the spec from the four-bullet description (DESIGNING.md section 3), through the anatomy above.
2. **Run** it: `bun harness/run.ts --arm spec --runs 3` (or your own harness; the receipts format is documented in [`harness/README.md`](./harness/README.md)).
3. **Score**: `bun harness/score-runs.ts`, then read the per-scenario fidelity, separation, and stability lines.
4. **Diagnose and revise.** Each eval points somewhere specific: fidelity misses point at sections 2 through 4 of the spec (the logic), separation collapse points at accountability sections that read the same across personas, stability failures point at vague language the model resolves differently run to run. Revise, bump the version, record the change and the reason in the changelog.
5. **Freeze** when the scorecard passes, or when the remaining misses are understood and documented as known failure modes on the card. A card with open, named misses is honest; a card with hidden ones is not, and a spec revised until its dashboard is suspiciously green has usually been fitted to its own test. A spec edited after its card is published is a new version with a new card.

Two honesty rules govern the loop. First, **regression versus validation**: when the scenarios being scored are the ones whose readings informed the spec, fidelity is a regression test, not validation. It still earns something real (it pins behavior, catches drift across spec edits and model versions), but the claim it licenses is "the spec captures the recorded logic," not "the spec predicts new cases." Held-out validation requires authoring the recorded readings for new scenarios first, with the specs frozen, then scoring. This dataset's published five are calibration material; scenarios 06 through 10 are reserved as the held-out set and their readings will be authored before the frozen specs are run against them. Second, **no threshold shopping**: the thresholds above are v1 editorial choices, documented here with rationale. Change them if your domain needs different ones, in the doc, with the reasoning, before looking at how the change moves your pass rates.

## 6. the spec ablation

The harness runs three arms that differ only in the system prompt:

- `cold`: no persona. One single-answer read. This arm, run repeatedly, is also how the dataset's `baseline_confidence` figures are measured rather than asserted.
- `role`: the bare role name. "You are a legal aid attorney, reading a SNAP case file."
- `spec`: the full operational spec.

The comparisons isolate the two claims a persona methodology quietly makes. Role against cold measures what invoking a role label does at all. Spec against role measures what the written institutional content adds beyond the label, which is the part the author actually wrote. If spec-arm fidelity is no better than role-arm fidelity, the spec is decoration over the model's stored stereotype of the role, and honesty requires saying so. If it is better, the delta is the measured value of the spec-writing, in TVD points, with receipts.

The arms also bound what the persona can claim to be. A spec-arm reading is jointly produced by the spec and the substrate model's priors about the role; the role arm is an estimate of those priors alone. Where the role arm already lands close to the recorded readings, the institution is legible to the model from its label, and the spec's job is mostly discipline (citation behavior, the not-yet-decided call, calibrated spread). Where the role arm misses, the spec is carrying the logic itself.

Results for this dataset's specs, including the ablation, live in [`results/`](./results/) with raw receipts in `results/raw/`.

## 7. what these evals cannot establish

Fidelity, separation, and stability are all measured against this dataset's own recorded readings. They establish that the specs capture the dataset's institutional logic, reproducibly, and distinctly. They do not establish that the dataset's institutional logic matches the institutions. That is construct validity, and no amount of self-referential measurement supplies it.

The validation that would: practitioners who hold these roles, reading the same cases, independently. The protocol this project intends, published before its results per the practice the field should reward: per role, two or more practitioners; per practitioner, the case body and interpretation question with all annotations stripped; collect a call, a percentage distribution across the named interpretations, and the phrases they would cite, before they see any persona output. Compare against the matching spec's outputs: call agreement, TVD, citation overlap, the same metrics as fidelity, pointed at people instead of frontmatter. A cheaper companion measure: endorsement, showing practitioners a spec-arm reading and asking whether a competent colleague in their role could have written it, and what is wrong with it.

The literature on LLMs simulating humans (the "silicon sampling" debate, Argyle et al. 2023 and its critics, below) cuts both ways here, and the honest position is narrow: these personas do not claim to be practitioners, or to predict any individual's judgment. They claim to encode an institutional reading position well enough to make contested cases legible as contested. Validation measures the distance between that claim and practice, and the distance gets published either way.

## 8. persona cards

Each persona file ends with a card, patterned on model cards (Mitchell et al. 2019): if a few hundred words of prompt are going to act like an instrument, they should be documented like one. The card carries:

- **Intended use**, including the standing caveat: an instrument for surfacing disagreement, not a substitute for the practitioner.
- **Provenance**: what the spec was distilled from, and its relationship to the recorded readings (reconstruction, not source).
- **Calibration**: the measured numbers from the most recent frozen version, with a pointer into `results/`.
- **Known failure modes**: observed, not hypothesized, from calibration runs.
- **Limitations**: the substrate dependency (a persona inherits the blind spots of the model running it), the domain framing, the synthetic cases.

A card with empty calibration is a spec with `status: drafted`. The difference between drafted and calibrated is receipts.

## 9. adapting this to your domain

The sequence is the same one this repo walked: pick three roles whose institutional pressures genuinely differ (DESIGNING.md sections 3 and 9, including the anti-patterns); write the four-bullet description per role; operationalize each through the anatomy in section 3 above; run the calibration loop against your own scenarios' recorded readings; ship specs with cards. The scorer functions are generic over persona slugs and interpretation labels, the validator runs on any scenario directory in this format, and the harness's runner interface is one function to reimplement for another model provider.

The part that does not transfer mechanically is the part that matters most: the recorded readings your specs calibrate against have to come from somewhere honest, which for contested determinations means practitioners, manuals, and case law, not introspection about what a role probably thinks. DESIGNING.md section 6's warning about target distributions applies with equal force to readings.

## 10. literature

The methodology sits in several intersecting lines of work; the load-bearing ones, with what each contributes here:

- **Disagreement as signal, not noise.** Plank, "The 'Problem' of Human Label Variation" (EMNLP 2022); Uma et al., "Learning from Disagreement: A Survey" (JAIR 2021); Aroyo et al., "DICES Dataset: Diversity in Conversational AI Evaluation for Safety" (NeurIPS Datasets 2023); Gordon et al., "Jury Learning: Integrating Dissenting Voices into Machine Learning Models" (CHI 2022). The perspectivist case that label variation is often information about the task, and the jury-learning move of modeling whose judgment is being predicted rather than averaging it away. Three Readings is that move applied to institutional roles instead of annotator demographics.
- **Whose distribution a model reflects.** Santurkar et al., "Whose Opinions Do Language Models Reflect?" (ICML 2023); Durmus et al., "Towards Measuring the Representation of Subjective Global Opinions in Language Models" (2023). Distributional comparison of model outputs against reference populations; this dataset's `target_distribution` is the same idea at the scale of one contested case.
- **Pluralistic alignment.** Sorensen et al., "A Roadmap to Pluralistic Alignment" (ICML 2024). Their taxonomy gives this artifact its coordinates: the persona specs are steerable pluralism, the calibration target is distributional pluralism, and the named-interpretation set is an Overton claim about which readings are reasonable.
- **Persona prompting and its fragility.** Beck et al., "Sensitivity, Performance, Robustness: Deconstructing the Effect of Sociodemographic Prompting" (EACL 2024), the reason the stability eval exists; Salewski et al., "In-Context Impersonation Reveals Large Language Models' Strengths and Biases" (NeurIPS 2023); Gupta et al., "Bias Runs Deep: Implicit Reasoning Biases in Persona-Assigned LLMs" (ICLR 2024), the caution that persona prompts can degrade reasoning and import stereotype, which is why these specs carry institutional structure rather than demographic identity.
- **Simulating humans, and the limits.** Argyle et al., "Out of One, Many: Using Language Models to Simulate Human Samples" (Political Analysis 2023), against Bisbee et al., "Synthetic Replacements for Human Survey Data? The Perils of Large Language Models" (Political Analysis 2024). The debate section 7's validity protocol answers to.
- **Documentation as discipline.** Mitchell et al., "Model Cards for Model Reporting" (FAT* 2019). The genre the persona cards borrow.
