---
applyTo: "**"
---

# UGWTF Workflow — copilot-chat-exporter

**Alias**: `chat-exporter`
**Repo**: `DaBigHomie/copilot-chat-exporter`
**Framework**: node
**Branch**: master

## CI Commands

| Command | Purpose |
|---------|---------|
| `npm run lint` | Lint check |
| `npx tsc --noEmit` | Type check |
| `npm run build` | Build |

## Pre-Commit Gates

```bash
npx tsc --noEmit   # 0 errors
npm run lint       # 0 errors
npm run build      # succeeds
```

## UGWTF Integration

- Registered alias: `chat-exporter`
- Default branch: `master`
- Pipeline commands: `node dist/index.js chain chat-exporter --no-cache`
