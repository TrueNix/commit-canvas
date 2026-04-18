import {
  clamp,
  formatDayLabel,
  formatMonthLabel,
  formatShortDate,
  hashToColor,
  pluralize,
  relativeDaysFromNow,
  startOfUtcDay,
  subtractDays,
  titleCase,
  toIsoDate,
} from "./utils.js";

const weekdayOrder = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function buildVisualizationModel(snapshot) {
  const { user, repos, events, contributions, tokenUsed, contributionError, days } = snapshot;
  const now = new Date();
  const activeWindowStart = startOfUtcDay(subtractDays(now, days - 1));

  const ownedRepos = repos.filter((repo) => !repo.fork);
  const totalStars = ownedRepos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
  const totalForks = ownedRepos.reduce((sum, repo) => sum + repo.forks_count, 0);
  const activeRepos = ownedRepos.filter((repo) => new Date(repo.pushed_at) >= activeWindowStart);
  const languageBreakdown = buildLanguageBreakdown(ownedRepos);

  const contributionSeries = contributions?.contributionCalendar
    ? flattenContributionDays(contributions.contributionCalendar)
    : buildEventSeries(events, activeWindowStart, now);

  const monthlyTrend = buildMonthlyTrend(contributionSeries);
  const weekdayBreakdown = buildWeekdayBreakdown(contributionSeries);
  const streaks = computeStreaks(contributionSeries);
  const topDay = contributionSeries.reduce((best, day) => (day.count > best.count ? day : best), {
    date: toIsoDate(now),
    count: 0,
  });
  const recentActivity = buildRecentActivity(events).slice(0, 10);
  const activityMix = buildActivityMix(events, contributions);
  const repoSpotlights = buildRepoSpotlights(ownedRepos);
  const contributionRepos = buildContributionRepos(contributions);
  const warnings = buildWarnings({ tokenUsed, contributions, contributionError });
  const insights = buildInsights({
    activityMix,
    activeRepos,
    contributionSeries,
    languageBreakdown,
    repoSpotlights,
    streaks,
    topDay,
    totalStars,
    days,
  });

  const totalHeatCount = contributionSeries.reduce((sum, day) => sum + day.count, 0);
  const sourceLabel = contributions?.contributionCalendar
    ? "Yearly contribution calendar via GitHub GraphQL"
    : `Public events over the last ${days} days`;

  return {
    meta: {
      generatedAt: now.toISOString(),
      username: user.login,
      sourceLabel,
      tokenUsed,
      warnings,
    },
    profile: {
      login: user.login,
      name: user.name || user.login,
      bio: user.bio || "No public bio available.",
      avatarUrl: user.avatar_url,
      profileUrl: user.html_url,
      company: user.company || "",
      location: user.location || "",
      blog: user.blog || "",
      createdAt: user.created_at,
      followers: user.followers,
      following: user.following,
      publicRepos: user.public_repos,
    },
    overviewStats: [
      { label: "Public repos", value: user.public_repos, detail: `${activeRepos.length} updated in ${days} days` },
      { label: "Stars earned", value: totalStars, detail: `${totalForks} forks across owned repos` },
      { label: "Followers", value: user.followers, detail: `${user.following} following` },
      {
        label: contributions?.contributionCalendar ? "Yearly contributions" : "Recent activity",
        value: contributions?.contributionCalendar?.totalContributions || totalHeatCount,
        detail: contributions?.contributionCalendar ? "Last 12 months" : `${days}-day public event window`,
      },
    ],
    contributionPanel: {
      title: contributions?.contributionCalendar ? "Contribution heatmap" : "Activity heatmap",
      subtitle: contributions?.contributionCalendar
        ? "A full-year calendar built from GitHub GraphQL contribution data."
        : "A recent public-activity matrix built from GitHub public events.",
      total: totalHeatCount,
      months: monthlyTrend,
      weekdays: weekdayBreakdown,
      series: contributionSeries,
      currentStreak: streaks.current,
      longestStreak: streaks.longest,
      topDay: {
        date: formatShortDate(topDay.date),
        count: topDay.count,
        weekday: formatDayLabel(topDay.date),
      },
    },
    activityMix,
    languages: languageBreakdown,
    repoSpotlights,
    contributionRepos,
    recentActivity,
    insights,
    exportData: {
      generatedAt: now.toISOString(),
      user: {
        login: user.login,
        name: user.name,
        url: user.html_url,
      },
      stats: {
        totalStars,
        totalForks,
        activeRepos: activeRepos.length,
        currentStreak: streaks.current,
        longestStreak: streaks.longest,
      },
      activityMix,
      languages: languageBreakdown,
      topRepos: repoSpotlights,
      recentActivity,
      contributionSeries,
    },
  };
}

