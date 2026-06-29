import type { TianyiImmersiveState } from "@/runtime/tianyi/tianyiImmersiveMock"

type TianyiDialoguePanelProps = {
  state: TianyiImmersiveState
  creativeSettingsSummary?: string
  customInstruction?: string
}

export function TianyiDialoguePanel({
  state,
  creativeSettingsSummary,
  customInstruction,
}: TianyiDialoguePanelProps) {
  const messages = state.messages.length
    ? state.messages
    : [{ id: "dialogue-empty", role: "tianyi" as const, text: "你可以问我：这个角色接下来会怎么做？这条伏笔怎么回收？当前剧情哪里有风险？" }]

  return (
    <section className="tianyi-dialogue-panel" data-testid="tianyi-dialogue-panel" aria-label="天意对话模式">
      <div className="tianyi-dialogue-panel__head">
        <div>
          <span className="dc-badge">对话模式 / 推演建议</span>
          <h3>现在天意会主动回应。</h3>
          <p>这里使用本地预演回复，只展示未来模型接入后的交互结构。</p>
          {creativeSettingsSummary ? (
            <p className="tianyi-creative-style-summary" data-testid="tianyi-dialogue-settings-summary">
              当前天意风格：{creativeSettingsSummary}
              {customInstruction ? `。作者希望：${customInstruction}` : "。"}
            </p>
          ) : null}
        </div>
      </div>

      <div className="tianyi-dialogue-flow" data-testid="tianyi-dialogue-flow">
        {messages.slice(-8).map((message) => (
          <article key={message.id} className={`tianyi-dialogue-message tianyi-dialogue-message--${message.role}`} data-testid="tianyi-dialogue-message">
            <span>{message.role === "author" ? "作者" : "天意"}</span>
            <p>{message.text}</p>
          </article>
        ))}
      </div>

      {state.prophecyPreviews.length ? (
        <section className="tianyi-prophecy-preview" data-testid="tianyi-prophecy-preview">
          <div className="tianyi-world-panel__section-head">
            <strong>候选预言 / 未入正史</strong>
            <span className="status-chip">{state.prophecyPreviews.length} 条</span>
          </div>
          {state.prophecyPreviews.slice(0, 2).map((prophecy) => (
            <article key={prophecy.id} className="tianyi-prophecy-card" data-testid="tianyi-prophecy-card">
              <span>{prophecy.statusLabel}</span>
              <strong>{prophecy.title}</strong>
              <p>{prophecy.prediction}</p>
              <div className="tianyi-card__meta">
                <span>基于：{prophecy.basedOnLabel}</span>
                <span>{prophecy.riskLabel}</span>
                <span>{prophecy.confidenceLabel}</span>
              </div>
              <em>{prophecy.boundaryLabel} 还需要确认：{prophecy.nextQuestionLabel}</em>
            </article>
          ))}
        </section>
      ) : null}
    </section>
  )
}
