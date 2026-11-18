# Agrilink Agent Instructions & Repository Guidelines

## 1. Git Repository Hygiene & Graphify Artifacts Policy
- **CRITICAL**: Never track, stage, commit, or push `graphify/`, `graphify-out/`, or any `*.graphify*` artifacts to the GitHub repository.
- Graphify directories are strictly local machine scratch files used for indexing and context analysis.
- They must remain in `.gitignore` at all times.
- Before committing or pushing, always verify with `git status` that no graphify files are staged.

## 2. Commit Discipline
- Commit frequently with concise conventional commit messages (`feat:`, `fix:`, `refactor:`, `style:`, `test:`, `chore:`, `docs:`).
- Always verify that all tests pass (`npm test`) and the project builds cleanly (`npm run build`) before pushing to `origin/main`.

## 3. Navigation & Authentication Principles
- Auth state must always be fully initialized before rendering protected routes or redirecting to `/login` to avoid cold-start login flashing.
- Navigation bars across Consumer, Producer, and Admin portals must remain permanently mounted across route transitions to prevent indicator flicker.

# Global Vibe Coding Protocol

## Always-On Compression
- **Prose (`caveman`):** Default to `caveman full` at all times. Use telegraphic, high-precision technical fragments. Drop pleasantries, hedging, filler, and summaries. Switch to `caveman ultra` for status checks and graph queries.
- **Code (`ponytail`):** Default to `ponytail full` during implementation. Write minimal, idiomatic code. Zero speculative abstractions, zero premature helper wrappers, zero unrequested comments.

## Context & Exploration Rules
- **Never grep or dump raw directories:** Before reading source files, inspect `graphify-out/GRAPH_REPORT.md` or run `/graphify query` to locate exact target files and line ranges.
- **Phase State Handshake:** Always read `PLAN.md` first when resuming a pipeline after `/clear` to identify the active `PIPELINE` and `CURRENT_PHASE`.

## Isolation Rules
- Never load `ui-ux-pro-max` or `impeccable` during backend/state TDD phases.
- Never modify unrelated code outside the active phase scope.

## Git Protocol
- Always commit via `/caveman-commit`: imperative subject under 50 chars, terse why-over-what body if non-obvious, zero AI attribution footers.
