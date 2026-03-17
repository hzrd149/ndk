---
"@nostr-dev-kit/cache-sqlite-wasm": patch
---

Avoid the expected `[wa-sqlite] exec error: no such table: schema_version` log on fresh database initialization by checking whether the `schema_version` table exists before querying it.
