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
