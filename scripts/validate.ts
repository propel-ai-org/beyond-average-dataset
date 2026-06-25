#!/usr/bin/env bun
// scripts/validate.ts
// Structural validator for the markdown scenario bundle in scenarios/.
//
// Enforces the cross-field invariants documented in SCHEMA.md, plus one check
// the scorer depends on but the schema cannot express on its own: every
// phrase_keys[*].text must appear verbatim in the scenario body (after the
// same normalization the scorer applies), because the phrase-grounding eval
// matches model citations against the body text.
//
// Adapters: this script reads YAML frontmatter via gray-matter and has no
// SNAP-specific logic. Point SCENARIO_DIR at your own scenario files (or pass
// a directory as the first argument) and it validates an adapted dataset
// unchanged.

import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import type { ScorerScenario } from "../scorer/types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCENARIO_DIR = process.argv[2] ?? join(__dirname, "..", "scenarios");

type Issue = { file: string; message: string };

// Same normalization as the scorer's phrase matcher: smart quotes collapse to
// straight, markdown emphasis markers drop out (the body renders some phrases
// inside *...*), whitespace collapses to single spaces, everything lowercased.
const normalize = (s: string) =>
  s.replace(/[‘’“”]/g, '"').replace(/[*_]/g, "").replace(/\s+/g, " ").trim().toLowerCase();

function validateScenario(file: string, raw: string): { issues: Issue[]; notes: string[] } {
  const issues: Issue[] = [];
  const notes: string[] = [];
  const add = (message: string) => issues.push({ file, message });

  let parsed: ReturnType<typeof matter>;
  try {
    parsed = matter(raw);
  } catch (e) {
    add(`frontmatter does not parse: ${e instanceof Error ? e.message : String(e)}`);
    return { issues, notes };
  }
  const fm = parsed.data as Partial<ScorerScenario>;
  const body = parsed.content;

  for (const field of ["id", "title", "interpretation_question"] as const) {
    if (typeof fm[field] !== "string" || fm[field].length === 0) {
      add(`missing or empty required field "${field}"`);
    }
  }
  if (typeof fm.id === "string" && !file.startsWith(fm.id)) {
    add(`id "${fm.id}" does not match filename prefix`);
  }

  if (!Array.isArray(fm.interpretations) || fm.interpretations.length === 0) {
    add("missing interpretations");
    return { issues, notes };
  }
  if (!Array.isArray(fm.phrase_keys) || fm.phrase_keys.length === 0) {
    add("missing phrase_keys");
    return { issues, notes };
  }
  if (!fm.readings || Object.keys(fm.readings).length === 0) {
    add("missing readings");
    return { issues, notes };
  }
  if (!fm.calibration) {
    add("missing calibration");
    return { issues, notes };
  }

  const labels = new Set(fm.interpretations.map((i) => i.label));
  if (labels.size !== fm.interpretations.length) {
    add("duplicate interpretation labels");
  }
  const phraseKeys = new Set(fm.phrase_keys.map((p) => p.key));
  if (phraseKeys.size !== fm.phrase_keys.length) {
    add("duplicate phrase keys");
  }

  // Every tagged phrase must be findable in the body, or the grounding eval
  // can never surface it.
  const bodyNorm = normalize(body);
  for (const pk of fm.phrase_keys) {
    if (!bodyNorm.includes(normalize(pk.text))) {
      add(`phrase key "${pk.key}" text does not appear in the scenario body`);
    }
  }

  const citedAnywhere = new Set<string>();
  for (const [slug, reading] of Object.entries(fm.readings)) {
    for (const key of reading.grounded_in) {
      citedAnywhere.add(key);
      if (!phraseKeys.has(key)) {
        add(`${slug}.grounded_in references unknown phrase key "${key}"`);
      }
    }
    if (reading.grounded_in.length === 0) {
      add(`${slug}.grounded_in is empty; every reading must be anchored in at least one phrase`);
    }

    const weightLabels = new Set(reading.weights.map((w) => w.interpretation));
    const total = reading.weights.reduce((sum, w) => sum + w.value, 0);
    if (total !== 100) {
      add(`${slug}.weights sum to ${total}, expected 100`);
    }
    for (const w of reading.weights) {
      if (!labels.has(w.interpretation)) {
        add(`${slug} weight label "${w.interpretation}" is not in interpretations`);
      }
    }
    for (const label of labels) {
      if (!weightLabels.has(label)) {
        add(`${slug} is missing a weight for interpretation "${label}"`);
      }
    }
    if (!weightLabels.has(reading.call)) {
      add(`${slug}.call "${reading.call}" is not one of its weight labels`);
    }
  }

  // Craft cross-check from DESIGNING.md section 5, reported but not fatal:
  // phrase keys no persona cites are inert for scoring (annotation anchors).
  const unreferenced = [...phraseKeys].filter((k) => !citedAnywhere.has(k));
  if (unreferenced.length > 0) {
    notes.push(`${file}: phrase key(s) not cited by any reading: ${unreferenced.join(", ")}`);
  }

  const cal = fm.calibration;
  if (!labels.has(cal.baseline_single_answer)) {
    add(`calibration.baseline_single_answer "${cal.baseline_single_answer}" is not in interpretations`);
  }
  if (typeof cal.baseline_confidence !== "number" || cal.baseline_confidence < 0 || cal.baseline_confidence > 100) {
    add("calibration.baseline_confidence must be a number 0-100");
  }
  const targetTotal = cal.target_distribution.reduce((sum, w) => sum + w.value, 0);
  if (targetTotal !== 100) {
    add(`calibration.target_distribution sums to ${targetTotal}, expected 100`);
  }
  for (const w of cal.target_distribution) {
    if (!labels.has(w.interpretation)) {
      add(`calibration.target_distribution label "${w.interpretation}" is not in interpretations`);
    }
  }
  const targets = cal.expected_targets;
  for (const field of [
    "max_single_reading_confidence",
    "min_named_readings",
    "min_grounding_phrases_per_reading",
    "min_factual_qa_gap_points",
  ] as const) {
    if (typeof targets?.[field] !== "number") {
      add(`calibration.expected_targets.${field} missing or not a number`);
    }
  }

  return { issues, notes };
}

function main() {
  const files = readdirSync(SCENARIO_DIR).filter((f) => f.endsWith(".md")).sort();
  if (files.length === 0) {
    console.error(`✗ no scenario files found in ${SCENARIO_DIR}`);
    process.exit(1);
  }

  const allIssues: Issue[] = [];
  const allNotes: string[] = [];
  for (const file of files) {
    const raw = readFileSync(join(SCENARIO_DIR, file), "utf-8");
    const { issues, notes } = validateScenario(file, raw);
    allIssues.push(...issues);
    allNotes.push(...notes);
  }

  for (const note of allNotes) console.log(`  note: ${note}`);
  if (allIssues.length === 0) {
    console.log(`✓ ${files.length} scenario file(s) validated`);
    process.exit(0);
  }
  console.error(`✗ ${allIssues.length} validation issue(s):\n`);
  for (const issue of allIssues) {
    console.error(`  [${issue.file}] ${issue.message}`);
  }
  process.exit(1);
}

main();