function flattenContributionDays(calendar) {
  const days = calendar.weeks.flatMap((week) =>
    week.contributionDays.map((day) => ({
      date: day.date,
      count: day.contributionCount,
      level: day.contributionCount === 0 ? 0 : undefined,
      color: day.color,
    })),
  );

  const maxCount = days.reduce((max, day) => Math.max(max, day.count), 0);

  return days.map((day) => ({
    ...day,
    level: day.level ?? deriveLevel(day.count, maxCount),
  }));
}

function buildEventSeries(events, startDate, endDate) {
  const counts = new Map();
  const end = startOfUtcDay(endDate);

  for (let cursor = new Date(startDate); cursor <= end; cursor = addDays(cursor, 1)) {
    counts.set(toIsoDate(cursor), 0);
  }

  for (const event of events) {
    const eventDate = toIsoDate(event.created_at);
    if (counts.has(eventDate)) {
      counts.set(eventDate, counts.get(eventDate) + 1);
    }
  }

  const maxCount = Math.max(...counts.values(), 0);

  return [...counts.entries()].map(([date, count]) => ({
    date,
    count,
    level: deriveLevel(count, maxCount),
    color: "",
  }));
}

function buildMonthlyTrend(series) {
  const buckets = new Map();

  for (const day of series) {
    const key = `${day.date.slice(0, 7)}-01`;
    buckets.set(key, (buckets.get(key) || 0) + day.count);
  }

  return [...buckets.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([month, count]) => ({
      label: formatMonthLabel(month),
      count,
      date: month,
    }));
}

function buildWeekdayBreakdown(series) {
  const buckets = new Map(weekdayOrder.map((day) => [day, 0]));

  for (const day of series) {
    const label = formatDayLabel(day.date);
    buckets.set(label, (buckets.get(label) || 0) + day.count);
  }

  return weekdayOrder.map((label) => ({
    label,
    count: buckets.get(label) || 0,
  }));
}

function computeStreaks(series) {
  let longest = 0;
  let currentRun = 0;

  for (const day of series) {
    if (day.count > 0) {
      currentRun += 1;
      longest = Math.max(longest, currentRun);
    } else {
      currentRun = 0;
    }
  }

  let current = 0;
  for (let index = series.length - 1; index >= 0; index -= 1) {
    if (series[index].count > 0) {
      current += 1;
    } else {
      break;
    }
  }

  return { current, longest };
}

function buildActivityMix(events, contributions) {
  if (contributions) {
    return [
      { label: "Commits", count: contributions.totalCommitContributions },
      { label: "Issues", count: contributions.totalIssueContributions },
      { label: "Pull requests", count: contributions.totalPullRequestContributions },
      { label: "Reviews", count: contributions.totalPullRequestReviewContributions },
    ]
      .filter((item) => item.count > 0)
      .sort((left, right) => right.count - left.count);
  }

  const buckets = new Map();
  for (const event of events) {
    const key = simplifyEventType(event.type);
    buckets.set(key, (buckets.get(key) || 0) + 1);
  }

  return [...buckets.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 6);
}

function buildLanguageBreakdown(repos) {
  const buckets = new Map();
  const totalWeight = repos.reduce((sum, repo) => sum + Math.max(repo.size, 1), 0) || 1;

  for (const repo of repos) {
    if (!repo.language) {
      continue;
    }

    const current = buckets.get(repo.language) || { label: repo.language, weight: 0, repos: 0 };
    current.weight += Math.max(repo.size, 1);
    current.repos += 1;
    buckets.set(repo.language, current);
  }

  return [...buckets.values()]
    .sort((left, right) => right.weight - left.weight)
    .slice(0, 6)
    .map((item) => ({
      label: item.label,
      color: hashToColor(item.label),
      repos: item.repos,
      share: Math.round((item.weight / totalWeight) * 100),
    }));
}

function buildRepoSpotlights(repos) {
  return [...repos]
    .sort((left, right) => {
      if (right.stargazers_count !== left.stargazers_count) {
        return right.stargazers_count - left.stargazers_count;
      }
      return new Date(right.pushed_at) - new Date(left.pushed_at);
    })
    .slice(0, 6)
    .map((repo) => ({
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description || "No description yet.",
      url: repo.html_url,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      issues: repo.open_issues_count,
      language: repo.language || "Mixed",
      languageColor: hashToColor(repo.language || repo.name),
      pushedAt: formatShortDate(repo.pushed_at),
      pushedRelative: relativeDaysFromNow(repo.pushed_at),
    }));
}

function buildContributionRepos(contributions) {
  const repositories = contributions?.commitContributionsByRepository || [];

  return repositories.map((item) => ({
    name: item.repository.nameWithOwner,
    url: item.repository.url,
    commits: item.contributions.totalCount,
    stars: item.repository.stargazerCount,
    language: item.repository.primaryLanguage?.name || "Mixed",
    color: item.repository.primaryLanguage?.color || hashToColor(item.repository.nameWithOwner),
    private: item.repository.isPrivate,
  }));
}

