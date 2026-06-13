import { appendFile, readFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { collectGitChanges } from "./collect-git.js";
import { analyzeChanges } from "./analyze.js";
import { formatMarkdown } from "./format.js";
import { upsertIssueComment } from "./comment.js";

const execFileAsync = promisify(execFile);

function getInput(name, fallback = "") {
  const canonicalKey = `INPUT_${name.toUpperCase().replaceAll(" ", "_")}`;
  const normalizedKey = `INPUT_${name.toUpperCase().replaceAll(/[\s-]/g, "_")}`;
  return process.env[canonicalKey] || process.env[normalizedKey] || fallback;
}

async function readEvent() {
  if (!process.env.GITHUB_EVENT_PATH) {
    return {};
  }
  const raw = await readFile(process.env.GITHUB_EVENT_PATH, "utf8");
  return JSON.parse(raw);
}

async function fetchBaseRef(baseSha) {
  if (!baseSha) {
    return;
  }
  try {
    await execFileAsync("git", ["fetch", "--no-tags", "--depth=100", "origin", baseSha], {
      maxBuffer: 1024 * 1024 * 10
    });
  } catch {
    // actions/checkout with fetch-depth: 0 usually already has the base commit.
  }
}

async function postComment(event, body) {
  const shouldComment = getInput("comment", "true") !== "false";
  const token = process.env.GITHUB_TOKEN || getInput("github-token");
  const repo = process.env.GITHUB_REPOSITORY;
  const number = event.pull_request?.number;

  if (!shouldComment) {
    return;
  }
  await upsertIssueComment({ repo, number, token, body });
}

function shouldFail(actualRisk, failOn) {
  const order = { none: 99, low: 1, medium: 2, high: 3 };
  return order[actualRisk] >= order[failOn];
}

async function main() {
  const event = await readEvent();
  const base = getInput("base", event.pull_request?.base?.sha || "origin/main");
  const head = getInput("head", event.pull_request?.head?.sha || "HEAD");
  const failOn = getInput("fail-on", "none");

  await fetchBaseRef(event.pull_request?.base?.sha);

  const files = await collectGitChanges(base, head);
  const result = analyzeChanges(files);
  const markdown = formatMarkdown(result);

  if (process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(process.env.GITHUB_STEP_SUMMARY, markdown);
  }

  console.log(markdown);
  try {
    await postComment(event, markdown);
  } catch (error) {
    console.warn(error.message);
  }

  if (shouldFail(result.risk, failOn)) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
