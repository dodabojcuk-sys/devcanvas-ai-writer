"use client"

import { useEffect, useState } from "react"

import { DEFAULT_CREATIVE_SETTINGS, type CreativeSettingsView } from "@/runtime/tianyi/creativeSettings"
import {
  type DevCanvasProductKernelResponse,
  processDevCanvasProductInput,
} from "@/core/kernel"
import {
  runCreativeImportReviewPipeline,
  type CreativeImportReviewPipelineResult,
} from "@/core/runtime/creativeImportReviewPipeline"
import type { TianyiDialogueContextItem } from "@/runtime/tianyi/tianyiDialogueContextBasket"
import {
  loadSavedWritingSession,
  saveWritingSession,
  type WritingSessionState,
} from "@/runtime/session/writingSessionManager"
import { fadeInMotion } from "@/ui/motion/fadeIn"
import { glowPulseMotion } from "@/ui/motion/glowPulse"
import { smoothSlideMotion } from "@/ui/motion/smoothSlide"
import { sentenceRevealText, typewriterMotion } from "@/ui/motion/typewriter"
import { NarrativeOrbitSystem } from "@/ui/cosmos/NarrativeOrbitSystem"
import type { OrbitNode } from "@/ui/cosmos/OrbitalEventRing"

type TianyiImmersiveWorkspaceProps = {
  creativeSettings?: CreativeSettingsView
  initialContextItems?: TianyiDialogueContextItem[]
}

type WritingMessage = {
  id: string
  role: "author" | "tianyi"
  text: string
}

const PRODUCT_SUGGESTION_CHIPS = [
  "继续推进这一章",
  "让冲突更锋利",
  "把这一段写得更有画面",
]

