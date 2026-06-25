// dataset/harness/lib.ts
// Shared pieces for the persona run harness: scenario/spec loading, prompt
// construction, output parsing, and the two model runners (Anthropic API,
// claude CLI). No scoring logic here; the scorer stays pure in ../scorer/.

import { readFileSync, mkdirSync } from "node:fs";
import matter from "gray-matter";
import type { ScorerScenario, PersonaOutput } from "../scorer/types";

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

export interface LoadedScenario {
  scenario: ScorerScenario;
  /**
   * What the model is shown: everything above "## Persona readings", i.e.
   * title, interpretation question, case facts, and the walkthrough's
   * annotation layer. The persona readings and calibration sections are the
   * answer key and are never sent. The walkthrough is included because some
   * load-bearing phrases (scenario 01's NC-manual carve-out) live there; it
   * is the same shared context for every persona and every arm.
   */
  promptBody: string;
}

export function loadScenario(path: string): LoadedScenario {
  const raw = readFileSync(path, "utf-8");
  const parsed = matter(raw);
  const scenario = parsed.data as ScorerScenario;
  const promptBody = parsed.content.split("## Persona readings")[0].trim();
  return { scenario, promptBody };
}

export interface PersonaSpec {
  slug: string;
  persona: string;
  archetype: string;
  version: string;
  /** The operational spec: the first ```text fenced block in the persona file. */
  spec: string;
}

export function loadPersonaSpec(path: string): PersonaSpec {
  const raw = readFileSync(path, "utf-8");
  const parsed = matter(raw);
  const fence = parsed.content.match(/```text\n([\s\S]*?)```/);
  if (!fence) {
    throw new Error(`No \`\`\`text spec block found in ${path}`);
  }
  const fm = parsed.data as { slug: string; persona: string; archetype: string; version: string };
  return {
    slug: fm.slug,
    persona: fm.persona,
    archetype: fm.archetype,
    version: fm.version,
    spec: fence[1].trim(),
  };
}

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------

export type Arm = "cold" | "role" | "spec";

const NEUTRAL_SYSTEM = "You are evaluating a SNAP eligibility scenario for a state agency.";

/** System prompt for each arm of the ablation. */
export function systemFor(arm: Arm, persona?: PersonaSpec): string {
  if (arm === "cold") return NEUTRAL_SYSTEM;
  if (!persona) throw new Error(`Arm "${arm}" needs a persona spec.`);
  if (arm === "role") return `You are a ${persona.persona.toLowerCase()}, reading a SNAP case file.`;
  return persona.spec;
}

function interpretationList(scenario: ScorerScenario): string {
  return scenario.interpretations
    .map((i) => `- "${i.label}": ${i.gloss}`)
    .join("\n");
}

/**
 * The reading prompt for the role and spec arms: produce one persona-shaped
 * reading as JSON. The output schema lives here, not in the persona spec, so
 * the role and spec arms differ only in the system prompt.
 */
export function buildReadingPrompt(loaded: LoadedScenario): string {
  const { scenario, promptBody } = loaded;
  return [
    `Interpretation question: ${scenario.interpretation_question}`,
    "",
    "Case file:",
    "",
    promptBody,
    "",
    "The named interpretations are:",
    interpretationList(scenario),
    "",
    "Read the case and produce your reading as JSON, with no other text:",
    "",
    `{`,
    `  "call": "<the one named interpretation you land on>",`,
    `  "weights": [{ "interpretation": "<named interpretation>", "value": <integer> }, ...],`,
    `  "citedPhrases": ["<verbatim phrase from the case file>", ...],`,
    `  "reasoning": "<one or two sentences>"`,
    `}`,
    "",
    "Rules:",
    "- weights must include every named interpretation exactly once and sum to 100.",
    "- call must be the interpretation you weight highest.",
    "- citedPhrases must be verbatim quotes from the case file, not paraphrases.",
  ].join("\n");
}

/**
 * The baseline prompt for the cold arm: one answer, one confidence. This is
 * the single-answer behavior the dataset's calibration payload records. The
 * named interpretations are listed so the answer is classifiable against the
 * schema; nothing in the prompt invites more than one reading.
 */
