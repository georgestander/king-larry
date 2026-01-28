"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, Sparkles } from "lucide-react";

import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Textarea } from "@/app/components/ui/textarea";
import { MODEL_OPTIONS, getDefaultModel, type ModelProvider } from "@/lib/models";

type SurveyPublishClientProps = {
  versionId: string;
  defaultTitle: string;
};

type Participant = {
  id: string;
  invite_token: string;
  status: "invited" | "started" | "completed";
  email: string | null;
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
    const detailText = details ? ` (${JSON.stringify(details)})` : "";
    throw new Error(`${baseMessage}${detailText}`);
  }
  return response.json() as Promise<T>;
};

const summarizeParticipants = (participants: Participant[]) => {
  const sent = participants.length;
  const started = participants.filter((participant) => participant.status !== "invited").length;
  const completed = participants.filter((participant) => participant.status === "completed").length;
  const completionRate = sent ? Math.round((completed / sent) * 100) : 0;
  return { sent, started, completed, completionRate };
};

const InviteLinkRow = ({ token }: { token: string }) => {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const inviteUrl = origin ? `${origin}/interview/${token}` : `/interview/${token}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <Input readOnly value={inviteUrl} className="h-8 max-w-[260px] text-xs" />
      <Button size="sm" variant="outline" onClick={handleCopy}>
        <Copy className="mr-1 h-3.5 w-3.5" />
        {copied ? "Copied" : "Copy"}
      </Button>
      <Button size="sm" variant="ghost" asChild>
        <a href={inviteUrl} target="_blank" rel="noreferrer">
          Open
        </a>
      </Button>
    </div>
  );
};

export const SurveyPublishClient = ({ versionId, defaultTitle }: SurveyPublishClientProps) => {
  const [sessionTitle, setSessionTitle] = useState(`${defaultTitle} Run`);
  const [timeLimit, setTimeLimit] = useState("15");
  const [provider, setProvider] = useState<ModelProvider>("openai");
  const [model, setModel] = useState(getDefaultModel("openai"));
  const [inviteEmails, setInviteEmails] = useState("");
  const [anonymousCount, setAnonymousCount] = useState("0");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [inviteTokens, setInviteTokens] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<{ sent: number; started: number; completed: number; completionRate: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const modelOptions = useMemo(() => MODEL_OPTIONS[provider], [provider]);

  useEffect(() => {
    if (!modelOptions.find((option) => option.id === model)) {
      setModel(getDefaultModel(provider));
    }
  }, [model, modelOptions, provider]);

  const refreshMetrics = async (id: string) => {
    const response = await fetch(`/api/sessions/${id}`);
    if (!response.ok) return;
    const payload = await response.json() as { participants: Participant[] };
    setMetrics(summarizeParticipants(payload.participants ?? []));
  };

  const handlePublish = async () => {
    setSaving(true);
    setError(null);
    try {
      const session = await postJson<{ sessionId: string }>("/api/sessions", {
        title: sessionTitle || "Survey Run",
        scriptVersionId: versionId,
        timeLimitMinutes: Number(timeLimit) || 15,
        provider,
        model,
      });
      setSessionId(session.sessionId);
      await refreshMetrics(session.sessionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish");
    } finally {
      setSaving(false);
    }
  };

  const handleInvites = async () => {
    if (!sessionId) return;
    setSaving(true);
    setError(null);
    try {
      const tokens: string[] = [];
      const emails = inviteEmails.split(",").map((email) => email.trim()).filter(Boolean);
      if (emails.length) {
        const invite = await postJson<{ participants: Participant[] }>(
          `/api/sessions/${sessionId}/invite`,
          { emails },
        );
        tokens.push(...invite.participants.map((participant) => participant.invite_token));
      }

      const count = Number(anonymousCount) || 0;
      if (count > 0) {
        const invite = await postJson<{ participants: Participant[] }>(
          `/api/sessions/${sessionId}/invite-anonymous`,
          { count },
        );
        tokens.push(...invite.participants.map((participant) => participant.invite_token));
      }

      if (tokens.length) {
        setInviteTokens((prev) => [...prev, ...tokens]);
      }
      await refreshMetrics(sessionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to invite");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-ink-200/70 bg-white/95">
        <CardHeader>
          <CardTitle>Publish this run</CardTitle>
          <CardDescription>Create a live session before sending invites.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Run title</Label>
            <Input value={sessionTitle} onChange={(event) => setSessionTitle(event.target.value)} />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Time limit (minutes)</Label>
              <Input value={timeLimit} onChange={(event) => setTimeLimit(event.target.value)} />
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
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {!sessionId ? (
            <Button onClick={handlePublish} disabled={saving}>
              <Sparkles className="mr-2 h-4 w-4" />
              Publish run
            </Button>
          ) : (
            <div className="rounded-xl border border-ink-200 bg-ink-50/70 p-4 text-sm text-ink-700">
              Run is live.
            </div>
          )}
        </CardContent>
      </Card>

      {sessionId && (
        <Card className="border-ink-200/70 bg-white/95">
          <CardHeader>
            <CardTitle>Invite participants</CardTitle>
            <CardDescription>Generate links for emails or anonymous shares.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Invite emails (comma-separated)</Label>
              <Textarea
                value={inviteEmails}
                onChange={(event) => setInviteEmails(event.target.value)}
                placeholder="alex@company.com, jamie@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Anonymous links</Label>
              <Input value={anonymousCount} onChange={(event) => setAnonymousCount(event.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={handleInvites}
                disabled={saving}
              >
                Generate invites
              </Button>
              <Button asChild variant="outline">
                <a href={`/api/sessions/${sessionId}/export.csv`}>Export CSV</a>
              </Button>
              <Button asChild variant="outline">
                <a href={`/sessions/${sessionId}`}>View results</a>
              </Button>
            </div>
            {inviteTokens.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.3em] text-ink-400">Invite links</p>
                <div className="space-y-2">
                  {inviteTokens.map((token) => (
                    <InviteLinkRow key={token} token={token} />
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {metrics && (
        <Card className="border-ink-200/70 bg-white/95">
          <CardHeader>
            <CardTitle>Run metrics</CardTitle>
            <CardDescription>Track responses as they come in.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm text-ink-600 md:grid-cols-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-ink-400">Sent</p>
              <p className="text-2xl font-semibold text-ink-900">{metrics.sent}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-ink-400">Started</p>
              <p className="text-2xl font-semibold text-ink-900">{metrics.started}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-ink-400">Completed</p>
              <p className="text-2xl font-semibold text-ink-900">{metrics.completed}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-ink-400">Completion</p>
              <p className="text-2xl font-semibold text-ink-900">{metrics.completionRate}%</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
