# AGENTS.md — Operating Contract for Any Agent

**Read this file first, every session. Then `wiki/SCHEMA.md`, then `wiki/index.md`, then the task spec.**

This project was once damaged by an agent that dropped production database tables and made unrequested changes. These rules exist so it never happens again. They are not optional.

## The stack (do not assume otherwise)
Vite + React 19 + Express + tRPC v11 + Drizzle (MySQL/TiDB) + better-auth + PayPal. Three.js + React Three Fiber for 3D. Wouter for routing. **This is NOT Next.js.** pnpm is the package manager.

## Hard rules

1. **Read before you edit. Report before you act.** For any non-trivial task: investigate, show your findings and plan, and wait for approval before modifying files. No surprise changes.
2. **Never run destructive SQL.** No `DROP`, no `TRUNCATE`, no `DELETE` without a row filter, ever — not even in "cleanup." Schema changes go through Drizzle migrations, proposed first.
3. **Never use production credentials.** Use the dev database. DDL and production access belong to the human alone. Never print, commit, or log secrets.
4. **Work on a branch.** `main` is protected. One logical change per branch. Show diff stats before irreversible commits.
5. **No ghost links in the wiki.** Per `wiki/SCHEMA.md`: only link to pages that exist; if a concept needs a page, create it in the same operation or don't link it. Run `scripts/wiki-lint.py` before any wiki commit.
6. **Stay in scope.** Do exactly the task. Do not "improve" adjacent code, reformat unrelated files, or refactor uninvited. If you see something worth changing, note it — don't do it.
7. **Preserve the design language.** Colors, typography (Cormorant Garamond / Cinzel / JetBrains Mono), and the reverent-cinematic register are intentional. Match the existing `oriel-signal/` design system; never replace it with generic defaults.
8. **Distinguish canon from voice, project memory from user memory.** Technical canon (engines, ephemeris, ROS) is precise and testable. Mythic voice is poetic. The `wiki/` is project memory; the runtime UMM/database is per-user memory. Never conflate them.

## Definition of done
- Tests pass (`npx vitest run`). Relevant suite green.
- No secrets, no scratch files (`_tmp_*`, `.hermes-tmp.*`), no unrelated reformatting in the diff.
- Work logged in `wiki/log.md` per the SCHEMA.
- A short summary of what changed and why.

## When in doubt
Ask. A clarifying question is always cheaper than an unrequested change.
