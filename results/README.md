# measured results: persona calibration v1.0.0, spec ablation, baselines

The three-arm ablation (cold / role / spec) produces one clear finding: bare role labels collapse the three readings toward the model's own answer (separation ratio 0.26), and full institutional specs recover 59 to 72 percent of the disagreement the cases carry, scaling with model tier. The cold-arm confidences, 65 to 78, are consistently above the honest distribution for these cases, which tops out at 38 to 50. Neither finding requires extreme overconfidence; 69 against a case whose honest distribution is 32/30/38 is the same category error, stated quietly.

What this folder is: the measured side of [`PERSONAS.md`](../PERSONAS.md). Every number below is computed by [`harness/score-runs.ts`](../harness/score-runs.ts) from the raw receipts in [`raw/`](./raw/), each of which records the full prompts and raw model text for one run. `summary.json` is the machine-readable aggregation. Nothing here is asserted without a receipt.

Run date: 2026-06-10. Persona specs: v1.0.0 (the first written-down versions; see the changelogs in [`personas/`](../personas/)). 255 runs, 255 usable, 0 errors.

## setup

- **Models.** claude-haiku-4-5-20251001, claude-sonnet-4-6, claude-opus-4-8. One model family by design of this first pass; see limits below.
- **Runner.** The `claude` CLI runner from [`harness/`](../harness/), tools and MCP disabled, sandbox working directory. The CLI does not expose temperature, so run-to-run variance is real sampling variance; the stability eval is pointed at exactly that.
- **Arms.** `cold` (single answer, no persona; 5 runs per scenario per model), `role` (bare role label; 3 runs, sonnet only), `spec` (full operational spec; 3 runs, all three models). Prompt construction in [`harness/lib.ts`](../harness/lib.ts); the model sees everything above `## Persona readings`, never the recorded readings or calibration block.
- **Scoring.** Fidelity, separation, stability as defined in PERSONAS.md sections 4 through 6, thresholds as shipped in [`scorer/persona.ts`](../scorer/persona.ts).

## the headline: role labels collapse, specs separate