function buildRecentActivity(events) {
  return events.map((event) => ({
    id: event.id,
    summary: summarizeEvent(event),
    repo: event.repo?.name || "Unknown repository",
    repoUrl: event.repo?.name ? `https://github.com/${event.repo.name}` : "",
    date: formatShortDate(event.created_at),
    relative: relativeDaysFromNow(event.created_at),
  }));
}

function summarizeEvent(event) {
  const repo = event.repo?.name || "an unknown repository";

  switch (event.type) {
    case "PushEvent": {
      const commits = event.payload?.size || event.payload?.commits?.length || 0;
      return `Pushed ${commits} ${pluralize(commits, "commit")} to ${repo}`;
    }
    case "PullRequestEvent":
      return `${titleCase(event.payload?.action || "updated")} a pull request in ${repo}`;
    case "PullRequestReviewEvent":
      return `Reviewed a pull request in ${repo}`;
    case "IssuesEvent":
      return `${titleCase(event.payload?.action || "updated")} an issue in ${repo}`;
    case "IssueCommentEvent":
      return `Commented on an issue in ${repo}`;
    case "WatchEvent":
      return `Starred ${repo}`;
    case "ForkEvent":
      return `Forked ${repo}`;
    case "CreateEvent":
      return `Created ${event.payload?.ref_type || "something new"} in ${repo}`;
    case "ReleaseEvent":
      return `Published a release in ${repo}`;
    default:
      return `${titleCase(event.type)} in ${repo}`;
  }
}

function buildWarnings({ tokenUsed, contributions, contributionError }) {
  const warnings = [];

  if (!tokenUsed) {
    warnings.push(
      "No GitHub token detected. The report uses public REST data only, so the yearly contribution calendar is replaced with a public-event heatmap.",
    );
  }

  if (tokenUsed && !contributions) {
    warnings.push(
      contributionError ||
        "A GitHub token was provided, but the GraphQL contribution query could not be used. The report fell back to public activity data.",
    );
  }

  warnings.push("GitHub's public events feed can lag, so very recent activity may not appear immediately.");

  return warnings;
}

function buildInsights({
  activityMix,
  activeRepos,
  contributionSeries,
  languageBreakdown,
  repoSpotlights,
  streaks,
  topDay,
  totalStars,
  days,
}) {
  const totalActivityDays = contributionSeries.filter((day) => day.count > 0).length;
  const strongestWeekday = buildWeekdayBreakdown(contributionSeries).sort((left, right) => right.count - left.count)[0];
  const leadLanguage = languageBreakdown[0];
  const topRepo = repoSpotlights[0];
  const leadActivity = activityMix[0];

  return [
    `${totalActivityDays} active ${pluralize(totalActivityDays, "day")} surfaced in the current visualization window.`,
    `The longest visible streak is ${streaks.longest} ${pluralize(streaks.longest, "day")}, with a current streak of ${streaks.current}.`,
    `${strongestWeekday.label} is the strongest weekday, and the busiest single day was ${topDay.weekday}, ${topDay.date}.`,
    `${activeRepos.length} owned ${pluralize(activeRepos.length, "repository")} saw pushes in the last ${days} days.`,
    leadLanguage
      ? `${leadLanguage.label} leads the repo mix at roughly ${leadLanguage.share}% of the weighted language footprint.`
      : "No dominant language surfaced from owned repositories yet.",
    topRepo
      ? `${topRepo.fullName} is the strongest spotlight candidate with ${topRepo.stars} stars and activity as recent as ${topRepo.pushedRelative}.`
      : "No repository spotlight data was available.",
    leadActivity
      ? `${leadActivity.label} drive the activity mix, and owned repos have collected ${totalStars} stars overall.`
      : "Recent public activity is light, so the report leans more on repository metadata than event flow.",
  ];
}

function simplifyEventType(type) {
  const mapping = {
    PushEvent: "Pushes",
    PullRequestEvent: "Pull requests",
    PullRequestReviewEvent: "Reviews",
    IssuesEvent: "Issues",
    IssueCommentEvent: "Issue comments",
    WatchEvent: "Stars",
    CreateEvent: "Creations",
    ForkEvent: "Forks",
    ReleaseEvent: "Releases",
  };

  return mapping[type] || titleCase(type);
}

function deriveLevel(count, maxCount) {
  if (count === 0 || maxCount === 0) {
    return 0;
  }

  const normalized = count / maxCount;
  return clamp(Math.ceil(normalized * 4), 1, 4);
}

function addDays(value, amount) {
  const date = new Date(value);
  date.setUTCDate(date.getUTCDate() + amount);
  return date;
}
