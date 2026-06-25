import { describe, it, expect } from "bun:test";
import {
  weightDistance,
  scorePersonaFidelity,
  scorePersonaSeparation,
  scorePersonaStability,
} from "./persona";
import type { ScorerScenario, PersonaOutput } from "./types";

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

const echoLegal: PersonaOutput = {
  call: "Not in household",
  weights: [
    { interpretation: "Not in household", value: 80 },
    { interpretation: "In household", value: 6 },
    { interpretation: "Verify further before deciding", value: 14 },
  ],
  citedPhrases: ["She shares a two-bedroom apartment.", "don't really eat together"],
};

describe("weightDistance", () => {
  it("is zero between identical distributions", () => {
    expect(weightDistance(echoLegal.weights, fixture.readings.legal.weights)).toBe(0);
  });

  it("computes total variation distance over the label union", () => {
    // |80-22| + |6-28| + |14-50| = 116; TVD = 58
    expect(
      weightDistance(fixture.readings.legal.weights, fixture.readings.worker.weights),
    ).toBe(58);
  });

  it("renormalizes small drift so weights summing to 99 do not register as distance", () => {
    const drifted = [
      { interpretation: "Not in household", value: 79 },
      { interpretation: "In household", value: 6 },
      { interpretation: "Verify further before deciding", value: 14 },
    ];
    expect(weightDistance(drifted, fixture.readings.legal.weights)).toBeLessThan(1);
  });
});

describe("scorePersonaFidelity", () => {
  it("passes when the output reproduces the recorded reading", () => {
    const result = scorePersonaFidelity(fixture, "legal", echoLegal);
    expect(result.status).toBe("pass");
    expect(result.callMatch).toBe(true);
    expect(result.weightDistance).toBe(0);
    expect(result.groundingRecall).toBe(1);
  });

  it("returns partial when the call matches but the weights drift past the pass threshold", () => {
    const drifted: PersonaOutput = {
      ...echoLegal,
      weights: [
        { interpretation: "Not in household", value: 60 },
        { interpretation: "In household", value: 15 },
        { interpretation: "Verify further before deciding", value: 25 },
      ],
    };
    // TVD vs (80/6/14) = (20 + 9 + 11) / 2 = 20: past 15, under 30.
    const result = scorePersonaFidelity(fixture, "legal", drifted);
    expect(result.status).toBe("partial");
    expect(result.weightDistance).toBe(20);
  });

  it("fails when the call diverges from the recorded reading", () => {
    const flipped: PersonaOutput = {
      ...echoLegal,
      call: "In household",
    };
    const result = scorePersonaFidelity(fixture, "legal", flipped);
    expect(result.status).toBe("fail");
    expect(result.callMatch).toBe(false);
  });

  it("holds a matching call at partial when expected phrases go uncited", () => {
    const uncited: PersonaOutput = { ...echoLegal, citedPhrases: [] };
    const result = scorePersonaFidelity(fixture, "legal", uncited);
    expect(result.groundingRecall).toBe(0);
    expect(result.status).toBe("partial");
  });

  it("records extra citations without penalizing them", () => {
    const extra: PersonaOutput = {
      ...echoLegal,
      citedPhrases: [...echoLegal.citedPhrases, "Jordan has covered her half"],
    };
    const result = scorePersonaFidelity(fixture, "legal", extra);
    expect(result.status).toBe("pass");
    expect(result.groundingExtras).toEqual(["rent"]);
  });

  it("throws on an unknown persona slug", () => {
    expect(() => scorePersonaFidelity(fixture, "underwriter", echoLegal)).toThrow();
  });
});

describe("scorePersonaSeparation", () => {
  const echo = (slug: "legal" | "worker" | "director"): PersonaOutput => ({
    call: fixture.readings[slug].call,
    weights: fixture.readings[slug].weights,
    citedPhrases: [],
  });

  it("passes when generated personas preserve the recorded spread", () => {
    const result = scorePersonaSeparation(fixture, {
      legal: echo("legal"),
      worker: echo("worker"),
      director: echo("director"),
    });
    expect(result.status).toBe("pass");
    expect(result.separationRatio).toBeCloseTo(1, 5);
    expect(result.distinctCalls).toBe(2);
  });

  it("fails when the personas collapse to one reading", () => {
    const collapsed = echo("worker");
    const result = scorePersonaSeparation(fixture, {
      legal: collapsed,
      worker: collapsed,
      director: collapsed,
    });
    expect(result.status).toBe("fail");
    expect(result.meanPairwiseDistance).toBe(0);
    expect(result.distinctCalls).toBe(1);
  });

  it("returns partial when spread shrinks to roughly half the recorded spread", () => {
    // Pull legal halfway toward worker; worker and director echoed.
    const halfway: PersonaOutput = {
      call: "Not in household",
      weights: [
        { interpretation: "Not in household", value: 51 },
        { interpretation: "In household", value: 17 },
        { interpretation: "Verify further before deciding", value: 32 },
      ],
      citedPhrases: [],
    };
    const result = scorePersonaSeparation(fixture, {
      legal: halfway,
      worker: echo("worker"),
      director: echo("director"),
    });
    expect(result.status).toBe("partial");
    expect(result.separationRatio).toBeGreaterThanOrEqual(0.5);
    expect(result.separationRatio).toBeLessThan(0.75);
  });

  it("reports pairwise grounding overlap", () => {
    const result = scorePersonaSeparation(fixture, {
      legal: { ...echo("legal"), citedPhrases: ["She shares a two-bedroom apartment."] },
      worker: { ...echo("worker"), citedPhrases: ["She shares a two-bedroom apartment."] },
    });
    expect(result.groundingOverlap["legal|worker"]).toBe(1);
  });

  it("throws with fewer than two personas", () => {
    expect(() => scorePersonaSeparation(fixture, { legal: echo("legal") })).toThrow();
  });
});

describe("scorePersonaStability", () => {
  it("passes when repeat runs agree on call and weights", () => {
    const result = scorePersonaStability([echoLegal, echoLegal, echoLegal]);
    expect(result.status).toBe("pass");
    expect(result.modalCallRate).toBe(1);
    expect(result.meanRunDistance).toBe(0);
  });

  it("passes at two-of-three modal agreement when weights stay close", () => {
    const wobble: PersonaOutput = {
      call: "Verify further before deciding",
      weights: [
        { interpretation: "Not in household", value: 70 },
        { interpretation: "In household", value: 10 },
        { interpretation: "Verify further before deciding", value: 20 },
      ],
      citedPhrases: [],
    };
    const result = scorePersonaStability([echoLegal, echoLegal, wobble]);
    expect(result.modalCallRate).toBeCloseTo(2 / 3, 5);
    expect(result.modalCall).toBe("Not in household");
    expect(result.status).toBe("pass");
  });

  it("fails when every run lands somewhere different", () => {
    const runs: PersonaOutput[] = [
      echoLegal,
      {
        call: "In household",
        weights: [
          { interpretation: "Not in household", value: 10 },
          { interpretation: "In household", value: 70 },
          { interpretation: "Verify further before deciding", value: 20 },
        ],
        citedPhrases: [],
      },
      {
        call: "Verify further before deciding",
        weights: [
          { interpretation: "Not in household", value: 20 },
          { interpretation: "In household", value: 10 },
          { interpretation: "Verify further before deciding", value: 70 },
        ],
        citedPhrases: [],
      },
    ];
    const result = scorePersonaStability(runs);
    expect(result.status).toBe("fail");
  });

  it("throws with fewer than two runs", () => {
    expect(() => scorePersonaStability([echoLegal])).toThrow();
  });
});
