import type { NarrativeCharacterState } from "../../types/narrativeContinuity"

const BLOCKED_NAMES = new Set(["第一章", "第二章", "第三章", "当前故事", "青铜铃", "鹤湾旧", "证据依据"])

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)))
}

function cleanInput(input: string) {
  return input.replace(/\s+/g, " ").trim()
}

function characterNames(input: string) {
  const explicit = input.match(/@([\u4e00-\u9fa5]{2,4})/g)?.map((name) => name.slice(1)) ?? []
  const subjectPattern = /(?:^|[：，。；、\s])([\u4e00-\u9fa5]{2,4})(?=在|发现|决定|回到|推开|进入|找到|确认|听见|看见|留下|选择|继续|追查|说|问|想|拿|带|去|被|把|与|和)/g
  const subjects = Array.from(input.matchAll(subjectPattern), (match) => match[1])
  const names = input.match(/[\u4e00-\u9fa5]{2,4}/g) ?? []
  const inferred = names.filter((name) => !BLOCKED_NAMES.has(name) && !/(旧宅|青铜|账册|雨夜|证据|依据|章节|故事|当前|女娲)/.test(name))
  return unique([...explicit, ...subjects, ...inferred]).slice(0, 3)
}

function emotionalChange(input: string) {
  if (/害怕|恐惧|不安|惊/.test(input)) return "情绪变化：害怕/不安"
  if (/相信|决定|留下|答应/.test(input)) return "情绪变化：从犹疑转向行动"
  if (/愤怒|失望|怀疑/.test(input)) return "情绪变化：信任下降"
  return "情绪变化：待观察"
}

function relationshipChange(input: string) {
  if (/旧宅|鹤湾/.test(input)) return "关系变化：与鹤湾旧宅的牵连加深"
  if (/青铜铃|账册|钥匙|玉佩/.test(input)) return "关系变化：与关键物件建立线索连接"
  if (/相信|背叛|隐瞒/.test(input)) return "关系变化：人物信任关系发生变化"
  return "关系变化：暂无明确变化"
}

function currentState(input: string) {
  if (/害怕|恐惧|不安/.test(input) && /留下|决定|推开|进入/.test(input)) return "害怕但仍选择推进事件"
  if (/受伤|虚弱|昏迷/.test(input)) return "身体或行动能力受限"
  if (/决定|选择|留下|进入/.test(input)) return "主动行动中"
  return "状态待确认"
}

export function trackCharacterState(input: string, previous: NarrativeCharacterState[] = []): NarrativeCharacterState[] {
  const clean = cleanInput(input)
  const names = characterNames(clean)
  const fallbackNames = names.length ? names : previous.map((character) => character.name).slice(0, 1)

  const updates = fallbackNames.map((name) => {
    const existing = previous.find((character) => character.name === name)
    return {
      id: existing?.id ?? `character:${name}`,
      name,
      currentState: currentState(clean),
      occurredEvents: unique([...(existing?.occurredEvents ?? []), clean.slice(0, 80)]).slice(-20),
      emotionalChanges: unique([...(existing?.emotionalChanges ?? []), emotionalChange(clean)]).slice(-20),
      relationshipChanges: unique([...(existing?.relationshipChanges ?? []), relationshipChange(clean)]).slice(-20),
    }
  })

  const untouched = previous.filter((character) => !updates.some((update) => update.name === character.name))
  return [...updates, ...untouched].slice(0, 12)
}
