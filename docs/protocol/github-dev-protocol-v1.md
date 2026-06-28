# DevCanvas GitHub Dev Protocol v1

## Purpose

DevCanvas development now runs through GitHub as the source of truth. Local work may be used for implementation and validation, but all durable engineering state must be represented as branches, pull requests, validation notes, and handoff records.

## Branch Model

- `main` is the stable product branch.
- `integration/devcanvas-v1` is the DevCanvas v1 integration branch.
- Short-lived `task-*` branches carry one module-scoped change at a time.
- Task branches merge into `integration/devcanvas-v1` first.
- `integration/devcanvas-v1` opens a final release PR into `main` only after full validation passes.

Long-lived module branches such as `dev/core-runtime` are not the default. Module ownership is expressed through PR scope, labels, and review rules instead of permanent branch divergence.

## Required PR Scope

Every PR must be single-module by default:

- `core/kernel/**` and kernel-facing tests only.
- `core/runtime/**` runtime preprocessing or loop modules only.
- `core/planning/**` and `core/orchestration/**` planning/orchestration only.
- `runtime/**` adapter, audit, enforcement, and session infrastructure only.
- `system/**` capability modules only.
- `app/tianyi/**`, `app/globals.css`, and `ui/**` UI/product surface only.
- `docs/**` documentation/protocol only.

Mixed UI plus kernel/runtime/system PRs are forbidden except for the final integration/release PR.

## Required PR Body

Each DevCanvas PR must include:

```markdown
## Summary

## Scope

## Skill Report
- selected skills:
- skill reasoning:
- affected modules:

## Router / Gate / Trace Summary
- router decision:
- gate result:
- trace id or report:
- stability notes:

## Runtime Impact
- kernel:
- runtime:
- system:
- UI:

## Validation
- focused tests:
- boundary audit:
- build/typecheck:
```

## Module PR Order

1. `task-053-repo-workflow-docs`
2. `task-054-core-kernel-runtime`
3. `task-055-skill-governance`
4. `task-056-decomposition-runtime`
5. `task-057-orchestrator-planning`
6. `task-058-system-capabilities`
7. `task-059-ui-tianyi-product`
8. `task-060-ci-and-boundary-validation`
9. `integration/devcanvas-v1` release PR to `main`

## Validation Rules

Module PRs must run focused tests for their scope plus the system boundary audit when they touch protected layers.

The final integration PR must run:

```bash
cd new
npm run typecheck
npm test
npm run audit:system-boundary
npm run build
```

## Forbidden Behavior

- No undocumented direct commits to `main`.
- No local-only continuation for durable DevCanvas work.
- No cross-module task branch without explicit integration purpose.
- No PR missing Skill Report, router/gate/trace summary, and validation notes.
- No architecture expansion under the name of migration.
