# DevCanvas Product Freeze v1

## 1. Purpose

DevCanvas Product Freeze v1 stops system expansion and moves DevCanvas into Stable Product Mode.

This document supersedes autonomous task chaining as the default development behavior.

## 2. Product State

DevCanvas is permanently in v1 product mode.

DevCanvas is now treated as:

```text
FROZEN PRODUCT
PRODUCT COMPLETE (v1)
WRITE-ONLY EXPERIENCE SYSTEM
PERMANENTLY MAINTENANCE-LOCKED SYSTEM
STRICTLY MAINTENANCE-GOVERNED SYSTEM
```

It is not treated as:

```text
evolving architecture research system
experimental AI OS
system expansion platform
autonomous task chain
general development environment
feature expansion project
```

## 3. Frozen Completed Systems

The following systems are considered complete for v1:

- writing system
- kernel/runtime/system isolation
- execution graph
- explainability
- UX lock
- world model contract
- snapshot assembler
- visualization design layer
- boundary freeze
- stability validation
- GitHub workflow
- autonomous task pipeline documentation

These systems are frozen. They may be documented or maintained, but they must not be expanded.

## 4. Stop Expansion Rule

Future work must not add:

- new features
- new system layers
- new intelligence modules
- new graph expansions
- new pipeline concepts
- new agent systems
- new skill execution systems
- new architecture branches
- new autonomous task chains
- new experimental layers
- new experimental modules
- new execution concepts
- new UI systems
- new AI capabilities

No feature expansion is allowed.

No architecture expansion is allowed.

No autonomous task generation is allowed.

No experimental layer or module is allowed.

No implicit evolution is allowed.

## 5. Future Task Admission Rules

Any future task must be maintenance-class only.

A future task must be one of:

- UI visual polish
- bugfix-only correction
- performance optimization without execution path change
- copy/text adjustment
- readability improvement without architecture change
- documentation update
- non-structural validation improvement

Any task that touches graph, system, kernel, runtime, snapshot, skill, workflow, autonomous execution, or intelligence expansion is forbidden by default.

Any task that introduces a new feature, new system, new UI layer, new execution path, new AI capability, or new product capability is forbidden by default.

## 6. Hard Guardrails

The following changes are forbidden:

- new feature development
- architecture modification
- kernel modification
- runtime modification
- system modification
- graph or snapshot modification
- graph, snapshot, skill, or workflow addition
- AI capability expansion
- intelligence layer expansion
- world model expansion
- autonomous task generation
- UI system expansion
- new UI layers
- new backend logic
- new execution path
- new architecture layer
- experimental modules

If a future task appears to require one of these changes, the task must be rejected rather than expanded.

## 7. Expansion Detection Rule

A PR must be rejected if it includes any expansion signal:

- new files introducing system concepts
- new module definitions for skill, graph, runtime, kernel, system, snapshot, workflow, or intelligence expansion
- new data structures that influence execution flow
- UI additions that create a system entry, panel, cockpit, dashboard, or control surface
- execution flow changes
- new imports that connect previously isolated layers
- new product capability hidden inside maintenance wording

Expansion detection applies even when the PR title says bugfix, refactor, polish, performance, or documentation.

## 8. Subtle Expansion Guard

Subtle expansion is forbidden.

Forbidden subtle expansion includes:

- using bugfix wording to introduce new capability
- using refactor wording to change architecture or boundaries
- using performance wording to change execution paths
- using UI polish wording to add a new UI system, panel, or control concept
- using documentation wording to reopen a frozen architecture path
- using validation wording to add runtime behavior

A PR must be judged by its diff, not its label.

If the diff expands capability, structure, execution, or system surface area, the PR must be rejected.

## 9. Allowed Future Work

Future work is limited to:

- bug fixes
- UI visual polish
- performance optimization without execution path change
- copy/text adjustments
- readability improvements
- documentation updates
- non-structural validation improvements

Allowed work must preserve the pure writing experience.

Allowed work must not modify execution architecture.

Allowed work must not introduce new systems.

Allowed work must not create hidden product capability expansion.

## 10. PR Gate Rule

Every future PR must pass the Product Freeze PR Gate:

- PR must be maintenance-class only.
- PR must not introduce new systems.
- PR must not introduce new features.
- PR must not modify execution architecture.
- PR must not change kernel/runtime/system behavior.
- PR must not add graph/snapshot/skill/workflow capabilities.
- PR must not add AI capabilities, intelligence layers, experimental modules, or UI systems.
- PR must not contain subtle expansion disguised as bugfix, refactor, performance, polish, docs, or validation.

A PR that fails any gate must be rejected.

## 11. Review Hard Constraint

ChatGPT is the expansion gatekeeper.

ChatGPT must reject any non-maintenance behavior.

ChatGPT must reject any expansion-type PR.

ChatGPT may only approve maintenance-level changes.

Expansion-type PRs include:

- feature expansion
- architecture expansion
- kernel/runtime/system modification
- graph/snapshot/skill/workflow addition
- UI system expansion
- AI capability expansion
- intelligence layer expansion
- experimental module addition
- autonomous task-chain revival
- hidden expansion under bugfix/refactor/performance wording

Review must preserve the maintenance-only product state.

## 12. GitHub Behavior

Default GitHub behavior changes from:

```text
PR -> next task suggestion -> task chain continues
```

to:

```text
PR -> maintenance gate -> expansion detection -> review -> product stabilization only
```

Future PRs must not include a `NEXT TASK SUGGESTION BLOCK` by default.

If a future task is required, it must be explicitly requested and must fit the allowed future work list.

## 13. UI Product Rule

Tianyi must remain a pure writing surface.

The UI must not reintroduce:

- explanation panels
- debug wording
- system-style labels
- graph labels
- session/meta labels
- execution labels
- cockpit panels
- control dashboards
- system panels
- development-tool language
- system entry points
- control surfaces

The product should continue to feel like:

```text
a story being written
```

not:

```text
a system being operated
```

## 14. Relationship To Previous Protocols

This freeze overrides the default behavior of:

- `docs/protocol/autonomous-task-pipeline-v1.md`
- `docs/protocol/github-dev-protocol-v1.md`

It does not delete those protocols. It restricts them to maintenance-only product work.

## 15. Release Readiness Meaning

Stable Product Mode means:

- DevCanvas architecture is frozen
- no evolution path exists, even implicitly
- only stability maintenance is allowed
- product identity is locked
- system boundaries are locked
- future work is corrective, cosmetic, textual, validation-only, or polishing only
- GitHub remains the source of truth
- DevCanvas is no longer a development environment

## 16. Non-Goals

This freeze does not:

- merge open PRs
- release software
- deploy DevCanvas
- implement UI changes
- implement runtime changes
- add CI automation
- remove existing documentation
