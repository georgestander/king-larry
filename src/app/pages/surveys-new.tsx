"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Textarea } from "@/app/components/ui/textarea";
import { MODEL_OPTIONS, getDefaultModel, type ModelProvider } from "@/lib/models";
import type { ScriptEditorDraft } from "@/lib/editor-types";

const postJson = async <T,>(url: string, body: unknown): Promise<T> => {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const baseMessage = typeof (payload as { error?: string }).error === "string"
      ? (payload as { error?: string }).error
      : "Request failed";
    const details = (payload as { details?: unknown }).details;
    const detailText = details ? ` (${JSON.stringify(details)})` : "";
    throw new Error(`${baseMessage}${detailText}`);
  }
  return response.json() as Promise<T>;
};

export const SurveysNewPage = () => {
  const [title, setTitle] = useState("");
  const [audience, setAudience] = useState("");
  const [goal, setGoal] = useState("");
  const [notes, setNotes] = useState("");
  const [provider, setProvider] = useState<ModelProvider>("openai");
  const [model, setModel] = useState(getDefaultModel("openai"));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const modelOptions = useMemo(() => MODEL_OPTIONS[provider], [provider]);

  useEffect(() => {
    if (!modelOptions.find((option) => option.id === model)) {
      setModel(getDefaultModel(provider));
    }
  }, [model, modelOptions, provider]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await postJson<{ draft: ScriptEditorDraft }>("/api/scripts/generate", {
        title,
        goal,
        audience,
        notes,
        provider,
        model,
      });
      const draft = result.draft;
      draft.meta.title = draft.meta.title || title;
      draft.meta.subtitle = draft.meta.subtitle || (audience ? `Audience: ${audience}` : "Narrative Survey");
      const response = await postJson<{ scriptId: string; versionId: string }>("/api/scripts", {
        title: draft.meta.title,
        draft,
      });
      window.location.href = `/surveys/${response.scriptId}/script`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink-50 text-ink-950 [background-image:radial-gradient(1200px_circle_at_top,_rgba(255,255,255,0.9),_transparent)]">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-12">
        <Card className="border-ink-200/70 bg-white/95">
          <CardHeader>
            <CardTitle>Create a new survey</CardTitle>
            <CardDescription>Brief → Script → Test → Publish</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-ink-400">
              <span className="text-ink-700">Brief</span>
              <ArrowRight className="h-3 w-3" />
              <span>Script</span>
              <ArrowRight className="h-3 w-3" />
              <span>Test</span>
              <ArrowRight className="h-3 w-3" />
              <span>Publish</span>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Survey title</Label>
                <Input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Onboarding Experience"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Audience</Label>
                  <Input
                    value={audience}
                    onChange={(event) => setAudience(event.target.value)}
                    placeholder="New users"
                  />
                </div>
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
              </div>
              <div className="space-y-2">
                <Label>Goal</Label>
                <Textarea
                  value={goal}
                  onChange={(event) => setGoal(event.target.value)}
                  placeholder="Understand why users drop during onboarding."
                />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Tone, constraints, specifics."
                />
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
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button onClick={handleGenerate} disabled={!title || !goal || loading} className="w-full">
                <Sparkles className="mr-2 h-4 w-4" />
                Generate script
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
