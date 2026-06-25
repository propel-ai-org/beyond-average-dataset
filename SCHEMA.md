# schema reference

## what this is

This document describes the YAML frontmatter shape used by scenario files in `scenarios/`. The markdown files are generated from canonical sources in the companion site repository. The schema below describes the generated frontmatter shape, which is also what the reference scorer at [`scorer/`](./scorer/) parses. For the methodology behind the design choices, see `DESIGNING.md`. For running the dataset against a model, see `EVALUATING.md`.

## the scenario file format

Each scenario file is a single markdown file with YAML frontmatter on top and a markdown body below. The frontmatter is the machine-readable spec; the body is the human-readable case file, walkthrough, and persona readings. The scorer reads only the frontmatter. Humans evaluating by hand read the body.

A trimmed frontmatter block for orientation:

```yaml
---
id: "01"
title: "The ex-roommate on the lease"
policy_zone: "Household composition"
hr1_relevance: "limited"
interpretation_question: "Is Jordan part of Maria's SNAP household for this application?"
interpretations:
  - label: "Not in household"
    gloss: "NC carve-out applies; purchase and prepare is separate."
phrase_keys:
  - key: "carve"
    text: "NC manual: Unmarried couples who live together..."
readings:
  legal:
    persona: "Legal aid attorney"
    archetype: "The advocate"
    call: "Not in household"
    weights: [{ interpretation: "Not in household", value: 80 }]
    grounded_in: ["carve"]
calibration:
  baseline_single_answer: "Not in household"
  baseline_confidence: 74
  target_distribution: [{ interpretation: "Not in household", value: 40 }]
  expected_targets:
    max_single_reading_confidence: 70
---
```

## field reference

### `id`

Zero-padded scenario number, as a string (e.g. `"01"`).

- Type: `string`
- Required

### `title`

Short, human-readable title.

- Type: `string`
- Required

### `policy_zone`

The SNAP policy area the case sits in (household composition, ABAWD, resources, income, etc.).

- Type: `string`
- Required
- SNAP-specific. Domain adapters should rename for their domain (e.g. `clinical_zone` for medical triage) or drop the field entirely.

### `hr1_relevance`

How much the HR1 / OBBBA changes shape the case.

- Type: `"central" | "indirect" | "limited"`
- Required
- SNAP-specific. Domain adapters should drop this field.

### `hr1_note`

Optional one-line annotation on how HR1 bears on the case.

- Type: `string`
- Optional
- SNAP-specific. Domain adapters should drop this field.

### `interpretation_question`

The contested question the case poses, phrased the way a frontline reviewer would have to phrase it. This is the question the model is asked.

- Type: `string`
- Required

### `interpretations`

The named outcomes a reviewer can land on. Usually three per scenario.

- Type: `Array<{ label: string; gloss: string }>`
- Required

Subfields:

- `label`: the canonical identifier referenced by `readings[*].weights[*].interpretation`, `readings[*].call`, `calibration.baseline_single_answer`, and `calibration.target_distribution[*].interpretation`. Treated as a string match across the schema; spelling matters.
- `gloss`: sentence-form supporting text, surfaced in the case body.

### `phrase_keys`

The specific phrases in the case (and, occasionally, in the walkthrough notes) that load-bearing arguments turn on, keyed by short slug. These are what the phrase-grounding eval scores against.

- Type: `Array<{ key: string; text: string }>`
- Required

Subfields:

- `key`: short slug (`"carve"`, `"prep"`, `"rent"`). Referenced by `readings[*].grounded_in`.
- `text`: the verbatim phrase from the case body or walkthrough.

### `readings`

One entry per persona. The persona keys are the persona slugs.

- Type: `Record<string, ScorerReading>`
- Required

In the SNAP dataset the slugs are `legal`, `worker`, `director`. Adapted datasets can use any string keys (`manager` / `recruiter` / `partner`, `physician` / `specialist` / `case-manager`). The reference scorer accepts arbitrary slugs without modification.

The entries here are the personas' *recorded readings*: the dataset's claims about how each lens reads this case. The operational persona specs that generate readings (and the evals that calibrate them against these recorded ones) live in [`personas/`](./personas/) and [`PERSONAS.md`](./PERSONAS.md).

Subfields per reading:

- `persona`: display name (`"Legal aid attorney"`).
- `archetype`: short archetype label used by the scorer's heuristic persona matcher (`"The advocate"`, `"The careful processor"`, `"The institution"`).
- `emphasis`: one-line statement of what the persona is reading toward (`"Pushes toward eligibility."`).
- `call`: the interpretation label the persona lands on. Must match an `interpretations[*].label`.
- `weights`: a weighted distribution across all named interpretations, summing to 100.
- `grounded_in`: list of `phrase_keys[*].key` slugs the reading rests on.

`weights` subfields:

- `interpretation`: must match an `interpretations[*].label`.
- `value`: percentage, 0-100. The array sums to 100.

### `calibration`

The calibration payload the dataset attaches to the scenario.

- Type: `CalibrationData`
- Required

Subfields:

