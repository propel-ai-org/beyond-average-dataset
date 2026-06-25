#!/usr/bin/env bun
// dataset/harness/score-runs.ts
// Read the raw receipts in results/raw/, score them with the persona evals,
// and write results/summary.json plus a console table.
//
// Grouping:
//   fidelity    per (scenario, arm, persona, model): scored per run, reported
//               as pass rate plus mean weight distance.
//   stability   per (scenario, arm, persona, model) across runs.
//   separation  per (scenario, arm, model, run index) across personas, then
//               averaged over run indexes.
//   baseline    cold-arm runs summarized as modal call plus mean confidence,
//               next to the scenario's recorded baseline for comparison.

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import {
  scorePersonaFidelity,
  scorePersonaSeparation,
  scorePersonaStability,
} from "../scorer/persona";
import type { ScorerScenario, PersonaOutput } from "../scorer/types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const RAW_DIR = join(ROOT, "results", "raw");
const SCENARIO_DIR = join(ROOT, "scenarios");

interface RawRecord {
  scenario: string;
  arm: "cold" | "role" | "spec";
  persona: string | null;
  personaVersion: string | null;
  model: string;
  run: number;
  parsed?: unknown;
  error?: string;
}

const scenarios = new Map<string, ScorerScenario>();
for (const f of readdirSync(SCENARIO_DIR).filter((f) => f.endsWith(".md"))) {
  const data = matter(readFileSync(join(SCENARIO_DIR, f), "utf-8")).data as ScorerScenario;
  scenarios.set(data.id, data);
}

const records: RawRecord[] = readdirSync(RAW_DIR)
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(readFileSync(join(RAW_DIR, f), "utf-8")) as RawRecord);

const errored = records.filter((r) => r.error);
const usable = records.filter((r) => !r.error && r.parsed);

console.log(`${records.length} receipt(s); ${usable.length} usable, ${errored.length} errored.`);

// --- group helpers ---------------------------------------------------------

const by = <T,>(items: T[], key: (t: T) => string): Map<string, T[]> => {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    map.set(k, [...(map.get(k) ?? []), item]);
  }
  return map;
};

// --- fidelity + stability ----------------------------------------------------

interface FidelitySummary {
  scenario: string;
  arm: string;
  persona: string;
  model: string;
  runs: number;
  passRate: number;
  callMatchRate: number;
  meanWeightDistance: number;
  meanGroundingRecall: number;
  stability: { status: string; modalCallRate: number; meanRunDistance: number } | null;
}

const fidelitySummaries: FidelitySummary[] = [];
const personaRuns = usable.filter((r) => r.arm !== "cold" && r.persona);

for (const [key, group] of by(personaRuns, (r) => `${r.scenario}|${r.arm}|${r.persona}|${r.model}`)) {
  const [scenarioId, arm, persona, model] = key.split("|");
  const scenario = scenarios.get(scenarioId);
  if (!scenario) continue;
  const outputs = group
    .sort((a, b) => a.run - b.run)
    .map((r) => r.parsed as PersonaOutput);

  const fidelity = outputs.map((o) => scorePersonaFidelity(scenario, persona, o));
  const stability = outputs.length >= 2 ? scorePersonaStability(outputs) : null;

  fidelitySummaries.push({
    scenario: scenarioId,
    arm,
    persona,
    model,
    runs: outputs.length,
    passRate: fidelity.filter((f) => f.status === "pass").length / fidelity.length,
    callMatchRate: fidelity.filter((f) => f.callMatch).length / fidelity.length,
    meanWeightDistance: fidelity.reduce((s, f) => s + f.weightDistance, 0) / fidelity.length,
    meanGroundingRecall: fidelity.reduce((s, f) => s + f.groundingRecall, 0) / fidelity.length,
    stability: stability
      ? { status: stability.status, modalCallRate: stability.modalCallRate, meanRunDistance: stability.meanRunDistance }
      : null,
  });
}

// --- separation ---------------------------------------------------------------

interface SeparationSummary {
  scenario: string;
  arm: string;
  model: string;
  runIndexes: number;
  meanSeparationRatio: number;
  meanDistinctCalls: number;
  expectedDistinctCalls: number;
  statuses: string[];
}

const separationSummaries: SeparationSummary[] = [];

