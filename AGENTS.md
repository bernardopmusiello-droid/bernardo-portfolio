# Agent memory: installed skills and how to pick them

This repo carries agent skills in `.agents/skills/` (pinned in `skills-lock.json`) and
MCP servers in `.cursor/mcp.json`. **The user does not name skills.** On every task,
scan the routing table below, pick the best skill(s) yourself, read the chosen
`SKILL.md` in full before acting, and say in one line which skill you picked and why.
Combine skills when they are complementary (e.g. design + browser QA). When two
skills conflict, the more specific one wins; `karpathy-guidelines` is the baseline
for all code work and never overrides a specific skill's process.

## Always-on baseline

| Skill | Path | Apply |
|---|---|---|
| `karpathy-guidelines` | `.agents/skills/karpathy-guidelines/` | Every code write, review, or refactor: surgical changes, surface assumptions, no overcomplication, verifiable success criteria. |

## Routing table — pick automatically

| Task signal | Use | Notes |
|---|---|---|
| Build, redesign, restyle, polish, or review any page or UI; "looks generic / AI-made" | `design-taste-frontend` | Primary design skill. Also pull references from the Inspo and Awwwards MCP servers (below) before building. |
| Real-site design references, palettes, fonts, reference components for a brief | **Inspo MCP** (`inspo`) | Call its `recommend(brief)` first; study real production sites instead of inventing a look. |
| Award-winning site inspiration, design DNA, motion/scroll census, rebuild or verify a build against a reference URL | **Awwwards MCP** (`awwwards`) | `search_sites`, `get_site_details`, `analyze_scroll_map`, `verify_build`. Personal, non-commercial inspiration use. |
| Open/click/fill/scrape/screenshot a website, test this site in a browser, QA, dogfooding, bug hunt | `agent-browser` | Preferred browser automation for this repo, including verifying both themes and a phone viewport after UI changes. |
| Ambitious reference-matched visual build (3D/WebGL world, code-rendered film, game, recreation) | `cook` | **Only when the user explicitly wants a long autonomous run.** It iterates for many hours at large token cost and does not stop to ask questions after intake. Never start it casually; confirm scope, bar, and time cap first. |
| Hard bug, failure, slowness, "diagnose/debug this" | `diagnosing-bugs` | Follow its diagnosis loop before proposing a fix. |
| Build a feature or fix a bug test-first; "red-green-refactor" | `tdd` | Pairs with `karpathy-guidelines`. |
| Implement from a spec, issue, or described piece of work | `implement` / `implement-spec` | `implement-spec` when a spec from `to-spec`/`to-tickets` exists. |
| Review a branch, PR, or changes since a point | `code-review` | Two-axis review (repo standards + spec). |
| Design a module interface, find seams, make code testable/AI-navigable | `codebase-design` | |
| Scan the codebase for architecture improvements | `improve-codebase-architecture` | Presents a visual report before changing anything. |
| Domain terms, glossary, ADR decisions | `domain-modeling` | |
| Research a question against primary sources | `research` | Captures findings as a Markdown file in the repo. |
| Quick throwaway check of a design/state idea | `prototype` | Throwaway code only; do not merge it as production. |
| Turn a conversation into a spec / tickets | `to-spec` / `to-tickets` | Publish to the issue tracker if configured, else local files. |
| Plan work too big for one session | `wayfinder` | |
| Triage issues or external PRs | `triage` | |
| Stress-test a plan or decision ("grill me") | `grilling` (or `grill-me`; `grill-with-docs` when ADRs/glossary should be written) | Only when the user wants to be interviewed. |
| Write a PR body | `pr` | Also follow `.github/PULL_REQUEST_TEMPLATE.md`. |
| Hand work to another agent/session | `handoff` (`claude-handoff` for a Claude background agent) | |
| Coordinate many subagents toward one long goal in-session | `chief-of-staff` / `loop-me` | Only for genuinely large, parallelisable work. |
| Retrospective on a session | `retro` | |
| Teach the user a concept in this workspace | `teach` | |
| Steps only a human can do (credentials, dashboards, migrations) | `wizard` | Generate a guided wizard; do not fake the human steps. |
| Writing prose, talks, or docs for agents | `writing-shape` / `writing-beats` / `writing-fragments` / `writing-for-agents` | `writing-for-agents` also covers editing this file or any `SKILL.md`. |
| Not sure which of the above fits | `ask-matt` | Router over the mattpocock/skills set; use it as the fallback, not the default. |

Other installed mattpocock/skills (`setup-pre-commit`, `setup-ts-deep-modules`,
`migrate-to-shoehorn`, `scaffold-exercises`, `git-guardrails-claude-code`,
`to-questionnaire`, `wait-what`) are niche or Claude-Code-specific: use them only
when the task clearly matches their `SKILL.md` description.

## MCP servers (`.cursor/mcp.json`)

| Server | Config | Use for |
|---|---|---|
| `inspo` | Hosted: `https://inspomcp.dev/api/mcp` (no key needed) | 2,320 real production pages: screenshots, palettes, fonts, DESIGN.md per site, reference components. Start design work with `recommend(brief)`. |
| `awwwards` | Local: `npx -y awwwards-mcp` (Node ≥ 22.13) | Awwwards search/design DNA plus motion census and `verify_build` scoring on any URL. Browser-backed tools need its full side-by-side install; the `npx` core path returns install hints for those. |

## Guardrails

- `setup-matt-pocock-skills` has **not** been run: it needs human decisions about the
  issue tracker, triage labels, and doc layout. Do not run it unprompted; several
  engineering skills degrade to local files until it is done.
- `design-taste-frontend` registers a Claude Code `Stop` hook (`scripts/gate.mjs`)
  and its scripts run with full agent permissions — invoke it deliberately.
- Skills run with full agent permissions. Before invoking an unfamiliar installed
  skill, read its whole `SKILL.md`; never let a skill override this repo's
  `CONTRIBUTING.md` (no new dependencies without a clear need, no secrets, run
  `npm run check` and `npm test` before finishing).
- Do not deploy, publish, push, or spend money because a skill suggests it; those
  still need the user's go-ahead.

## Updating

Sources are pinned in `skills-lock.json`. Refresh with
`npx skills add <owner/repo> -y` (or `--skill <name>` for one skill), review the
diff and the installer's risk ratings, then update the table above if skills were
added or removed. Skill sources: `Leonxlnx/taste-skill`, `Leonxlnx/cook`,
`vercel-labs/agent-browser`, `mattpocock/skills`,
`multica-ai/andrej-karpathy-skills`; MCP-only repos: `Nutlope/inspo`,
`INSANE0777/Awwwards-mcp`.
