export const typewriterMotion = {
  className: "motion-typewriter",
  stepMs: 180,
} as const

export function typewriterText(text: string, visibleCharacters: number) {
  if (visibleCharacters >= text.length) return text
  return text.slice(0, Math.max(0, visibleCharacters))
}

export function sentenceRevealText(text: string, visibleSentences: number) {
  const sentences = text.match(/[^。！？!?]+[。！？!?]?/g) ?? [text]
  return sentences.slice(0, Math.max(1, visibleSentences)).join("")
}
