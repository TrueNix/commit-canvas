import test from "node:test";
import assert from "node:assert/strict";

import { parseArgs } from "../src/utils.js";

test("parseArgs builds defaults from the username and environment token", () => {
  const previousToken = process.env.GITHUB_TOKEN;
  process.env.GITHUB_TOKEN = "env-token";

  try {
    const options = parseArgs(["Octo Cat"]);

    assert.equal(options.username, "Octo Cat");
    assert.equal(options.output, "Octo-Cat.report.html");
    assert.equal(options.days, 90);
    assert.equal(options.token, "env-token");
  } finally {
    if (previousToken === undefined) {
      delete process.env.GITHUB_TOKEN;
    } else {
      process.env.GITHUB_TOKEN = previousToken;
    }
  }
});

test("parseArgs respects explicit options", () => {
  const options = parseArgs([
    "octocat",
    "--output",
    "custom/report.html",
    "--json",
    "custom/report.json",
    "--days",
    "30",
    "--token",
    "cli-token",
  ]);

  assert.equal(options.username, "octocat");
  assert.equal(options.output, "custom/report.html");
  assert.equal(options.json, "custom/report.json");
  assert.equal(options.days, 30);
  assert.equal(options.token, "cli-token");
});

test("parseArgs rejects invalid input", () => {
  assert.throws(() => parseArgs([]), /Missing required GitHub username/);
  assert.throws(() => parseArgs(["octocat", "--days", "0"]), /positive number/);
  assert.throws(() => parseArgs(["octocat", "--output"]), /Missing value for --output/);
  assert.throws(() => parseArgs(["octocat", "--nope"]), /Unknown option/);
});
