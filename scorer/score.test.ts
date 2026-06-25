import { describe, it, expect } from "bun:test";
import { scoreDisaggregation, scoreCalibration, scoreGrounding, scoreScenario } from "./score";
import type { ScorerScenario, ModelOutput } from "./types";

const fixture: ScorerScenario = {
  id: "test-01",
  title: "Test scenario",
  interpretation_question: "Q?",
  interpretations: [
    { label: "Not in household", gloss: "a" },
    { label: "In household", gloss: "b" },
    { label: "Verify further before deciding", gloss: "c" },
  ],
  phrase_keys: [
    { key: "cohabit", text: "She shares a two-bedroom apartment." },
    { key: "prep", text: "don't really eat together" },
    { key: "rent", text: "Jordan has covered her half" },
  ],
  readings: {
    legal: {
      persona: "Legal aid attorney", archetype: "The advocate", emphasis: "",
      call: "Not in household",
      weights: [
        { interpretation: "Not in household", value: 80 },
        { interpretation: "In household", value: 6 },
        { interpretation: "Verify further before deciding", value: 14 },
      ],
      grounded_in: ["cohabit", "prep"],
    },
    worker: {
      persona: "Eligibility worker", archetype: "The careful processor", emphasis: "",
      call: "Verify further before deciding",
      weights: [
        { interpretation: "Not in household", value: 22 },
        { interpretation: "In household", value: 28 },
        { interpretation: "Verify further before deciding", value: 50 },
      ],
      grounded_in: ["prep", "rent"],
    },
    director: {
      persona: "SNAP director", archetype: "The institution", emphasis: "",
      call: "Verify further before deciding",
      weights: [
        { interpretation: "Not in household", value: 36 },
        { interpretation: "In household", value: 18 },
        { interpretation: "Verify further before deciding", value: 46 },
      ],
      grounded_in: ["cohabit", "rent"],
    },
  },
  calibration: {
    baseline_single_answer: "Not in household",
    baseline_confidence: 95,
    target_distribution: [
      { interpretation: "Not in household", value: 40 },
      { interpretation: "In household", value: 17 },
      { interpretation: "Verify further before deciding", value: 43 },
    ],
    expected_targets: {
      max_single_reading_confidence: 70,
      min_named_readings: 3,
      min_grounding_phrases_per_reading: 1,
      min_factual_qa_gap_points: 20,
    },
  },
};

describe("scoreDisaggregation", () => {
  it("passes when all three interpretations are surfaced with persona-mapped calls", () => {
    const output: ModelOutput = {
      readings: [
        { name: "The advocate", call: "Not in household", confidence: 60, citedPhrases: [] },
        { name: "The careful processor", call: "Verify further before deciding", confidence: 50, citedPhrases: [] },
        { name: "The institution", call: "In household", confidence: 45, citedPhrases: [] },
      ],
    };
    const result = scoreDisaggregation(fixture, output);
    expect(result.status).toBe("pass");
    expect(result.coverage.surfaced.sort()).toEqual([
      "In household", "Not in household", "Verify further before deciding",
    ].sort().filter(l => result.coverage.surfaced.includes(l)));
    expect(result.coverage.missed).toEqual([]);
    expect(result.personaMapping.confidence).toBe("high");
  });

  it("returns partial when only 2 of 3 interpretations are surfaced", () => {
    const output: ModelOutput = {
      readings: [
        { name: "The advocate", call: "Not in household", confidence: 60, citedPhrases: [] },
        { name: "The careful processor", call: "Verify further before deciding", confidence: 50, citedPhrases: [] },
      ],
    };
    const result = scoreDisaggregation(fixture, output);
    expect(result.status).toBe("partial");
    expect(result.coverage.missed).toEqual(["In household"]);
  });

  it("returns fail when only 1 interpretation surfaced", () => {
    const output: ModelOutput = {
      readings: [
        { name: "The advocate", call: "Not in household", confidence: 95, citedPhrases: [] },
      ],
    };
    const result = scoreDisaggregation(fixture, output);
    expect(result.status).toBe("fail");
  });

  it("flags extras when the model invents a 4th interpretation", () => {
    const output: ModelOutput = {
      readings: [
        { name: "The advocate", call: "Not in household", confidence: 50, citedPhrases: [] },
        { name: "The careful processor", call: "Verify further before deciding", confidence: 30, citedPhrases: [] },
        { name: "The institution", call: "In household", confidence: 10, citedPhrases: [] },
        { name: "A fourth lens", call: "Refer to a supervisor", confidence: 10, citedPhrases: [] },
      ],
    };
    const result = scoreDisaggregation(fixture, output);
    expect(result.coverage.extras).toContain("Refer to a supervisor");
    expect(result.status).toBe("pass");
  });

  it("low persona mapping when readings are structurally similar", () => {
    const output: ModelOutput = {
      readings: [
        { name: "Reading 1", call: "Not in household", confidence: 40, citedPhrases: [] },
        { name: "Reading 2", call: "In household", confidence: 30, citedPhrases: [] },
        { name: "Reading 3", call: "Verify further before deciding", confidence: 30, citedPhrases: [] },
      ],
    };
    const result = scoreDisaggregation(fixture, output);
    expect(result.personaMapping.confidence).toBe("low");
  });
});