export function buildBaselinePrompt(loaded: LoadedScenario): string {
  const { scenario, promptBody } = loaded;
  return [
    `Interpretation question: ${scenario.interpretation_question}`,
    "",
    "Case file:",
    "",
    promptBody,
    "",
    "The named interpretations are:",
    interpretationList(scenario),
    "",
    "Answer the interpretation question. Respond as JSON, with no other text:",
    "",
    `{ "call": "<the one named interpretation>", "confidence": <integer 0-100>, "reasoning": "<one or two sentences>" }`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Output parsing
// ---------------------------------------------------------------------------

function stripFences(text: string): string {
  const fenced = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  return (fenced ? fenced[1] : text).trim();
}

export function parsePersonaOutput(text: string): PersonaOutput {
  const parsed = JSON.parse(stripFences(text)) as PersonaOutput;
  if (typeof parsed.call !== "string" || !Array.isArray(parsed.weights) || !Array.isArray(parsed.citedPhrases)) {
    throw new Error("Model output missing call/weights/citedPhrases.");
  }
  return parsed;
}

export interface BaselineOutput {
  call: string;
  confidence: number;
  reasoning?: string;
}

export function parseBaselineOutput(text: string): BaselineOutput {
  const parsed = JSON.parse(stripFences(text)) as BaselineOutput;
  if (typeof parsed.call !== "string" || typeof parsed.confidence !== "number") {
    throw new Error("Model output missing call/confidence.");
  }
  return parsed;
}

// ---------------------------------------------------------------------------
// Runners
// ---------------------------------------------------------------------------

export type Runner = (args: { system: string; user: string }) => Promise<string>;

/**
 * Anthropic API runner. Needs ANTHROPIC_API_KEY; honors ANTHROPIC_BASE_URL.
 * Temperature 0 per EVALUATING.md: the evals care about reported confidence,
 * not sampling variance.
 */
export function apiRunner(model: string): Runner {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set.");
  const base = (process.env.ANTHROPIC_BASE_URL ?? "https://api.anthropic.com").replace(/\/$/, "");
  return async ({ system, user }) => {
    const res = await fetch(`${base}/v1/messages`, {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        temperature: 0,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });
    if (!res.ok) {
      throw new Error(`API ${res.status}: ${(await res.text()).slice(0, 300)}`);
    }
    const data = (await res.json()) as { content: Array<{ type: string; text?: string }> };
    return data.content.map((b) => b.text ?? "").join("");
  };
}

const CLI_SANDBOX = "/tmp/three-readings-harness";

/**
 * claude CLI runner, for environments authenticated through Claude Code
 * rather than an API key. Runs from a sandbox directory with tools and MCP
 * disabled so nothing but the system prompt shapes the substrate. Note the
 * CLI does not expose a temperature control; expect mild run-to-run variance
 * and use repeat runs.
 */
export function cliRunner(model: string): Runner {
  mkdirSync(CLI_SANDBOX, { recursive: true });
  return async ({ system, user }) => {
    const proc = Bun.spawn(
      [
        "claude", "-p",
        "--model", model,
        "--system-prompt", system,
        "--output-format", "json",
        "--no-session-persistence",
        "--strict-mcp-config",
        "--tools", "",
      ],
      { cwd: CLI_SANDBOX, stdin: "pipe", stdout: "pipe", stderr: "pipe" },
    );
    proc.stdin.write(user);
    proc.stdin.end();

    const timeout = setTimeout(() => proc.kill(), 180_000);
    const [stdout, stderr] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
    ]);
    const exitCode = await proc.exited;
    clearTimeout(timeout);

    if (exitCode !== 0) {
      throw new Error(`claude CLI exited ${exitCode}: ${stderr.slice(0, 300)}`);
    }
    const envelope = JSON.parse(stdout) as { result?: string; is_error?: boolean };
    if (envelope.is_error || typeof envelope.result !== "string") {
      throw new Error(`claude CLI error envelope: ${stdout.slice(0, 300)}`);
    }
    return envelope.result;
  };
}

export function makeRunner(kind: "api" | "cli", model: string): Runner {
  return kind === "api" ? apiRunner(model) : cliRunner(model);
}
