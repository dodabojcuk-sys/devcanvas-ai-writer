export type UiLayer =
  | "tianyi"
  | "sidebar"
  | "eventline"
  | "nuwa"
  | "evidence"
  | "omnibar"
  | "system"

export type KernelIntentMapping =
  | "dialogue"
  | "creative_exploration"
  | "story_generation"
  | "structure_edit"
  | "rewrite"
  | "context_injection"
  | "evidence_query"
  | "project_navigation"
  | "system_trace"

export interface UiComponentMapping {
  uiElement: string
  component: string
  layer: UiLayer
  ownerPath: string
  entryRole: "entry" | "secondary" | "runtime_triggered" | "hidden"
  notes: string
}

export interface UiKernelInteractionMapping {
  uiBehavior: string
  kernelIntent: KernelIntentMapping
  kernelEntry: "processDevCanvasInput"
  triggerPath: "tianyi_input" | "selection_action" | "drag_action" | "context_action" | "runtime_action"
  systemAccess: "kernel_only"
  notes: string
}

export interface UiStateFlowMapping {
  uiState: string
  kernelState: string
  systemState: string
  owner: UiLayer
  notes: string
}

export interface UiBoundaryRuleMapping {
  rule: string
  appliesTo: string[]
  enforcement: "kernel_driven" | "runtime_triggered" | "not_component_entry"
  notes: string
}

export const UI_COMPONENT_MAPPING: UiComponentMapping[] = [
  {
    uiElement: "AI天意输入框",
    component: "TianyiInputBar.tsx",
    layer: "tianyi",
    ownerPath: "app/tianyi",
    entryRole: "entry",
    notes: "Only visible primary input surface; sends user text to Kernel.",
  },
  {
    uiElement: "AI天意对话区",
    component: "TianyiChatPanel.tsx",
    layer: "tianyi",
    ownerPath: "app/tianyi",
    entryRole: "entry",
    notes: "Presentation surface for Kernel responses and execution graph summaries.",
  },
  {
    uiElement: "创意模式 orb",
    component: "TianyiCreativeOrb.tsx",
    layer: "tianyi",
    ownerPath: "app/tianyi",
    entryRole: "secondary",
    notes: "Creative mode affordance inside Tianyi; not a system launcher.",
  },
  {
    uiElement: "左侧资产/叙事/项目侧边栏",
    component: "ProjectNarrativeSidebar.tsx",
    layer: "sidebar",
    ownerPath: "app/tianyi",
    entryRole: "secondary",
    notes: "Navigation context only; cannot call system implementations.",
  },
  {
    uiElement: "EventLine 左侧抽屉",
    component: "EventLineDrawer.tsx",
    layer: "eventline",
    ownerPath: "core/eventline",
    entryRole: "runtime_triggered",
    notes: "Derived structure surface opened from Tianyi/Kernel context.",
  },
  {
    uiElement: "Nuwa 右侧面板",
    component: "NuwaSidePanel.tsx",
    layer: "nuwa",
    ownerPath: "app/tianyi",
    entryRole: "runtime_triggered",
    notes: "UI container for Kernel-authorized rewrite results; never direct Nuwa entry.",
  },
  {
    uiElement: "Evidence popup",
    component: "EvidenceTooltip.tsx",
    layer: "evidence",
    ownerPath: "app/tianyi",
    entryRole: "runtime_triggered",
    notes: "Selection/right-click support surface; read-only evidence access through Kernel.",
  },
  {
    uiElement: "AI天意 omnibar / input system",
    component: "TianyiOmnibar.tsx",
    layer: "omnibar",
    ownerPath: "app/tianyi",
    entryRole: "entry",
    notes: "Command-like input still resolves through Kernel, not direct system calls.",
  },
  {
    uiElement: "System debug drawer",
    component: "SystemDebugDrawer.tsx",
    layer: "system",
    ownerPath: "app/tianyi",
    entryRole: "hidden",
    notes: "Developer-only trace surface; not part of writer first-screen UI.",
  },
]