describe("scoreCalibration", () => {
  it("passes when gap >= threshold and per-reading confidence under cap", () => {
    const output: ModelOutput = {
      readings: [
        { name: "The advocate", call: "Not in household", confidence: 60, citedPhrases: [] },
        { name: "The careful processor", call: "Verify further before deciding", confidence: 50, citedPhrases: [] },
        { name: "The institution", call: "Verify further before deciding", confidence: 40, citedPhrases: [] },
      ],
    };
    const result = scoreCalibration(fixture, output, 95);
    expect(result.status).toBe("pass");
    expect(result.gap).toBe(35);
    expect(result.maxReadingConfidence).toBe(60);
  });

  it("returns partial when one reading exceeds the max cap", () => {
    const output: ModelOutput = {
      readings: [
        { name: "The advocate", call: "Not in household", confidence: 85, citedPhrases: [] },
        { name: "The careful processor", call: "Verify further before deciding", confidence: 30, citedPhrases: [] },
        { name: "The institution", call: "Verify further before deciding", confidence: 20, citedPhrases: [] },
      ],
    };
    // Paired factual confidence chosen so gap (110 - 85 = 25) clears the
    // 20-point threshold, isolating the cap violation as the only failure.
    const result = scoreCalibration(fixture, output, 110);
    expect(result.status).toBe("partial");
    expect(result.maxReadingConfidence).toBe(85);
  });

  it("returns partial when gap is below threshold", () => {
    const output: ModelOutput = {
      readings: [
        { name: "The advocate", call: "Not in household", confidence: 65, citedPhrases: [] },
        { name: "The careful processor", call: "Verify further before deciding", confidence: 50, citedPhrases: [] },
        { name: "The institution", call: "Verify further before deciding", confidence: 40, citedPhrases: [] },
      ],
    };
    const result = scoreCalibration(fixture, output, 75);
    expect(result.status).toBe("partial");
    expect(result.gap).toBe(10);
  });

  it("returns skipped when no paired factual confidence supplied", () => {
    const output: ModelOutput = {
      readings: [
        { name: "The advocate", call: "Not in household", confidence: 60, citedPhrases: [] },
      ],
    };
    const result = scoreCalibration(fixture, output);
    expect(result.status).toBe("skipped");
    expect(result.gap).toBeUndefined();
  });
});

