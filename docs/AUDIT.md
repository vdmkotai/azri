# AUDIT

## Verdict

PASS WITH WARNINGS

## Accessibility (WCAG2AA via axe-core)

- Violations: 1
- Violation: `color-contrast` (serious), 8 nodes
- Targets: TOC spans for `#overview`, `#shape`, `#risks`, `#diff`, `#module-map`

## Keyboard Navigation

- Unique elements reached: 14
- TOC links reachable: yes (`1. Overview` through `7. After this lands`)
- Presses logged: 30

## Contrast

- Pairs tested: 31
- Failing pairs (<4.5:1): 0

## Security Headers

- Bot not running — see T26 unit tests.
- Bot-served pages confirm: `Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy`.

## XSS Test (PR title injection)

- Result: PASS
- Raw payload leaks: 0
- CSP meta present: yes
- Note: `javascript:` was still detected in the PR URL href string; no raw payload leaked and probes were escaped/not rendered.

## Dependency Audit

- Critical: 0
- High: 0

## Known Limitations / Follow-Ups

- Live bot header dump was not executed during this audit because the bot was offline.
- Renderer should still consider rejecting/sanitizing `javascript:` PR URLs even though CSP blocks script execution.
