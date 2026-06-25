#!/usr/bin/env bun
// dataset/scorer/example.ts
// Runnable demo: loads scenario 01, runs a hardcoded mock model output through
// the scorer, prints the ScoreResult.

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { scoreScenario } from "./score";
import type { ScorerScenario, ModelOutput } from "./types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCENARIO_PATH = join(__dirname, "..", "scenarios", "01-ex-roommate.md");

function loadScenario(path: string): ScorerScenario {
  const raw = readFileSync(path, "utf-8");
  const parsed = matter(raw);
  return parsed.data as ScorerScenario;
}

const mockOutput: ModelOutput = {
  readings: [
    {
      name: "The advocate (legal aid)",
      call: "Not in household",
      confidence: 60,
      citedPhrases: [
        "NC manual: \"Unmarried couples who live together",
        "don't really eat together",
      ],
    },
    {
      name: "The careful processor (worker)",
      call: "Verify further before deciding",
      confidence: 50,
      citedPhrases: [
        "They share the fridge and the kitchen.",
        "Jordan has covered her half",
      ],
    },
    {
      name: "The institution (director)",
      call: "Verify further before deciding",
      confidence: 40,
      citedPhrases: [
        "Jordan works full time as a warehouse supervisor",
      ],
    },
  ],
};

const scenario = loadScenario(SCENARIO_PATH);
const result = scoreScenario(scenario, mockOutput, { pairedFactualConfidence: 95 });

console.log(JSON.stringify(result, null, 2));
