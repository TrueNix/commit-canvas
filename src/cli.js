import path from "node:path";

import { buildVisualizationModel } from "./aggregate.js";
import { fetchSnapshot } from "./github-api.js";
import { renderReport } from "./report.js";
import { parseArgs, writeTextFile } from "./utils.js";

export async function runCli(argv) {
  const options = parseArgs(argv);

  if (options.help) {
    printHelp();
    return;
  }

  console.log(`Fetching GitHub data for ${options.username}...`);
  const snapshot = await fetchSnapshot(options.username, {
    token: options.token,
    days: options.days,
  });

  console.log(`Building visualization model...`);
  const model = buildVisualizationModel(snapshot);
  const html = renderReport(model);

  await writeTextFile(options.output, html);
  console.log(`HTML report written to ${path.resolve(options.output)}`);

  if (options.json) {
    await writeTextFile(options.json, JSON.stringify(model.exportData, null, 2));
    console.log(`JSON export written to ${path.resolve(options.json)}`);
  }

  if (model.meta.warnings.length) {
    console.log("");
    console.log("Notes:");
    for (const warning of model.meta.warnings) {
      console.log(`- ${warning}`);
    }
  }
}

function printHelp() {
  console.log(`Commit Canvas

Usage:
  commit-canvas <github-username> [options]
  node ./bin/commit-canvas.js <github-username> [options]

Options:
  -o, --output <file>  HTML output path
  --json <file>        Optional JSON export path
  --days <number>      Public event fallback window in days (default: 90)
  --token <token>      GitHub token, or use GITHUB_TOKEN
  -h, --help           Show this help
`);
}
