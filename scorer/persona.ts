// dataset/scorer/persona.ts
// Persona evals: fidelity, separation, stability.
//
// The evals in score.ts score a model under test: the model reads the case
// cold and the dataset's frontmatter is the rubric. The evals here invert
// that: the persona spec is the system under test, and the model is the
// substrate it runs on. A persona-conditioned output (PersonaOutput) is what
// a model produced when given a persona spec from personas/ plus the case
// body, with the dataset's recorded reading hidden.
//
// Same conventions as score.ts: pure functions, no model calling, no
// aggregation across scenarios. Thresholds are v1 editorial choices,
// documented with rationale in PERSONAS.md; adjust them there first, code
// second.

import type {
  ScorerScenario,
  WeightEntry,
  PersonaOutput,
  FidelityResult,
  SeparationResult,
  StabilityResult,
} from "./types";
import { matchPhraseKey } from "./score";

// Fidelity thresholds (percentage points of total variation distance).
// 15 points is roughly the gap between (80/6/14) and (70/12/18): the same
// reading with softer edges. 30 points is a recognizably different posture.
const FIDELITY_PASS_DISTANCE = 15;
const FIDELITY_PARTIAL_DISTANCE = 30;
const FIDELITY_PASS_RECALL = 0.5;

// Separation thresholds, relative to the spread the dataset itself records.
const SEPARATION_PASS_RATIO = 0.75;
const SEPARATION_PARTIAL_RATIO = 0.5;

// Stability thresholds across repeat runs of one persona on one scenario.
const STABILITY_PASS_MODAL = 2 / 3;
const STABILITY_PASS_DISTANCE = 12;
const STABILITY_PARTIAL_MODAL = 0.5;
const STABILITY_PARTIAL_DISTANCE = 25;

/**
 * Total variation distance between two weight distributions, in percentage
 * points (0-100). Computed over the union of labels; each side is
 * renormalized to sum 100 first, so small prompt-side drift (weights summing
 * to 99 or 101) does not register as distance.
 */
export function weightDistance(a: WeightEntry[], b: WeightEntry[]): number {
  const toMap = (entries: WeightEntry[]): Map<string, number> => {
    const total = entries.reduce((sum, e) => sum + e.value, 0);
    const map = new Map<string, number>();
    for (const e of entries) {
      map.set(e.interpretation, total > 0 ? (e.value / total) * 100 : 0);
    }
    return map;
  };
  const ma = toMap(a);
  const mb = toMap(b);
  const labels = new Set([...ma.keys(), ...mb.keys()]);
  let sum = 0;
  for (const label of labels) {
    sum += Math.abs((ma.get(label) ?? 0) - (mb.get(label) ?? 0));
  }
  return sum / 2;
}

function citedKeys(scenario: ScorerScenario, output: PersonaOutput): Set<string> {
  const keys = new Set<string>();
  for (const cited of output.citedPhrases) {
    const key = matchPhraseKey(cited, scenario.phrase_keys);
    if (key) keys.add(key);
  }
  return keys;
}

/**
 * Fidelity: does the persona spec, run against the case body, reproduce the
 * reading the dataset records for that persona?
 */
export function scorePersonaFidelity(
  scenario: ScorerScenario,
  slug: string,
  output: PersonaOutput,
): FidelityResult {
  const recorded = scenario.readings[slug];
  if (!recorded) {
    throw new Error(`Scenario ${scenario.id} has no persona "${slug}"`);
  }

  const callMatch = output.call === recorded.call;
  const distance = weightDistance(output.weights, recorded.weights);

  const cited = citedKeys(scenario, output);
  const expected = recorded.grounded_in;
  const hit = expected.filter((k) => cited.has(k));
  const groundingRecall = expected.length > 0 ? hit.length / expected.length : 1;
  const groundingExtras = [...cited].filter((k) => !expected.includes(k));

  let status: FidelityResult["status"];
  if (callMatch && distance <= FIDELITY_PASS_DISTANCE && groundingRecall >= FIDELITY_PASS_RECALL) {
    status = "pass";
  } else if (callMatch && distance <= FIDELITY_PARTIAL_DISTANCE) {
    status = "partial";
  } else {
    status = "fail";
  }

  const detail = [
    callMatch
      ? `Call matches ("${output.call}").`
      : `Call diverges: generated "${output.call}", recorded "${recorded.call}".`,
    `Weight distance: ${distance.toFixed(1)} points (pass <= ${FIDELITY_PASS_DISTANCE}).`,
    `Grounding recall: ${hit.length}/${expected.length} expected phrase(s) cited.`,
    groundingExtras.length ? `Also cited: ${groundingExtras.join(", ")}.` : "",
  ].filter(Boolean).join(" ");

  return { status, callMatch, weightDistance: distance, groundingRecall, groundingExtras, detail };
}

function pairKey(a: string, b: string): string {
  return [a, b].sort().join("|");
}

function meanPairwise(slugs: string[], weightsBySlug: Map<string, WeightEntry[]>): {
  pairwise: Record<string, number>;
  mean: number;
} {
  const pairwise: Record<string, number> = {};
  let sum = 0;
  let count = 0;
  for (let i = 0; i < slugs.length; i++) {
    for (let j = i + 1; j < slugs.length; j++) {
      const d = weightDistance(weightsBySlug.get(slugs[i])!, weightsBySlug.get(slugs[j])!);
      pairwise[pairKey(slugs[i], slugs[j])] = d;
      sum += d;
      count++;
    }
  }
  return { pairwise, mean: count > 0 ? sum / count : 0 };
}

