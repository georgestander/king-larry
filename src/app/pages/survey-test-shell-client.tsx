"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, RefreshCw, Save } from "lucide-react";
import { TextStreamChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";

import { SurveyShell, type SurveyRunItem, type SurveyVersionItem } from "@/app/components/builder/SurveyShell";
import type { SurveyStep } from "@/app/components/builder/steps";
import { ErrorBanner, type ErrorInfo } from "@/app/components/alerts/ErrorBanner";
import { InterviewChat } from "@/app/components/chat/InterviewChat";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import type { ScriptEditorDraft } from "@/lib/editor-types";
import { MODEL_OPTIONS, getDefaultModel, type ModelOption, type ModelProvider } from "@/lib/models";

type SurveyTestShellClientProps = {
  title: string;
  steps: SurveyStep[];
  versions: SurveyVersionItem[];
  runs: SurveyRunItem[];
  scriptId: string;
  versionId: string | null;
  draft: ScriptEditorDraft;
  initialProvider: ModelProvider;
  initialModel: string;
  timeLimitMinutes: number;
};

export const SurveyTestShellClient = ({
  title,
  steps,
  versions,
  runs,
  scriptId,
  versionId,
  draft,
  initialProvider,
  initialModel,
  timeLimitMinutes,
}: SurveyTestShellClientProps) => {
  const [provider, setProvider] = useState<ModelProvider>(initialProvider);
  const [model, setModel] = useState(initialModel);
  const [modelOptions, setModelOptions] = useState<ModelOption[]>(MODEL_OPTIONS[initialProvider]);
  const [availableProviders, setAvailableProviders] = useState({
    openai: true,
    anthropic: true,
    openrouter: true,
  });
  const [modelsLoading, setModelsLoading] = useState(false);
  const [timeLimit, setTimeLimit] = useState(String(timeLimitMinutes));
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

  useEffect(() => {
    fetch("/api/config")
      .then((response) => response.json())
      .then((data) => {
        const providers = (data as { providers?: typeof availableProviders }).providers;
        if (providers) {
          setAvailableProviders(providers);
          if (!providers[provider]) {
            const next = (Object.keys(providers) as ModelProvider[]).find((key) => providers[key]) ?? provider;
            setProvider(next);
          }
        }
      })
      .catch(() => null);
  }, []);

  useEffect(() => {
    setModelsLoading(true);
    fetch(`/api/models/${provider}`)
      .then((response) => response.json())
      .then((data) => {
        const models = (data as { models?: ModelOption[] }).models;
        if (models?.length) {
          setModelOptions(models);
        } else {
          setModelOptions(MODEL_OPTIONS[provider]);
        }
      })
      .catch(() => setModelOptions(MODEL_OPTIONS[provider]))
      .finally(() => setModelsLoading(false));
  }, [provider]);

  useEffect(() => {
    if (!modelOptions.find((option) => option.id === model)) {
      setModel(getDefaultModel(provider));
    }
  }, [model, modelOptions, provider]);

  const remainingSeconds = useMemo(() => {
    if (!startedAt) return Number(timeLimit) * 60;
    const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
    return Math.max(0, Number(timeLimit) * 60 - elapsedSeconds);
  }, [startedAt, timeLimit]);

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
            timeLimitMinutes: Number(timeLimit) || 15,
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

  const sidebarPanels = ({ collapsed }: { collapsed: boolean }) => {
    if (collapsed) return null;
    return (
      <details className="group">
        <summary className="flex cursor-pointer items-center justify-between rounded-xl border border-ink-200/70 bg-white/95 px-3 py-2 text-xs font-semibold text-ink-900">
          Preview settings
          <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
        </summary>
        <div className="mt-3 space-y-3">
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
          </div>

          {!versionId && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-950">
              Save a script version before saving transcripts.
            </div>
          )}

          <Card className="border-ink-200/70 bg-white/95">
            <CardContent className="space-y-3 pt-4">
              <div className="space-y-2">
                <Label>Provider</Label>
                <Select value={provider} onValueChange={(value) => setProvider(value as ModelProvider)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="anthropic" disabled={!availableProviders.anthropic}>
                      Anthropic
                    </SelectItem>
                    <SelectItem value="openai" disabled={!availableProviders.openai}>
                      OpenAI
                    </SelectItem>
                    <SelectItem value="openrouter" disabled={!availableProviders.openrouter}>
                      OpenRouter
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Model {modelsLoading ? "(loading…)" : ""}</Label>
                <Select value={model} onValueChange={setModel} disabled={modelsLoading}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {modelOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Time limit (minutes)</Label>
                <Input value={timeLimit} onChange={(event) => setTimeLimit(event.target.value)} />
              </div>
              {savedAt && (
                <p className="text-xs text-ink-500">Saved {new Date(savedAt).toLocaleTimeString()}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </details>
    );
  };

  return (
    <SurveyShell
      title={title}
      subtitle="Test chat"
      steps={steps}
      versions={versions}
      runs={runs}
      sidebarPanels={sidebarPanels}
    >
      <div className="space-y-6">
        <ErrorBanner error={uiError} />

        <InterviewChat
          title={draft.meta.title}
          subtitle="Preview — this is exactly what respondents see."
          timeLimitMinutes={Number(timeLimit) || 15}
          remainingSeconds={remainingSeconds}
          started={started}
          messages={messages}
          input={input}
          onInputChange={setInput}
          onSubmit={handleSubmit}
          onStart={startInterview}
          onComplete={() => setCompleted(true)}
          isLoading={isLoading}
          completed={completed}
          showFinish={false}
        />
      </div>
    </SurveyShell>
  );
};
