# persona run harness

Executes persona runs against the scenarios and writes raw receipts; the companion scorer reads the receipts back and produces `results/summary.json`. Every number reported in `results/` traces to a receipt in `results/raw/` carrying the full prompts and raw model text.

This is a small harness, not a framework: two files, no queue, no resume. Copy it, point it at your own scenario and persona directories, replace it.

## the three arms

- `cold`: one single-answer read, no persona. Reproduces the calibration baseline (`calibration.baseline_single_answer` / `baseline_confidence`) with receipts.
- `role`: the bare role name as system prompt ("You are a legal aid attorney, reading a SNAP case file."). The ablation control.
- `spec`: the full operational spec from [`personas/`](../personas/).

Comparing `cold` to `role` to `spec` is the spec ablation described in [`PERSONAS.md`](../PERSONAS.md): it measures what the written spec adds beyond the role label, and what the role label adds beyond nothing.

## what the model sees

Everything above `## Persona readings` in the scenario file: title, interpretation question, case facts, and the walkthrough's annotation layer. The persona readings and calibration sections are the answer key and are never sent. The named interpretations are listed in the prompt so outputs are classifiable against the schema.

## usage

```bash
# baselines: 5 single-answer runs per scenario
bun harness/run.ts --arm cold --model claude-sonnet-4-6 --runs 5

# the ablation arms
bun harness/run.ts --arm role --model claude-sonnet-4-6 --runs 3
bun harness/run.ts --arm spec --model claude-sonnet-4-6 --runs 3

# score everything in results/raw/
bun harness/score-runs.ts
```

Flags: `--scenarios 01,02` and `--personas legal,worker` filter the run matrix; `--concurrency N` (default 4) bounds parallel calls; `--runner api|cli` picks the model runner.

## runners

- `api` (recommended): Anthropic Messages API via `fetch`, temperature 0. Needs `ANTHROPIC_API_KEY`; honors `ANTHROPIC_BASE_URL`. For other providers, implement the one-function `Runner` interface in [`lib.ts`](./lib.ts).
- `cli`: shells out to the `claude` CLI for environments authenticated through Claude Code rather than an API key. Runs from a sandbox directory with tools and MCP disabled so nothing but the system prompt shapes the substrate. The CLI does not expose temperature, so expect mild run-to-run variance; that variance is exactly what the stability eval measures, so keep `--runs` at 3 or higher.

## output

One JSON receipt per run in `results/raw/`, named `{scenario}_{arm}_{persona|cold}_{model}_r{n}.json`, recording the system prompt, the user prompt, the raw model text, the parsed output, and any error. Malformed model output gets one retry; a second failure is recorded as an error and excluded from scoring, never patched.

`score-runs.ts` aggregates: fidelity and stability per (scenario, persona, model), separation per (scenario, model) across personas, and cold-arm baselines next to the recorded `baseline_confidence` for comparison.