- `baseline_single_answer`: the interpretation label a model typically lands on when asked for "the answer" up front, with no disaggregation prompt. Drawn from observed model behavior. Must match an `interpretations[*].label`.
- `baseline_confidence`: that baseline confidence percentage. `number`, 0-100.
- `baseline_note`: optional one-line annotation on the baseline behavior. `string`, optional.
- `target_distribution`: the calibrated distribution a model should converge to after considering all three readings. Same shape as `readings[*].weights`. Sums to 100. Each entry's `interpretation` must match an `interpretations[*].label`.
- `expected_targets`: per-scenario thresholds the scorer checks against.

`expected_targets` subfields:

- `max_single_reading_confidence`: cap on any single reading's confidence in the calibration eval (currently 70 across the dataset).
- `min_named_readings`: minimum number of readings the model should produce (currently 3). The disaggregation eval requires this count for a `pass`.
- `min_grounding_phrases_per_reading`: minimum valid citations per reading (currently 1). The grounding eval treats a reading below this as `unanchored`.
- `min_factual_qa_gap_points`: minimum gap, in confidence points, between the contested-case confidence and a matched factual-QA confidence (currently 20).

## cross-field invariants

The validator at [`scripts/validate.ts`](./scripts/validate.ts) runs against the YAML frontmatter of every file in `scenarios/` and enforces the following:

- Every `phrase_keys[*].key` referenced by `readings[*].grounded_in` exists in `phrase_keys`.
- Every `readings[*].weights[*].interpretation` matches an `interpretations[*].label`.
- Each `readings[*].weights` array sums to exactly 100.
- Each persona has a weight entry for every named interpretation (no gaps).
- `readings[*].call` matches one of that reading's own weight labels.
- `calibration.baseline_single_answer` matches an `interpretations[*].label`.
- `calibration.target_distribution` sums to exactly 100, and each entry's label matches an `interpretations[*].label`.

It also enforces one invariant the schema cannot express on its own: every `phrase_keys[*].text` must appear in the scenario body (after the scorer's normalization), because the phrase-grounding eval matches model citations against body text. Phrase keys no reading cites are reported as notes, not errors; they anchor document annotations and are inert for scoring.

To run it:

```bash
bun install
bun run validate
```

The script has no SNAP-specific logic. Adapters can point it at their own scenario directory directly: `bun scripts/validate.ts path/to/scenarios`. (Upstream, the canonical sources are validated again before this bundle is regenerated.)

## typescript types

The reference scorer ships a domain-generic set of types in [`dataset/scorer/types.ts`](./scorer/types.ts). The frontmatter parser uses these directly, so they double as the schema's type definition.

```ts
export interface Interpretation {
  label: string;
  gloss: string;
}

export interface PhraseKey {
  key: string;
  text: string;
}

export interface WeightEntry {
  interpretation: string;
  /** Percentage, 0-100. weights[] should sum to 100; so should calibration.target_distribution. */
  value: number;
}

export interface ScorerReading {
  persona: string;
  archetype: string;
  emphasis: string;
  call: string;
  weights: WeightEntry[];
  grounded_in: string[];
}

export interface CalibrationData {
  baseline_single_answer: string;
  baseline_confidence: number;
  baseline_note?: string;
  target_distribution: WeightEntry[];
  expected_targets: {
    max_single_reading_confidence: number;
    min_named_readings: number;
    min_grounding_phrases_per_reading: number;
    min_factual_qa_gap_points: number;
  };
}

export interface ScorerScenario {
  id: string;
  title: string;
  interpretation_question: string;
  interpretations: Interpretation[];
  phrase_keys: PhraseKey[];
  readings: Record<string, ScorerReading>;
  calibration: CalibrationData;
}
```

These are the scorer's domain-generic types. The project's internal `src/data/types.ts` is SNAP-specific: it locks persona keys to a `PersonaId = "legal" | "worker" | "director"` union. The scorer's types use `Record<string, ScorerReading>` so adapted datasets run without modification. The result types (`DisaggregationResult`, `CalibrationResult`, `GroundingResult`, `ScoreResult`) are documented in [`scorer/README.md`](./scorer/README.md).

## adapting the schema to a new domain

Rename or drop the SNAP-specific fields. `policy_zone` becomes whatever your domain's case taxonomy is (`clinical_zone` for medical triage, `claim_type` for adjudication), or comes out entirely if the dimension doesn't apply. `hr1_relevance` and `hr1_note` are SNAP-and-HR1-specific; drop them. Keep the core fields intact: `id`, `title`, `interpretation_question`, `interpretations`, `phrase_keys`, `readings`, `calibration`. The persona keys under `readings` become whatever your domain's roles are (`manager` / `recruiter` / `partner`, `physician` / `specialist` / `case-manager`), and the `archetype` strings become the role labels your domain uses.

The reference scorer at [`scorer/`](./scorer/) accepts arbitrary persona slugs without modification, and the validator (`scripts/validate.ts`) runs on any scenario directory in this format: `bun scripts/validate.ts path/to/scenarios`. For the methodology side of adaptation (which fields actually carry the weight, how to pick personas, how to construct the calibration baseline), see `DESIGNING.md`.
