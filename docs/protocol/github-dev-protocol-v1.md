# DevCanvas GitHub Dev Protocol v1

## 1. Purpose

This protocol defines the allowed GitHub development behavior after DevCanvas Product Freeze v1.

DevCanvas is no longer an open-ended development environment.

DevCanvas is now a permanently maintenance-locked writing product.

## 2. Current System Status

DevCanvas is:

```text
FROZEN PRODUCT
PRODUCT COMPLETE (v1)
WRITE-ONLY EXPERIENCE SYSTEM
PERMANENTLY MAINTENANCE-LOCKED SYSTEM
```

The architecture is frozen.

No evolution path exists.

Only stability maintenance is allowed.

## 3. PR Gate Rule

Every PR must pass the Maintenance-Class PR Gate.

A PR must be maintenance-class only.

A PR must not:

- introduce new features
- introduce new systems
- modify execution architecture
- modify kernel/runtime/system behavior
- add graph/snapshot/skill/workflow capabilities
- add intelligence layers
- add experimental modules
- expand UI into a new system
- revive autonomous task generation

If a PR fails this gate, it must be rejected.

## 4. Allowed PR Classes

Only these PR classes are allowed:

- UI polish
- bug fixes
- performance optimization
- readability improvements
- documentation updates
- validation improvements that do not change structure

Allowed PRs must preserve the pure writing experience.

Allowed PRs must not introduce new product capabilities.

## 5. Forbidden PR Classes

These PR classes are forbidden:

- feature development
- architecture changes
- kernel changes
- runtime changes
- system changes
- graph changes
- snapshot changes
- skill changes
- workflow changes
- UI system expansion
- intelligence layer expansion
- experimental module addition
- new execution concepts
- autonomous task-chain revival

## 6. Review Hard Constraint

ChatGPT must reject any expansion-type PR.

ChatGPT may only approve maintenance-level changes.

Review must check:

- Is this maintenance-class only?
- Does this introduce a new system?
- Does this modify execution architecture?
- Does this touch kernel/runtime/system?
- Does this touch graph/snapshot/skill/workflow?
- Does this add an intelligence layer or experimental module?
- Does this reintroduce system-style UI or development-tool language?

If the answer to any expansion question is yes, the PR must be rejected.

## 7. Scope Rule

Each PR must explicitly state:

- changed files
- allowed maintenance class
- architecture impact
- UI impact
- validation performed

Architecture impact must be:

```text
none
```

for all normal PRs.

Any PR with non-none architecture impact is invalid unless a human explicitly reopens product strategy outside this protocol.

## 8. GitHub Behavior

GitHub remains the source of truth for:

- branches
- PRs
- diffs
- handoff state
- review decisions

GitHub must not be used to continue automatic task chaining by default.

PRs must not include a `NEXT TASK SUGGESTION BLOCK` unless a human explicitly requests a bounded maintenance follow-up.

## 9. UI Guardrail

The product UI must remain a pure writing experience.

Future UI work must not add:

- system panels
- graph panels
- debug panels
- execution labels
- session/meta labels
- cockpit views
- control dashboards
- development-tool language

Future UI work may only polish the writing surface.

## 10. Enforcement

A PR is invalid if it violates:

- this protocol
- `docs/product/product-freeze-v1.md`
- the product freeze state
- the maintenance-only rule

Invalid PRs must be closed or rewritten as maintenance-only work.

## 11. Non-Goals

This protocol does not:

- add CI automation
- add GitHub Actions
- add runtime enforcement
- add feature flags
- add system monitors
- reopen architecture work
- restart autonomous task chaining