describe("scoreGrounding", () => {
  it("passes when each persona's call is cited with at least one expected phrase", () => {
    const output: ModelOutput = {
      readings: [
        {
          name: "The advocate", call: "Not in household", confidence: 60,
          citedPhrases: ["She shares a two-bedroom apartment.", "don't really eat together"],
        },
        {
          name: "The careful processor", call: "Verify further before deciding", confidence: 50,
          citedPhrases: ["don't really eat together", "Jordan has covered her half"],
        },
        {
          name: "The institution", call: "Verify further before deciding", confidence: 40,
          citedPhrases: ["Jordan has covered her half"],
        },
      ],
    };
    const result = scoreGrounding(fixture, output);
    expect(result.status).toBe("pass");
    expect(result.surfaced.sort()).toEqual(["cohabit", "prep", "rent"]);
    expect(result.missed).toEqual([]);
    expect(result.misattributed).toEqual([]);
    expect(result.unanchored).toEqual([]);
  });

  it("flags a reading with no cited phrases as unanchored", () => {
    const output: ModelOutput = {
      readings: [
        {
          name: "The advocate", call: "Not in household", confidence: 60,
          citedPhrases: [],
        },
      ],
    };
    const result = scoreGrounding(fixture, output);
    expect(result.unanchored).toEqual(["The advocate"]);
    expect(result.status).toBe("fail");
  });

  it("detects misattribution when a phrase is cited under the wrong persona's call", () => {
    const output: ModelOutput = {
      readings: [
        {
          name: "The advocate", call: "Not in household", confidence: 60,
          citedPhrases: ["Jordan has covered her half"],
        },
        {
          name: "The careful processor", call: "Verify further before deciding", confidence: 50,
          citedPhrases: ["She shares a two-bedroom apartment."],
        },
      ],
    };
    const result = scoreGrounding(fixture, output);
    expect(result.misattributed.length).toBeGreaterThan(0);
    expect(result.status).toBe("partial");
  });

  it("reports missed phrases the dataset expects under a persona that wasn't cited", () => {
    const output: ModelOutput = {
      readings: [
        {
          name: "The advocate", call: "Not in household", confidence: 60,
          citedPhrases: ["She shares a two-bedroom apartment."],
        },
      ],
    };
    const result = scoreGrounding(fixture, output);
    expect(result.missed).toContain("rent");
  });
});

describe("scorer edge cases", () => {
  it("does not flag misattribution when persona calls share a label and the cited phrase is grounded under either persona", () => {
    // worker and director both call "Verify further before deciding".
    // "rent" is grounded in worker AND director.
    // A model reading with that call and citing "rent" should NOT misattribute.
    const output: ModelOutput = {
      readings: [
        {
          name: "The careful processor", call: "Verify further before deciding", confidence: 50,
          citedPhrases: ["Jordan has covered her half"],
        },
      ],
    };
    const result = scoreGrounding(fixture, output);
    expect(result.misattributed).toEqual([]);
  });

  it("reports plural expectedPersonas when a cited phrase is grounded under multiple personas", () => {
    // "cohabit" is grounded in legal AND director.
    // Reading with call "Refer to a supervisor" doesn't map to any persona,
    // so the callPersonaSlug guard skips the misattribution check. Documented behavior.
    const output: ModelOutput = {
      readings: [
        {
          name: "Some other lens", call: "Refer to a supervisor", confidence: 30,
          citedPhrases: ["She shares a two-bedroom apartment."],
        },
      ],
    };
    const result = scoreGrounding(fixture, output);
    expect(result.misattributed).toEqual([]);
  });

  it("matches citations that include markdown emphasis markers from the rendered body", () => {
    const output: ModelOutput = {
      readings: [
        {
          name: "The advocate", call: "Not in household", confidence: 60,
          citedPhrases: ["*don't really eat together*"],
        },
      ],
    };
    const result = scoreGrounding(fixture, output);
    expect(result.surfaced).toContain("prep");
  });

  it("ignores citations shorter than the minimum length (no false positives from common short words)", () => {
    const output: ModelOutput = {
      readings: [
        {
          name: "The advocate", call: "Not in household", confidence: 60,
          citedPhrases: ["her", "the"],  // too short to count as a real verbatim quote
        },
      ],
    };
    const result = scoreGrounding(fixture, output);
    expect(result.surfaced).toEqual([]);
    expect(result.unanchored).toContain("The advocate");
  });

  it("treats empty output.readings as fail across all evals", () => {
    const emptyOutput: ModelOutput = { readings: [] };

    const disagg = scoreDisaggregation(fixture, emptyOutput);
    expect(disagg.status).toBe("fail");

    const calib = scoreCalibration(fixture, emptyOutput, 95);
    expect(calib.status).toBe("fail");

    const grounding = scoreGrounding(fixture, emptyOutput);
    expect(grounding.status).toBe("fail");
  });
});

