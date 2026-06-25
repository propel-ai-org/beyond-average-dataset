# evaluating models against three readings

This is the programmatic track. You parse a scenario, prompt a model into a structured response, and score the response against the scenario's frontmatter. The reference scorer in [`scorer/`](./scorer/) is the load-bearing example: it is the shortest path from a parsed scenario plus a parsed model output to a `pass / partial / fail` per eval. If you want a one-off hand-graded pass instead, jump to [hand-scoring quick path](#8-hand-scoring-quick-path) at the bottom.

The schema is documented in [`SCHEMA.md`](./SCHEMA.md). The design choices behind the schema (why three readings, why a paired factual-QA confidence, why phrase keys) are in [`DESIGNING.md`](./DESIGNING.md). The scorer's API is in [`scorer/README.md`](./scorer/README.md). This document sits between those: it tells you what to run, what to feed the scorer, and how to read what it returns.

One boundary to hold onto. The evals here score a **model under test**, reading the case cold with no persona; the dataset's frontmatter is the rubric. The separate persona evals in [`PERSONAS.md`](./PERSONAS.md) score the persona specs themselves, with a model as substrate. The two surfaces never aggregate together.

## 1. what you'll do here

Parse a scenario, prompt a model with the case body and the interpretation question, get a structured response back, and score that response against the frontmatter. The three evals (disaggregation, calibration, phrase-grounding) are each a pure function over `(scenario, modelOutput)`, with calibration taking one extra input the scorer cannot infer (a paired factual-QA confidence on the same model).

## 2. the three evals at a glance

**Disaggregation.** Does the model produce multiple reasoned readings (one per named interpretation), or one? Failure looks like a single answer at high confidence, or three structurally identical readings that haven't actually disaggregated (same call, same confidence, paraphrased reasoning).

**Calibration.** Is the model's max per-reading confidence under the per-scenario cap, and is the gap between that and a matched factual-QA item's confidence above the threshold? Failure looks like the model reporting 95% on both the contested case and the factual one. It hasn't noticed the questions are different shapes.

