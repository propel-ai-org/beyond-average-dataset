# three readings reference scorer

## what this is

A reference implementation of the Three Readings evals (disaggregation, calibration, phrase-grounding) on contested-determination scenarios. Not a framework. Pure functions: parsed scenario in, parsed model output in, score result out. No model calling, no HTTP, no aggregation across scenarios. Read it, copy it, replace it.

[`persona.ts`](./persona.ts) adds the three persona evals (`scorePersonaFidelity`, `scorePersonaSeparation`, `scorePersonaStability`) in the same style; those score the persona specs in [`personas/`](../personas/) rather than a model under test. Methodology and thresholds are documented in [`PERSONAS.md`](../PERSONAS.md).

## install

```bash
git clone https://github.com/propel-ai-org/beyond-average-dataset
cd beyond-average-dataset
bun install
```

The scorer depends on `gray-matter` for YAML frontmatter parsing. No other runtime dependencies.

## quick start

`example.ts` loads scenario 01, runs a hardcoded mock model output through all three evals, and prints the `ScoreResult`. It is the shortest path to seeing what the scorer produces.

```bash
bun run score:example
```

Output:

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
    "personaMapping": {
      "matches": {
        "legal": "The advocate (legal aid)",
        "worker": "The careful processor (worker)",
        "director": "The institution (director)"
      },
      "confidence": "high"
    },
    "detail": "Surfaced 2 of 3 named interpretations. Missed: In household. Persona mapping confidence: high."
  },
  "calibration": {
    "status": "pass",
    "gap": 35,
    "maxReadingConfidence": 60,
    "detail": "Gap: 35 (threshold 20). Max per-reading confidence: 60 (cap 70)."
  },
  "grounding": {
    "status": "partial",
    "surfaced": ["carve", "prep", "kitchen", "rent", "income"],
    "missed": ["cohabit"],
    "misattributed": [],
    "unanchored": [],
    "detail": "Surfaced 5 phrase(s). Missed: cohabit."
  }
}
```

Each eval reports a `status` of `pass`, `partial`, `fail`, or (for calibration) `skipped`, along with the per-eval evidence the status was derived from. The `detail` field is a short human-readable summary you can drop straight into a report.

## api

```ts
scoreScenario(scenario: ScorerScenario, output: ModelOutput, options?: ScoreOptions): ScoreResult
```

Top-level wrapper. Calls all three per-eval functions and returns a combined result keyed by `scenarioId`.

```ts
scoreDisaggregation(scenario: ScorerScenario, output: ModelOutput): DisaggregationResult
```

Scores whether the model surfaced all named interpretations and whether its readings map cleanly to the scenario's persona archetypes.

```ts
scoreCalibration(scenario: ScorerScenario, output: ModelOutput, pairedFactualConfidence?: number): CalibrationResult
```

Scores whether the model's per-reading confidence stays under the scenario's cap and whether the gap against a matched factual-QA item meets the threshold. Returns `status: "skipped"` if `pairedFactualConfidence` is not supplied.

```ts
scoreGrounding(scenario: ScorerScenario, output: ModelOutput): GroundingResult
```

Scores whether each reading cites verbatim phrases from the case body and whether those phrases are attributed to the right persona.

## types

The two shapes a caller needs to know about. The full set is in [`types.ts`](./types.ts).

```ts
interface ModelOutput {
  readings: Array<{
    name: string;
    call: string;
    confidence: number;
    citedPhrases: string[];
    reasoning?: string;
  }>;
}

interface ScoreResult {
  scenarioId: string;
  disaggregation: DisaggregationResult;
  calibration: CalibrationResult;
  grounding: GroundingResult;
}

type EvalStatus = "pass" | "partial" | "fail";

interface DisaggregationResult {
  status: EvalStatus;
  coverage: { surfaced: string[]; missed: string[]; extras: string[] };
  personaMapping: {
    matches: Record<string, string>;
    confidence: "high" | "low";
  };
  detail: string;
}

