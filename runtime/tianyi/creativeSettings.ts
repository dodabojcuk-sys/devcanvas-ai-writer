export type TianyiPersonalityPreset =
  | "professional_editor"
  | "warm_companion"
  | "sharp_reviewer"
  | "mystic_tianyi"
  | "co_creator"

export type EmotionalFeedbackLevel = "restrained" | "standard" | "expressive"

export type SuggestionDensity = "low" | "medium" | "high"

export type QuestioningStyle = "light" | "balanced" | "deep"

export interface CreativeSettingsView {
  personality: TianyiPersonalityPreset
  emotionalFeedback: EmotionalFeedbackLevel
  suggestionDensity: SuggestionDensity
  questioningStyle: QuestioningStyle
  customTianyiInstruction: string
}

export const CREATIVE_SETTINGS_STORAGE_KEY = "devcanvas:creative-settings:v1"
export const CREATIVE_SETTINGS_CUSTOM_INSTRUCTION_LIMIT = 400

export const DEFAULT_CREATIVE_SETTINGS: CreativeSettingsView = {
  personality: "professional_editor",
  emotionalFeedback: "standard",
  suggestionDensity: "medium",
  questioningStyle: "balanced",
  customTianyiInstruction: "",
}

export const TIAN_YI_PERSONALITY_OPTIONS: Array<{
  value: TianyiPersonalityPreset
  label: string
  description: string
}> = [
  { value: "professional_editor", label: "专业编辑", description: "冷静、可靠，帮你指出故事问题。" },
  { value: "warm_companion", label: "温和陪伴", description: "多一点鼓励，陪你继续往下想。" },
  { value: "sharp_reviewer", label: "犀利审稿", description: "更直接指出漏洞、拖沓和风险。" },
  { value: "mystic_tianyi", label: "玄妙天意", description: "更有命运感、隐喻感和氛围感。" },
  { value: "co_creator", label: "共创伙伴", description: "主动给选择、分支和下一步方向。" },
]

export const EMOTIONAL_FEEDBACK_OPTIONS: Array<{
  value: EmotionalFeedbackLevel
  label: string
  description: string
}> = [
  { value: "restrained", label: "克制", description: "少一点情绪，多一点判断。" },
  { value: "standard", label: "标准", description: "保持鼓励、提醒和分析的平衡。" },
  { value: "expressive", label: "更有情绪", description: "更明显地共鸣、鼓励和提醒。" },
]

export const SUGGESTION_DENSITY_OPTIONS: Array<{
  value: SuggestionDensity
  label: string
  description: string
}> = [
  { value: "low", label: "少量建议", description: "只给最关键的方向。" },
  { value: "medium", label: "适中", description: "给出少量可比较的选择。" },
  { value: "high", label: "更多选择", description: "提供更多分支和可能性。" },
]

export const QUESTIONING_STYLE_OPTIONS: Array<{
  value: QuestioningStyle
  label: string
  description: string
}> = [
  { value: "light", label: "少问问题", description: "减少追问，先陪作者整理。" },
  { value: "balanced", label: "适度追问", description: "适量追问动机、伏笔和因果。" },
  { value: "deep", label: "深入追问", description: "更主动追问角色动机和断点。" },
]

const PERSONALITY_LABELS = Object.fromEntries(
  TIAN_YI_PERSONALITY_OPTIONS.map((option) => [option.value, option.label]),
) as Record<TianyiPersonalityPreset, string>

const EMOTIONAL_LABELS = Object.fromEntries(
  EMOTIONAL_FEEDBACK_OPTIONS.map((option) => [option.value, option.label]),
) as Record<EmotionalFeedbackLevel, string>

const SUGGESTION_LABELS = Object.fromEntries(
  SUGGESTION_DENSITY_OPTIONS.map((option) => [option.value, option.label]),
) as Record<SuggestionDensity, string>

const QUESTIONING_LABELS = Object.fromEntries(
  QUESTIONING_STYLE_OPTIONS.map((option) => [option.value, option.label]),
) as Record<QuestioningStyle, string>

function isOneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
}

function normalizeCustomInstruction(value: unknown) {
  if (typeof value !== "string") return ""
  return value.replace(/\s+/g, " ").trim().slice(0, CREATIVE_SETTINGS_CUSTOM_INSTRUCTION_LIMIT)
}

export function normalizeCreativeSettings(input: Partial<CreativeSettingsView> = {}): CreativeSettingsView {
  const personalityValues = TIAN_YI_PERSONALITY_OPTIONS.map((option) => option.value)
  const emotionalValues = EMOTIONAL_FEEDBACK_OPTIONS.map((option) => option.value)
  const suggestionValues = SUGGESTION_DENSITY_OPTIONS.map((option) => option.value)
  const questioningValues = QUESTIONING_STYLE_OPTIONS.map((option) => option.value)

  return {
    personality: isOneOf(input.personality, personalityValues) ? input.personality : DEFAULT_CREATIVE_SETTINGS.personality,
    emotionalFeedback: isOneOf(input.emotionalFeedback, emotionalValues)
      ? input.emotionalFeedback
      : DEFAULT_CREATIVE_SETTINGS.emotionalFeedback,
    suggestionDensity: isOneOf(input.suggestionDensity, suggestionValues)
      ? input.suggestionDensity
      : DEFAULT_CREATIVE_SETTINGS.suggestionDensity,
    questioningStyle: isOneOf(input.questioningStyle, questioningValues)
      ? input.questioningStyle
      : DEFAULT_CREATIVE_SETTINGS.questioningStyle,
    customTianyiInstruction: normalizeCustomInstruction(input.customTianyiInstruction),
  }
}

export function getTianyiPersonalityLabel(value: TianyiPersonalityPreset): string {
  return PERSONALITY_LABELS[value] ?? PERSONALITY_LABELS.professional_editor
}

export function getEmotionalFeedbackLabel(value: EmotionalFeedbackLevel): string {
  return EMOTIONAL_LABELS[value] ?? EMOTIONAL_LABELS.standard
}

export function getSuggestionDensityLabel(value: SuggestionDensity): string {
  return SUGGESTION_LABELS[value] ?? SUGGESTION_LABELS.medium
}

export function getQuestioningStyleLabel(value: QuestioningStyle): string {
  return QUESTIONING_LABELS[value] ?? QUESTIONING_LABELS.balanced
}

export function getCreativeSettingsSummary(settings: CreativeSettingsView): string {
  const normalized = normalizeCreativeSettings(settings)
  return [
    getTianyiPersonalityLabel(normalized.personality),
    getEmotionalFeedbackLabel(normalized.emotionalFeedback),
    getSuggestionDensityLabel(normalized.suggestionDensity),
    getQuestioningStyleLabel(normalized.questioningStyle),
  ].join(" / ")
}

export function buildCreativeSettingsPromptPreview(settings: CreativeSettingsView): string {
  const normalized = normalizeCreativeSettings(settings)
  const lines = [
    `天意性格：${getTianyiPersonalityLabel(normalized.personality)}`,
    `情绪反馈：${getEmotionalFeedbackLabel(normalized.emotionalFeedback)}`,
    `建议密度：${getSuggestionDensityLabel(normalized.suggestionDensity)}`,
    `追问风格：${getQuestioningStyleLabel(normalized.questioningStyle)}`,
  ]

  if (normalized.customTianyiInstruction) {
    lines.push(`作者希望：${normalized.customTianyiInstruction}`)
  }

  lines.push("边界：这是本地提示词草稿，不调用真实模型，不写入正史，不绕过证据门。")

  return lines.join("\n")
}
