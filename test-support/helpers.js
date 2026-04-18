import { subtractDays, toIsoDate } from "../src/utils.js";

export function daysAgoIso(days, hour = 12) {
  const date = subtractDays(new Date(), days);
  date.setUTCHours(hour, 0, 0, 0);
  return date.toISOString();
}

export function daysAgoDate(days) {
  return toIsoDate(daysAgoIso(days));
}

export function buildContributionCalendar(counts) {
  const totalContributions = counts.reduce((sum, count) => sum + count, 0);
  const days = counts.map((count, index) => {
    const daysBack = counts.length - index - 1;
    return {
      color: contributionColor(count),
      contributionCount: count,
      date: daysAgoDate(daysBack),
      weekday: (new Date(daysAgoIso(daysBack)).getUTCDay() + 6) % 7,
    };
  });

  const weeks = [];
  for (let index = 0; index < days.length; index += 7) {
    weeks.push({
      firstDay: days[index].date,
      contributionDays: days.slice(index, index + 7),
    });
  }

  return {
    totalContributions,
    months: [
      {
        name: new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "UTC" }).format(new Date(days[0].date)),
        year: new Date(days[0].date).getUTCFullYear(),
        firstDay: days[0].date,
        totalWeeks: weeks.length,
      },
    ],
    weeks,
  };
}

export function buildPublicSnapshot() {
  return {
    username: "octocat",
    days: 14,
    tokenUsed: false,
    contributionError: "",
    contributions: null,
    user: {
      login: "octocat",
      name: "Octo <Cat>",
      bio: "Builds useful tools & writes docs.",
      avatar_url: "https://example.com/avatar.png",
      html_url: "https://github.com/octocat",
      company: "@octo",
      location: "The Internet",
      blog: "octo.example.dev",
      created_at: daysAgoIso(800),
      followers: 42,
      following: 7,
      public_repos: 3,
    },
    repos: [
      {
        fork: false,
        name: "active-repo",
        full_name: "octocat/active-repo",
        description: "Main project",
        html_url: "https://github.com/octocat/active-repo",
        stargazers_count: 15,
        forks_count: 4,
        open_issues_count: 2,
        language: "JavaScript",
        pushed_at: daysAgoIso(1),
        size: 80,
      },
      {
        fork: false,
        name: "design-repo",
        full_name: "octocat/design-repo",
        description: "Secondary project",
        html_url: "https://github.com/octocat/design-repo",
        stargazers_count: 8,
        forks_count: 1,
        open_issues_count: 0,
        language: "TypeScript",
        pushed_at: daysAgoIso(4),
        size: 20,
      },
      {
        fork: true,
        name: "forked-repo",
        full_name: "octocat/forked-repo",
        description: "Fork should not count as owned spotlight",
        html_url: "https://github.com/octocat/forked-repo",
        stargazers_count: 99,
        forks_count: 99,
        open_issues_count: 1,
        language: "Rust",
        pushed_at: daysAgoIso(2),
        size: 60,
      },
    ],
    events: [
      {
        id: "evt-1",
        type: "PushEvent",
        created_at: daysAgoIso(1),
        repo: { name: "octocat/active-repo" },
        payload: { size: 3, commits: [{}, {}, {}] },
      },
      {
        id: "evt-2",
        type: "PushEvent",
        created_at: daysAgoIso(3),
        repo: { name: "octocat/design-repo" },
        payload: { size: 1, commits: [{}] },
      },
      {
        id: "evt-3",
        type: "IssueCommentEvent",
        created_at: daysAgoIso(2),
        repo: { name: "octocat/active-repo" },
        payload: {},
      },
      {
        id: "evt-4",
        type: "IssuesEvent",
        created_at: daysAgoIso(5),
        repo: { name: "octocat/design-repo" },
        payload: { action: "opened" },
      },
    ],
  };
}

export function buildTokenSnapshot() {
  return {
    ...buildPublicSnapshot(),
    tokenUsed: true,
    contributions: {
      totalCommitContributions: 18,
      totalIssueContributions: 4,
      totalPullRequestContributions: 3,
      totalPullRequestReviewContributions: 6,
      contributionCalendar: buildContributionCalendar([0, 2, 4, 0, 1, 2, 3, 5, 2, 1, 4, 2, 2, 1]),
      commitContributionsByRepository: [
        {
          repository: {
            nameWithOwner: "octocat/active-repo",
            url: "https://github.com/octocat/active-repo",
            isPrivate: false,
            stargazerCount: 15,
            primaryLanguage: {
              name: "JavaScript",
              color: "#f1e05a",
            },
          },
          contributions: {
            totalCount: 11,
          },
        },
      ],
    },
  };
}

function contributionColor(count) {
  if (count === 0) {
    return "#ebedf0";
  }
  if (count < 3) {
    return "#9be9a8";
  }
  if (count < 5) {
    return "#40c463";
  }
  return "#216e39";
}
