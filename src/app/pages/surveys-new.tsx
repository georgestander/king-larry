"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { ErrorBanner, type ErrorInfo } from "@/app/components/alerts/ErrorBanner";
import { loadAiSettings } from "@/app/lib/ai-settings";
import type { ModelProvider } from "@/lib/models";
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
    const requestId = (payload as { requestId?: string }).requestId;
    const detailText = details ? ` (${JSON.stringify(details)})` : "";
    const error = new Error(`${baseMessage}${detailText}`);
    (error as Error & { details?: unknown; requestId?: string }).details = details;
    (error as Error & { details?: unknown; requestId?: string }).requestId = requestId;
    throw error;
  }
  return response.json() as Promise<T>;
};

export const SurveysNewPage = () => {
  const [title, setTitle] = useState("");
  const [audience, setAudience] = useState("");
  const [goal, setGoal] = useState("");
  const [notes, setNotes] = useState("");
  const [aiProvider, setAiProvider] = useState<ModelProvider>("openai");
  const [aiModel, setAiModel] = useState<string>("");
  const [availableProviders, setAvailableProviders] = useState<Record<ModelProvider, boolean>>({
    openai: true,
    anthropic: true,
    openrouter: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorInfo | null>(null);

  useEffect(() => {
    loadAiSettings()
      .then(({ settings, providers }) => {
        setAiProvider(settings.provider);
        setAiModel(settings.model);
        setAvailableProviders(providers);
      })
      .catch(() => null);
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const resolved = await loadAiSettings();
      const result = await postJson<{ draft: ScriptEditorDraft; usedFallback?: boolean; warning?: string }>("/api/scripts/generate", {
        title,
        goal,
        audience,
        notes,
        provider: resolved.settings.provider,
        model: resolved.settings.model,
      });
      const draft = result.draft;
      draft.meta.title = draft.meta.title || title;
      draft.meta.subtitle = draft.meta.subtitle || (audience ? `Audience: ${audience}` : "Narrative Survey");
      const response = await postJson<{ scriptId: string; versionId: string }>("/api/scripts", {
        title: draft.meta.title,
        draft,
      });
      const noticeParam = result.usedFallback ? "?notice=fallback" : "";
      window.location.href = `/surveys/${response.scriptId}/script${noticeParam}`;
    } catch (err) {
      if (err instanceof Error) {
        const details = (err as Error & { details?: unknown }).details;
        const requestId = (err as Error & { requestId?: string }).requestId;
        setError({
          message: err.message,
          details: details ? JSON.stringify(details, null, 2) : undefined,
          requestId,
        });
      } else {
        setError({ message: "Failed to generate" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <Card className="border-ink-200/70 bg-white/95">
        <CardHeader>
          <CardTitle>Create a new survey</CardTitle>
          <CardDescription>Brief → Script → Test → Publish → Invite → Results</CardDescription>
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
            <ArrowRight className="h-3 w-3" />
            <span>Invite</span>
            <ArrowRight className="h-3 w-3" />
            <span>Results</span>
          </div>

          <div className="rounded-xl border border-ink-200 bg-ink-50/70 p-4 text-sm text-ink-700">
            <p className="font-semibold text-ink-900">AI settings</p>
            <p className="mt-1 text-xs text-ink-600">
              Using <span className="font-semibold">{aiProvider}</span> ·{" "}
              <span className="font-semibold">{aiModel || "—"}</span>.{" "}
              <a href="/settings" className="font-semibold underline underline-offset-4">Change in Settings</a>.
            </p>
            {!availableProviders[aiProvider] && (
              <p className="mt-2 text-xs text-amber-900">
                This provider is currently disabled (missing API key). Generation may fall back to a template.
              </p>
            )}
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
            <ErrorBanner error={error} />
            <Button onClick={handleGenerate} disabled={!title || !goal || loading} className="w-full">
              <Sparkles className="mr-2 h-4 w-4" />
              Generate script
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};
