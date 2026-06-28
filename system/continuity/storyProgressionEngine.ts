import type { NarrativeStoryProgress, NarrativeWorldState } from "../../types/narrativeContinuity"

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)))
}

function completedEvent(input: string) {
  return input.replace(/\s+/g, " ").trim().slice(0, 96) || "空白事件"
}

function unresolvedForeshadows(input: string) {
  const foreshadows: string[] = []
  if (/青铜铃|铃/.test(input)) foreshadows.push("青铜铃为何响起")
  if (/缺页|账册/.test(input)) foreshadows.push("账册缺页的真相")
  if (/秘密|隐瞒/.test(input)) foreshadows.push("被隐瞒的信息")
  return foreshadows
}

function currentConflict(input: string, previous?: NarrativeStoryProgress) {
  if (/害怕|风险|冲突|危险/.test(input)) return "角色恐惧与继续调查之间的冲突"
  if (/为什么|关系|证据|依据/.test(input)) return "证据不足与人物判断之间的冲突"
  if (/修改|润色|扩写|重写/.test(input)) return previous?.currentConflict ?? "文本修改需保持既有因果"
  return previous?.currentConflict ?? "当前冲突待确认"
}

export function progressStoryState(input: string, world: NarrativeWorldState, previous?: NarrativeStoryProgress): NarrativeStoryProgress {
  return {
    currentChapter: world.timeProgression.currentChapter,
    completedEvents: unique([...(previous?.completedEvents ?? []), completedEvent(input)]).slice(-100),
    unresolvedForeshadows: unique([...(previous?.unresolvedForeshadows ?? []), ...unresolvedForeshadows(input)]).slice(-80),
    currentConflict: currentConflict(input, previous),
  }
}