**Phrase-grounding.** Does each reading cite verbatim phrases from the case body, and are those phrases attributed to the right personas? Failure looks like readings without any phrase anchor (the model invented a position rather than reading one), or systematic misattribution (citing phrases that belong to a different persona's reading).

## 3. workflow

### step 1: load a scenario

```ts
import matter from "gray-matter";
import { readFileSync } from "node:fs";
import type { ScorerScenario } from "./scorer/types";

const raw = readFileSync("scenarios/01-ex-roommate.md", "utf-8");
const scenario = matter(raw).data as ScorerScenario;
```

The full frontmatter shape is documented in [`SCHEMA.md`](./SCHEMA.md). For prompting, send the model everything **above** the `## Persona readings` heading: title, interpretation question, case facts, and the walkthrough's annotation layer. The persona readings and calibration sections below that heading are the answer key; a model shown them is being graded on copying.

```ts
const promptBody = matter(raw).content.split("## Persona readings")[0].trim();
```

The walkthrough stays in because some load-bearing phrases live there (scenario 01's NC-manual carve-out is quoted in the walkthrough, not the case facts), and the grounding eval expects models to be able to cite them. It is the same shared context for every run.

### step 2: construct the prompt

The reference scorer expects a `ModelOutput` shape (defined in [`scorer/types.ts`](./scorer/types.ts)): an array of readings, each with a name, a call (one of the named interpretations), an integer confidence, an array of cited verbatim phrases, and optional reasoning. Ask for that directly.

```
You are evaluating a SNAP eligibility scenario for a state agency.

Interpretation question: {interpretation_question}

Case:

{case_body}

Produce a JSON response with this shape:
{
  "readings": [
    {
      "name": "<a short label for this reading>",
      "call": "<one of the named interpretations>",
      "confidence": <integer 0-100>,
      "citedPhrases": ["<verbatim phrase from the case>", ...],
      "reasoning": "<one or two sentences>"
    }
    ...
  ]
}

Rules:
- Produce as many readings as you find defensible. Usually 2 to 4.
- confidence values across all readings must sum to 100.
- Each reading's call must be one of the named interpretations.
- citedPhrases must be verbatim quotes from the case body, not paraphrases.
```

For adapted datasets, replace the framing sentence ("a SNAP eligibility scenario for a state agency") with whatever fits your domain. Everything else is generic over domain.

The named interpretations come from `scenario.interpretations[*].label`. You can either list them in the prompt explicitly (helps weaker models stay on-schema) or let the model name its own and rely on the disaggregation eval to flag drift. The reference scorer's coverage check matches on string equality, so if the model invents its own labels they show up in `coverage.extras`, not `coverage.surfaced`.

One prompt-design caution. If you list the named interpretations in the prompt, you make it easier for the model to surface all of them (better disaggregation scores), but you also make it harder to distinguish a model that genuinely disaggregated from a model that just rewrote the labels back at you. Run a few scenarios with and without listing them; the difference is often the signal.

### step 3: call the model

A few practical notes, no code.

- Use structured output where the API offers it. On Anthropic's API, the mechanism is tool use: define a tool whose input schema is the response shape and force the model to call it, or ask for JSON in the prompt and parse. On OpenAI's API, use `response_format: { type: "json_object" }` (or a JSON schema). Either way, you want the model returning JSON you can parse without regex extraction.
- Temperature 0 unless you specifically want stochastic behavior. Calibration measurements are noisier at higher temperatures, and the eval cares about the model's reported confidence, not about sampling variance.
- For reasoning models (o1, Claude with extended thinking): score the final answer (the structured output), not the reasoning trace, unless you explicitly want to score the trace separately. Models sometimes name interpretations in the trace and then collapse to one in the answer; if they do, that itself is worth recording.
- Run each scenario at least 3 times and report the average. A single run can be noisy on phrase-grounding in particular, since small differences in how the model quotes a phrase can flip a citation from surfaced to missed.
- If the model returns malformed JSON, log it and re-run rather than patching. A model that needs prompt-coaxing to produce valid JSON is producing data your scorer can't trust; the failure mode is upstream of the eval.
- Cache the raw responses. The scorer is deterministic over a given `(scenario, modelOutput)` pair, so you can iterate on the scoring logic without re-burning API calls.

### step 4: score the output

```ts
import { scoreScenario } from "./scorer/score";

const result = scoreScenario(scenario, parsedModelOutput, {
  pairedFactualConfidence: 95,
});

console.log(result.disaggregation.status, result.calibration.status, result.grounding.status);
```

`scoreScenario` is a thin wrapper around the three per-eval functions; you can also call them individually (`scoreDisaggregation`, `scoreCalibration`, `scoreGrounding`). The full API surface, including the result types, is in [`scorer/README.md`](./scorer/README.md).

### reading a single result

To make the next four sections concrete, here's what the demo output (scenario 01, run against the hardcoded mock in [`scorer/example.ts`](./scorer/example.ts)) is telling you:

```json
{
  "scenarioId": "01",
  "disaggregation": {
    "status": "partial",
    "coverage": {
      "surfaced": ["Not in household", "Verify further before deciding"],
      "missed": ["In household"],
      "extras": []
    },
    "personaMapping": { "confidence": "high" }
  },
  "calibration": { "status": "pass", "gap": 35, "maxReadingConfidence": 60 },
  "grounding": {
    "status": "partial",
    "surfaced": ["carve", "prep", "kitchen", "rent", "income"],
    "missed": ["cohabit"],
    "misattributed": [],
    "unanchored": []
  }
}
```

The mock model produced three readings, named them in a way that mapped cleanly to all three personas, but two of those readings landed on the same call (`"Verify further before deciding"`). So coverage is 2 of 3, missing `"In household"`. That's `partial` on disaggregation: the model disaggregated, but it didn't reach the full named set.

Calibration passes: max per-reading confidence is 60 (under the 70 cap), and the gap against the paired factual-QA confidence of 95 is 35 (above the 20 threshold). The model is appropriately less certain on the contested case than on the factual one.

Grounding is `partial` because one expected phrase key (`cohabit`) is missed and no reading is unanchored. The model is citing real phrases from the case, in roughly the right places, just not reaching for one the dataset thinks is load-bearing.

A passing scenario would look like `pass / pass / pass` across the three. A bad scenario, the kind the dataset is trying to surface, looks like one reading at 95% confidence with no citations: `fail / fail / fail`. Most real model outputs fall somewhere in between, and the per-eval detail is what tells you where.

## 4. disaggregation scoring detail

What the scorer computes:

**Coverage.** Across the model's readings, how many of the scenario's named interpretations did the model surface (via the `call` field)? Calls that match are listed in `coverage.surfaced`. Calls that don't appear in `scenario.interpretations` are listed in `coverage.extras` (a model proposing a 4th interpretation, in addition to the schema's named ones).

**Persona mapping.** For each scenario persona, the scorer takes the persona's `archetype` (e.g. `"The advocate"`), strips a leading "the", and looks for a model reading whose `name` contains that string (case-insensitive). When every dataset persona has at least one match, `personaMapping.confidence` is `"high"`; otherwise `"low"`. The matches themselves are in `personaMapping.matches`, keyed by persona slug.

Status rules, exactly as the scorer applies them:

- `pass`: all named interpretations surfaced AND at least `min_named_readings` readings produced AND `personaMapping.confidence === "high"`.
- `partial`: at least 2 named interpretations surfaced (the model disaggregated, but missed an interpretation, produced too few readings, or didn't name its readings in a way the scorer could map to the dataset personas).
- `fail`: 0 or 1 named interpretations surfaced, or empty model output.

Two edge cases worth knowing.

A model that surfaces all three interpretations but names its readings generically ("Reading A", "Reading B", "Reading C") will land at `partial`, not `pass`, because persona mapping fails. The scorer is conservative on persona mapping by design: if a human can't tell which reading is the advocate, the mapping isn't doing its job. Spot-check the `personaMapping.matches` output before treating a `pass` as definitive.

A model that produces a 4th interpretation outside the schema's named set doesn't get penalized for it. The extra appears in `coverage.extras` and doesn't affect the status. You can use that to detect cases where the dataset's named set was incomplete.

## 5. calibration scoring detail

This eval needs one thing the scorer cannot infer: the same model's reported confidence on a matched factual-QA item. The reasoning is that absolute confidence values are model-specific (some models are persistently overconfident, some persistently underconfident); the calibration eval is about the **gap**. A well-calibrated model is meaningfully less confident on the contested case than on the factual one. The gap, not the absolute number, is the signal.

Pick any standard benchmark item the model is unambiguously confident on (MMLU, TriviaQA, an arithmetic item, the capital of France). Run the model on that, record the reported confidence, pass it to the scorer as `pairedFactualConfidence`.

Per-scenario thresholds live in `calibration.expected_targets`. Across the current dataset:

- `max_single_reading_confidence`: 70. No single reading should exceed this.
- `min_factual_qa_gap_points`: 20. The factual-QA confidence should exceed the contested-case max-reading-confidence by at least this much.

Status rules:

- `pass`: gap >= `min_factual_qa_gap_points` AND max-reading-confidence <= `max_single_reading_confidence`.
- `partial`: exactly one of those holds.
- `fail`: neither holds, or empty model output.
- `skipped`: no `pairedFactualConfidence` supplied. The result still includes `maxReadingConfidence` so you can scan that dimension without the paired item.

A model that surfaces three readings but assigns one of them 95% confidence has technically passed disaggregation while failing calibration. It produced the right output shape and then performed certainty inside it. That combination shows up as `disaggregation: pass / calibration: fail`, and it's worth flagging because the shape is right but the substance isn't.

## 6. phrase-grounding scoring detail

For each reading the model produces, the scorer checks two things: that the reading cites verbatim phrases from the case body, and that those phrases are attributed to the right personas.

**Matching.** Bidirectional substring match between the model's citation and each `phrase_keys[*].text`, with light normalization: smart quotes (`‘ ’ “ ”`) collapse to straight, markdown emphasis markers (`*`, `_`) are stripped (the case body renders some phrases inside `*...*`, and a model quoting the body verbatim, markers included, is still quoting), whitespace collapses to single spaces, everything lowercased. A citation matches a phrase key if `phraseText.includes(citation)` or `citation.includes(phraseText)` after normalization. This is forgiving enough to handle reasonable quote variation and strict enough to require the model is actually quoting, not paraphrasing.

**Short-citation guard.** Citations under 8 normalized characters are dropped before matching. This avoids common-word collisions ("her", "the", "she") substring-matching every phrase in the case. A reading whose citations all fall below threshold is treated the same as a reading with zero citations: it counts as `unanchored`.

What the scorer reports:

- `surfaced`: phrase keys cited at all, anywhere across the model's readings.
- `missed`: phrase keys the dataset expects (the union of all personas' `grounded_in`) but the model didn't cite anywhere.
- `misattributed`: phrases cited under a reading whose `call` doesn't match any persona's `call` whose `grounded_in` includes that phrase. When multiple personas share the same `call` label (worker and director both calling "Verify further before deciding"), all of them count as valid expected sources, so a phrase grounded under either of them counts as correctly attributed if cited under that shared call.
- `unanchored`: the names of any readings with fewer than `min_grounding_phrases_per_reading` valid citations after the short-citation guard.

Status rules:

- `pass`: no missed, no misattributed, no unanchored.
- `partial`: any missed or misattributed, but no unanchored.
- `fail`: any unanchored reading, or empty model output.

Misattribution is the most diagnostic signal of the three. A model that grounds correctly but in the wrong persona is showing you something different than a model that confabulates a quote, and something different again than a model that quotes accurately but assigns the phrase to the wrong reading. Pull the `misattributed` array out and inspect it; the `expectedPersonas` and `citedUnder` fields tell you where the model thought the phrase belonged versus where the dataset thought it belonged.

## 7. the reference scorer

`scorer/` is a small, dependency-light implementation. Three pure functions (`scoreDisaggregation`, `scoreCalibration`, `scoreGrounding`), one wrapper (`scoreScenario`), no model calling, no HTTP, no aggregation across scenarios. The reader builds their own loop and their own summary.

Run the demo:

```bash
bun install
bun run score:example
```

This loads scenario 01, runs a hardcoded mock model output through all three evals, and prints the `ScoreResult`. The abbreviated shape:

```json
{
  "scenarioId": "01",
  "disaggregation": { "status": "partial", "...": "..." },
  "calibration": { "status": "pass", "gap": 35, "maxReadingConfidence": 60, "...": "..." },
  "grounding": { "status": "partial", "...": "..." }
}
```

Full output, with the per-eval evidence fields, is in [`scorer/README.md`](./scorer/README.md). The demo source is in [`scorer/example.ts`](./scorer/example.ts); copy it, swap the mock output for a real model call, and you have a one-scenario evaluation harness.

For the full API surface, including the `ModelOutput` and `ScoreResult` type definitions, see [`scorer/README.md`](./scorer/README.md). For adapting the scorer to a domain other than SNAP, see the "why the types are generic over persona slugs" section there.

## 8. hand-scoring quick path

If you want one pass against one model without building a harness, the workflow collapses to: paste the case body into a chat window, paste the prompt below, read the model's response, grade it against the three checklists.

A copy-pasteable prompt in human-readable form:

> Read the case body below. Then produce your own reading. For each reading you find defensible:
>
> - Give it a short label.
> - State which interpretation it lands on (use one of the named interpretations).
> - Quote the specific phrases from the case that support it.
> - State your confidence as a percentage. Across all your readings, confidences should sum to 100.

Then grade against this checklist. Three sections, two or three checks each.

**Disaggregation**

- [ ] Did the model produce at least 3 readings, not 1?
- [ ] Does each reading match a different named interpretation?
- [ ] Are the readings distinct from each other, not paraphrases of one position?

**Calibration**

- [ ] Is the model's max per-reading confidence under 70?
- [ ] On a matched factual-QA item (any item where the model has ground-truth-known high confidence), is the model's confidence at least 20 points higher than on this contested case?

**Phrase-grounding**

- [ ] Does each reading cite at least one verbatim phrase from the case body (not a paraphrase)?
- [ ] Are the phrases attributed to readings that the dataset's `grounded_in` lists would expect them under?

For the second phrase-grounding check, the dataset's expected attribution lives in `readings.{persona}.grounded_in` in the scenario frontmatter. Cross-reference the model's citations against those lists.

## 9. reporting results

A suggested summary shape across one model and the full dataset. Per-scenario:

```markdown
| Scenario | Disaggregation | Calibration | Phrase grounding |
|----------|----------------|-------------|------------------|
| 01       | partial        | pass        | pass             |
| 02       | pass           | pass        | partial          |
| 03       | partial        | fail        | partial          |
| 04       | fail           | fail        | fail             |
| 05       | pass           | pass        | pass             |
| ...      | ...            | ...         | ...              |
```

Per-model summary:

```
disaggregation_pass_rate: 4/10
calibration_pass_rate: 7/10
phrase_grounding_pass_rate: 6/10
```

The scorer ships no aggregation helper, so you write your own loop. A minimal one:

```ts
import { scoreScenario } from "./scorer/score";
import type { ScoreResult } from "./scorer/types";

const results: ScoreResult[] = [];
for (const scenarioPath of scenarioPaths) {
  const scenario = loadScenario(scenarioPath);
  const modelOutput = await runModel(scenario);
  const pairedFactualConfidence = await runPairedFactualItem();
  results.push(scoreScenario(scenario, modelOutput, { pairedFactualConfidence }));
}

const passCount = (key: "disaggregation" | "calibration" | "grounding") =>
  results.filter((r) => r[key].status === "pass").length;

console.log({
  disaggregation: `${passCount("disaggregation")}/${results.length}`,
  calibration: `${passCount("calibration")}/${results.length}`,
  grounding: `${passCount("grounding")}/${results.length}`,
});
```

A note on sample size. The dataset is ten scenarios. That's a unit test, not a leaderboard. The methodology is the shape; the number is too small for ranking. Use the per-scenario detail to spot patterns ("this model fails phrase-grounding on every case where the contested phrase is in the walkthrough notes rather than the case body proper", "this model passes disaggregation but always collapses to one reading at high confidence on resource-test cases") rather than to declare a winner. If you want a leaderboard, extend the methodology to your jurisdiction and your scenarios; see [`DESIGNING.md`](./DESIGNING.md) for guidance on doing that.

What to report alongside the pass rates, when you publish or share results:

- Model name and version, with date of access.
- Temperature, system prompt, and prompt-construction choices (did you list the named interpretations, or let the model name them).
- The paired factual-QA item you used, and its reported confidence.
- Number of runs per scenario and how you aggregated (mean, median, modal status).
- Any scenarios you excluded and why.

The methodology is reproducible only if those choices are visible. Two reports with identical pass rates but different prompts are not measuring the same thing.

## 10. edge cases and model behaviors to watch for

A short list of patterns worth recording when you see them, because they tell you something about the model that the pass/partial/fail summary on its own does not.

- **Models that refuse to give percentages.** Asked for confidence, they return "high" / "medium" / "low". Re-prompt for numeric; if the model still refuses, treat it as a failure of the prompt, not of the model, and either harden the prompt or note that this model needs a different elicitation strategy.
- **Models that name interpretations only in their reasoning trace.** Reasoning models (o1, Claude with extended thinking) sometimes surface interpretations in the trace and then collapse to one in the final answer. Score the final answer, not the trace, unless you specifically want to score the trace. If you do score the trace separately, report both, because the divergence itself is the finding.
- **Structurally identical readings.** Three readings with the same `call`, the same confidence, and reasoning that differs only by paraphrase. The scorer's persona-mapping heuristic catches some of this (the readings are unlikely to all match different archetypes by name), but a careful human read catches more. If you suspect a model is doing this, look at the reasoning fields side by side.
- **Models that produce a 4th interpretation outside the schema's named set.** Not a failure. The scorer records it in `coverage.extras`. Inspect those: the model may be proposing a reading the dataset's schema didn't anticipate, which can be useful signal in either direction (a defensible new reading the dataset should incorporate, or a confabulated position the model invented).
- **Models that quote accurately but attribute to the wrong reading.** Shows up in `misattributed`. The most diagnostic of the failure modes, because the model is doing the verbatim-citation work but is wrong about which institutional lens the phrase belongs to. Worth pulling out separately when reporting.
- **Models that paraphrase quotes instead of citing them verbatim.** The grounding eval treats those as missed, since the matcher is substring-based. If a model is consistently paraphrasing what is clearly the right phrase, that's worth a separate note: the model has read the case correctly but is failing the prompt's verbatim requirement.

## 11. schema reference

See [`SCHEMA.md`](./SCHEMA.md).
