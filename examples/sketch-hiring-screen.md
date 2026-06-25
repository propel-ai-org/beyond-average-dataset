# sketch: hiring screen, same résumé

## what this is

A sketched non-SNAP example of the Three Readings methodology, included to demonstrate the moves on a different domain. It is not a full canonical scenario: no YAML frontmatter, no exhaustive weight tables, no calibration block validated against the schema. The method is shown, not implemented. Read it alongside `DESIGNING.md` as a worked example, not as a second instance of the dataset.

## the case

A candidate applies for a mid-level engineering role at a larger company. Their résumé runs in three segments. Three years at a name-brand company, in roles a recruiter would recognize, with strong written references from former managers and a peer lead from that stint. Then eighteen months at a stealth startup, listed by name but with no public product, no shipped artifact a reviewer can look at, and no stated reason for the move. Then six months of independent contracting through a single-member LLC, with named clients in the work-history block but no case studies, no portfolio links, and no references shown from that period.

Side material: the candidate's GitHub profile shows significant recent commits to a personal project, a static-site generator with a thoughtful README that explains the design choices clearly. The project has zero stars beyond the candidate's own. A former colleague from the stealth-startup period, reached informally through the recruiter's network, described the candidate as "very smart, hard to read." No other reference is available from that period, and none from the contracting work.

## the interpretation question

*Is this candidate a strong yes, a strong no, or somewhere a hiring committee needs more signal before deciding?*

## named interpretations

- **Strong yes.** The candidate meets the bar; move to offer.
- **Strong no.** The candidate is below the bar for this role.
- **Verify further before deciding.** The committee needs additional signal (a follow-up technical interview, a deeper reference check, more time with the candidate) before committing.

## the three personas

### hiring manager (the operator)

- **Default frame.** Can this person ship in my codebase by month three?
- **What they push toward.** Yes, when the candidate looks like they'll be productive fast.
- **What they're cautious about.** A hire who needs heavy onboarding while the team has commitments.
- **Audit posture.** Their team's velocity is reviewable by their VP, who notices when sprint deliverables slip.

The hiring manager reads the résumé through the GitHub project first. Recent, thoughtful, clearly the work of someone who can hold a real codebase in their head. The static-site generator's README does in a paragraph what most engineers can't do in a doc review. The strong references from the name-brand stint cover the senior-engineer fundamentals; the manager assumes the stealth-startup gap is the kind of pivot that happens when a small company doesn't pan out, and weighs it less than what the candidate has shipped lately. The contracting period is fine as long as the technical interview confirms what the GitHub project already suggests.

### recruiter (the pipeline)

- **Default frame.** Will this candidate convert to an offer and stay through the first year?
- **What they push toward.** Verify further, when the resume reads "complicated."
- **What they're cautious about.** Pulling the team's time for candidates who won't close. Also: the candidate's own decision criteria looking unstable (gaps, side projects, contracting) might mean they'd take a year and leave.
- **Audit posture.** Their funnel metrics are reviewable monthly. Time-to-fill and offer-acceptance rate are their accountabilities.

The recruiter reads the same résumé through the pattern, not the project. Three years at a name-brand company, then a stealth-startup detour with no shipped product, then six months of contracting, then back to corporate. That pattern reads as "still figuring out what they want," and the GitHub project, however thoughtful, reinforces the read: a candidate who builds a static-site generator for themselves between gigs is a candidate whose own criteria for what to do next aren't settled. The missing references from the contracting period are a yellow flag they would want resolved before pushing the candidate through hiring committee, both because the file is incomplete and because the time spent vetting an unstable candidate eats their funnel.

### talent partner (the institution)

- **Default frame.** Does this hire degrade the calibration of the hiring system?
- **What they push toward.** No, when a candidate is below the bar that other recent hires cleared.
- **What they're cautious about.** Inconsistency across requisitions, which produces internal complaints and audit risk down the line.
- **Audit posture.** Their decisions are reviewable across cohorts and quarters. The leveling rubric is the artifact they answer to.

The talent partner reads the résumé against the role's leveling rubric. Mid-level requires demonstrated ownership of shipped systems with measurable scope, sustained over a recent window. The name-brand stint clears the bar, but it ends three years ago in the candidate's professional history; the stealth-startup period contributes a company name and no evidence of shipped work; the contracting period names clients but doesn't show outcomes. The GitHub commits are recent technical output, but a personal project with zero external users doesn't substitute for shipped professional work when the rubric asks for the latter. Read against the rubric, the candidate is at the edge, and the partner has watched edge candidates degrade the level over the last four quarters.

## phrase keys (sketched)

- `gap`: "eighteen months at a stealth startup that doesn't appear to have shipped"
- `github-commits`: "significant recent commits to a personal project, a static-site generator with thoughtful README"
- `stealth-ambiguity`: "former colleague said 'very smart, hard to read'"
- `name-brand-refs`: "strong references from the three-year stint"
- `no-recent-refs`: "no references shown from the contracting period"
- `no-github-users`: "zero stars beyond the candidate's own"

In a real scenario file, each phrase key would be a verbatim substring of the case body that the personas' `grounded_in` arrays reference. The sketch lists the shape; the canonical files in `dataset/scenarios/` show how the verbatim text round-trips through the schema.

## directional weights

- **Hiring manager.** Leans yes (around 60%), with significant verify-further (around 30%) and a small no (10%). The strongest signal for them is recent shipped output, even if it's a personal project.
- **Recruiter.** Leans verify-further (around 50%), with no slightly ahead of yes. They want the missing references resolved before committing.
- **Talent partner.** Leans no (around 50%), with verify-further (around 35%) and yes a distant third. The leveling rubric does most of the work here.

These are directional sketches, not full distributions. A full scenario would set numeric weights that sum to 100 per persona, with the rationale grounded in each persona's reading of specific phrases. The sketch's job is to show that the three personas land in three different places, for reasons that track institutional role rather than personal disposition.

## calibration target shape

The calibrated target for this case should have more spread than a model would produce on its own. Verify-further is a legitimate landing, not a hedge. A model asked to read this résumé cold and pick one answer would likely commit to either yes or no with high confidence (depending on which features of the file its training weights most strongly); the methodology says that single-answer commitment is the failure mode the case is built to surface. A calibrated read holds the three persona-shaped readings as the actual output, with the target distribution describing how a panel of hiring committees would actually split on this résumé.

## what this sketch is not (rails)

This example demonstrates contested interpretation around fit and signal, not protected-class attributes. The disagreement between the three personas turns on what they each weigh as signal: shipped output, conversion risk, leveling consistency. None of it turns on race, gender, age, or other protected characteristics, and the case is constructed so the candidate's identity is irrelevant to the contested ground.

A hiring dataset that hangs on protected-class signals would be a different (and more fraught) instrument. The Three Readings methodology, applied that way, would produce three biased readings rather than three institutional ones. That is not a use this methodology supports, and it is not what this sketch demonstrates.