Separation ratio is generated spread over recorded spread (1.0 = the three generated readings disagree as much as the dataset's recorded readings do). Mean over the five scenarios:

| arm  | model  | separation ratio | distinct calls (of 2.4 recorded) |
|------|--------|------------------|----------------------------------|
| role | sonnet | **0.26**         | 1.2                              |
| spec | haiku  | 0.55             | 1.5                              |
| spec | sonnet | **0.59**         | 1.9                              |
| spec | opus   | **0.72**         | 2.2                              |

Told only "you are a legal aid attorney" / "you are an eligibility worker" / "you are a SNAP director," the three readings collapse toward one: on most scenarios every role lands on the model's own cold-baseline answer, and the disagreement the case actually carries disappears (ratio 0.26, usually a single distinct call). The same model handed the full institutional specs recovers more than half of the recorded spread, and the recovery scales with model tier. The disagreement does not come from naming the role. It comes from the written accountability structure: who reviews this role's decisions, and which errors cost.

This is the spec ablation's answer to "what does the spec add beyond the label": on these cases, most of the separation that exists at all.

## fidelity, role arm against spec arm (sonnet)

Fidelity compares each generated reading to the persona's recorded reading. Means over five scenarios, three runs each:

| arm  | persona  | call match | weight distance (TVD pts) | grounding recall |
|------|----------|-----------:|--------------------------:|-----------------:|
| role | legal    | 40%        | 32.6                      | 29%              |
| spec | legal    | **87%**    | **16.9**                  | 42%              |
| role | worker   | 40%        | 27.3                      | 9%               |
| spec | worker   | **60%**    | **20.8**                  | 42%              |
| role | director | 80%        | 19.8                      | 18%              |
| spec | director | 80%        | 22.2                      | 26%              |

The spec's value concentrates exactly where the lens sits furthest from the model's default posture. The advocate is not where the model goes on its own: the bare label leaves it at 40% call match, the spec carries it to 87% and halves the weight distance. The director barely moves between arms, because the model's cold reading already resembles institutional caution (compare the cold-arm calls below); for that persona the spec's measured contribution is weight shape and citation discipline, not direction. The worker sits between. A persona methodology that reported only the director would look like the labels were doing the work; only the ablation across all three shows where the writing earns its keep.

## cross-tier: the substrate is part of the instrument

Spec arm, all personas pooled:

| model  | call match | weight distance | grounding recall | stability pass (of 15) |
|--------|-----------:|----------------:|-----------------:|------------------------:|
| haiku  | 58%        | 26.4            | 31%              | 4                       |
| sonnet | 76%        | 20.0            | 37%              | 15                      |
| opus   | 76%        | 16.2            | 29%              | 14                      |

The same specs, verbatim, are a reliable instrument on sonnet and opus and an unreliable one on haiku (stability passes on 4 of 15 persona-scenario combinations; two outright fails where repeat runs land on different calls). A persona spec is not a portable artifact that means the same thing on any substrate; the card for each persona names the tiers it has been calibrated on, and adapters should treat an uncalibrated substrate as an unvalidated instrument.

## where the specs miss, and what each miss is

Three of fifteen persona-scenario combinations diverge on the call in the spec arm (sonnet; the role arm diverges on six, all toward the model's cold answer). Each is a different kind of finding, which is the point of running the eval rather than asserting the personas work:

- **Scenario 01, director.** The spec commits to "Not in household" on the strength of the explicit NC carve-out; the recorded director pends for documented diligence. The spec's "only if the file documents that its conditions were checked" clause is not binding enough against a clean-looking carve-out. A spec gap; the identified v1.1 revision target.
- **Scenario 02, worker.** The spec pends ("Pend with specific request") where the recorded worker commits to "Hours are not verified," consistently across all three tiers. Here the spec may be right and the recorded reading wrong: committing on thin documentation is the less worker-shaped move, and the spec's pending discipline is doing what the role's QC posture says it should. Flagged as a recorded-reading question for the dataset, not (only) a spec question.
- **Scenario 04, worker.** The spec follows the tracing methodology where the recorded worker reading commits to the six-month closure; the measured baseline lands on tracing too (see the baseline section). The recorded worker reading is the outlier on this scenario, flagged for review against practice.

## baselines: how the published values were measured

The cold arm produces, with receipts, the single-answer behavior the dataset's `calibration.baseline_single_answer` / `baseline_confidence` fields record. **The published payloads carry the claude-sonnet-4-6 values from this run** (modal call, rounded mean confidence over five runs), with provenance in each `baseline_note`. The scenarios were first authored with informally observed baselines (calls mostly identical; confidences 81 to 95, uniformly above what this measurement produces); those authored values were replaced when this run landed, which is the kind of correction the receipts exist to force.

Five runs per scenario per model; modal call and mean reported confidence:

| scenario | published (= sonnet, measured)            | haiku                                | opus                                     |
|----------|-------------------------------------------|--------------------------------------|-------------------------------------------|
| 01       | Not in household @ 74                     | same @ 77.8                          | same @ 74.0                                |
| 02       | Pend with specific request @ 74           | same @ 73.2                          | same @ 76.8                                |
| 03       | Countable as unearned income @ 78         | same @ 77.0                          | same @ 76.8                                |
| 04       | Trace via lowest intermediate balance @ 69 | **Fully exempt under 6409** @ 74.4  | same @ 68.4                                |
| 05       | Pend for the state medical statement form @ 71 | **PCP letter is sufficient** @ 74.0 | same @ 64.8                            |

Three things this table says.

First, the baseline **calls** are tier-stable on scenarios 01 through 03: every tier commits to the same single answer. Scenario 04 is the live one: sonnet and opus reach for the tracing methodology while haiku declares the refund fully exempt, and the originally authored baseline (the six-month commingling closure) reproduced on no tier at all. A case where model tiers disagree about which single answer to be confident in is the dataset's argument making itself. On 05, haiku peels off toward the advocate's reading.

Second, the **confidences** sit at 65 to 78 against calibration targets whose top weight is 38 to 50. The category error the dataset documents does not require a 95: a 69 on a case whose honest distribution is 32/30/38 is the same collapse, stated more politely.

Third, one operationalization note for anyone comparing numbers: this cold prompt lists the named interpretations so the answer is classifiable against the schema. Choosing among named options plausibly elicits lower reported confidence than a fully open-ended ask; if you measure baselines open-ended, expect higher numbers and harder classification, and report which one you did.

## limits

- **Regression, not validation.** The five scenarios scored here are the ones whose readings informed the specs. These results show the specs capture the recorded logic; they do not show the specs predict new cases. Scenarios 06 through 10 are reserved as the held-out set (readings to be authored before the frozen specs run against them), per PERSONAS.md section 5.
- **No practitioner validation yet.** Fidelity to the dataset is not fidelity to the institutions; the protocol is in PERSONAS.md section 7 and runs after launch.
- **One model family.** Cross-tier is not cross-family. The runner interface is one function ([`harness/lib.ts`](../harness/lib.ts)); GPT-class and open-weight substrates are the obvious next extension.
- **Small k.** Three runs per cell (five for baselines) bounds the precision of every percentage here; treat single-cell differences under ~15 points as noise and the arm-level patterns (0.26 against 0.59, 40% against 87%) as the findings.
- **Thresholds are v1.** Pass lines (TVD 15, ratio 0.75, and so on) are editorial choices documented in PERSONAS.md; the raw distances are all in `summary.json` for anyone who prefers different lines.
- **Grounding recall is the weakest dimension everywhere** (18 to 42%). Inspection of receipts says this is mostly models citing defensible anchors outside the persona's `grounded_in` list rather than confabulation (extras are recorded per run), which reads as a tension between the dataset's narrow expected-anchor lists and the wider set of real phrases a reading can legitimately rest on. v1 leaves it measured and unresolved.

## reproducing

```bash
bun install
bun harness/run.ts --arm cold --model claude-sonnet-4-6 --runs 5
bun harness/run.ts --arm role --model claude-sonnet-4-6 --runs 3
bun harness/run.ts --arm spec --model claude-sonnet-4-6 --runs 3
bun harness/score-runs.ts
```

Swap `--model` for the other tiers, or `--runner api` with `ANTHROPIC_API_KEY` set.

On what to expect: the arm-level patterns (role collapse, spec recovery scaling with tier) should reproduce. Exact percentages will vary. The published run used the `cli` runner, which does not lock temperature; `--runner api` runs at temperature 0 and will give tighter per-cell numbers. Model behavior also changes between API versions, so the run date above is the anchor. The receipts in `results/raw/` carry the full prompts and raw model text; diff your run against them to see where the numbers moved and by how much.
