import { escapeHtml, formatNumber } from "./utils.js";

const heatmapPalette = ["#21181c", "#43303a", "#82606d", "#d08ba0", "#ffd6a8"];

export function renderReport(model) {
  const maxMix = Math.max(...model.activityMix.map((item) => item.count), 1);
  const maxLanguage = Math.max(...model.languages.map((item) => item.share), 1);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(model.profile.name)} · Commit Canvas</title>
    <meta
      name="description"
      content="Generated GitHub activity report for ${escapeHtml(model.profile.login)}."
    >
    <style>
      :root {
        --bg: #07111c;
        --bg-2: #0d1727;
        --surface: rgba(255, 255, 255, 0.06);
        --surface-strong: rgba(255, 255, 255, 0.1);
        --border: rgba(255, 255, 255, 0.12);
        --text: #f6efe6;
        --muted: rgba(246, 239, 230, 0.72);
        --accent: #ffb86b;
        --accent-2: #9ce6ff;
        --accent-3: #ff8faa;
        --shadow: 0 30px 80px rgba(0, 0, 0, 0.35);
        --radius-xl: 30px;
        --radius-lg: 24px;
        --radius-md: 18px;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        font-family: "Avenir Next", "Segoe UI", system-ui, sans-serif;
        color: var(--text);
        background:
          radial-gradient(circle at top left, rgba(255, 184, 107, 0.14), transparent 30%),
          radial-gradient(circle at 80% 0%, rgba(156, 230, 255, 0.12), transparent 25%),
          linear-gradient(180deg, #06111b 0%, #0d1623 45%, #07111c 100%);
      }

      body::before {
        content: "";
        position: fixed;
        inset: 0;
        pointer-events: none;
        background:
          linear-gradient(rgba(255, 255, 255, 0.012), rgba(255, 255, 255, 0.012)),
          repeating-linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.014) 0,
            rgba(255, 255, 255, 0.014) 1px,
            transparent 1px,
            transparent 72px
          );
      }

      a {
        color: inherit;
      }

      .shell {
        width: min(1240px, calc(100vw - 28px));
        margin: 0 auto;
        padding: 26px 0 60px;
      }

      .hero {
        display: grid;
        grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
        gap: 24px;
        margin-bottom: 24px;
      }

      .hero-card,
      .panel,
      .repo-card,
      .timeline-item,
      .insight-item,
      .warning,
      .stat-card {
        border: 1px solid var(--border);
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04));
        box-shadow: var(--shadow);
        backdrop-filter: blur(22px);
      }

      .hero-card {
        display: grid;
        gap: 22px;
        padding: 28px;
        border-radius: var(--radius-xl);
      }

      .eyebrow {
        margin: 0;
        font-size: 0.76rem;
        text-transform: uppercase;
        letter-spacing: 0.22em;
        color: rgba(255, 255, 255, 0.62);
      }

      h1,
      h2,
      h3,
      h4 {
        margin: 0;
        font-family: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif;
        letter-spacing: -0.03em;
        line-height: 0.96;
      }

      h1 {
        font-size: clamp(3rem, 7vw, 5.8rem);
        max-width: 10ch;
      }

      h2 {
        font-size: clamp(2rem, 4vw, 3.3rem);
      }

      h3 {
        font-size: 1.6rem;
      }

      p {
        margin: 0;
        line-height: 1.7;
        color: var(--muted);
      }

      .hero-top {
        display: flex;
        align-items: center;
        gap: 18px;
      }

      .avatar {
        width: 86px;
        height: 86px;
        border-radius: 24px;
        border: 1px solid rgba(255, 255, 255, 0.18);
      }

      .profile-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 10px 16px;
        color: var(--muted);
        font-size: 0.95rem;
      }

      .hero-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
      }

      .hero-summary {
        font-size: 1.08rem;
        color: rgba(246, 239, 230, 0.84);
      }

      .hero-highlights {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .hero-highlight {
        display: inline-flex;
        align-items: center;
        padding: 10px 14px;
        border-radius: 999px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(255, 255, 255, 0.04);
        color: rgba(255, 255, 255, 0.84);
        font-size: 0.88rem;
      }

      .button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 48px;
        padding: 0 18px;
        border-radius: 999px;
        text-decoration: none;
        font-weight: 700;
        border: 1px solid transparent;
      }

      .button-primary {
        background: linear-gradient(135deg, var(--accent), #ffe2a6);
        color: #201207;
      }

      .button-secondary {
        border-color: var(--border);
        color: var(--text);
      }

      .hero-side {
        display: grid;
        gap: 14px;
      }

      .stat-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
      }

      .stat-card {
        border-radius: var(--radius-lg);
        padding: 18px;
      }

      .stat-value {
        font-family: "Iowan Old Style", "Palatino Linotype", Georgia, serif;
        font-size: 2.2rem;
        color: var(--text);
      }

      .stat-label {
        display: block;
        margin-top: 8px;
        color: rgba(255, 255, 255, 0.74);
        font-size: 0.95rem;
      }

      .stat-detail {
        display: block;
        margin-top: 4px;
        color: rgba(255, 255, 255, 0.56);
        font-size: 0.84rem;
      }

      .warning {
        border-radius: var(--radius-lg);
        padding: 18px 20px;
      }

      .layout {
        display: grid;
        gap: 20px;
      }

      .panel {
        border-radius: var(--radius-xl);
        padding: 26px;
      }

      .panel-grid {
        display: grid;
        grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
        gap: 20px;
      }

      .metric-strip {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
        margin-top: 18px;
      }

      .metric-chip {
        padding: 16px;
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
      }

      .metric-chip strong {
        display: block;
        font-size: 1.5rem;
        color: var(--text);
      }

      .heatmap {
        width: 100%;
        overflow-x: auto;
        margin-top: 16px;
      }

      .heatmap svg,
      .trend svg {
        width: 100%;
        height: auto;
        display: block;
      }

      .bars,
      .languages {
        display: grid;
        gap: 12px;
        margin-top: 18px;
      }

      .bar-row {
        display: grid;
        gap: 8px;
      }

      .bar-meta {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        font-size: 0.95rem;
        color: var(--muted);
      }

      .bar-track {
        height: 12px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.08);
        overflow: hidden;
      }

      .bar-fill {
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(135deg, var(--accent-2), var(--accent));
      }

      .language-fill {
        background: linear-gradient(135deg, var(--bar-color), rgba(255,255,255,0.9));
      }

      .repo-grid,
      .insight-grid,
      .timeline {
        display: grid;
        gap: 16px;
      }

      .repo-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .repo-card,
      .insight-item,
      .timeline-item {
        border-radius: var(--radius-lg);
        padding: 20px;
      }

      .repo-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 14px;
        margin-bottom: 12px;
      }

      .repo-name {
        font-size: 1.28rem;
      }

      .pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.08);
        font-size: 0.84rem;
        color: rgba(255, 255, 255, 0.82);
      }

      .dot {
        width: 10px;
        height: 10px;
        border-radius: 999px;
        background: var(--dot-color);
      }

      .repo-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 16px;
      }

      .two-column {
        display: grid;
        grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
        gap: 20px;
      }

      .timeline-item {
        display: grid;
        gap: 8px;
      }

      .timeline-row {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        color: rgba(255, 255, 255, 0.62);
        font-size: 0.9rem;
      }

      .insight-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      footer {
        margin-top: 22px;
        padding: 0 4px;
        color: rgba(255, 255, 255, 0.56);
        font-size: 0.92rem;
      }

      code {
        font-family: ui-monospace, "SF Mono", "Cascadia Code", monospace;
        font-size: 0.9em;
        color: #ffe4bb;
      }

      @media (max-width: 1024px) {
        .hero,
        .panel-grid,
        .two-column,
        .repo-grid,
        .insight-grid {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 720px) {
        .shell {
          width: min(100vw - 18px, 100%);
          padding-top: 18px;
        }

        .hero-card,
        .panel {
          padding: 22px;
        }

        .stat-grid,
        .metric-strip {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <div class="shell">
      <section class="hero">
        <article class="hero-card">
          <p class="eyebrow">Generated activity portrait</p>
          <div class="hero-top">
            <img class="avatar" src="${escapeHtml(model.profile.avatarUrl)}" alt="${escapeHtml(model.profile.login)} avatar">
            <div>
              <h1>${escapeHtml(model.profile.name)}</h1>
              <p style="margin-top: 10px;">@${escapeHtml(model.profile.login)}</p>
            </div>
          </div>

          <p class="hero-summary">${escapeHtml(model.profile.summary || model.profile.bio)}</p>

          <div class="profile-meta">
            ${model.profile.company ? `<span>${escapeHtml(model.profile.company)}</span>` : ""}
            ${model.profile.location ? `<span>${escapeHtml(model.profile.location)}</span>` : ""}
            <span>On GitHub since ${escapeHtml(new Date(model.profile.createdAt).getUTCFullYear().toString())}</span>
            <span>${escapeHtml(model.meta.sourceLabel)}</span>
          </div>

          ${
            model.profile.highlights?.length
              ? `<div class="hero-highlights">
            ${model.profile.highlights
              .map((item) => `<span class="hero-highlight">${escapeHtml(item)}</span>`)
              .join("")}
          </div>`
              : ""
          }

          <div class="hero-actions">
            <a class="button button-primary" href="${escapeHtml(model.profile.profileUrl)}" target="_blank" rel="noreferrer">
              Open profile
            </a>
            ${
              model.profile.blog
                ? `<a class="button button-secondary" href="${escapeHtml(normalizeExternalUrl(model.profile.blog))}" target="_blank" rel="noreferrer">${escapeHtml(deriveWebsiteLabel(model.profile.blog))}</a>`
                : ""
            }
          </div>
        </article>

        <aside class="hero-side">
          <div class="stat-grid">
            ${model.overviewStats
              .map(
                (item) => `
              <article class="stat-card">
                <span class="stat-value">${escapeHtml(formatNumber(item.value))}</span>
                <span class="stat-label">${escapeHtml(item.label)}</span>
                <span class="stat-detail">${escapeHtml(item.detail)}</span>
              </article>
            `,
              )
              .join("")}
          </div>

          ${model.meta.warnings
            .map(
              (warning) => `
            <aside class="warning">
              <p class="eyebrow">Data note</p>
              <p>${escapeHtml(warning)}</p>
            </aside>
          `,
            )
            .join("")}
        </aside>
      </section>

      <main class="layout">
        <section class="panel panel-grid">
          <div>
            <p class="eyebrow">${escapeHtml(model.contributionPanel.title)}</p>
            <h2>${escapeHtml(model.contributionPanel.subtitle)}</h2>
            <div class="metric-strip">
              <div class="metric-chip">
                <strong>${escapeHtml(formatNumber(model.contributionPanel.total))}</strong>
                <span>Total visible activity</span>
              </div>
              <div class="metric-chip">
                <strong>${escapeHtml(formatNumber(model.contributionPanel.currentStreak))}</strong>
                <span>Current streak</span>
              </div>
              <div class="metric-chip">
                <strong>${escapeHtml(formatNumber(model.contributionPanel.longestStreak))}</strong>
                <span>Longest streak</span>
              </div>
            </div>
            <div class="heatmap">
              ${renderHeatmap(model.contributionPanel.series)}
            </div>
          </div>

          <div>
            <p class="eyebrow">Trendline</p>
            <h3>Monthly activity skyline</h3>
            <div class="trend">${renderTrendChart(model.contributionPanel.months)}</div>

            <div class="bars">
              <div class="bar-row">
                <div class="bar-meta">
                  <span>Busiest day</span>
                  <span>${escapeHtml(`${model.contributionPanel.topDay.weekday} · ${formatNumber(model.contributionPanel.topDay.count)}`)}</span>
                </div>
              </div>
              ${model.contributionPanel.weekdays
                .map((item) => {
                  const maxWeekday = Math.max(...model.contributionPanel.weekdays.map((entry) => entry.count), 1);
                  const width = Math.round((item.count / maxWeekday) * 100);
                  return `
                    <div class="bar-row">
                      <div class="bar-meta">
                        <span>${escapeHtml(item.label)}</span>
                        <span>${escapeHtml(formatNumber(item.count))}</span>
                      </div>
                      <div class="bar-track"><div class="bar-fill" style="width: ${width}%;"></div></div>
                    </div>
                  `;
                })
                .join("")}
            </div>
          </div>
        </section>

        <section class="panel two-column">
          <div>
            <p class="eyebrow">Activity mix</p>
            <h3>Where the visible work shows up</h3>
            <div class="bars">
              ${model.activityMix
                .map(
                  (item) => `
                <div class="bar-row">
                  <div class="bar-meta">
                    <span>${escapeHtml(item.label)}</span>
                    <span>${escapeHtml(formatNumber(item.count))}</span>
                  </div>
                  <div class="bar-track"><div class="bar-fill" style="width: ${Math.max(6, Math.round((item.count / maxMix) * 100))}%;"></div></div>
                </div>
              `,
                )
                .join("")}
            </div>
          </div>

          <div>
            <p class="eyebrow">Language spread</p>
            <h3>Weighted by owned repository size</h3>
            <div class="languages">
              ${model.languages
                .map(
                  (item) => `
                <div class="bar-row">
                  <div class="bar-meta">
                    <span style="display:inline-flex;align-items:center;gap:10px;">
                      <span class="dot" style="--dot-color:${escapeHtml(item.color)};"></span>
                      ${escapeHtml(item.label)}
                    </span>
                    <span>${escapeHtml(`${item.share}% · ${item.repos} repos`)}</span>
                  </div>
                  <div class="bar-track">
                    <div class="bar-fill language-fill" style="width:${Math.max(6, Math.round((item.share / maxLanguage) * 100))}%; --bar-color:${escapeHtml(item.color)};"></div>
                  </div>
                </div>
              `,
                )
                .join("")}
            </div>
          </div>
        </section>

        <section class="panel">
          <p class="eyebrow">Repo spotlights</p>
          <h3>Projects carrying the strongest public signal</h3>
          <div class="repo-grid" style="margin-top: 18px;">
            ${model.repoSpotlights
              .map(
                (repo) => `
              <article class="repo-card">
                <div class="repo-head">
                  <div>
                    <h4 class="repo-name">${escapeHtml(repo.name)}</h4>
                    <p style="margin-top: 8px;">${escapeHtml(repo.description)}</p>
                  </div>
                  <span class="pill">
                    <span class="dot" style="--dot-color:${escapeHtml(repo.languageColor)};"></span>
                    ${escapeHtml(repo.language)}
                  </span>
                </div>

                <div class="repo-meta">
                  <span class="pill">★ ${escapeHtml(formatNumber(repo.stars))}</span>
                  <span class="pill">⑂ ${escapeHtml(formatNumber(repo.forks))}</span>
                  <span class="pill">Issues ${escapeHtml(formatNumber(repo.issues))}</span>
                </div>

                <div class="timeline-row" style="margin-top: 16px;">
                  <span>${escapeHtml(repo.pushedAt)}</span>
                  <span>${escapeHtml(repo.pushedRelative)}</span>
                </div>

                <a href="${escapeHtml(repo.url)}" target="_blank" rel="noreferrer" style="display:inline-block;margin-top:16px;">
                  View repository
                </a>
              </article>
            `,
              )
              .join("")}
          </div>
        </section>

        <section class="panel two-column">
          <div>
            <p class="eyebrow">Recent public activity</p>
            <h3>Latest visible moves</h3>
            <div class="timeline" style="margin-top: 18px;">
              ${
                model.recentActivity.length
                  ? model.recentActivity
                      .map(
                        (item) => `
                <article class="timeline-item">
                  <div class="timeline-row">
                    <span>${escapeHtml(item.date)}</span>
                    <span>${escapeHtml(item.relative)}</span>
                  </div>
                  <strong>${escapeHtml(item.summary)}</strong>
                  ${
                    item.repoUrl
                      ? `<a href="${escapeHtml(item.repoUrl)}" target="_blank" rel="noreferrer">${escapeHtml(item.repo)}</a>`
                      : `<span>${escapeHtml(item.repo)}</span>`
                  }
                </article>
              `,
                      )
                      .join("")
                  : `<article class="timeline-item"><p>No recent public events were available for this run.</p></article>`
              }
            </div>
          </div>

          <div>
            <p class="eyebrow">Contribution repos</p>
            <h3>Repositories with visible contribution weight</h3>
            <div class="timeline" style="margin-top: 18px;">
              ${
                model.contributionRepos.length
                  ? model.contributionRepos
                      .map(
                        (item) => `
                    <article class="timeline-item">
                      <div class="timeline-row">
                        <span>${escapeHtml(item.private ? "Private" : "Public")}</span>
                        <span>${escapeHtml(formatNumber(item.commits))} commits</span>
                      </div>
                      <strong>${escapeHtml(item.name)}</strong>
                      <div class="repo-meta">
                        <span class="pill">
                          <span class="dot" style="--dot-color:${escapeHtml(item.color)};"></span>
                          ${escapeHtml(item.language)}
                        </span>
                        <span class="pill">★ ${escapeHtml(formatNumber(item.stars))}</span>
                      </div>
                      <a href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">Open repository</a>
                    </article>
                  `,
                      )
                      .join("")
                  : `<article class="timeline-item"><p>No token-backed contribution repository data was available in this run.</p></article>`
              }
            </div>
          </div>
        </section>

        <section class="panel">
          <p class="eyebrow">Generated insights</p>
          <h3>Human-readable takeaways from the data</h3>
          <div class="insight-grid" style="margin-top: 18px;">
            ${model.insights
              .map(
                (item) => `
              <article class="insight-item">
                <p>${escapeHtml(item)}</p>
              </article>
            `,
              )
              .join("")}
          </div>
        </section>
      </main>

      <footer>
        <p>Generated ${escapeHtml(new Date(model.meta.generatedAt).toUTCString())} with <code>commit-canvas</code>. GitHub contribution timestamps are UTC, and public events can arrive with a delay.</p>
      </footer>
    </div>
  </body>
</html>`;
}

function renderHeatmap(series) {
  if (!series.length) {
    return `<p>No activity data available to render a heatmap.</p>`;
  }

  const cell = 14;
  const gap = 5;
  const columns = Math.ceil(series.length / 7);
  const width = columns * (cell + gap) + 76;
  const height = 7 * (cell + gap) + 44;
  const labels = ["S", "M", "T", "W", "T", "F", "S"];

  const rects = series
    .map((day, index) => {
      const column = Math.floor(index / 7);
      const row = index % 7;
      const x = 54 + column * (cell + gap);
      const y = 16 + row * (cell + gap);
      const fill = day.color || heatmapPalette[day.level] || heatmapPalette[0];

      return `
        <rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="4" fill="${fill}">
          <title>${escapeHtml(`${day.date}: ${formatNumber(day.count)} visible contributions`)}</title>
        </rect>
      `;
    })
    .join("");

  const monthMarkers = series
    .map((day, index) => ({ ...day, index }))
    .filter((day) => day.date.endsWith("-01"))
    .map((day) => {
      const column = Math.floor(day.index / 7);
      const x = 54 + column * (cell + gap);
      return `<text x="${x}" y="11" fill="rgba(255,255,255,0.55)" font-size="11">${escapeHtml(shortMonth(day.date))}</text>`;
    })
    .join("");

  const weekdayLabels = labels
    .map(
      (label, index) =>
        `<text x="10" y="${28 + index * (cell + gap)}" fill="rgba(255,255,255,0.55)" font-size="11">${label}</text>`,
    )
    .join("");

  return `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Activity heatmap">
      ${monthMarkers}
      ${weekdayLabels}
      ${rects}
    </svg>
  `;
}

function renderTrendChart(months) {
  if (!months.length) {
    return `<p>No monthly trend data available.</p>`;
  }

  const width = 660;
  const height = 220;
  const maxValue = Math.max(...months.map((item) => item.count), 1);
  const barWidth = Math.max(18, Math.floor((width - 60) / months.length) - 10);

  const bars = months
    .map((month, index) => {
      const scaled = (month.count / maxValue) * 150;
      const x = 34 + index * (barWidth + 12);
      const y = 172 - scaled;
      return `
        <rect x="${x}" y="${y}" width="${barWidth}" height="${scaled}" rx="10" fill="url(#trend-gradient)">
          <title>${escapeHtml(`${month.label}: ${formatNumber(month.count)}`)}</title>
        </rect>
        <text x="${x + barWidth / 2}" y="196" text-anchor="middle" fill="rgba(255,255,255,0.52)" font-size="11">${escapeHtml(month.label)}</text>
      `;
    })
    .join("");

  return `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Monthly activity chart">
      <defs>
        <linearGradient id="trend-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#9ce6ff"></stop>
          <stop offset="100%" stop-color="#ffb86b"></stop>
        </linearGradient>
      </defs>
      <line x1="20" y1="172" x2="${width - 20}" y2="172" stroke="rgba(255,255,255,0.14)"></line>
      ${bars}
    </svg>
  `;
}

function normalizeExternalUrl(value) {
  if (!value.startsWith("http://") && !value.startsWith("https://")) {
    return `https://${value}`;
  }
  return value;
}

function deriveWebsiteLabel(value) {
  try {
    const hostname = new URL(normalizeExternalUrl(value)).hostname.replace(/^www\./, "");
    const knownHosts = {
      "linkedin.com": "Visit LinkedIn",
      "x.com": "Visit X",
      "twitter.com": "Visit X",
      "youtube.com": "Visit YouTube",
      "medium.com": "Visit Medium",
    };

    return knownHosts[hostname] || `Visit ${hostname}`;
  } catch {
    return "Visit website";
  }
}

function shortMonth(value) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    timeZone: "UTC",
  }).format(new Date(value));
}