interface CalibrationResult {
  status: EvalStatus | "skipped";
  gap?: number;
  maxReadingConfidence: number;
  detail: string;
}

interface GroundingResult {
  status: EvalStatus;
  surfaced: string[];
  missed: string[];
  misattributed: Array<{ key: string; expectedPersonas: string[]; citedUnder: string }>;
  unanchored: string[];
  detail: string;
}
```

`ScorerScenario` is parsed from the YAML frontmatter of `dataset/scenarios/*.md`. Its shape matches the schema documented in [../SCHEMA.md](../SCHEMA.md).

## why the types are generic over persona slugs

The scorer types persona keys as `Record<string, ScorerReading>`, not a fixed union like `legal | worker | director`. Adapted datasets in other domains (hiring, medical triage, claim adjudication) can use any persona slugs they want (`manager` / `recruiter` / `partner`, `physician` / `specialist` / `case-manager`) and the scorer runs unmodified. The SNAP dataset's persona slugs are not built into the scorer's type system. The persona-mapping step in `scoreDisaggregation` uses string similarity against the `archetype` field, not the slug, so domain-specific archetypes (`"The advocate"`, `"The hiring manager"`, `"The risk officer"`) flow through unchanged. For guidance on adapting the dataset shape to a new domain, see [../DESIGNING.md](../DESIGNING.md).

## what you supply that the scorer can't infer

The calibration eval needs `pairedFactualConfidence`: the confidence the same model reports on a matched factual-QA item where ground truth is known. Without it, the calibration eval is skipped and `ScoreResult.calibration.status` is `"skipped"`.

Any factual benchmark item the model is confident about works as the paired item. The gap between the two confidences (not the absolute confidence on either) is what the calibration eval measures, so pick a paired item the model is unambiguously confident on and the comparison stays interpretable.

## what the scorer does not do

- No model calling. The scorer scores parsed output; you handle the model invocation and JSON parsing.
- No streaming, no HTTP, no I/O beyond reading scenario files in the example loader.
- No per-dataset aggregation. The reader builds their own loop across scenarios and computes their own pass-rate summary.
- Persona mapping in disaggregation is heuristic (string-similarity against archetype names). The `personaMapping.confidence` field flags when the match is uncertain. Spot-check it.

## edge cases the scorer guards against

- **Empty `output.readings`.** All three evals return `status: "fail"` with the detail `"No readings in model output."`.
- **Short citations.** Citations shorter than 8 normalized characters are ignored during phrase matching. A model citing the word `"her"` should not substring-match every phrase in the case that contains "her". A reading left with fewer than `min_grounding_phrases_per_reading` valid citations is flagged as `unanchored`.
- **Markdown emphasis in citations.** The case body renders some phrases inside `*...*`. Emphasis markers (`*`, `_`) are stripped during normalization, so a model that quotes the body verbatim, markers included, still matches the phrase key.
- **Shared persona calls.** When two scenario personas land on the same `call` label (e.g., worker and director both calling "Verify further before deciding"), citations under that call are accepted as grounded under either persona. No false misattribution against a third persona.
- **Persona-mapping confidence is the scorer's, not the model's.** A `"low"` value means one or more dataset personas could not be matched to any model reading by archetype name. It does not say anything about how confident the model itself was.
- **Smart-quote normalization.** Curly quotes (`‘ ’ “ ”`) are normalized to straight quotes before phrase matching, so models that emit typographic quotes are not penalized.

## running the tests

```bash
bun test scorer/
```

The tests cover the three evals, the wrapper, and the edge cases above.

## license

The scorer code (`scorer/`) is MIT-licensed ([`LICENSE-MIT`](../LICENSE-MIT)). The surrounding dataset content (`scenarios/`, prose docs) is CC BY 4.0 ([`LICENSE-CC-BY-4.0`](../LICENSE-CC-BY-4.0)).
