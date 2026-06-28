# Coupling Risk Report v1

## 1. Purpose

This report records coupling risks that could break the DevCanvas architecture freeze.

The current system is stable. The risks below are forward-looking guardrails for future tasks.

## 2. Current Risk Level

Current coupling risk:

```text
Low
```

Reason:

- writing execution does not read snapshot state
- snapshot assembly does not call writing execution
- visualization is design-only
- graph state is read-only

## 3. Critical Coupling Risks

### 3.1 Graph -> Writing Coupling

Risk level: high if introduced.

Risk pattern:

```text
NarrativeGraphSnapshot -> processDevCanvas()
NarrativeGraphSnapshot -> kernel routing
NarrativeGraphSnapshot -> writing continuation behavior
```

Why it matters:

Graph state would stop being representation and become control input. This would turn the read-only world model into an execution system.

Current status:

```text
Not present.
```

### 3.2 Snapshot -> Runtime Coupling

Risk level: high if introduced.

Risk pattern:

```text
SnapshotAssembler -> runtime/systemAdapter
SnapshotAssembler -> runDevCanvasKernel
SnapshotAssembler -> system gateway
```

Why it matters:

The assembler would stop being a projection layer and become part of runtime execution.

Current status:

```text
Not present.
```

### 3.3 Visualization -> Tianyi Coupling

Risk level: medium if introduced.

Risk pattern:

```text
Character map click -> writing behavior
Timeline edit -> session mutation
Visualization panel -> system command
```

Why it matters:

Visualization would become a second product surface for controlling story execution.

Current status:

```text
Not present.
```

### 3.4 UI -> Graph Mutation

Risk level: high if introduced.

Risk pattern:

```text
UI edits graph nodes
UI creates relation edges
UI marks inferred events as confirmed
```

Why it matters:

Evidence-backed world representation would become manually mutable without the required provenance rules.

Current status:

```text
Not present.
```

## 4. Safe Future Work

Future work remains safe when it follows this direction:

```text
processDevCanvas output -> snapshot -> read-only display
```

Safe examples:

- read-only snapshot viewer
- static character map generated from snapshot data
- event timeline rendered from snapshot data
- CI scan that blocks forbidden imports

## 5. Unsafe Future Work

Future work becomes unsafe when it creates this direction:

```text
snapshot / visualization / graph -> writing execution
```

Unsafe examples:

- using snapshot confidence to route kernel behavior
- letting visualization clicks alter session state
- allowing graph edits to generate story events
- letting the assembler call runtime or system adapters

## 6. Guardrail Recommendation

Before implementing new features, future tasks should add an automated boundary check that scans for forbidden imports and execution calls.

Recommended future guardrail:

```text
CI boundary check:
  app/core/runtime/system must not import runtime/narrative
  runtime/narrative must not import app/core/runtime/systemAdapter/system
```

This recommendation is not implemented in Task 022 because Task 022 is validation-only.

## 7. Risk Conclusion

DevCanvas currently has low coupling risk.

The main risk is future drift, not current architecture.
