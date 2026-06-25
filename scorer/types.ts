// dataset/scorer/types.ts
// Type definitions for the Three Readings reference scorer.
//
// These types are deliberately decoupled from src/data/types.ts so the scorer
// works on adapted datasets with arbitrary persona slugs (manager / recruiter /
// partner, physician / specialist / case-manager, etc.), not only the SNAP
// dataset's legal / worker / director.
//
// Field naming convention: types that mirror YAML frontmatter keep snake_case
// (interpretation_question, phrase_keys, grounded_in, baseline_single_answer,
// target_distribution, expected_targets). Scorer-internal output types use
// camelCase (citedPhrases, maxReadingConfidence, scenarioId). The boundary is
// intentional: gray-matter returns the YAML keys verbatim, so the scenario
// types stay readable next to the source data.

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
  /** Percentage, 0-100. A persona's weights[] should sum to 100; so should calibration.target_distribution. */
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

/**
 * The shape the scorer parses out of dataset/scenarios/*.md frontmatter.
 * Persona keys are strings, not a fixed union: an adapted hiring dataset can
 * use {manager, recruiter, partner} and this type still describes it.
 */
export interface ScorerScenario {
  id: string;
  title: string;
  interpretation_question: string;
  interpretations: Interpretation[];
  phrase_keys: PhraseKey[];
  readings: Record<string, ScorerReading>;
  calibration: CalibrationData;
}

/**
 * What the scorer expects a model to produce. Reader is responsible for
 * prompting their model into this shape (see EVALUATING.md).
 */
export interface ModelOutput {
  readings: Array<{
    name: string;
    call: string;
    confidence: number;
    citedPhrases: string[];
    reasoning?: string;
  }>;
}

export interface ScoreOptions {
  /** Confidence the same model reports on a matched factual-QA item. Required for the calibration eval. */
  pairedFactualConfidence?: number;
}

export type EvalStatus = "pass" | "partial" | "fail";

export interface DisaggregationResult {
  status: EvalStatus;
  coverage: { surfaced: string[]; missed: string[]; extras: string[] };
  personaMapping: {
    /** Maps dataset persona slug (e.g. "legal") to the model reading.name that matched it. */
    matches: Record<string, string>;
    /** Scorer's certainty in its own mapping, not the model's confidence. "low" when one or more personas could not be matched to any model reading. */
    confidence: "high" | "low";
  };
  detail: string;
}

export interface CalibrationResult {
  status: EvalStatus | "skipped";
  gap?: number;
  maxReadingConfidence: number;
  detail: string;
}

export interface GroundingResult {
  status: EvalStatus;
  surfaced: string[];
  missed: string[];
  misattributed: Array<{ key: string; expectedPersonas: string[]; citedUnder: string }>;
  unanchored: string[];
  detail: string;
}

export interface ScoreResult {
  scenarioId: string;
  disaggregation: DisaggregationResult;
  calibration: CalibrationResult;
  grounding: GroundingResult;
}

// ---------------------------------------------------------------------------
// Persona evals (persona.ts). The model-under-test evals above score a model
// reading the case cold; the persona evals score the persona specs themselves,
// with the model as substrate. See PERSONAS.md for the methodology.
// ---------------------------------------------------------------------------

/**
 * One persona-conditioned output: a model was given a persona spec plus the
 * case body and produced that persona's reading.
 */
export interface PersonaOutput {
  call: string;
  /** Distribution over the named interpretations. Should sum to 100; the scorer renormalizes small drift. */
  weights: WeightEntry[];
  citedPhrases: string[];
  reasoning?: string;
}

export interface FidelityResult {
  status: EvalStatus;
  /** Did the generated call equal the dataset's recorded call for this persona? */
  callMatch: boolean;
  /** Total variation distance between generated and recorded weights, in percentage points (0-100). */
  weightDistance: number;
  /** Fraction of the persona's grounded_in keys the output cited (0-1). */
  groundingRecall: number;
  /** Phrase keys the output cited that the dataset does not list under this persona. Recorded, not penalized. */
  groundingExtras: string[];
  detail: string;
}

export interface SeparationResult {
  status: EvalStatus;
  /** Pairwise total variation distance between generated personas, keyed "a|b", in points. */
  pairwiseDistance: Record<string, number>;
  meanPairwiseDistance: number;
  /** Same measure over the dataset's recorded readings: the spread the personas are expected to preserve. */
  expectedMeanPairwiseDistance: number;
  /** Generated spread as a fraction of recorded spread. */
  separationRatio: number;
  distinctCalls: number;
  expectedDistinctCalls: number;
  /** Pairwise Jaccard overlap of cited phrase keys, keyed "a|b" (1 = identical citations). */
  groundingOverlap: Record<string, number>;
  detail: string;
}

export interface StabilityResult {
  status: EvalStatus;
  runs: number;
  /** Fraction of runs landing on the most common call. */
  modalCallRate: number;
  modalCall: string;
  /** Mean pairwise total variation distance between runs, in points. */
  meanRunDistance: number;
  detail: string;
}
