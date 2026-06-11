import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

async function git(args) {
  const { stdout } = await execFileAsync("git", args, {
    maxBuffer: 1024 * 1024 * 10
  });
  return stdout.trim();
}

function parseNumstat(output) {
  if (!output) {
    return new Map();
  }
  return new Map(
    output.split("\n").map((line) => {
      const [rawAdditions, rawDeletions, filename] = line.split("\t");
      return [
        filename,
        {
          additions: rawAdditions === "-" ? 0 : Number(rawAdditions || 0),
          deletions: rawDeletions === "-" ? 0 : Number(rawDeletions || 0)
        }
      ];
    })
  );
}

function parseNameStatus(output, stats) {
  if (!output) {
    return [];
  }
  return output.split("\n").map((line) => {
    const parts = line.split("\t");
    const statusCode = parts[0];
    const filename = parts.at(-1);
    const stat = stats.get(filename) || { additions: 0, deletions: 0 };
    const status = statusCode.startsWith("A")
      ? "added"
      : statusCode.startsWith("D")
        ? "deleted"
        : statusCode.startsWith("R")
          ? "renamed"
          : "modified";

    return {
      filename,
      status,
      additions: stat.additions,
      deletions: stat.deletions
    };
  });
}

export async function collectGitChanges(base, head) {
  const range = base === head ? head : `${base}...${head}`;
  const [numstat, nameStatus] = await Promise.all([
    git(["diff", "--numstat", range]),
    git(["diff", "--name-status", range])
  ]);
  const stats = parseNumstat(numstat);
  return parseNameStatus(nameStatus, stats);
}
