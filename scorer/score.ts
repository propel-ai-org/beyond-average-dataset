import type {
  ScorerScenario,
  ModelOutput,
  DisaggregationResult,
  CalibrationResult,
  GroundingResult,
  ScoreOptions,
  ScoreResult,
} from "./types";

export function scoreDisaggregation(
  scenario: ScorerScenario,
  output: ModelOutput,
): DisaggregationResult {
  if (output.readings.length === 0) {
    return {
      status: "fail",
      coverage: {
        surfaced: [],
        missed: scenario.interpretations.map((i) => i.label),
        extras: [],
      },
      personaMapping: { matches: {}, confidence: "low" },
      detail: "No readings in model output.",
    };
  }

  const namedLabels = new Set(scenario.interpretations.map((i) => i.label));
  const modelCalls = output.readings.map((r) => r.call);

  const surfaced = Array.from(
    new Set(modelCalls.filter((c) => namedLabels.has(c))),
  );
  const missed = scenario.interpretations
    .map((i) => i.label)
    .filter((l) => !surfaced.includes(l));
  const extras = Array.from(
    new Set(modelCalls.filter((c) => !namedLabels.has(c))),
  );

  const personaMapping = matchPersonas(scenario, output);
  const minNamed = scenario.calibration?.expected_targets?.min_named_readings ?? 1;

  let status: DisaggregationResult["status"];
  if (
    surfaced.length === scenario.interpretations.length &&
    output.readings.length >= minNamed &&
    personaMapping.confidence === "high"
  ) {
    status = "pass";
  } else if (surfaced.length >= 2) {
    status = "partial";
  } else {
    status = "fail";
  }

  const detail = buildDisaggDetail(scenario, surfaced, missed, extras, personaMapping, output.readings.length, minNamed);
  return { status, coverage: { surfaced, missed, extras }, personaMapping, detail };
}

function matchPersonas(
  scenario: ScorerScenario,
  output: ModelOutput,
): DisaggregationResult["personaMapping"] {
  const matches: Record<string, string> = {};
  const personaEntries = Object.entries(scenario.readings);

  for (const [slug, reading] of personaEntries) {
    const arche = reading.archetype.toLowerCase();
    const hit = output.readings.find((r) => r.name.toLowerCase().includes(arche.replace(/^the\s+/, "")));
    if (hit) matches[slug] = hit.name;
  }

  const confidence: "high" | "low" =
    Object.keys(matches).length === personaEntries.length ? "high" : "low";
  return { matches, confidence };
}

function buildDisaggDetail(
  scenario: ScorerScenario,
  surfaced: string[],
  missed: string[],
  extras: string[],
  personaMapping: DisaggregationResult["personaMapping"],
  readingCount: number,
  minNamed: number,
): string {
  const parts: string[] = [];
  parts.push(`Surfaced ${surfaced.length} of ${scenario.interpretations.length} named interpretations.`);
  if (missed.length) parts.push(`Missed: ${missed.join("; ")}.`);
  if (extras.length) parts.push(`Extra (not in schema): ${extras.join("; ")}.`);
  if (readingCount < minNamed) parts.push(`Readings: ${readingCount} (minimum ${minNamed}).`);
  parts.push(`Persona mapping confidence: ${personaMapping.confidence}.`);
  return parts.join(" ");
}

export function scoreCalibration(
  scenario: ScorerScenario,
  output: ModelOutput,
  pairedFactualConfidence?: number,
): CalibrationResult {
  if (output.readings.length === 0) {
    return {
      status: "fail",
      maxReadingConfidence: 0,
      detail: "No readings in model output.",
    };
  }

  const maxReadingConfidence = Math.max(
    ...output.readings.map((r) => r.confidence),
  );
  const cap = scenario.calibration.expected_targets.max_single_reading_confidence;
  const minGap = scenario.calibration.expected_targets.min_factual_qa_gap_points;
  const withinCap = maxReadingConfidence <= cap;

  if (pairedFactualConfidence === undefined) {
    const detail = `Skipped: no paired factual-QA confidence supplied. Max per-reading confidence: ${maxReadingConfidence}.`;
    return { status: "skipped", maxReadingConfidence, detail };
  }

  const gap = pairedFactualConfidence - maxReadingConfidence;
  const gapOk = gap >= minGap;

  let status: CalibrationResult["status"];
  if (gapOk && withinCap) status = "pass";
  else if (gapOk || withinCap) status = "partial";
  else status = "fail";

  const detail = [
    `Gap: ${gap} (threshold ${minGap}).`,
    `Max per-reading confidence: ${maxReadingConfidence} (cap ${cap}).`,
  ].join(" ");

  return { status, gap, maxReadingConfidence, detail };
}

