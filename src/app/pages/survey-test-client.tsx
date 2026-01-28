"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Save } from "lucide-react";
import { TextStreamChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";

import { InterviewChat } from "@/app/components/chat/InterviewChat";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import type { ScriptEditorDraft } from "@/lib/editor-types";
import { MODEL_OPTIONS, getDefaultModel, type ModelProvider } from "@/lib/models";

type SurveyTestClientProps = {
  scriptId: string;
  versionId: string;
  draft: ScriptEditorDraft;
  initialProvider: ModelProvider;
  initialModel: string;
  timeLimitMinutes: number;
};

export const SurveyTestClient = ({
  scriptId,
  versionId,
  draft,
  initialProvider,
  initialModel,
  timeLimitMinutes,
}: SurveyTestClientProps) => {
  const [provider, setProvider] = useState<ModelProvider>(initialProvider);
  const [model, setModel] = useState(initialModel);
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

  const { messages, sendMessage, status, setMessages } = useChat({ transport });
  const isLoading = status === "streaming" || status === "submitted";

  const modelOptions = useMemo(() => MODEL_OPTIONS[provider], [provider]);

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
  };

  const handleReset = async () => {
    setStarted(false);
    setStartedAt(null);
    setInput("");
    setCompleted(false);
    setMessages([]);
    await saveTranscript([]);
  };

  const saveTranscript = async (transcript: typeof messages) => {
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

  return (
    <div className="space-y-6">
      <Card className="border-ink-200/70 bg-white/95">
        <CardHeader className="flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg">Preview settings</CardTitle>
            <p className="text-sm text-ink-500">Test the exact respondent experience.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => saveTranscript(messages)} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              Save transcript
            </Button>
            <Button variant="outline" onClick={handleReset} disabled={saving}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Start over
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Provider</Label>
            <Select value={provider} onValueChange={(value) => setProvider(value as ModelProvider)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="anthropic">Anthropic</SelectItem>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="openrouter">OpenRouter</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Model</Label>
            <Select value={model} onValueChange={setModel}>
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
  );
};