for (const [key, group] of by(personaRuns, (r) => `${r.scenario}|${r.arm}|${r.model}`)) {
  const [scenarioId, arm, model] = key.split("|");
  const scenario = scenarios.get(scenarioId);
  if (!scenario) continue;

  const byRun = by(group, (r) => String(r.run));
  const perRun = [];
  for (const [, runGroup] of byRun) {
    const outputs: Record<string, PersonaOutput> = {};
    for (const r of runGroup) outputs[r.persona!] = r.parsed as PersonaOutput;
    if (Object.keys(outputs).length < 2) continue;
    perRun.push(scorePersonaSeparation(scenario, outputs));
  }
  if (perRun.length === 0) continue;

  separationSummaries.push({
    scenario: scenarioId,
    arm,
    model,
    runIndexes: perRun.length,
    meanSeparationRatio: perRun.reduce((s, r) => s + r.separationRatio, 0) / perRun.length,
    meanDistinctCalls: perRun.reduce((s, r) => s + r.distinctCalls, 0) / perRun.length,
    expectedDistinctCalls: perRun[0].expectedDistinctCalls,
    statuses: perRun.map((r) => r.status),
  });
}

// --- baselines ------------------------------------------------------------------

interface BaselineSummary {
  scenario: string;
  model: string;
  runs: number;
  modalCall: string;
  modalCallRate: number;
  meanConfidence: number;
  recordedCall: string;
  recordedConfidence: number;
}

const baselineSummaries: BaselineSummary[] = [];
const coldRuns = usable.filter((r) => r.arm === "cold");

for (const [key, group] of by(coldRuns, (r) => `${r.scenario}|${r.model}`)) {
  const [scenarioId, model] = key.split("|");
  const scenario = scenarios.get(scenarioId);
  if (!scenario) continue;
  const outputs = group.map((r) => r.parsed as { call: string; confidence: number });

  const counts = new Map<string, number>();
  for (const o of outputs) counts.set(o.call, (counts.get(o.call) ?? 0) + 1);
  const [modalCall, modalCount] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];

  baselineSummaries.push({
    scenario: scenarioId,
    model,
    runs: outputs.length,
    modalCall,
    modalCallRate: modalCount / outputs.length,
    meanConfidence: outputs.reduce((s, o) => s + o.confidence, 0) / outputs.length,
    recordedCall: scenario.calibration.baseline_single_answer,
    recordedConfidence: scenario.calibration.baseline_confidence,
  });
}

// --- write + print ---------------------------------------------------------------

const summary = {
  generated: new Date().toISOString(),
  receipts: records.length,
  usable: usable.length,
  errored: errored.length,
  fidelity: fidelitySummaries.sort((a, b) => a.scenario.localeCompare(b.scenario) || a.persona.localeCompare(b.persona)),
  separation: separationSummaries.sort((a, b) => a.scenario.localeCompare(b.scenario)),
  baselines: baselineSummaries.sort((a, b) => a.scenario.localeCompare(b.scenario)),
};

mkdirSync(join(ROOT, "results"), { recursive: true });
writeFileSync(join(ROOT, "results", "summary.json"), JSON.stringify(summary, null, 2));

const pct = (n: number) => `${Math.round(n * 100)}%`;
const pts = (n: number) => n.toFixed(1);

if (baselineSummaries.length) {
  console.log("\nbaselines (cold arm vs recorded):");
  for (const b of summary.baselines) {
    const match = b.modalCall === b.recordedCall ? "=" : "≠";
    console.log(`  ${b.scenario} [${b.model}] modal "${b.modalCall}" ${pct(b.modalCallRate)} @ mean ${pts(b.meanConfidence)} | recorded "${b.recordedCall}" @ ${b.recordedConfidence} ${match}`);
  }
}

if (fidelitySummaries.length) {
  console.log("\nfidelity (per scenario x persona):");
  for (const f of summary.fidelity) {
    console.log(`  ${f.scenario} ${f.arm.padEnd(4)} ${f.persona.padEnd(8)} [${f.model}] pass ${pct(f.passRate)} call ${pct(f.callMatchRate)} dist ${pts(f.meanWeightDistance)} recall ${pct(f.meanGroundingRecall)}${f.stability ? ` | stability ${f.stability.status}` : ""}`);
  }
}

if (separationSummaries.length) {
  console.log("\nseparation (per scenario, across personas):");
  for (const s of summary.separation) {
    console.log(`  ${s.scenario} ${s.arm.padEnd(4)} [${s.model}] ratio ${s.meanSeparationRatio.toFixed(2)} distinct ${s.meanDistinctCalls.toFixed(1)}/${s.expectedDistinctCalls} (${s.statuses.join(",")})`);
  }
}

console.log(`\n✓ wrote results/summary.json`);
