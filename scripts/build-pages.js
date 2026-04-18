#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { runCli } from "../src/cli.js";

const username = process.env.COMMIT_CANVAS_USERNAME || "TrueNix";
const token = process.env.COMMIT_CANVAS_TOKEN || process.env.GITHUB_TOKEN || "";
const output = process.env.COMMIT_CANVAS_PAGES_OUTPUT || "./docs/index.html";
const json = process.env.COMMIT_CANVAS_PAGES_JSON || "./docs/report.json";
const days = process.env.COMMIT_CANVAS_DAYS || "";
const cname = process.env.COMMIT_CANVAS_CNAME || "";

const args = [username, "--output", output, "--json", json];

if (token) {
  args.push("--token", token);
}

if (days) {
  args.push("--days", days);
}

await runCli(args);

const outputDir = path.dirname(path.resolve(output));
await mkdir(outputDir, { recursive: true });
await writeFile(path.join(outputDir, ".nojekyll"), "", "utf8");

if (cname) {
  await writeFile(path.join(outputDir, "CNAME"), `${cname.trim()}\n`, "utf8");
}

console.log(`Pages artifact prepared in ${outputDir}`);
