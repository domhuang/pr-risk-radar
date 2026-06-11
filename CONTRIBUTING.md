# Contributing

Thanks for helping improve PR Risk Radar.

## Local setup

```bash
npm test
node bin/pr-risk-radar.js --base HEAD --head HEAD
```

## Good rule changes

- The rule has a clear maintainer workflow benefit.
- The finding explains why it matters.
- The rule avoids project-specific assumptions unless it is configurable.
- Tests cover the expected risk level.

## Pull request checklist

- Tests pass with `npm test`.
- New risk signals include at least one test.
- User-facing behavior is documented in `README.md`.