/**
 * Separation: are the generated personas behaviorally distinct, to at least
 * the degree the dataset's recorded readings are? Collapse (three personas,
 * one reading) fails; spread beyond the recorded readings is reported in the
 * detail but not penalized.
 */
export function scorePersonaSeparation(
  scenario: ScorerScenario,
  outputs: Record<string, PersonaOutput>,
): SeparationResult {
  const slugs = Object.keys(outputs);
  if (slugs.length < 2) {
    throw new Error("Separation needs outputs for at least two personas.");
  }

  const generated = new Map(slugs.map((s) => [s, outputs[s].weights]));
  const { pairwise, mean } = meanPairwise(slugs, generated);

  const recordedSlugs = slugs.filter((s) => scenario.readings[s]);
  const recorded = new Map(recordedSlugs.map((s) => [s, scenario.readings[s].weights]));
  const { mean: expectedMean } = meanPairwise(recordedSlugs, recorded);

  const distinctCalls = new Set(slugs.map((s) => outputs[s].call)).size;
  const expectedDistinctCalls = new Set(recordedSlugs.map((s) => scenario.readings[s].call)).size;

  const groundingOverlap: Record<string, number> = {};
  for (let i = 0; i < slugs.length; i++) {
    for (let j = i + 1; j < slugs.length; j++) {
      const a = citedKeys(scenario, outputs[slugs[i]]);
      const b = citedKeys(scenario, outputs[slugs[j]]);
      const union = new Set([...a, ...b]);
      const inter = [...a].filter((k) => b.has(k));
      groundingOverlap[pairKey(slugs[i], slugs[j])] =
        union.size > 0 ? inter.length / union.size : 0;
    }
  }

  // A dataset whose recorded readings are not separated cannot anchor this
  // eval; report pass-by-default and say so, rather than dividing by ~zero.
  if (expectedMean < 1) {
    return {
      status: "pass",
      pairwiseDistance: pairwise,
      meanPairwiseDistance: mean,
      expectedMeanPairwiseDistance: expectedMean,
      separationRatio: 1,
      distinctCalls,
      expectedDistinctCalls,
      groundingOverlap,
      detail:
        "Dataset's recorded readings are not separated on this scenario; separation eval is uninformative here.",
    };
  }

  const ratio = mean / expectedMean;

  let status: SeparationResult["status"];
  if (ratio >= SEPARATION_PASS_RATIO && distinctCalls >= expectedDistinctCalls) {
    status = "pass";
  } else if (ratio >= SEPARATION_PARTIAL_RATIO) {
    status = "partial";
  } else {
    status = "fail";
  }

  const detail = [
    `Mean pairwise distance: ${mean.toFixed(1)} points (recorded readings: ${expectedMean.toFixed(1)}; ratio ${ratio.toFixed(2)}).`,
    `Distinct calls: ${distinctCalls} (recorded: ${expectedDistinctCalls}).`,
    ratio > 1.5 ? "Generated spread exceeds the recorded spread; worth inspecting for caricature." : "",
  ].filter(Boolean).join(" ");

  return {
    status,
    pairwiseDistance: pairwise,
    meanPairwiseDistance: mean,
    expectedMeanPairwiseDistance: expectedMean,
    separationRatio: ratio,
    distinctCalls,
    expectedDistinctCalls,
    groundingOverlap,
    detail,
  };
}

/**
 * Stability: across repeat runs of one persona on one scenario, does the
 * persona behave like one instrument? Modal-call consistency plus run-to-run
 * weight distance.
 */
export function scorePersonaStability(runs: PersonaOutput[]): StabilityResult {
  if (runs.length < 2) {
    throw new Error("Stability needs at least two runs.");
  }

  const counts = new Map<string, number>();
  for (const run of runs) {
    counts.set(run.call, (counts.get(run.call) ?? 0) + 1);
  }
  const [modalCall, modalCount] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  const modalCallRate = modalCount / runs.length;

  let sum = 0;
  let count = 0;
  for (let i = 0; i < runs.length; i++) {
    for (let j = i + 1; j < runs.length; j++) {
      sum += weightDistance(runs[i].weights, runs[j].weights);
      count++;
    }
  }
  const meanRunDistance = count > 0 ? sum / count : 0;

  let status: StabilityResult["status"];
  if (modalCallRate >= STABILITY_PASS_MODAL && meanRunDistance <= STABILITY_PASS_DISTANCE) {
    status = "pass";
  } else if (modalCallRate >= STABILITY_PARTIAL_MODAL && meanRunDistance <= STABILITY_PARTIAL_DISTANCE) {
    status = "partial";
  } else {
    status = "fail";
  }

  const detail = [
    `${runs.length} runs; modal call "${modalCall}" in ${(modalCallRate * 100).toFixed(0)}% of them.`,
    `Mean run-to-run weight distance: ${meanRunDistance.toFixed(1)} points.`,
  ].join(" ");

  return { status, runs: runs.length, modalCallRate, modalCall, meanRunDistance, detail };
}
