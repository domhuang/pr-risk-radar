# Maintainer workflow

PR Risk Radar is designed for maintainers who need a fast first pass before reviewing contributor pull requests.

## Current workflow

1. A contributor opens a pull request.
2. The GitHub Action compares the pull request with the base branch.
3. The action posts a short risk report showing the files and topics that deserve review attention.
4. The maintainer uses the report to decide who should review the PR and whether tests, docs, or release notes are needed.

## Future API-assisted workflow

If the project receives API credits, they will be used only for open-source maintenance tasks:

- explain risky changes in maintainer-friendly language;
- summarize issue reports and pull request context;
- draft release notes from merged pull requests;
- suggest project-specific risk rules from historical pull requests;
- help identify security-sensitive changes that need deeper human review.

The project will keep API usage optional and transparent.
