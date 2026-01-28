"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Save } from "lucide-react";
import { TextStreamChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";

import { ErrorBanner, type ErrorInfo } from "@/app/components/alerts/ErrorBanner";
import { InterviewChat } from "@/app/components/chat/InterviewChat";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { loadAiSettings } from "@/app/lib/ai-settings";
import type { ScriptEditorDraft } from "@/lib/editor-types";
import { type ModelProvider } from "@/lib/models";

type SurveyTestShellClientProps = {
  scriptId: string;
  versionId: string | null;
  draft: ScriptEditorDraft;
  timeLimitMinutes: number;
};

export const SurveyTestShellClient = ({
  scriptId,
  versionId,
  draft,
  timeLimitMinutes,
}: SurveyTestShellClientProps) => {
  const [provider, setProvider] = useState<ModelProvider>("openai");
  const [model, setModel] = useState<string>("");
  const [aiReady, setAiReady] = useState(false);
  const [started, setStarted] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const transport = useMemo(
    () => new TextStreamChatTransport({ api: "/api/preview/chat" }),
    [],
  );

  const { messages, sendMessage, status, setMessages, error } = useChat({ transport });
  const isLoading = status === "streaming" || status === "submitted";
  const isChatReady = aiReady && Boolean(provider) && Boolean(model);

  useEffect(() => {
    loadAiSettings()
      .then(({ settings }) => {
        setProvider(settings.provider);
        setModel(settings.model);
      })
      .catch(() => null)
      .finally(() => setAiReady(true));
  }, []);

  const remainingSeconds = useMemo(() => {
    if (!startedAt) return Number(timeLimitMinutes) * 60;
    const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
    return Math.max(0, Number(timeLimitMinutes) * 60 - elapsedSeconds);
  }, [startedAt, timeLimitMinutes]);

  const startInterview = () => {
    setStarted(true);
    setMessages([
      {
        id: crypto.randomUUID(),
        role: "assistant",
        parts: [{ type: "text", text: "Before we start, what name should I use for you?" }],
      } as any,
    ]);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!input.trim() || isLoading) return;
    if (!aiReady || !provider || !model) return;
    if (!startedAt) setStartedAt(Date.now());
    const message = input.trim();
    setInput("");
    try {
      await sendMessage(
        { text: message },
        {
          body: {
            provider,
            model,
            timeLimitMinutes,
            draft,
          },
        },
      );
    } catch {
      // useChat error will surface via `error`
    }
  };

  const saveTranscript = async (transcript: typeof messages) => {
    if (!versionId) return;
    setSaving(true);
    try {
      await fetch(`/api/scripts/${scriptId}/versions/${versionId}/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      setSavedAt(new Date().toISOString());
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setStarted(false);
    setStartedAt(null);
    setInput("");
    setCompleted(false);
    setMessages([]);
    await saveTranscript([]);
  };

  const uiError: ErrorInfo | null = error ? { message: error.message } : null;

  return (
    <div className="space-y-6">
      <ErrorBanner error={uiError} />
      {!isChatReady && (
        <div className="rounded-2xl border border-ink-200 bg-white/90 p-4 text-sm text-ink-700">
          Loading AI settings… Configure provider/model in{" "}
          <a href="/settings" className="font-semibold underline underline-offset-4">Settings</a>.
        </div>
      )}

      <Card className="border-ink-200/70 bg-white/95">
        <CardContent className="space-y-3 pt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-400">Test tools</p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => saveTranscript(messages)}
              disabled={saving || !versionId}
            >
              <Save className="mr-2 h-4 w-4" />
              Save transcript
            </Button>
            <Button size="sm" variant="outline" onClick={handleReset} disabled={saving}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Start over
            </Button>
            <Button asChild size="sm" variant="ghost">
              <a href="/settings">AI settings</a>
            </Button>
          </div>

          {!versionId && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-950">
              Save a script version before saving transcripts.
            </div>
          )}
          {savedAt && (
            <p className="text-xs text-ink-500">Saved {new Date(savedAt).toLocaleTimeString()}</p>
          )}
        </CardContent>
      </Card>

      <InterviewChat
        title={draft.meta.title}
        subtitle="Preview — this is exactly what respondents see."
        timeLimitMinutes={timeLimitMinutes}
        remainingSeconds={remainingSeconds}
        started={started}
        messages={messages}
        input={input}
        onInputChange={setInput}
        onSubmit={handleSubmit}
        onStart={startInterview}
        onComplete={() => setCompleted(true)}
        startDisabled={!isChatReady}
        inputDisabled={!isChatReady}
        isLoading={isLoading}
        completed={completed}
        showFinish={false}
      />
    </div>
  );
};
