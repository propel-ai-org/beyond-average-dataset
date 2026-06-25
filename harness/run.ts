#!/usr/bin/env bun
// dataset/harness/run.ts
// Execute persona runs against scenarios and write raw receipts to
// results/raw/. Each receipt records the prompts, the raw model text, and
// the parsed output, so every number in results/ traces back to a run.
//
// Usage:
//   bun harness/run.ts --arm spec --model sonnet --runs 3
//   bun harness/run.ts --arm cold --model sonnet --runs 5 --scenarios 01,02
//   bun harness/run.ts --arm role --personas legal,worker --runner api --model claude-sonnet-4-6
//
// Arms (see PERSONAS.md):
//   cold  one single-answer read, no persona. The calibration baseline.
//   role  bare role name as system prompt ("You are a legal aid attorney...").
//   spec  the full operational spec from personas/.

import { readdirSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import {
  loadScenario,
  loadPersonaSpec,
  systemFor,
  buildReadingPrompt,
  buildBaselinePrompt,
  parsePersonaOutput,
  parseBaselineOutput,
  makeRunner,
  type Arm,
  type PersonaSpec,
} from "./lib";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SCENARIO_DIR = join(ROOT, "scenarios");
const PERSONA_DIR = join(ROOT, "personas");
const RAW_DIR = join(ROOT, "results", "raw");

// --- tiny arg parser ---------------------------------------------------

function arg(name: string, fallback?: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

const arm = (arg("arm") ?? "spec") as Arm;
const model = arg("model") ?? "sonnet";
const runnerKind = (arg("runner") ?? "cli") as "api" | "cli";
const runs = parseInt(arg("runs") ?? "3", 10);
const concurrency = parseInt(arg("concurrency") ?? "4", 10);
const scenarioFilter = arg("scenarios") ?? "all";
const personaFilter = arg("personas") ?? "all";

if (!["cold", "role", "spec"].includes(arm)) {
  console.error(`Unknown arm "${arm}". Use cold, role, or spec.`);
  process.exit(1);
}

// --- work list -----------------------------------------------------------

const scenarioFiles = readdirSync(SCENARIO_DIR)
  .filter((f) => f.endsWith(".md"))
  .filter((f) => scenarioFilter === "all" || scenarioFilter.split(",").some((id) => f.startsWith(id.trim())))
  .sort();

const personaFiles = arm === "cold"
  ? []
  : readdirSync(PERSONA_DIR)
      .filter((f) => f.endsWith(".md"))
      .filter((f) => personaFilter === "all" || personaFilter.split(",").includes(basename(f, ".md")))
      .sort();

interface Job {
  scenarioFile: string;
  persona?: PersonaSpec;
  run: number;
}

const jobs: Job[] = [];
for (const scenarioFile of scenarioFiles) {
  if (arm === "cold") {
    for (let r = 1; r <= runs; r++) jobs.push({ scenarioFile, run: r });
  } else {
    for (const personaFile of personaFiles) {
      const persona = loadPersonaSpec(join(PERSONA_DIR, personaFile));
      for (let r = 1; r <= runs; r++) jobs.push({ scenarioFile, persona, run: r });
    }
  }
}

console.log(`${jobs.length} run(s): arm=${arm} model=${model} runner=${runnerKind} scenarios=${scenarioFiles.length}${arm === "cold" ? "" : ` personas=${personaFiles.length}`} x${runs}`);

// --- execution -----------------------------------------------------------

mkdirSync(RAW_DIR, { recursive: true });
const runner = makeRunner(runnerKind, model);

async function executeJob(job: Job): Promise<string> {
  const loaded = loadScenario(join(SCENARIO_DIR, job.scenarioFile));
  const system = systemFor(arm, job.persona);
  const user = arm === "cold" ? buildBaselinePrompt(loaded) : buildReadingPrompt(loaded);
  const who = job.persona?.slug ?? "cold";
  const name = `${loaded.scenario.id}_${arm}_${who}_${model.replace(/[^a-z0-9.-]/gi, "-")}_r${job.run}`;

  const record: Record<string, unknown> = {
    scenario: loaded.scenario.id,
    arm,
    persona: job.persona?.slug ?? null,
    personaVersion: job.persona?.version ?? null,
    model,
    runner: runnerKind,
    run: job.run,
    timestamp: new Date().toISOString(),
    system,
    user,
  };

  try {
    let rawText = await runner({ system, user });
    let parsed: unknown;
    try {
      parsed = arm === "cold" ? parseBaselineOutput(rawText) : parsePersonaOutput(rawText);
    } catch {
      // One retry on malformed output; a second failure is recorded as an
      // error rather than patched (see EVALUATING.md on malformed JSON).
      rawText = await runner({ system, user });
      parsed = arm === "cold" ? parseBaselineOutput(rawText) : parsePersonaOutput(rawText);
      record.retried = true;
    }
    record.rawText = rawText;
    record.parsed = parsed;
  } catch (e) {
    record.error = e instanceof Error ? e.message : String(e);
  }

  writeFileSync(join(RAW_DIR, `${name}.json`), JSON.stringify(record, null, 2));
  return `${name}${record.error ? "  ERROR: " + record.error : ""}`;
}

let done = 0;
const queue = [...jobs];
async function workerLoop(): Promise<void> {
  while (queue.length > 0) {
    const job = queue.shift()!;
    const label = await executeJob(job);
    done++;
    console.log(`  [${done}/${jobs.length}] ${label}`);
  }
}

await Promise.all(Array.from({ length: Math.min(concurrency, jobs.length) }, workerLoop));
console.log(`✓ wrote ${jobs.length} receipt(s) to results/raw/`);