export function TianyiImmersiveWorkspace({
  creativeSettings: _creativeSettings = DEFAULT_CREATIVE_SETTINGS,
  initialContextItems = [],
}: TianyiImmersiveWorkspaceProps) {
  const [draft, setDraft] = useState("")
  const [writingMessages, setWritingMessages] = useState<WritingMessage[]>([])
  const [lastProductResponse, setLastProductResponse] = useState<DevCanvasProductKernelResponse | null>(null)
  const [creativeImportSource, setCreativeImportSource] = useState("")
  const [creativeImportTitle, setCreativeImportTitle] = useState("")
  const [creativeImportResult, setCreativeImportResult] = useState<CreativeImportReviewPipelineResult | null>(null)
  const [resumedSessionState, setResumedSessionState] = useState<WritingSessionState | null>(null)
  const [visibleSentences, setVisibleSentences] = useState(1)
  const [typingActive, setTypingActive] = useState(false)
  const activeSessionState = lastProductResponse?.sessionState ?? resumedSessionState
  const visibleMessages = writingMessages.length
    ? writingMessages
    : [{ id: "empty-writing-output", role: "tianyi" as const, text: "从一句话开始写。天意会把结构、证据和连续性都放在后台处理。" }]
  const storyStatus = activeSessionState?.eventState.latestEventHint ?? "等待第一段故事"
  const chapterLabel = activeSessionState?.chapterState.currentChapterTitle ?? "第 1 章"
  const latestMessage = visibleMessages[visibleMessages.length - 1]
  const productSuggestions = lastProductResponse?.suggestions.length
    ? lastProductResponse.suggestions
    : PRODUCT_SUGGESTION_CHIPS
  const cosmicEventNodes: OrbitNode[] = [
    {
      id: "inner-character-orbit",
      label: "角色",
      kind: "character",
      orbit: "inner",
      angle: -28,
    },
    {
      id: `middle-event-orbit-${storyStatus}`,
      label: storyStatus,
      kind: "event",
      orbit: "middle",
      angle: 92,
    },
    {
      id: `outer-prediction-orbit-${productSuggestions[0]}`,
      label: productSuggestions[0] ?? "主线候选",
      kind: "prediction",
      orbit: "outer",
      angle: 218,
    },
  ]

  useEffect(() => {
    setResumedSessionState(loadSavedWritingSession())
  }, [])

  useEffect(() => {
    if (!latestMessage || latestMessage.role !== "tianyi") return
    setVisibleSentences(1)
    const sentenceCount = latestMessage.text.match(/[^。！？!?]+[。！？!?]?/g)?.length ?? 1
    const timer = window.setInterval(() => {
      setVisibleSentences((current) => {
        if (current >= sentenceCount) {
          window.clearInterval(timer)
          return current
        }
        return current + 1
      })
    }, typewriterMotion.stepMs)
    return () => window.clearInterval(timer)
  }, [latestMessage?.id, latestMessage?.role, latestMessage?.text])

  function applyProductResponse(inputText: string, response: DevCanvasProductKernelResponse) {
    setWritingMessages((current) => {
      const nextMessages: WritingMessage[] = [
        ...current,
        { id: `author-${current.length + 1}`, role: "author", text: inputText },
        { id: `tianyi-${current.length + 2}`, role: "tianyi", text: response.finalText },
      ]
      return nextMessages.slice(-8)
    })
    setLastProductResponse(response)
    setResumedSessionState(response.sessionState)
    saveWritingSession(response.sessionState)
  }

  function renderMessageText(message: WritingMessage) {
    if (message.id === latestMessage?.id && message.role === "tianyi") {
      return sentenceRevealText(message.text, visibleSentences)
    }
    return message.text
  }

  function submitDraft() {
    const text = draft.trim()
    if (!text) return

    const response = processDevCanvasProductInput({
      input: text,
      contextBasketItems: initialContextItems,
      sessionState: activeSessionState ?? undefined,
    })
    applyProductResponse(text, response)
    setDraft("")
  }

  function previewCreativeImport() {
    const rawText = creativeImportSource.trim()
    if (!rawText) {
      setCreativeImportResult(null)
      return
    }

    setCreativeImportResult(runCreativeImportReviewPipeline({
      rawText,
      sourceId: "tianyi_creative_import",
      title: creativeImportTitle.trim() || "未命名原稿",
      chunkSizeChars: 320,
    }))
  }

  function loadCreativeImportFile(file: File | undefined) {
    if (!file) return
    setCreativeImportTitle(file.name.replace(/\.[^.]+$/, ""))
    const reader = new FileReader()
    reader.onload = () => {
      setCreativeImportSource(typeof reader.result === "string" ? reader.result : "")
    }
    reader.readAsText(file)
  }

  const creativeCharacters = creativeImportResult?.draft.entities.filter((entity) => entity.entity_type === "character") ?? []
  const creativeLocations = creativeImportResult?.draft.entities.filter((entity) => entity.entity_type === "location") ?? []
  const creativeItems = creativeImportResult?.draft.entities.filter((entity) => entity.entity_type === "item") ?? []
  const creativeEvents = creativeImportResult?.draft.events ?? []
  const creativeEvidence = creativeImportResult?.draft.evidence.slice(0, 4) ?? []

  return (
    <section
      className="tianyi-workspace tianyi-workspace--product-surface"
      data-testid="tianyi-immersive-workspace"
      data-tianyi-mode="dialogue"
      data-entry-point="ai-tianyi"
      data-system-ui="hidden"
    >
      <div className="ambient-narrative-field" aria-hidden="true" />
      <main className="writing-product-surface" data-testid="tianyi-only-first-screen">
        <section className="creative-import-loom" aria-label="创意导入">
          <div className="creative-import-loom__copy">
            <span>创意模式</span>
            <h2>把一小章原稿拆成可复查的故事线索</h2>
            <p>粘贴或选择本地文本，天意会先做记录员：抽出人物、地点、物件、事件和原文依据。</p>
          </div>

          <div className="creative-import-source">
            <input
              aria-label="原稿标题"
              value={creativeImportTitle}
              onChange={(event) => setCreativeImportTitle(event.target.value)}
              placeholder="原稿标题"
            />
            <label className="creative-import-file">
              <span>选择文本</span>
              <input
                type="file"
                accept=".txt,.md,text/plain"
                onChange={(event) => loadCreativeImportFile(event.target.files?.[0])}
              />
            </label>
            <textarea
              rows={5}
              value={creativeImportSource}
              onChange={(event) => setCreativeImportSource(event.target.value)}
              placeholder="粘贴一小章小说或设定片段。先从短文本开始，所有候选都会保留原文依据。"
            />
            <button type="button" onClick={previewCreativeImport}>
              拆出故事脉络
            </button>
          </div>

          {creativeImportResult ? (
            <div className="creative-import-preview" data-testid="creative-import-preview">
              <div className="creative-import-stats" aria-label="导入概况">
                <span className="creative-import-stat">{creativeImportResult.preview.chapterCount} 章</span>
                <span className="creative-import-stat">{creativeImportResult.preview.evidenceCount} 条原文依据</span>
                <span className="creative-import-stat">{creativeImportResult.preview.candidateCounts.entities} 个候选实体</span>
                <span className="creative-import-stat">{creativeImportResult.preview.candidateCounts.events} 个候选事件</span>
              </div>

              <div className="creative-import-groups">
                <div>
                  <h3>候选人物</h3>
                  <div className="creative-import-chip-row">
                    {creativeCharacters.length ? creativeCharacters.slice(0, 8).map((entity) => (
                      <span key={entity.entity_id} className="creative-import-chip">{entity.name}</span>
                    )) : <span className="creative-import-empty">暂未发现</span>}
                  </div>
                </div>
                <div>
                  <h3>候选地点</h3>
                  <div className="creative-import-chip-row">
                    {creativeLocations.length ? creativeLocations.slice(0, 8).map((entity) => (
                      <span key={entity.entity_id} className="creative-import-chip creative-import-chip--place">{entity.name}</span>
                    )) : <span className="creative-import-empty">暂未发现</span>}
                  </div>
                </div>
                <div>
                  <h3>候选物件</h3>
                  <div className="creative-import-chip-row">
                    {creativeItems.length ? creativeItems.slice(0, 8).map((entity) => (
                      <span key={entity.entity_id} className="creative-import-chip creative-import-chip--item">{entity.name}</span>
                    )) : <span className="creative-import-empty">暂未发现</span>}
                  </div>
                </div>
              </div>

              <div className="creative-import-events">
                <h3>候选事件</h3>
                {creativeEvents.length ? creativeEvents.slice(0, 4).map((event) => (
                  <p key={event.event_id}>{event.description}</p>
                )) : <p className="creative-import-empty">暂未发现</p>}
              </div>

              <div className="creative-import-evidence">
                <h3>原文依据</h3>
                {creativeEvidence.map((evidence) => (
                  <blockquote key={evidence.evidence_id}>{evidence.quote}</blockquote>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <NarrativeOrbitSystem
          chapterLabel={chapterLabel}
          eventNodes={cosmicEventNodes}
          statusLabel={storyStatus}
        >
          <section className={`writing-output writing-canvas-primary manuscript-layer ${fadeInMotion.className}`} data-testid="writing-output" aria-label="写作输出">
            <div className="manuscript-paper">
              {visibleMessages.slice(-8).map((message) => (
                <article
                  key={message.id}
                  className={`writing-message writing-message--${message.role} ${message.role === "tianyi" ? "writing-message--orbital-emission" : ""} ${smoothSlideMotion.className}`}
                >
                  <span>{message.role === "author" ? "作者" : "天意"}</span>
                  <p className={message.role === "tianyi" ? "writing-message__text--sentence-reveal" : undefined}>
                    {renderMessageText(message)}
                  </p>
                </article>
              ))}
            </div>

            <div className="tertiary-memory-layer" aria-label="故事记忆浮层">
              {lastProductResponse ? (
                <div className="writing-suggestion-chips" data-testid="writing-suggestion-chips">
                  {productSuggestions.slice(0, 3).map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      className="writing-suggestion-chip"
                      onClick={() => setDraft(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              ) : null}
              <aside className={`minimal-session-indicator floating-session-pill ${glowPulseMotion.className}`} data-testid="minimal-session-indicator" aria-label="当前写作状态">
                <span>{chapterLabel}</span>
                <p>{storyStatus}</p>
              </aside>
            </div>
          </section>
        </NarrativeOrbitSystem>

        <section className={`writing-input ai-presence-layer${typingActive || draft ? " writing-input--typing" : ""}`} data-testid="writing-input">
          <label>
            <span>继续写</span>
            <textarea
              data-testid="tianyi-immersive-input"
              rows={3}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onFocus={() => setTypingActive(true)}
              onBlur={() => setTypingActive(false)}
              placeholder="写下一段故事，或告诉天意你想怎么改。"
            />
          </label>
          <button type="button" className="tianyi-send-button" data-testid="tianyi-immersive-send" onClick={submitDraft}>
            发送
          </button>
        </section>
      </main>
    </section>
  )
}
