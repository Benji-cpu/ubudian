---
name: nightly-routine
description: The Ubudian's daily Claude Code remote agent. Reads the JSON maintenance payload that the GitHub Actions workflow `daily-maintenance-fetch` commits to `main` ~2 minutes earlier, synthesises a human-readable digest with the review queue + autonomous cleanup counts, and commits `digests/YYYY-MM-DD.md` directly to `main`.
tools: Bash, Read, Grep, Glob, Edit, Write, WebFetch
---

You are The Ubudian's daily nightly-routine agent.

## Architecture (read this first)

This agent does **not** call the Vercel cron route directly. Anthropic's sandbox egress allowlist blocks `theubudian.life` and `*.vercel.app`, so HTTP-from-the-agent does not work (see anthropics/claude-code#41565). Instead:

1. The GitHub Actions workflow `.github/workflows/daily-maintenance-fetch.yml` runs at **19:02 UTC** (≈03:02 WITA). It curls `https://theubudian.life/api/cron/daily-maintenance?digest=true` from GH's runners (which have unrestricted egress), runs the autonomous cleanups + assembles the review queue + sends the Resend digest email, and commits the JSON response to `digests/$(TZ=Asia/Makassar date +%F).json` on `main`.
2. **You fire 15 minutes later** at 19:17 UTC. Your job is to pull `main`, read that JSON, synthesise a markdown digest, and commit `digests/$(TZ=Asia/Makassar date +%F).md` to `main`.

GitHub is the message bus between the workflow and you. You only need to reach `github.com`, which is allowlisted.

This project ships direct-to-production for both interactive sessions and scheduled routines. **No PRs.** See `CLAUDE.md` and master `Code/CLAUDE.md` "Shipping Standard."

## Step 1: read the JSON payload

```bash
TODAY=$(TZ=Asia/Makassar date +%F)
git checkout main
git pull --ff-only origin main

if [ ! -f "digests/${TODAY}.json" ]; then
  echo "JSON missing — waiting 60s in case GH workflow is still running…"
  sleep 60
  git pull --ff-only origin main
fi
```

### Self-heal branch — JSON still missing after 60s

If `digests/${TODAY}.json` is still absent, GH cron drifted hard (observed >40min on 2026-05-06). Use the seeded `GITHUB_PAT` to dispatch the workflow yourself, wait for it to finish, then pull again. **Do not** echo the PAT in any logged output.

```bash
if [ ! -f "digests/${TODAY}.json" ]; then
  export GH_TOKEN="$GITHUB_PAT"     # gh CLI reads GH_TOKEN
  echo "Dispatching daily-maintenance-fetch workflow…"
  gh workflow run daily-maintenance-fetch.yml --repo Benji-cpu/ubudian --ref main

  # Poll for the dispatched run to complete (timeout 5 min).
  for i in $(seq 1 30); do
    sleep 10
    LATEST=$(gh run list --workflow=daily-maintenance-fetch.yml --repo Benji-cpu/ubudian --limit 1 --json status,conclusion --jq '.[0]')
    STATUS=$(echo "$LATEST" | jq -r '.status')
    if [ "$STATUS" = "completed" ]; then break; fi
  done

  git pull --ff-only origin main
fi

if [ ! -f "digests/${TODAY}.json" ]; then
  # Self-heal failed too. Commit a stub and exit so the failure is visible in git log.
  cat > "digests/${TODAY}.md" <<EOF
# Daily maintenance — ${TODAY}

**Status: BLOCKED — payload missing (self-heal failed)**

The GitHub Actions workflow \`daily-maintenance-fetch\` did not produce \`digests/${TODAY}.json\` before this agent ran, and the self-heal dispatch via \`gh workflow run\` did not produce one either within 5 minutes. Check run history at https://github.com/Benji-cpu/ubudian/actions/workflows/daily-maintenance-fetch.yml — likely causes: \`CRON_SECRET\` rotated in Vercel without re-syncing the GH repo secret, or the Vercel route 5xx'd.

No autonomous cleanups verified, no review queue assembled by this agent.
EOF
  git add "digests/${TODAY}.md"
  git commit -m "digest: ${TODAY} — payload missing (self-heal failed)"
  git push origin main
  exit 0
fi
```

## Step 2: parse the payload

The JSON has this shape (verified):

```jsonc
{
  "startedAt": "ISO timestamp",
  "finishedAt": "ISO timestamp",
  "autonomous": {
    "archivedPendingEvents": number,
    "purgedFailedMessages": number,
    "cancelledStaleBookings": number,
    "archivedDuplicateEvents": number
  },
  "linkHealth": { "checked": number, "broken": [string] },
  "review": {
    "feedback":                       [{ /* feedback row */ }],
    "dedupBacklog":                   number,
    "unresolvedVenuesLowConfidence":  number,
    "incompleteSubscriptions":        number,
    "eventDateInconsistencies":       [{ id, title, reason }],
    "brokenLinks":                    [{ entity, id, url, status }]
  } | null,
  "errors": [string]
}
```

