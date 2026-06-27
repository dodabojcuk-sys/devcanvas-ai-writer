"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type SessionState = "idle" | "drafting" | "ready";

const starterSuggestions = [
  "Clarify the protagonist's immediate goal.",
  "Turn the scene into sensory prose.",
  "Add conflict without changing the plot.",
];

function createMockResponse(input: string) {
  return [
    "AI Tianyi mock draft",
    "",
    `Based on your input: ${input}`,
    "",
    "The scene can open closer to the character's intent, then widen into action. Keep the next paragraph focused on one decision, one obstacle, and one visible consequence.",
  ].join("\n");
}

function SessionIndicator({ state }: { state: SessionState }) {
  const label = {
    idle: "Local session idle",
    drafting: "Mock response generating",
    ready: "Mock response ready",
  }[state];

  return (
    <div className="dcw-session-indicator" aria-live="polite">
      <span className={`dcw-session-dot dcw-session-dot-${state}`} />
      {label}
    </div>
  );
}

function WritingInput({
  inputText,
  isGenerating,
  onInputChange,
  onGenerate,
}: {
  inputText: string;
  isGenerating: boolean;
  onInputChange: (value: string) => void;
  onGenerate: () => void;
}) {
  return (
    <form
      className="dcw-writing-input"
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        onGenerate();
      }}
    >
      <label className="dcw-input-label" htmlFor="tianyi-writing-input">
        AI Tianyi writing input
      </label>
      <textarea
        id="tianyi-writing-input"
        className="dcw-input-field"
        value={inputText}
        onChange={(event) => onInputChange(event.target.value)}
        placeholder="Write the next scene beat, paragraph idea, or revision request."
        rows={6}
      />
      <div className="dcw-input-actions">
        <span className="dcw-input-hint">Mock only. No kernel, runtime, or system access.</span>
        <button className="dcw-generate-button" type="submit" disabled={isGenerating}>
          {isGenerating ? "Drafting..." : "Generate mock draft"}
        </button>
      </div>
    </form>
  );
}

function WritingCanvas({ outputText }: { outputText: string }) {
  return (
    <section className="dcw-writing-canvas" aria-label="Writing canvas">
      {outputText ? (
        <pre className="dcw-output-text">{outputText}</pre>
      ) : (
        <div className="dcw-empty-canvas">
          <p>Writing area is ready.</p>
          <span>Enter a scene idea to render a local mock AI response here.</span>
        </div>
      )}
    </section>
  );
}

function AISuggestionPanel({ onUseSuggestion }: { onUseSuggestion: (value: string) => void }) {
  return (
    <aside className="dcw-suggestion-panel" aria-label="AI suggestion panel">
      <div>
        <p className="dcw-panel-eyebrow">Mock suggestions</p>
        <h2>Shape the next pass</h2>
      </div>
      <div className="dcw-suggestion-list">
        {starterSuggestions.map((suggestion) => (
          <button
            className="dcw-suggestion-chip"
            key={suggestion}
            type="button"
            onClick={() => onUseSuggestion(suggestion)}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </aside>
  );
}

export default function TianyiImmersiveWorkspace() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const generationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (generationTimer.current) {
        clearTimeout(generationTimer.current);
      }
    };
  }, []);

  const handleGenerate = () => {
    const trimmedInput = inputText.trim();

    if (!trimmedInput || sessionState === "drafting") {
      return;
    }

    if (generationTimer.current) {
      clearTimeout(generationTimer.current);
    }

    setSessionState("drafting");
    generationTimer.current = setTimeout(() => {
      setOutputText(createMockResponse(trimmedInput));
      setSessionState("ready");
    }, 420);
  };

  const handleUseSuggestion = (suggestion: string) => {
    setInputText((current) => (current ? `${current}\n\n${suggestion}` : suggestion));
  };

  return (
    <main className="dcw-tianyi-workspace">
      <section className="dcw-workspace-primary" aria-label="AI Tianyi writing workspace">
        <SessionIndicator state={sessionState} />
        <WritingInput
          inputText={inputText}
          isGenerating={sessionState === "drafting"}
          onInputChange={setInputText}
          onGenerate={handleGenerate}
        />
        <WritingCanvas outputText={outputText} />
      </section>
      <AISuggestionPanel onUseSuggestion={handleUseSuggestion} />
    </main>
  );
}
