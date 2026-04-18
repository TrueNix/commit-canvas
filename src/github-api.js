const REST_ROOT = "https://api.github.com";
const GRAPHQL_ROOT = "https://api.github.com/graphql";
const USER_AGENT = "commit-canvas";

const contributionQuery = `
  query ContributionSnapshot($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      login
      contributionsCollection(from: $from, to: $to) {
        contributionYears
        restrictedContributionsCount
        totalCommitContributions
        totalIssueContributions
        totalPullRequestContributions
        totalPullRequestReviewContributions
        contributionCalendar {
          totalContributions
          months {
            name
            year
            firstDay
            totalWeeks
          }
          weeks {
            firstDay
            contributionDays {
              color
              contributionCount
              date
              weekday
            }
          }
        }
        commitContributionsByRepository(maxRepositories: 8) {
          repository {
            nameWithOwner
            url
            isPrivate
            stargazerCount
            primaryLanguage {
              name
              color
            }
          }
          contributions(first: 1) {
            totalCount
          }
        }
      }
    }
  }
`;

export async function fetchSnapshot(username, { token, days }) {
  const [user, repos, events] = await Promise.all([
    fetchUser(username, token),
    fetchUserRepos(username, token),
    fetchPublicEvents(username, token, { pages: 3 }),
  ]);

  let contributions = null;
  let contributionError = "";

  if (token) {
    try {
      contributions = await fetchContributionCollection(username, token);
    } catch (error) {
      contributionError = error instanceof Error ? error.message : String(error);
    }
  }

  return {
    username,
    days,
    tokenUsed: Boolean(token),
    user,
    repos,
    events,
    contributions,
    contributionError,
  };
}

async function fetchUser(username, token) {
  return requestJson(`${REST_ROOT}/users/${encodeURIComponent(username)}`, token);
}

async function fetchUserRepos(username, token) {
  const results = [];

  for (let page = 1; page <= 10; page += 1) {
    const url = new URL(`${REST_ROOT}/users/${encodeURIComponent(username)}/repos`);
    url.searchParams.set("per_page", "100");
    url.searchParams.set("page", String(page));
    url.searchParams.set("sort", "updated");
    url.searchParams.set("type", "owner");

    const pageItems = await requestJson(url, token);
    results.push(...pageItems);

    if (pageItems.length < 100) {
      break;
    }
  }

  return results;
}

async function fetchPublicEvents(username, token, { pages }) {
  const results = [];

  for (let page = 1; page <= pages; page += 1) {
    const url = new URL(`${REST_ROOT}/users/${encodeURIComponent(username)}/events/public`);
    url.searchParams.set("per_page", "100");
    url.searchParams.set("page", String(page));

    const pageItems = await requestJson(url, token);
    results.push(...pageItems);

    if (pageItems.length < 100) {
      break;
    }
  }

  return results;
}

async function fetchContributionCollection(username, token) {
  const now = new Date();
  const from = new Date(now);
  from.setUTCFullYear(now.getUTCFullYear() - 1);

  const payload = await requestGraphql(
    {
      query: contributionQuery,
      variables: {
        login: username,
        from: from.toISOString(),
        to: now.toISOString(),
      },
    },
    token,
  );

  return payload.user?.contributionsCollection ?? null;
}

async function requestJson(url, token) {
  const response = await fetch(url, {
    headers: buildHeaders(token),
  });

  if (!response.ok) {
    throw new Error(await buildErrorMessage(response));
  }

  return response.json();
}

async function requestGraphql(body, token) {
  const response = await fetch(GRAPHQL_ROOT, {
    method: "POST",
    headers: {
      ...buildHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await buildErrorMessage(response));
  }

  const payload = await response.json();

  if (payload.errors?.length) {
    const message = payload.errors.map((item) => item.message).join("; ");
    throw new Error(`GitHub GraphQL request failed: ${message}`);
  }

  return payload.data;
}

function buildHeaders(token) {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": USER_AGENT,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function buildErrorMessage(response) {
  let details = "";

  try {
    const payload = await response.json();
    details = payload.message || JSON.stringify(payload);
  } catch {
    details = await response.text();
  }

  return `GitHub request failed with ${response.status} ${response.statusText}${details ? `: ${details}` : ""}`;
}
