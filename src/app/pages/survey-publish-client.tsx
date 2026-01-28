"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";

import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { ErrorBanner, type ErrorInfo } from "@/app/components/alerts/ErrorBanner";
import { loadAiSettings } from "@/app/lib/ai-settings";
import type { InterviewDefinition } from "@/lib/interview-types";
import type { ModelProvider } from "@/lib/models";

type SurveyPublishClientProps = {
  scriptId: string;
  versionId: string;
  defaultTitle: string;
  interview: InterviewDefinition;
  scriptVersionNumber: number;
  scriptVersionCreatedAt: string;
  latestResponseRun: {
    id: string;
    title: string;
    created_at: string;
    script_version_number: number;
    sent_count: number;
    started_count: number;
    completed_count: number;
  } | null;
  requiresResponseGate: boolean;
};

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

export const SurveyPublishClient = ({
  scriptId,
  versionId,
  defaultTitle,
  interview,
  scriptVersionNumber,
  scriptVersionCreatedAt,
  latestResponseRun,
  requiresResponseGate,
}: SurveyPublishClientProps) => {
  const [sessionTitle, setSessionTitle] = useState(`${defaultTitle} Run`);
  const [timeLimit, setTimeLimit] = useState("15");
  const [provider, setProvider] = useState<ModelProvider>("openai");
  const [model, setModel] = useState<string>("");
  const [availableProviders, setAvailableProviders] = useState<Record<ModelProvider, boolean>>({
    openai: true,
    anthropic: true,
    openrouter: true,
  });
  const [aiReady, setAiReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<ErrorInfo | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

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

  const handlePublish = async () => {
    setSaving(true);
    setError(null);
    try {
      const resolved = await loadAiSettings();
      setProvider(resolved.settings.provider);
      setModel(resolved.settings.model);
      setAvailableProviders(resolved.providers);

      if (!resolved.providers[resolved.settings.provider]) {
        setError({
          message: "No AI provider configured. Set an API key and choose a provider/model in Settings.",
        });
        return;
      }

      const session = await postJson<{ sessionId: string }>("/api/sessions", {
        title: sessionTitle || "Survey Run",
        scriptVersionId: versionId,
        timeLimitMinutes: Number(timeLimit) || 15,
        provider: resolved.settings.provider,
        model: resolved.settings.model,
      });
      setSessionId(session.sessionId);
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
        setError({ message: "Failed to publish" });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-ink-200/70 bg-white/95">
        <CardHeader>
          <CardTitle>Review & publish</CardTitle>
          <CardDescription>Create a live run from the active script version.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {aiReady && !availableProviders[provider] && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-950">
              <p className="font-semibold">AI provider not configured</p>
              <p className="mt-1 text-xs text-amber-900/80">
                Configure provider + model in{" "}
                <a href="/settings" className="font-semibold underline underline-offset-4">Settings</a>{" "}
                before publishing a live run.
              </p>
            </div>
          )}
          {!sessionId && latestResponseRun && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-950">
              <p className="font-semibold text-amber-950">Heads up: you already have responses</p>
              <p className="mt-1 text-xs text-amber-900/80">
                Latest run with responses: <span className="font-semibold">{latestResponseRun.title}</span>{" "}
                (Version {latestResponseRun.script_version_number}) ·{" "}
                {new Date(latestResponseRun.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
              </p>
              <div className="mt-2 flex flex-wrap gap-4 text-xs text-amber-900/80">
                <span><span className="font-semibold">Sent</span> {latestResponseRun.sent_count}</span>
                <span><span className="font-semibold">Started</span> {latestResponseRun.started_count}</span>
                <span><span className="font-semibold">Completed</span> {latestResponseRun.completed_count}</span>
              </div>
              {requiresResponseGate && (
                <p className="mt-3 text-xs text-amber-950">
                  Publishing a new run on a new version splits results. If you just need more respondents, invite more people to the existing run instead.
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline">
                  <a href={`/surveys/${scriptId}/runs/${latestResponseRun.id}`}>View latest run results</a>
                </Button>
                <Button asChild size="sm" variant="ghost">
                  <a href={`/surveys/${scriptId}/invite`}>Invite more people</a>
                </Button>
              </div>
            </div>
          )}

          <details className="group">
            <summary className="flex cursor-pointer items-center justify-between rounded-xl border border-ink-200/70 bg-white px-4 py-3 text-sm font-semibold text-ink-900">
              Survey script (Version {scriptVersionNumber})
              <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
            </summary>
            <div className="mt-3 space-y-3 rounded-xl border border-ink-200/70 bg-ink-50/60 p-4 text-sm text-ink-700">
              <p className="text-xs text-ink-500">
                This run will use the active script version created{" "}
                {new Date(scriptVersionCreatedAt).toLocaleDateString()}.
                Changes you make later will create a new version and won’t affect this run.
              </p>
              <div>
                <p className="text-base font-semibold text-ink-950">{interview.meta.title}</p>
                <p className="text-sm text-ink-500">{interview.meta.subtitle}</p>
              </div>
              {interview.context?.briefingMarkdown && (
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.2em] text-ink-400">Briefing</p>
                  <p className="whitespace-pre-wrap text-sm text-ink-700">{interview.context.briefingMarkdown}</p>
                </div>
              )}
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.2em] text-ink-400">Questions</p>
                <ol className="space-y-2 pl-5 text-sm text-ink-800">
                  {interview.questions.map((question) => (
                    <li key={question.id}>
                      <p className="text-xs font-semibold text-ink-900">{question.topic}</p>
                      <p className="text-sm text-ink-700">{question.question}</p>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline">
                  <a href={`/surveys/${scriptId}/script`}>Edit script</a>
                </Button>
                <Button asChild size="sm" variant="secondary">
                  <a href={`/surveys/${scriptId}/test`}>Test chat</a>
                </Button>
              </div>
            </div>
          </details>

          <div className="space-y-2">
            <Label>Run title</Label>
            <Input value={sessionTitle} onChange={(event) => setSessionTitle(event.target.value)} />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Time limit (minutes)</Label>
              <Input value={timeLimit} onChange={(event) => setTimeLimit(event.target.value)} />
            </div>
          </div>
          <ErrorBanner error={error} />
          {!sessionId ? (
            <Button
              onClick={handlePublish}
              disabled={
                saving
                || !aiReady
                || !availableProviders[provider]
              }
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {requiresResponseGate ? "Publish new run anyway" : "Publish run"}
            </Button>
          ) : (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm text-emerald-950">
              <p className="font-semibold">Run is live.</p>
              <p className="mt-1 text-xs text-emerald-900/80">
                Next: invite participants to start collecting responses.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button asChild size="sm" variant="secondary">
                  <a href={`/surveys/${scriptId}/invite`}>Invite participants</a>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <a href={`/surveys/${scriptId}/runs/${sessionId}`}>View results</a>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

