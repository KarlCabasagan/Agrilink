---
name: superpowers
description: Core software engineering primitives including brainstorming, atomic plan writing, plan execution, systematic debugging, and rigorous verification.
---

# Superpowers

Modular development workflows for structured planning, execution, debugging, and verification.

## 1. Brainstorming (`superpowers:brainstorming`)
- Explore architectural trade-offs, scope boundaries, and API contracts.
- Ask clarifying questions before locking requirements.
- Produce structured decision records.

## 2. Write Plan (`superpowers:write-plan`)
- Break feature or fix into small, atomic, verifiable steps.
- Specify exact file paths, expected test additions, and minimal diff changes.
- Ensure each step can be validated independently with automated tests.

## 3. Execute Plan (`superpowers:execute-plan`)
- Work through the active plan sequentially step-by-step.
- After each step, run tests to verify implementation before proceeding.
- Keep modifications tightly scoped to the current step.

## 4. Systematic Debugging (`superpowers:systematic-debugging`)
1. **Reproduce:** Write a minimal failing test (RED) reproducing the exact bug.
2. **Isolate:** Trace call chain and state transitions to lock root cause; do not guess.
3. **Patch:** Apply the smallest possible working fix (GREEN).
4. **Harden:** Ensure zero regressions and purge defensive bloat.

## 5. Verification (`superpowers:verification-before-completion`)
- Execute full test suite and build checks before declaring completion.
- Confirm edge cases, error states, and assertions hold under production conditions.
