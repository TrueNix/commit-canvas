import test from "node:test";
import assert from "node:assert/strict";

import { buildVisualizationModel } from "../src/aggregate.js";
import { buildPublicSnapshot, buildTokenSnapshot } from "../test-support/helpers.js";

test("buildVisualizationModel summarizes public snapshot data", () => {
  const model = buildVisualizationModel(buildPublicSnapshot());

  assert.equal(model.meta.username, "octocat");
  assert.match(model.meta.sourceLabel, /Public events over the last 14 days/);
  assert.ok(model.meta.warnings.some((warning) => warning.includes("No GitHub token detected")));
  assert.equal(model.profile.summary, "Builds useful tools & writes docs.");
  assert.equal(model.activityMix[0].label, "Pushes");
  assert.equal(model.activityMix[0].count, 2);
  assert.equal(model.languages[0].label, "JavaScript");
  assert.equal(model.repoSpotlights.length, 2);
  assert.equal(model.repoSpotlights[0].fullName, "octocat/active-repo");
  assert.equal(model.recentActivity[0].summary, "Pushed 3 commits to octocat/active-repo");
  assert.ok(model.contributionPanel.series.length >= 14);
  assert.ok(model.insights.length >= 5);
});

test("buildVisualizationModel prefers contribution calendar data when available", () => {
  const model = buildVisualizationModel(buildTokenSnapshot());

  assert.equal(model.meta.tokenUsed, true);
  assert.match(model.meta.sourceLabel, /Yearly contribution calendar via GitHub GraphQL/);
  assert.equal(model.contributionPanel.title, "Contribution heatmap");
  assert.equal(model.activityMix[0].label, "Commits");
  assert.equal(model.activityMix[0].count, 18);
  assert.equal(model.contributionRepos.length, 1);
  assert.equal(model.contributionRepos[0].name, "octocat/active-repo");
  assert.ok(model.meta.warnings.every((warning) => !warning.includes("No GitHub token detected")));
  assert.ok(model.contributionPanel.total > 0);
});

test("buildVisualizationModel creates cleaner fallback summary and deduplicated activity items", () => {
  const snapshot = buildPublicSnapshot();
  snapshot.user.bio = "";
  snapshot.events = [
    {
      id: "evt-dup-1",
      type: "PushEvent",
      created_at: snapshot.events[0].created_at,
      repo: { name: "octocat/active-repo" },
      payload: { size: 0, commits: [] },
    },
    {
      id: "evt-dup-2",
      type: "PushEvent",
      created_at: snapshot.events[0].created_at,
      repo: { name: "octocat/active-repo" },
      payload: { size: 0, commits: [] },
    },
    ...snapshot.events,
  ];

  const model = buildVisualizationModel(snapshot);

  assert.match(model.profile.summary, /active-repo currently carries the strongest public signal/i);
  assert.ok(model.profile.highlights.some((item) => item.includes("current streak")));
  assert.equal(model.recentActivity[0].summary, "Updated branch in octocat/active-repo");
  assert.equal(
    model.recentActivity.filter((item) => item.summary === "Updated branch in octocat/active-repo").length,
    1,
  );
});
