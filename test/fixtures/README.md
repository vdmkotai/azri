# Test fixtures

Synthetic data used by the Azri test suite. **Nothing here is production data.**

## Files

| File | Purpose |
|---|---|
| `sample.diff` | Realistic unified diff covering text modification, rename, binary file, addition, deletion. |
| `stage0-input.json` | Hand-crafted `AzriRunInput` (PR mode, small ChangeSet) for Stage 0 triage tests. |
| `stage0-output.json` | Expected output shape from Stage 0 triage. |
| `stage1-output.json` | Stage 1 output with a small `EvidenceGraph` (3–5 packets). |
| `pr-input.json` | Full `AzriRunInput` used by the end-to-end orchestrator tests. |
| `azri-output.json` | Stub `AzriRunOutput` (`kind: 'ok'`) for cache-hit tests. |
| `webhooks/pull-request-opened.json` | Synthetic GitHub `pull_request.opened` webhook payload. |
| `webhooks/pull-request-synchronize.json` | Synthetic `pull_request.synchronize` payload. |
| `webhooks/issue-comment-created.json` | Synthetic comment with body `/azri regenerate`, `COLLABORATOR` author. |
| `test-private-key.pem` | Synthetic RSA-2048 private key (gitignored). **NOT a real production key.** |

## Regenerating the test private key

The PEM file is gitignored. To regenerate locally:

```bash
openssl genpkey -algorithm RSA -out test/fixtures/test-private-key.pem -pkeyopt rsa_keygen_bits:2048
```

This key is used only to exercise the GitHub App JWT signing code paths during tests. It is never used against a real GitHub App.
