import test from "node:test";
import assert from "node:assert/strict";
import { analyzeChanges } from "../src/analyze.js";

test("marks auth changes without tests as high risk", () => {
  const result = analyzeChanges([
    { filename: "src/auth/session.ts", additions: 80, deletions: 12 },
    { filename: "src/user/profile.ts", additions: 20, deletions: 4 }
  ]);

  assert.equal(result.risk, "high");
  assert.ok(result.findings.some((finding) => finding.id === "auth-security"));
  assert.ok(result.findings.some((finding) => finding.id === "no-tests"));
});

test("marks ordinary source plus tests as low risk", () => {
  const result = analyzeChanges([
    { filename: "src/button.ts", additions: 20, deletions: 5 },
    { filename: "test/button.test.ts", additions: 30, deletions: 0 }
  ]);

  assert.equal(result.risk, "low");
});

test("marks source changes without tests as medium risk", () => {
  const result = analyzeChanges([{ filename: "src/button.ts", additions: 20, deletions: 5 }]);

  assert.equal(result.risk, "medium");
  assert.ok(result.findings.some((finding) => finding.id === "no-tests"));
});

test("marks dependency lockfile changes as medium risk", () => {
  const result = analyzeChanges([{ filename: "package-lock.json", additions: 300, deletions: 250 }]);

  assert.equal(result.risk, "medium");
  assert.ok(result.findings.some((finding) => finding.id === "dependency-change"));
});
