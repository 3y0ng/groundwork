# The Groundwork workspace

All founder data lives in a `groundwork/` directory at the root of the
project the founder is working in — plain markdown with YAML frontmatter,
readable and editable by hand, friendly to git and grep. `groundwork/
project.md` is the marker that a workspace exists.

## Layout

```
groundwork/
  project.md                      # the frame: problem, decision, deadline
  hypotheses/
    H1-<slug>.md                  # one file per hypothesis
  segments/
    S1-<slug>.md                  # one file per segment
  guides/
    G1-<slug>.md                  # one file per interview guide
  interviews/
    2026-08-29-<participant>.md   # one file per interview
  decisions.md                    # append-only decision log
  insights.md                     # insight log
```

Create new files from the skeletons in this skill's `templates/` directory.
On first init, create `project.md`, the empty subdirectories, `decisions.md`,
and `insights.md`; hypothesis/segment/guide/interview files are created as
they arise.

## IDs and naming

- Hypotheses: `H1`, `H2`, … — filename `H<id>-<kebab-slug-of-title>.md`.
- Segments: `S1`, `S2`, … — filename `S<id>-<kebab-slug-of-name>.md`.
- Slugs: lowercase; replace every non-alphanumeric run with a single hyphen;
  drop leading/trailing hyphens; truncate to ~5 words. Once a file exists its
  slug is fixed — match on the `H*/S*` id prefix, never re-derive the slug.
- Guides: `G1`, `G2`, … — filename `G<id>-<kebab-slug>.md`.
- Interviews: sequential integer `id` in frontmatter; filename
  `YYYY-MM-DD-<participant-slug>.md` (interview date, not today).
- Evidence: `EV-<interview id>-<n>`, numbered within its interview file.
  Evidence ids are stable once written — never renumber.

IDs are never reused, even after a file is deleted. To find the next free id,
scan the existing files' frontmatter, not just filenames.

## Where things live (no duplication)

- **Evidence lives in the interview file it came from** — the quote stays
  adjacent to its source notes. Hypothesis files never copy evidence bodies;
  they reference `EV-*` ids in their score table and consolidation.
- To gather evidence for hypothesis `Hn`: read every file in
  `groundwork/interviews/`, collect the `EV-*` blocks whose `hypotheses`
  line includes `Hn`. This walk is the single source of truth for scoring.

## Edit rules

| Content | Rule |
|---|---|
| `## Raw notes`, `## Transcript` in interviews | Never edited after capture. Corrections go in structured capture or interpretation fields. |
| Evidence `quote` lines | Verbatim, never edited. |
| Evidence `founder interpretation` | The founder's; leave blank until they fill it, never overwrite. |
| `decisions.md` | Append-only. Never rewrite or delete past entries. |
| `## Consolidation`, `## Evidence score` in hypotheses | Replaced in full on each re-run (dated snapshots) — update in place, never accumulate duplicates. |
| Frontmatter `strength` | Computed via `scoring.md` only — not hand-tuned. |
| Everything else | Update freely; the founder may hand-edit anything, so re-read files before writing. |

## File formats

Exact frontmatter and section structure for each file type is defined by the
skeletons in `templates/` — copy them rather than improvising. Summary:

- **project.md** — frontmatter `name, industry, stage, deadline, confidence`;
  sections: Problem statement · Solution idea (parked) · Decision to make.
- **hypothesis** — frontmatter `id, title, type, status, strength,
  confidence, threshold, segments`; sections: Belief · What would prove this
  wrong · Evidence required · Assumptions · Evidence score · Consolidation.
  `status`: `untested | testing | supported | partially_supported |
  inconclusive | contradicted`. `threshold` = # of relevant conversations to
  treat it as supported.
- **segment** — frontmatter `id, name, industry, role, company_size,
  geography, frequency, severity (1–5), budget_ownership, accessibility
  (1–5), hypotheses`; sections: Workflow · Trigger event · Existing
  alternative · Why they'd care · Why they might not.
- **guide** — frontmatter `id, hypothesis, segment, objective`; the nine
  question sections from `interviewing.md`.
- **interview** — frontmatter `id, date, participant, company, role, segment,
  hypotheses, feedback_score`; sections: Raw notes · Transcript (optional) ·
  Structured capture (key quotes, current workflow, trigger events, pain
  points, consequences, existing tools, existing spend, workarounds,
  frequency, severity, decision process, commitments, follow-ups) · Evidence
  (`EV-*` blocks) · Interview feedback.
- **decisions.md** — append-only entries: date, hypothesis, decision type,
  evidence basis, remaining uncertainty, next test, what would change your
  mind.
- **insights.md** — entries with `level` (project / hypothesis / segment /
  interview), an optional ref id, title, body.

### Evidence block format (inside `## Evidence` of an interview)

```markdown
### EV-4-2 — CAC spiked 30% after re-scaling a known-bad hook
> CAC jumped 30% for three days before we caught it
- kind: observed_past_behaviour · direction: supports · hypotheses: H3
- tags: consequence, spending
- Founder interpretation: _(yours to fill in)_
- AI interpretation: A quantified, dated consequence of a repeated mistake —
  real cost, not opinion. Establishes that the failure was expensive once;
  says nothing yet about how often the cost recurs.
```

The blockquote is the verbatim quote. The heading after the id is the
factual statement.

## Appendix: importing a Groundwork app export (Bundle v1)

The old Groundwork web app exported `groundwork-<slug>.json` with shape
`{ version: 1, exportedAt, project, hypotheses[], segments[], interviews[],
evidence[], decisions[], insights[] }`. To migrate one:

- `project` → `project.md` (`problemStatement` → Problem statement,
  `solutionIdea` → Solution idea (parked), `decisionToMake` → Decision to
  make; keep `industry, stage, deadline, confidence`).
- `hypotheses[]` → `hypotheses/H<n>-…md` in `createdAt` order, assigning
  `H1…`; map `belief, disconfirming → What would prove this wrong,
  evidenceRequired, assumptions, supportThreshold → threshold, type, status,
  strength, confidence, segmentIds → segments (remapped to S ids)`.
- `segments[]` → `segments/S<n>-…md` (fields map by name; `whyCare/
  whyNotCare` → the two Why sections).
- `interviews[]` → `interviews/<date>-<participant>.md` in date order,
  assigning integer ids; `rawNotes → Raw notes`, `transcript → Transcript`
  (omit the section when there is no transcript), `keyQuotes` and the other
  structured-capture fields into Structured capture (join multiple key
  quotes with ` · `), `hypothesisIds → hypotheses` (remapped).
- `evidence[]` → `EV-<interview id>-<n>` blocks inside the owning interview's
  `## Evidence` (grouped by `interviewId`, ordered by `createdAt`); keep
  `quote` byte-for-byte; map `statement, kind, direction, hypothesisIds,
  founderInterpretation, aiInterpretation, tags` (an empty founder
  interpretation stays the blank placeholder).
- `decisions[]` → entries appended to `decisions.md` in `createdAt` order.
- `insights[]` → entries in `insights.md`.
- Discard: the old opaque ids (after remapping), `exportedAt`/`createdAt`
  timestamps (interview and decision *dates* are kept), `interviewer`, and
  per-evidence-item `strength` and `segmentId` (strength is recomputed; the
  interview's own segment covers provenance).

After import, re-run `scoring.md` per hypothesis: the computed strength wins
and goes in the frontmatter (per the edit rules), and where it differs from
the imported value, say so in the `## Evidence score` section and tell the
founder — never reconcile silently.
