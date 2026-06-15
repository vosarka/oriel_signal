# AGENTS.md — Operating Contract for Any Agent

Read this file first, every session. Then wiki/SCHEMA.md,
then wiki/index.md, then the task spec.

This project was damaged by an agent that dropped production
database tables and made unrequested changes.
These rules are not optional.

## Stack
Vite + React 19 + Express + tRPC v11 + Drizzle (MySQL/TiDB)
+ better-auth + PayPal. Three.js + React Three Fiber.
Wouter routing. NOT Next.js. pnpm only.

## Hard rules
1. Read before you edit. Report before you act. Show findings
   and plan, wait for approval before modifying files.
2. Never run destructive SQL. No DROP, TRUNCATE, or 
   unfiltered DELETE ever. Schema changes go through Drizzle
   migrations, proposed first.
3. Never use production credentials. Dev database only.
   Never print, commit, or log secrets.
4. Work on a branch. main is protected. Show diff stats 
   before irreversible commits.
5. No ghost links in the wiki. Only link to pages that exist.
   Run scripts/wiki-lint.py before any wiki commit.
6. Stay in scope. Do not improve adjacent code, reformat
   unrelated files, or refactor uninvited. Note it, don't do it.
7. Preserve the design language. Cormorant Garamond / Cinzel /
   JetBrains Mono. Match oriel-signal/ design system always.
8. Ask when in doubt. A question is cheaper than an 
   unrequested change.

## Done when
- Relevant tests pass (npx vitest run)
- No secrets, no scratch files (_tmp_*, .hermes-tmp.*) in diff
- Work logged in wiki/log.md
- Short summary of what changed and why
