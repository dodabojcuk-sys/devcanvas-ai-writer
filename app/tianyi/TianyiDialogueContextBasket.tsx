"use client"

import type { DragEvent } from "react"
import {
  TIANYI_CONTEXT_BASKET_MIME,
  buildTianyiContextBasketView,
  decodeTianyiContextDragData,
  type TianyiDialogueContextItem,
} from "@/runtime/tianyi/tianyiDialogueContextBasket"

type TianyiDialogueContextBasketProps = {
  items: TianyiDialogueContextItem[]
  maxItems?: number
  onAddItem?: (item: TianyiDialogueContextItem) => void
  onRemoveItem?: (id: string) => void
  onClear?: () => void
}

export function TianyiDialogueContextBasket({
  items,
  maxItems,
  onAddItem,
  onRemoveItem,
  onClear,
}: TianyiDialogueContextBasketProps) {
  const view = buildTianyiContextBasketView(items, maxItems)
  const isFull = view.items.length >= view.maxItems

  function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault()
    const encoded = event.dataTransfer.getData(TIANYI_CONTEXT_BASKET_MIME)
    const item = decodeTianyiContextDragData(encoded)
    if (!item || isFull) return
    onAddItem?.(item)
  }

  return (
    <section
      className={`tianyi-context-basket${isFull ? " tianyi-context-basket--full" : ""}`}
      data-testid="tianyi-context-basket"
      aria-label="天意上下文篮"
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
      tabIndex={0}
    >
      <header className="tianyi-context-basket__head">
        <div>
          <span className="dc-badge">上下文篮</span>
          <h4>围绕这些对象问天意</h4>
        </div>
        <span className="status-chip" data-testid="tianyi-context-basket-count">{view.summary}</span>
      </header>

      {view.items.length ? (
        <>
          <div className="tianyi-context-basket__items" data-testid="tianyi-context-basket-items">
            {view.items.map((item) => (
              <article key={`${item.kind}:${item.id}`} className="tianyi-context-basket__item" data-testid="tianyi-context-basket-item">
                <span>{item.kindLabel}</span>
                <strong>{item.title}</strong>
                <p>{item.summary}</p>
                <small>{item.sourceLabel}{item.evidenceLabel ? ` · ${item.evidenceLabel}` : ""}</small>
                {item.riskLabel ? <small>风险：{item.riskLabel}</small> : null}
                <button
                  type="button"
                  className="ghost-button"
                  data-testid="tianyi-context-basket-remove"
                  onClick={() => onRemoveItem?.(item.id)}
                >
                  移除
                </button>
              </article>
            ))}
          </div>
          <div className="tianyi-context-basket__actions">
            <button type="button" className="ghost-button" data-testid="tianyi-context-basket-clear" onClick={onClear}>
              清空上下文
            </button>
            {isFull ? <span className="status-chip" data-testid="tianyi-context-basket-full">上下文太多了。先移除一些，再继续问天意。</span> : null}
          </div>
        </>
      ) : (
        <p className="tianyi-context-basket__empty" data-testid="tianyi-context-basket-empty">
          把卡片、故事节点或原文证据拖到这里，或点击“加入提问”。
        </p>
      )}

      <p className="tianyi-context-basket__boundary" data-testid="tianyi-context-basket-boundary">
        {view.boundaryText}
      </p>
    </section>
  )
}
