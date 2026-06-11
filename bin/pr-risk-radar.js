#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { collectGitChanges } from "../src/collect-git.js";
import { analyzeChanges } from "../src/analyze.js";
import { formatMarkdown, formatJson } from "../src/format.js";

function parseArgs(argv) {
  const args = {
    base: "origin/main",
    head: "HEAD",
    format: "markdown",
    output: "",
    failOn: "none"
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const next = argv[index + 1];
    if (token === "--base") {
      args.base = next;
      index += 1;
    } else if (token === "--head") {
      args.head = next;
      index += 1;
    } else if (token === "--format") {
      args.format = next;
      index += 1;
    } else if (token === "--output") {
      args.output = next;
      index += 1;
    } else if (token === "--fail-on") {
      args.failOn = next;
      index += 1;
    } else if (token === "--help" || token === "-h") {
      args.help = true;
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }

  return args;
}

function printHelp() {
  console.log(`pr-risk-radar

Usage:
  pr-risk-radar --base origin/main --head HEAD
  pr-risk-radar --base main --head feature --format json --output report.json

Options:
  --base       Base ref for the comparison. Default: origin/main
  --head       Head ref for the comparison. Default: HEAD
  --format     markdown or json. Default: markdown
  --output     Optional file path for the report.
  --fail-on    none, medium, or high. Default: none
`);
}

function shouldFail(actualRisk, failOn) {
  const order = { none: 99, low: 1, medium: 2, high: 3 };
  if (!(failOn in order)) {
    throw new Error("--fail-on must be one of: none, medium, high");
  }
  return order[actualRisk] >= order[failOn];
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const changes = await collectGitChanges(args.base, args.head);
  const result = analyzeChanges(changes);
  const output = args.format === "json" ? formatJson(result) : formatMarkdown(result);

  if (args.output) {
    await mkdir(dirname(args.output), { recursive: true });
    await writeFile(args.output, output);
  } else {
    console.log(output);
  }

  if (shouldFail(result.risk, args.failOn)) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