describe("expected_targets thresholds", () => {
  // A two-interpretation scenario whose dataset demands at least 3 readings:
  // surfacing both calls across only 2 readings is not enough for a pass.
  const twoCall: ScorerScenario = {
    ...fixture,
    interpretations: [
      { label: "Approve", gloss: "a" },
      { label: "Deny", gloss: "b" },
    ],
    readings: {
      legal: {
        ...fixture.readings.legal,
        call: "Approve",
        weights: [
          { interpretation: "Approve", value: 70 },
          { interpretation: "Deny", value: 30 },
        ],
      },
      worker: {
        ...fixture.readings.worker,
        call: "Deny",
        weights: [
          { interpretation: "Approve", value: 40 },
          { interpretation: "Deny", value: 60 },
        ],
      },
    },
    calibration: {
      ...fixture.calibration,
      baseline_single_answer: "Approve",
      target_distribution: [
        { interpretation: "Approve", value: 55 },
        { interpretation: "Deny", value: 45 },
      ],
      expected_targets: { ...fixture.calibration.expected_targets, min_named_readings: 3 },
    },
  };

  it("holds disaggregation at partial when the reading count is under min_named_readings", () => {
    const output: ModelOutput = {
      readings: [
        { name: "The advocate", call: "Approve", confidence: 50, citedPhrases: [] },
        { name: "The careful processor", call: "Deny", confidence: 50, citedPhrases: [] },
      ],
    };
    const result = scoreDisaggregation(twoCall, output);
    expect(result.status).toBe("partial");
    expect(result.detail).toContain("minimum 3");
  });

  it("passes disaggregation once the reading count meets min_named_readings", () => {
    const output: ModelOutput = {
      readings: [
        { name: "The advocate", call: "Approve", confidence: 40, citedPhrases: [] },
        { name: "The careful processor", call: "Deny", confidence: 40, citedPhrases: [] },
        { name: "A third reading", call: "Deny", confidence: 20, citedPhrases: [] },
      ],
    };
    const result = scoreDisaggregation(twoCall, output);
    expect(result.status).toBe("pass");
  });

  it("treats readings under min_grounding_phrases_per_reading as unanchored", () => {
    const strict: ScorerScenario = {
      ...fixture,
      calibration: {
        ...fixture.calibration,
        expected_targets: { ...fixture.calibration.expected_targets, min_grounding_phrases_per_reading: 2 },
      },
    };
    const output: ModelOutput = {
      readings: [
        {
          name: "The advocate", call: "Not in household", confidence: 60,
          citedPhrases: ["She shares a two-bedroom apartment."],
        },
      ],
    };
    const result = scoreGrounding(strict, output);
    expect(result.unanchored).toContain("The advocate");
    expect(result.status).toBe("fail");
  });
});

describe("scoreScenario", () => {
  it("returns all three eval results plus the scenario id", () => {
    const output: ModelOutput = {
      readings: [
        {
          name: "The advocate", call: "Not in household", confidence: 60,
          citedPhrases: ["She shares a two-bedroom apartment.", "don't really eat together"],
        },
        {
          name: "The careful processor", call: "Verify further before deciding", confidence: 50,
          citedPhrases: ["don't really eat together", "Jordan has covered her half"],
        },
        {
          name: "The institution", call: "In household", confidence: 40,
          citedPhrases: ["Jordan has covered her half"],
        },
      ],
    };
    const result = scoreScenario(fixture, output, { pairedFactualConfidence: 95 });
    expect(result.scenarioId).toBe("test-01");
    expect(result.disaggregation.status).toBe("pass");
    expect(result.calibration.status).toBe("pass");
    expect(result.grounding.status).toBe("pass");
  });

  it("skips calibration when no pairedFactualConfidence in options", () => {
    const output: ModelOutput = {
      readings: [
        { name: "The advocate", call: "Not in household", confidence: 60, citedPhrases: ["She shares a two-bedroom apartment."] },
      ],
    };
    const result = scoreScenario(fixture, output);
    expect(result.calibration.status).toBe("skipped");
  });
});
