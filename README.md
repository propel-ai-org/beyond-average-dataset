# Three Readings

Ten SNAP eligibility scenarios where three institutional roles read the same case three different ways. The dataset records that disagreement, along with tooling to measure it and a methodology for extending it to other contested-determination problems.

## the argument

When an LLM is asked to score a contested decision, it returns one number. That number is an average across the institutional perspectives in its training, blended into a single line of output and presented as a judgment. On contested decisions, that averaging conceals real disagreement: the kind of disagreement institutions ordinarily resolve through deliberation between roles (advocate, processor, supervisor), not through a single confident verdict.

The pattern shows up wherever LLMs are deployed as evaluators: eligibility, diagnosis, underwriting, hiring, admissions, claims. The procurement language in use, accuracy and calibration error and confidence intervals, is borrowed from factual-QA, and on contested decisions it measures the wrong thing. It tells you the model is sure. It does not tell you whether the determination itself is contested, and on the cases that matter most, it is. SNAP is the case study here because the failure mode is most legible there, and because state agencies are accelerating LLM-assisted eligibility under HR1 / OBBBA timelines. The argument does not stop at SNAP.

A confident single answer on a contested case is not a model error; measured here, current models commit at 65 to 78 reported confidence on cases whose honest distribution tops out near 40 (see [`results/`](results/)). It is a category error in how the question was asked. The fix is not better calibration on the same question; the fix is to ask a different question, one that leaves room for what is contested.

The dataset is a small instrument pointed at one failure mode.

## what's in here

- [`EVALUATING.md`](EVALUATING.md): run the included SNAP cases against a model.
- [`DESIGNING.md`](DESIGNING.md): build your own dataset for a different contested-determination problem.
- [`PERSONAS.md`](PERSONAS.md): write personas as operational specs, and calibrate them against evals.
- [`SCHEMA.md`](SCHEMA.md): frontmatter schema reference for the scenario files.
- [`scenarios/`](scenarios/): the published SNAP scenarios in markdown with YAML frontmatter.
- [`personas/`](personas/): the three operational persona specs, versioned, with persona cards.
- [`examples/`](examples/): sketched non-SNAP applications of the methodology.
- [`scorer/`](scorer/): a TypeScript reference scorer for the three model evals and the three persona evals.
- [`harness/`](harness/): a small runner that executes persona runs and writes receipts.
- [`results/`](results/): measured calibration results, with raw run receipts.
- [`scripts/`](scripts/): the frontmatter validator (`bun run validate`).

## where to start

- If you want to **evaluate a model** against the included SNAP cases, start with [`EVALUATING.md`](EVALUATING.md).
- If you want to **build your own dataset** for a different contested-determination problem, start with [`DESIGNING.md`](DESIGNING.md).
- If you want to **work with the personas**, as specs to run or as a methodology to copy, start with [`PERSONAS.md`](PERSONAS.md).

## how the SNAP cases were built

The scenarios are synthetic cases written against real federal SNAP regulations, state policy manuals, HR1 / OBBBA changes, and conversations with practitioners. The canonical sources live in the companion site repository; the markdown in [`scenarios/`](scenarios/) is generated from them. Corrections are welcome as issues here; fixes land in the canonical sources and the bundle is regenerated.

## what this dataset is not

- **Not a benchmark.** Ten cases is enough to be a unit test, not enough to rank models.
- **Not a ground truth.** There is no "correct" answer to most of these cases.
- **Not legal advice.** The cases are synthetic; the regulations cited are real but should not be relied on for live determinations.

## status

Published: 01 (Household composition), 02 (ABAWD), 03 (Income), 04 (Resources), 05 (ABAWD medical exemption). In progress: 06 through 10.

## authorship

Written by Keith Kurson as part of the Propel AI Residency, 2026.

## license

- Dataset content (`scenarios/`, `examples/`, prose docs): CC BY 4.0 ([`LICENSE-CC-BY-4.0`](LICENSE-CC-BY-4.0)).
- Code (`scorer/`, `scripts/`): MIT ([`LICENSE-MIT`](LICENSE-MIT)).
