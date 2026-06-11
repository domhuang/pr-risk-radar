const HIGH_RISK_RULES = [
  {
    id: "auth-security",
    label: "Auth or security-sensitive code changed",
    severity: "high",
    patterns: [
      /auth/i,
      /oauth/i,
      /jwt/i,
      /session/i,
      /password/i,
      /permission/i,
      /policy/i,
      /crypto/i,
      /secret/i,
      /token/i
    ],
    advice: "Ask for a focused review from someone familiar with auth, access control, or secrets handling."
  },
  {
    id: "billing-payments",
    label: "Billing or payment flow changed",
    severity: "high",
    patterns: [/billing/i, /payment/i, /stripe/i, /checkout/i, /invoice/i, /subscription/i],
    advice: "Verify idempotency, retries, refunds, and failure states before merge."
  },
  {
    id: "data-migration",
    label: "Database schema or migration changed",
    severity: "high",
    patterns: [/migration/i, /schema/i, /prisma/i, /knex/i, /sequelize/i, /typeorm/i, /database/i, /db\//i],
    advice: "Check rollback safety, deployment order, and compatibility with existing data."
  },
  {
    id: "infra-deploy",
    label: "Infrastructure, deployment, or CI changed",
    severity: "medium",
    patterns: [/Dockerfile/i, /docker-compose/i, /terraform/i, /k8s/i, /helm/i, /\.github\/workflows/i, /deploy/i],
    advice: "Confirm environment variables, permissions, and release behavior."
  }
];

const TEST_PATTERNS = [/(\.|-|_)test\./i, /(\.|-|_)spec\./i, /__tests__/i, /^test\//i, /^tests\//i];
const DOC_PATTERNS = [/README/i, /^docs\//i, /\.md$/i, /\.mdx$/i];
const SOURCE_PATTERNS = [/\.(js|jsx|ts|tsx|py|go|rs|java|kt|rb|php|cs|swift|c|cpp|h)$/i];
const DEPENDENCY_PATTERNS = [
  /package-lock\.json$/i,
  /pnpm-lock\.yaml$/i,
  /yarn\.lock$/i,
  /Cargo\.lock$/i,
  /go\.sum$/i,
  /poetry\.lock$/i,
  /requirements\.txt$/i,
  /Gemfile\.lock$/i
];

const severityScore = {
  low: 1,
  medium: 2,
  high: 3
};

function matchesAny(filename, patterns) {
  return patterns.some((pattern) => pattern.test(filename));
}

function summarizeFiles(files) {
  return files.reduce(
    (summary, file) => {
      summary.additions += file.additions || 0;
      summary.deletions += file.deletions || 0;
      summary.changed += 1;
      return summary;
    },
    { changed: 0, additions: 0, deletions: 0 }
  );
}

function addFinding(findings, finding) {
  const existing = findings.find((item) => item.id === finding.id);
  if (existing) {
    existing.files = Array.from(new Set([...existing.files, ...finding.files])).slice(0, 8);
    existing.count += finding.count;
    return;
  }
  findings.push({ ...finding, files: finding.files.slice(0, 8) });
}

function getRisk(findings, totals) {
  const score = findings.reduce((sum, finding) => sum + severityScore[finding.severity] * finding.count, 0);
  const hasHigh = findings.some((finding) => finding.severity === "high");
  if (hasHigh || score >= 8 || totals.additions + totals.deletions >= 900) {
    return "high";
  }
  if (score >= 3 || totals.additions + totals.deletions >= 300) {
    return "medium";
  }
  return "low";
}

export function analyzeChanges(files) {
  const normalized = files.map((file) => ({
    filename: file.filename,
    status: file.status || "modified",
    additions: Number(file.additions || 0),
    deletions: Number(file.deletions || 0)
  }));

  const findings = [];
  const totals = summarizeFiles(normalized);
  const sourceFiles = normalized.filter((file) => matchesAny(file.filename, SOURCE_PATTERNS));
  const testFiles = normalized.filter((file) => matchesAny(file.filename, TEST_PATTERNS));
  const docFiles = normalized.filter((file) => matchesAny(file.filename, DOC_PATTERNS));

  for (const rule of HIGH_RISK_RULES) {
    const matchedFiles = normalized.filter((file) => matchesAny(file.filename, rule.patterns));
    if (matchedFiles.length > 0) {
      addFinding(findings, {
        id: rule.id,
        label: rule.label,
        severity: rule.severity,
        advice: rule.advice,
        count: matchedFiles.length,
        files: matchedFiles.map((file) => file.filename)
      });
    }
  }

  const dependencyFiles = normalized.filter((file) => matchesAny(file.filename, DEPENDENCY_PATTERNS));
  if (dependencyFiles.length > 0) {
    addFinding(findings, {
      id: "dependency-change",
      label: "Dependency lockfile or runtime dependency changed",
      severity: "medium",
      advice: "Review supply-chain impact and confirm the dependency change is intentional.",
      count: dependencyFiles.length,
      files: dependencyFiles.map((file) => file.filename)
    });
  }

  const largeFiles = normalized.filter((file) => file.additions + file.deletions >= 250);
  if (largeFiles.length > 0) {
    addFinding(findings, {
      id: "large-file-change",
      label: "Large file change needs extra review time",
      severity: "medium",
      advice: "Consider splitting the PR or asking reviewers to focus on the largest files first.",
      count: largeFiles.length,
      files: largeFiles.map((file) => file.filename)
    });
  }

  if (sourceFiles.length > 0 && testFiles.length === 0) {
    addFinding(findings, {
      id: "no-tests",
      label: "Source changed without tests",
      severity: "medium",
      advice: "Ask whether existing tests cover this behavior or request a small regression test.",
      count: sourceFiles.length,
      files: sourceFiles.map((file) => file.filename)
    });
  }

  if (sourceFiles.length >= 4 && docFiles.length === 0) {
    addFinding(findings, {
      id: "no-docs",
      label: "Broad source change without docs",
      severity: "low",
      advice: "Check whether user-facing behavior or configuration changed and needs documentation.",
      count: sourceFiles.length,
      files: sourceFiles.map((file) => file.filename)
    });
  }

  const risk = getRisk(findings, totals);
  return {
    risk,
    totals,
    findings: findings.sort((a, b) => severityScore[b.severity] - severityScore[a.severity]),
    files: normalized
  };
}