export const UI_KERNEL_INTERACTION_MAPPING: UiKernelInteractionMapping[] = [
  {
    uiBehavior: "输入一段故事",
    kernelIntent: "story_generation",
    kernelEntry: "processDevCanvasInput",
    triggerPath: "tianyi_input",
    systemAccess: "kernel_only",
    notes: "Kernel classifies story material and may derive EventLine/Evidence support.",
  },
  {
    uiBehavior: "普通对话提问",
    kernelIntent: "dialogue",
    kernelEntry: "processDevCanvasInput",
    triggerPath: "tianyi_input",
    systemAccess: "kernel_only",
    notes: "Tianyi response remains the presentation layer.",
  },
  {
    uiBehavior: "进入创意模式",
    kernelIntent: "creative_exploration",
    kernelEntry: "processDevCanvasInput",
    triggerPath: "runtime_action",
    systemAccess: "kernel_only",
    notes: "Creative mode changes Tianyi presentation, not system entry rights.",
  },
  {
    uiBehavior: "拖入 EventLine 卡片",
    kernelIntent: "structure_edit",
    kernelEntry: "processDevCanvasInput",
    triggerPath: "drag_action",
    systemAccess: "kernel_only",
    notes: "Structure edits are routed by Kernel and constrained before adapter calls.",
  },
  {
    uiBehavior: "选中文字 + Nuwa",
    kernelIntent: "rewrite",
    kernelEntry: "processDevCanvasInput",
    triggerPath: "selection_action",
    systemAccess: "kernel_only",
    notes: "Nuwa is backend execution only; UI selection does not bypass Kernel.",
  },
  {
    uiBehavior: "@ 引用 Evidence",
    kernelIntent: "context_injection",
    kernelEntry: "processDevCanvasInput",
    triggerPath: "context_action",
    systemAccess: "kernel_only",
    notes: "Evidence is injected as context and read-only support.",
  },
  {
    uiBehavior: "右键/选中触发 Evidence",
    kernelIntent: "evidence_query",
    kernelEntry: "processDevCanvasInput",
    triggerPath: "selection_action",
    systemAccess: "kernel_only",
    notes: "Evidence tooltip uses Kernel-authorized context lookup.",
  },
]

export const UI_STATE_FLOW_MAPPING: UiStateFlowMapping[] = [
  {
    uiState: "dialogue mode",
    kernelState: "intent=dialogue or story_generation; primary=tianyi",
    systemState: "no direct system execution unless Kernel derives support",
    owner: "tianyi",
    notes: "Default first-screen state.",
  },
  {
    uiState: "creative mode",
    kernelState: "intent=creative_exploration; presentation=tianyi",
    systemState: "system hidden unless Kernel requests support",
    owner: "tianyi",
    notes: "Creative UI is still Tianyi-owned.",
  },
  {
    uiState: "event-line expanded",
    kernelState: "intent=structure_edit or story_generation; primary/secondary decided by constraints",
    systemState: "eventline derived surface only",
    owner: "eventline",
    notes: "EventLine is a drawer/derived view, not an entry route.",
  },
  {
    uiState: "nuwa open",
    kernelState: "intent=rewrite; fallback if direct Nuwa entry is requested",
    systemState: "nuwa candidate-only execution through SystemAdapter",
    owner: "nuwa",
    notes: "Nuwa panel reflects Kernel output.",
  },
  {
    uiState: "evidence active",
    kernelState: "intent=context_injection or evidence_query",
    systemState: "evidence read-only support through SystemAdapter",
    owner: "evidence",
    notes: "Evidence never becomes a workspace entry.",
  },
]

export const UI_BOUNDARY_RULE_MAPPING: UiBoundaryRuleMapping[] = [
  {
    rule: "EventLine drawer cannot become a route entry",
    appliesTo: ["EventLineDrawer.tsx", "StorylineSurface.tsx", "StoryPositionAxis.tsx"],
    enforcement: "not_component_entry",
    notes: "Open only from Tianyi/Kernel-derived context.",
  },
  {
    rule: "Nuwa panel cannot call Nuwa system directly",
    appliesTo: ["NuwaSidePanel.tsx"],
    enforcement: "kernel_driven",
    notes: "Rewrite actions must become Kernel intent=rewrite.",
  },
  {
    rule: "Evidence tooltip is read-only and runtime-triggered",
    appliesTo: ["EvidenceTooltip.tsx"],
    enforcement: "runtime_triggered",
    notes: "Evidence access must be contextual and Kernel-authorized.",
  },
  {
    rule: "Omnibar cannot become a secondary launcher",
    appliesTo: ["TianyiOmnibar.tsx", "TianyiInputBar.tsx"],
    enforcement: "kernel_driven",
    notes: "All commands resolve through processDevCanvasInput.",
  },
  {
    rule: "System debug drawer cannot be writer-facing first-screen UI",
    appliesTo: ["SystemDebugDrawer.tsx"],
    enforcement: "not_component_entry",
    notes: "Debug trace may exist only as hidden/developer-only UI.",
  },
]
