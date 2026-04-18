# Commit Canvas

Generate a polished, shareable HTML report from a GitHub profile.

`Commit Canvas` turns public repositories, public events, and optional GraphQL contribution data into a visual report with a heatmap, trend charts, language breakdowns, repo spotlights, and human-readable activity insights.

## Why This Is Useful

Most GitHub profile stats tools stop at a badge or a tiny SVG card.

This project is for people who want something richer:

- a standalone report you can open locally, publish, or send to someone
- a real contribution heatmap when a token is available
- meaningful summaries of activity instead of raw API dumps
- a zero-dependency CLI that is easy to run in GitHub Actions, CI, or locally

## What It Generates

- profile snapshot and momentum stats
- contribution heatmap
- monthly activity skyline
- activity type breakdown
- language distribution across owned repos
- repo spotlight cards
- recent public activity timeline
- generated insights such as streaks, busiest weekdays, and repo freshness

## Install

```bash
npm install
```

Or run it directly from source:

```bash
node ./bin/commit-canvas.js sindresorhus
```

## Usage

```bash
commit-canvas <github-username> [options]
```

### Options

- `-o, --output <file>`: HTML output path
- `--json <file>`: optional JSON export path
- `--days <number>`: recent activity window for public events fallback, default `90`
- `--token <token>`: GitHub token, or use `GITHUB_TOKEN`
- `-h, --help`: show help

## Examples

Generate a public-data-only report:

```bash
node ./bin/commit-canvas.js torvalds --output ./reports/torvalds.report.html
```

Generate a full report with contribution calendar data:

```bash
GITHUB_TOKEN=your_token_here node ./bin/commit-canvas.js sindresorhus \
  --output ./reports/sindresorhus.report.html \
  --json ./reports/sindresorhus.report.json
```

## Development

Run the built-in checks locally:

```bash
npm run check
npm test
```

CI is wired up in `.github/workflows/ci.yml` and runs the same checks on pushes to `main` and on pull requests.

## GitHub Pages

Build a publishable Pages artifact for `TrueNix`:

```bash
COMMIT_CANVAS_TOKEN="$(gh auth token)" npm run pages:build
```

That writes:

- `docs/index.html`
- `docs/report.json`
- `docs/.nojekyll`

If you want to target a different account or output path, override the environment variables:

- `COMMIT_CANVAS_USERNAME`
- `COMMIT_CANVAS_TOKEN`
- `COMMIT_CANVAS_PAGES_OUTPUT`
- `COMMIT_CANVAS_PAGES_JSON`
- `COMMIT_CANVAS_DAYS`
- `COMMIT_CANVAS_CNAME`

Automatic Pages deployment is wired in `.github/workflows/pages.yml`.

To activate it on GitHub:

1. Push this repo to GitHub.
2. In repository settings, set GitHub Pages to publish with `GitHub Actions`.
3. Add a repository secret named `COMMIT_CANVAS_TOKEN` with a personal access token if you want richer contribution data than the default workflow token can provide.
4. Push to `main` or run the workflow manually from the Actions tab.

If this repository name stays `codex2`, the project site URL will typically be:

```text
https://truenix.github.io/codex2/
```

## Token Modes

Without a token, the tool uses public REST data:

- user profile
- public repositories
- public user events

With a token, the tool also queries the GraphQL contribution calendar and yearly contribution totals.

If the token has the optional `read:user` permission, GitHub may also include private contribution counts in the contribution collection, while keeping private repo details restricted.

## Output

The generated report is a single self-contained HTML file.

That makes it easy to:

- attach to a portfolio
- publish from GitHub Pages or any static host
- generate on a schedule in GitHub Actions
- archive as a historical snapshot

## Data Notes

- GitHub's public events endpoint is not real-time and can lag.
- Contribution graph timestamps are tracked in UTC.
- Public mode is useful on its own, but the token-enhanced mode is what unlocks the full yearly contribution view.

## Project Structure

- [bin/commit-canvas.js](/Users/ruslankuznetsov/git/apps/codex2/bin/commit-canvas.js): CLI entrypoint
- [src/cli.js](/Users/ruslankuznetsov/git/apps/codex2/src/cli.js): argument parsing and output flow
- [src/github-api.js](/Users/ruslankuznetsov/git/apps/codex2/src/github-api.js): REST and GraphQL fetching
- [src/aggregate.js](/Users/ruslankuznetsov/git/apps/codex2/src/aggregate.js): metrics and insight generation
- [src/report.js](/Users/ruslankuznetsov/git/apps/codex2/src/report.js): standalone HTML renderer

## Ideas To Extend

- SVG export mode
- GitHub Action for scheduled report refresh
- side-by-side user comparisons
- repo-level drilldown pages
- themed report presets

## License

MIT
