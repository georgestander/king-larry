"use client";

import { useEffect, useMemo, useState } from "react";
import { MessageSquareText, RefreshCw } from "lucide-react";
import { TextStreamChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";

import { ErrorBanner, type ErrorInfo } from "@/app/components/alerts/ErrorBanner";
import { InterviewChat } from "@/app/components/chat/InterviewChat";
import { Dialog, DialogContent, DialogTrigger } from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { loadAiSettings } from "@/app/lib/ai-settings";
import type { ScriptEditorDraft } from "@/lib/editor-types";
import type { ModelProvider } from "@/lib/models";

type SurveyTestClientProps = {
  draft: ScriptEditorDraft;
  timeLimitMinutes: number;
};

export const SurveyTestClient = ({ draft, timeLimitMinutes }: SurveyTestClientProps) => {
  const [provider, setProvider] = useState<ModelProvider>("openai");
  const [model, setModel] = useState<string>("");
  const [availableProviders, setAvailableProviders] = useState<Record<ModelProvider, boolean>>({
    openai: true,
    anthropic: true,
    openrouter: true,
  });
  const [aiReady, setAiReady] = useState(false);

  const [started, setStarted] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [completed, setCompleted] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const transport = useMemo(() => new TextStreamChatTransport({ api: "/api/preview/chat" }), []);
  const { messages, sendMessage, status, setMessages, error } = useChat({ transport });

  const isLoading = status === "streaming" || status === "submitted";
  const providerEnabled = availableProviders[provider];
  const isChatReady = aiReady && providerEnabled && Boolean(model);

  useEffect(() => {
    loadAiSettings()
      .then(({ settings, providers }) => {
        setProvider(settings.provider);
        setModel(settings.model);
        setAvailableProviders(providers);
      })
      .catch(() => null)
      .finally(() => setAiReady(true));
  }, []);

  const remainingSeconds = useMemo(() => {
    if (!startedAt) return timeLimitMinutes * 60;
    const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
    return Math.max(0, timeLimitMinutes * 60 - elapsedSeconds);
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
    if (!isChatReady) return;
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
      // useChat error surfaces via `error`
    }
  };

  const handleReset = () => {
    setStarted(false);
    setStartedAt(null);
    setInput("");
    setCompleted(false);
    setMessages([]);
  };

  const uiError: ErrorInfo | null = error ? { message: error.message } : null;

  return (
    <div className="space-y-6">
      <ErrorBanner error={uiError} />

      {aiReady && !providerEnabled && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-950">
          <p className="font-semibold">AI provider not configured</p>
          <p className="mt-1 text-xs text-amber-900/80">
            Configure provider + model in{" "}
            <a href="/settings" className="font-semibold underline underline-offset-4">Settings</a>{" "}
            before testing the chat.
          </p>
        </div>
      )}

      <Card className="border-ink-200/70 bg-white/95">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-4 text-sm text-ink-700">
          <p className="text-xs text-ink-500">
            Using AI settings from{" "}
            <a href="/settings" className="font-semibold underline underline-offset-4">Settings</a>
            :{" "}
            <span className="font-semibold">{provider}</span>
            {" · "}
            <span className="font-semibold">{model || "—"}</span>
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleReset} disabled={!started && messages.length === 0}>
              <RefreshCw className="h-4 w-4" />
              Start over
            </Button>
            <Dialog open={chatOpen} onOpenChange={setChatOpen}>
              <DialogTrigger asChild>
                <Button size="sm" disabled={!isChatReady}>
                  <MessageSquareText className="h-4 w-4" />
                  Open test chat
                </Button>
              </DialogTrigger>
              <DialogContent className="h-[90vh] max-w-5xl border-none bg-transparent p-0 shadow-none">
                <InterviewChat
                  className="h-full"
                  layout="embedded"
                  title={draft.meta.title}
                  subtitle="Preview — this simulates the respondent UI."
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
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
      <Card className="border-ink-200/70 bg-white/90">
        <CardContent className="space-y-3 py-10 text-sm text-ink-600">
          <p className="font-semibold text-ink-900">Test chat</p>
          <p>
            Open the modal to preview the respondent UI. The chat scrolls independently and stays pinned to the latest
            message.
          </p>
          <Button onClick={() => setChatOpen(true)} disabled={!isChatReady} className="w-full sm:w-auto">
            <MessageSquareText className="h-4 w-4" />
            Open test chat
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
