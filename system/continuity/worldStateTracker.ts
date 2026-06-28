import type { NarrativeWorldState } from "../../types/narrativeContinuity"

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)))
}

function chapterNumber(input: string, fallback = 1) {
  const numeric = input.match(/第\s*(\d+)\s*章/)
  if (numeric) return Number(numeric[1])
  const chinese = input.match(/第\s*([一二三四五六七八九十])\s*章/)?.[1]
  const map: Record<string, number> = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 }
  return chinese ? map[chinese] : fallback
}

function settingCandidates(input: string) {
  return unique([
    input.match(/鹤湾旧宅|旧宅/)?.[0] ?? "",
    input.match(/青铜铃/)?.[0] ?? "",
    input.match(/账册/)?.[0] ?? "",
    input.match(/雨夜/)?.[0] ?? "",
  ])
}

function worldChange(input: string) {
  if (/响起|出现|失踪|改变|坍塌|封锁/.test(input)) return `世界变化：${input.slice(0, 80)}`
  return "世界变化：设定被记录，等待后续确认"
}

function spatialChange(input: string) {
  if (/旧宅|鹤湾/.test(input)) return "空间变化：故事焦点移动到鹤湾旧宅"
  if (/离开|进入|推开|到达/.test(input)) return "空间变化：角色位置发生推进"
  return "空间变化：未明确"
}

function timeLabel(input: string, chapter: number) {
  if (/雨夜/.test(input)) return `第 ${chapter} 章 / 雨夜`
  if (/清晨/.test(input)) return `第 ${chapter} 章 / 清晨`
  if (/傍晚|黄昏/.test(input)) return `第 ${chapter} 章 / 傍晚`
  return `第 ${chapter} 章 / 时间待确认`
}

export function trackWorldState(input: string, previous?: NarrativeWorldState): NarrativeWorldState {
  const chapter = chapterNumber(input, previous?.timeProgression.currentChapter ?? 1)
  return {
    definedSettings: unique([...(previous?.definedSettings ?? []), ...settingCandidates(input)]).slice(-40),
    occurredChanges: unique([...(previous?.occurredChanges ?? []), worldChange(input)]).slice(-40),
    timeProgression: {
      currentChapter: chapter,
      currentTimeLabel: timeLabel(input, chapter),
    },
    spatialChanges: unique([...(previous?.spatialChanges ?? []), spatialChange(input)]).slice(-40),
  }
}