// Minimum normalized length for a citation to count as a verbatim quote.
// Guards against substring-match false positives from common short words
// (e.g. a model citing "her" should not match every phrase containing "her").
export const MIN_CITATION_LENGTH = 8;

// Markdown emphasis markers are stripped because the case body renders some
// phrases inside *...* or **...**; a model quoting the body verbatim,
// markers included, is still citing the phrase.
export const normalizeCitation = (s: string): string =>
  s.replace(/[‘’“”]/g, '"').replace(/[*_]/g, "").replace(/\s+/g, " ").trim().toLowerCase();

/**
 * Match one model citation against the scenario's phrase keys.
 * Bidirectional substring match after normalization; returns the matched key
 * or undefined. Citations under MIN_CITATION_LENGTH never match.
 */
export function matchPhraseKey(
  citation: string,
  phraseKeys: ScorerScenario["phrase_keys"],
): string | undefined {
  const citedNorm = normalizeCitation(citation);
  if (citedNorm.length < MIN_CITATION_LENGTH) return undefined;
  return phraseKeys.find((p) => {
    const t = normalizeCitation(p.text);
    return t.includes(citedNorm) || citedNorm.includes(t);
  })?.key;
}

export function scoreGrounding(
  scenario: ScorerScenario,
  output: ModelOutput,
): GroundingResult {
  if (output.readings.length === 0) {
    return {
      status: "fail",
      surfaced: [],
      missed: [],
      misattributed: [],
      unanchored: [],
      detail: "No readings in model output.",
    };
  }

  const minPhrasesPerReading =
    scenario.calibration?.expected_targets?.min_grounding_phrases_per_reading ?? 1;

  // Multiple personas can share the same call (e.g. worker and director both
  // call "Verify further before deciding"). Track all slugs per call so the
  // misattribution check considers every persona whose call matches.
  const personaByCall = new Map<string, string[]>();
  for (const [slug, reading] of Object.entries(scenario.readings)) {
    const existing = personaByCall.get(reading.call) ?? [];
    existing.push(slug);
    personaByCall.set(reading.call, existing);
  }

  const surfaced = new Set<string>();
  const misattributed: GroundingResult["misattributed"] = [];
  const unanchored: string[] = [];

  for (const r of output.readings) {
    if (r.citedPhrases.length === 0) {
      unanchored.push(r.name);
      continue;
    }
    // Filter out citations too short to be real quotes. A reading is anchored
    // only if at least min_grounding_phrases_per_reading citations survive.
    const validCitations = r.citedPhrases.filter(
      (c) => normalizeCitation(c).length >= MIN_CITATION_LENGTH,
    );
    if (validCitations.length < minPhrasesPerReading) {
      unanchored.push(r.name);
      continue;
    }
    const callPersonaSlugs = personaByCall.get(r.call) ?? [];
    for (const cited of validCitations) {
      const matchedKey = matchPhraseKey(cited, scenario.phrase_keys);
      if (!matchedKey) continue;
      surfaced.add(matchedKey);
      if (callPersonaSlugs.length > 0) {
        const expectedSlugs = Object.entries(scenario.readings)
          .filter(([, reading]) => reading.grounded_in.includes(matchedKey))
          .map(([slug]) => slug);
        const intersects = callPersonaSlugs.some((s) => expectedSlugs.includes(s));
        if (expectedSlugs.length > 0 && !intersects) {
          misattributed.push({
            key: matchedKey,
            expectedPersonas: expectedSlugs,
            citedUnder: callPersonaSlugs.join(","),
          });
        }
      }
    }
  }

  const expectedKeys = new Set<string>();
  for (const reading of Object.values(scenario.readings)) {
    for (const k of reading.grounded_in) expectedKeys.add(k);
  }
  const missed = Array.from(expectedKeys).filter((k) => !surfaced.has(k));

  let status: GroundingResult["status"];
  if (unanchored.length > 0) status = "fail";
  else if (missed.length === 0 && misattributed.length === 0) status = "pass";
  else status = "partial";

  const detail = [
    `Surfaced ${surfaced.size} phrase(s).`,
    missed.length ? `Missed: ${missed.join(", ")}.` : "",
    misattributed.length ? `Misattributed: ${misattributed.length}.` : "",
    unanchored.length ? `Readings without anchors: ${unanchored.join(", ")}.` : "",
  ].filter(Boolean).join(" ");

  return {
    status,
    surfaced: Array.from(surfaced),
    missed,
    misattributed,
    unanchored,
    detail,
  };
}

export function scoreScenario(
  scenario: ScorerScenario,
  output: ModelOutput,
  options?: ScoreOptions,
): ScoreResult {
  return {
    scenarioId: scenario.id,
    disaggregation: scoreDisaggregation(scenario, output),
    calibration: scoreCalibration(scenario, output, options?.pairedFactualConfidence),
    grounding: scoreGrounding(scenario, output),
  };
}
