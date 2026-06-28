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
STRICTLY MAINTENANCE-GOVERNED SYSTEM
```

The architecture is frozen.

No evolution path exists.

No implicit evolution path exists.

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
- add AI capabilities
- add intelligence layers
- add experimental modules
- expand UI into a new system
- revive autonomous task generation

If a PR fails this gate, it must be rejected.

## 4. Expansion Detection Rule

A PR must be rejected if it contains any expansion signal:

- new files introducing system concepts
- new module definitions for skill, graph, runtime, kernel, system, snapshot, workflow, or intelligence expansion
- new data structures that influence execution flow
- UI additions that create a system entry, panel, cockpit, dashboard, or control surface
- execution flow changes
- new imports that connect previously isolated layers
- new AI capability or product capability
- new feature behavior hidden under maintenance wording

Expansion detection applies to all PRs, including PRs labeled as bugfix, refactor, performance, polish, documentation, or validation.

## 5. Subtle Expansion Guard

Subtle expansion is forbidden.

A PR must be rejected if it:

- uses bugfix wording to introduce new capability
- uses refactor wording to change architecture or boundaries
- uses performance wording to change execution paths
- uses UI polish wording to add a new UI system, panel, or control concept
- uses documentation wording to reopen a frozen architecture path
- uses validation wording to add runtime behavior
- uses readability wording to change system responsibility

A PR is reviewed by its diff, not by its title.

If the diff expands capability, structure, execution, or system surface area, the PR is invalid.

## 6. Allowed PR Classes

Only these PR classes are allowed:

- bug fixes
- UI visual polish
- performance optimization without execution path changes
- copy/text adjustments
- readability improvements without structural changes
- documentation updates
- non-structural validation improvements

Allowed PRs must preserve the pure writing experience.

Allowed PRs must not introduce new product capabilities.

Allowed PRs must not alter execution architecture.

## 7. Forbidden PR Classes

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
- graph/snapshot/skill/workflow additions
- UI system expansion
- AI capability expansion
- intelligence layer expansion
- experimental module addition
- new execution concepts
- autonomous task-chain revival
- hidden expansion through bugfix/refactor/performance/polish/docs/validation wording

## 8. Review Hard Constraint

ChatGPT is the expansion gatekeeper.

ChatGPT must reject any expansion-type PR.

ChatGPT must reject any non-maintenance behavior.

ChatGPT may only approve maintenance-level changes.

Review must check:

- Is this maintenance-class only?
- Does this introduce a new feature?
- Does this introduce a new system?
- Does this modify execution architecture?
- Does this touch kernel/runtime/system?
- Does this touch graph/snapshot/skill/workflow?
- Does this add an AI capability?
- Does this add an intelligence layer or experimental module?
- Does this add a UI system entry, panel, dashboard, or control surface?
- Does this reintroduce system-style UI or development-tool language?
- Is this subtle expansion disguised as bugfix, refactor, performance, polish, docs, or validation?

If the answer to any expansion question is yes, the PR must be rejected.

## 9. Scope Rule

Each PR must explicitly state:

- changed files
- allowed maintenance class
- architecture impact
- UI impact
- validation performed
- expansion detection result

Architecture impact must be:

```text
none
```

for all normal PRs.

Expansion detection result must be:

```text
no expansion detected
```

for all valid PRs.

Any PR with non-none architecture impact is invalid unless a human explicitly reopens product strategy outside this protocol.

Any PR with expansion detected is invalid.

## 10. GitHub Behavior

GitHub remains the source of truth for:

- branches
- PRs
- diffs
- handoff state
- review decisions

GitHub must not be used to continue automatic task chaining by default.

PRs must not include a `NEXT TASK SUGGESTION BLOCK` unless a human explicitly requests a bounded maintenance follow-up.

## 11. UI Guardrail

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
- system entry points
- control surfaces

Future UI work may only polish the writing surface.

## 12. Enforcement

A PR is invalid if it violates:

- this protocol
- `docs/product/product-freeze-v1.md`
- the product freeze state
- the maintenance-only rule
- the expansion detection rule
- the subtle expansion guard

Invalid PRs must be closed or rewritten as maintenance-only work.

## 13. Non-Goals

This protocol does not:

- add CI automation
- add GitHub Actions
- add runtime enforcement
- add feature flags
- add system monitors
- reopen architecture work
- restart autonomous task chaining
