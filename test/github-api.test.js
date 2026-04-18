import test from "node:test";
import assert from "node:assert/strict";

import { fetchSnapshot } from "../src/github-api.js";

const originalFetch = globalThis.fetch;

test.afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("fetchSnapshot uses public REST endpoints without GraphQL when no token is provided", async () => {
  const calls = [];

  globalThis.fetch = async (url, init = {}) => {
    const href = String(url);
    calls.push({ href, init });

    if (href.includes("/repos")) {
      return jsonResponse([
        { name: "repo-one", fork: false, stargazers_count: 2, forks_count: 1, open_issues_count: 0, size: 1 },
      ]);
    }

    if (href.includes("/events/public")) {
      return jsonResponse([{ id: "evt-1", type: "PushEvent", created_at: new Date().toISOString(), payload: { size: 1 } }]);
    }

    if (href.endsWith("/users/octocat")) {
      return jsonResponse({ login: "octocat", public_repos: 1, followers: 1, following: 1 });
    }

    throw new Error(`Unexpected URL ${href}`);
  };

  const snapshot = await fetchSnapshot("octocat", { token: "", days: 30 });

  assert.equal(snapshot.tokenUsed, false);
  assert.equal(snapshot.contributions, null);
  assert.equal(snapshot.user.login, "octocat");
  assert.equal(snapshot.repos.length, 1);
  assert.equal(snapshot.events.length, 1);
  assert.equal(calls.some((call) => call.href.includes("/graphql")), false);
});

test("fetchSnapshot includes GraphQL contribution data when a token is provided", async () => {
  const calls = [];

  globalThis.fetch = async (url, init = {}) => {
    const href = String(url);
    calls.push({ href, init });

    if (href.includes("/graphql")) {
      return jsonResponse({
        data: {
          user: {
            contributionsCollection: {
              totalCommitContributions: 10,
              totalIssueContributions: 2,
              totalPullRequestContributions: 3,
              totalPullRequestReviewContributions: 4,
              contributionCalendar: {
                totalContributions: 19,
                months: [],
                weeks: [],
              },
              commitContributionsByRepository: [],
            },
          },
        },
      });
    }

    if (href.includes("/repos")) {
      return jsonResponse([]);
    }

    if (href.includes("/events/public")) {
      return jsonResponse([]);
    }

    if (href.endsWith("/users/octocat")) {
      return jsonResponse({ login: "octocat", public_repos: 0, followers: 0, following: 0 });
    }

    throw new Error(`Unexpected URL ${href}`);
  };

  const snapshot = await fetchSnapshot("octocat", { token: "secret-token", days: 30 });

  assert.equal(snapshot.tokenUsed, true);
  assert.equal(snapshot.contributionError, "");
  assert.equal(snapshot.contributions.totalCommitContributions, 10);

  const graphqlCall = calls.find((call) => call.href.includes("/graphql"));
  assert.ok(graphqlCall);
  assert.equal(graphqlCall.init.method, "POST");
  assert.equal(graphqlCall.init.headers.Authorization, "Bearer secret-token");
});

test("fetchSnapshot falls back cleanly when the contribution GraphQL request fails", async () => {
  globalThis.fetch = async (url) => {
    const href = String(url);

    if (href.includes("/graphql")) {
      return jsonResponse({ errors: [{ message: "no access" }] });
    }

    if (href.includes("/repos")) {
      return jsonResponse([]);
    }

    if (href.includes("/events/public")) {
      return jsonResponse([]);
    }

    if (href.endsWith("/users/octocat")) {
      return jsonResponse({ login: "octocat", public_repos: 0, followers: 0, following: 0 });
    }

    throw new Error(`Unexpected URL ${href}`);
  };

  const snapshot = await fetchSnapshot("octocat", { token: "secret-token", days: 30 });

  assert.equal(snapshot.contributions, null);
  assert.match(snapshot.contributionError, /GitHub GraphQL request failed: no access/);
});

function jsonResponse(body, { status = 200, statusText = "OK" } = {}) {
  return new Response(JSON.stringify(body), {
    status,
    statusText,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
