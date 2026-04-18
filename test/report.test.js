import test from "node:test";
import assert from "node:assert/strict";

import { buildVisualizationModel } from "../src/aggregate.js";
import { renderReport } from "../src/report.js";
import { buildPublicSnapshot } from "../test-support/helpers.js";

test("renderReport outputs escaped, self-contained HTML", () => {
  const snapshot = buildPublicSnapshot();
  snapshot.user.bio = "Safe <b>bio</b> & useful";
  const model = buildVisualizationModel(snapshot);

  const html = renderReport(model);

  assert.match(html, /<!doctype html>/i);
  assert.match(html, /Commit Canvas/);
  assert.match(html, /Safe &lt;b&gt;bio&lt;\/b&gt; &amp; useful/);
  assert.match(html, /Octo &lt;Cat&gt;/);
  assert.match(html, /https:\/\/octo\.example\.dev/);
  assert.match(html, /Activity heatmap/);
  assert.match(html, /<svg/);
  assert.match(html, /View repository/);
});