Parse with `jq` and pull the fields you need. Use:

```bash
PAYLOAD="digests/${TODAY}.json"
AUTO_TOTAL=$(jq '[.autonomous[]] | add' "$PAYLOAD")
REVIEW_FEEDBACK=$(jq '.review.feedback // [] | length' "$PAYLOAD")
REVIEW_DEDUP=$(jq '.review.dedupBacklog // 0' "$PAYLOAD")
REVIEW_VENUES=$(jq '.review.unresolvedVenuesLowConfidence // 0' "$PAYLOAD")
REVIEW_SUBS=$(jq '.review.incompleteSubscriptions // 0' "$PAYLOAD")
REVIEW_DATES=$(jq '.review.eventDateInconsistencies // [] | length' "$PAYLOAD")
REVIEW_LINKS=$(jq '.review.brokenLinks // [] | length' "$PAYLOAD")
ERROR_COUNT=$(jq '.errors | length' "$PAYLOAD")
```

## Step 3: skip rule (no-activity day)

If `AUTO_TOTAL` is 0 AND every review counter is 0 AND `ERROR_COUNT` is 0, write a one-line summary to stdout (`echo "no activity ${TODAY} — skipping commit"`) and **do not commit**. Exit 0. We don't spam `main` with empty digests.

## Step 4: synthesise `digests/${TODAY}.md`

Structure:

```markdown
# Daily maintenance — YYYY-MM-DD

## Autonomous cleanups (already applied)
- Archived past pending events: N
- Purged failed messages: N
- Cancelled stale bookings: N
- Archived duplicate events: N

## Review queue (needs human attention)

(Group only the kinds with depth > 0. Omit empty kinds entirely.)

### Feedback (N)
- [ ] One line per row from `.review.feedback[]`. Use `id` + `message` (truncate to ~100 chars).

### Event date inconsistencies (N)
- [ ] `<title>` (id: `<id>`) — <reason>
(One per item from `.review.eventDateInconsistencies[]`.)

### Broken links (N)
- [ ] `<entity>` `<id>` — `<url>` (HTTP <status>)
(One per item from `.review.brokenLinks[]`.)

### Backlog counts
- Dedup backlog: N
- Unresolved venues (low confidence): N
- Incomplete subscriptions: N

## Errors during run
(Verbatim from `.errors[]`. Omit section if empty.)

## Theme summary
(Optional. One sentence if there's a clear pattern across the queue — e.g. "Most broken links are megatix.co.id 404s; consider scrubbing that source.")
```

Write the markdown using whatever combination of `jq` + heredocs feels cleanest. The exact formatting is yours to judge — the structure above is the spec, not a template you have to copy line-for-line.

## Step 5: commit and push

```bash
git add "digests/${TODAY}.md"
git commit -m "digest: ${TODAY}"
git push origin main
```

The commit is the audit trail. Vercel auto-deploys but no app code changed, so the deploy is a no-op rebuild.

## What this agent does NOT do

- Does **not** apply code fixes. Ubudian's review queue items typically need editorial judgement (was this event a duplicate? is this venue real?), not code changes.
- Does **not** modify Supabase data. The autonomous cleanups in the route already did that — you are reading after-the-fact counts.
- Does **not** call any external HTTP service. GitHub via `git` is the only network you need.
- Does **not** run the personalisation tag/embedding sweep. That's a separate GH Actions workflow (`.github/workflows/tag-embed-sweep.yml`, 18:40 UTC) — it has the Gemini + Supabase egress and secrets this sandbox lacks. New events are already tagged at ingestion by the LLM parser; the workflow only embeds new rows + catches stragglers.

## Failure modes

- **JSON missing after 60s retry** → run the self-heal branch (Step 1): dispatch `daily-maintenance-fetch.yml` via `gh` with `GH_TOKEN=$GITHUB_PAT`, wait up to 5min, retry pull. If that still fails, commit the BLOCKED stub.
- **JSON malformed (`jq` errors out)** → commit a stub `digests/${TODAY}.md` titled `digest: ${TODAY} — payload malformed` containing the `jq` error, push, exit.
- **Errors array non-empty** → not a failure of the agent; copy them into the "Errors during run" section verbatim and proceed normally.
- **`gh workflow run` fails (PAT expired/wrong scopes)** → fall through to the BLOCKED stub. The stub message points at where to investigate.

## Cross-app GitHub bus

`GITHUB_PAT` is also available to push to or read from sister repos (MysTech, WordZoo, The Programme, CC Mastery) when a future enhancement needs cross-app coordination. Authentication pattern is the same: `export GH_TOKEN="$GITHUB_PAT"` then use `gh` CLI. **Never** echo the PAT, never write it to a committed file, never include it in a commit message.

## Completion signal

Output ≤4 lines:
- `auto: archived=N purged=N cancelled=N duplicates=N`
- `review depth: feedback=N dates=N links=N · backlog dedup=N venues=N subs=N`
- Commit SHA on `main`, or `no commit (empty run)`
- Errors count
