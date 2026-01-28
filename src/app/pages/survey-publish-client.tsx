"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, Mail, Sparkles } from "lucide-react";

import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Textarea } from "@/app/components/ui/textarea";
import { ErrorBanner, type ErrorInfo } from "@/app/components/alerts/ErrorBanner";
import { MODEL_OPTIONS, getDefaultModel, type ModelOption, type ModelProvider } from "@/lib/models";

type SurveyPublishClientProps = {
  scriptId: string;
  versionId: string;
  defaultTitle: string;
};

type Participant = {
  id: string;
  invite_token: string;
  status: "invited" | "started" | "completed";
  email: string | null;
};

type InviteLink = {
  token: string;
  label: string;
  email?: string | null;
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

const summarizeParticipants = (participants: Participant[]) => {
  const sent = participants.length;
  const started = participants.filter((participant) => participant.status !== "invited").length;
  const completed = participants.filter((participant) => participant.status === "completed").length;
  const completionRate = sent ? Math.round((completed / sent) * 100) : 0;
  return { sent, started, completed, completionRate };
};

const InviteLinkRow = ({ token, label, email, subject }: InviteLink & { subject: string }) => {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const inviteUrl = origin ? `${origin}/interview/${token}` : `/interview/${token}`;

  const inviteMessage = `Hi,\n\nYou’re invited to a short interview: ${subject}.\n\nOpen this link to start:\n${inviteUrl}\n\nThanks!`;
  const mailtoLink = email
    ? `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(`Interview invite: ${subject}`)}&body=${encodeURIComponent(inviteMessage)}`
    : null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleCopyMessage = async () => {
    await navigator.clipboard.writeText(inviteMessage);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 1500);
  };

  return (
    <div className="rounded-xl border border-ink-200/60 bg-white/95 p-3">
      <p className="text-xs font-semibold text-ink-900">{label}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
        <Input readOnly value={inviteUrl} className="h-8 max-w-[320px] text-xs" />
        <Button size="sm" variant="outline" onClick={handleCopy}>
          <Copy className="mr-1 h-3.5 w-3.5" />
          {copied ? "Copied" : "Copy link"}
        </Button>
        <Button size="sm" variant="outline" onClick={handleCopyMessage}>
          <Mail className="mr-1 h-3.5 w-3.5" />
          {copiedMessage ? "Copied" : "Copy message"}
        </Button>
        <Button size="sm" variant="ghost" asChild>
          <a href={inviteUrl} target="_blank" rel="noreferrer">
            Open
          </a>
        </Button>
        {mailtoLink && (
          <Button size="sm" variant="ghost" asChild>
            <a href={mailtoLink}>Email</a>
          </Button>
        )}
      </div>
    </div>
  );
};

export const SurveyPublishClient = ({ scriptId, versionId, defaultTitle }: SurveyPublishClientProps) => {
  const [sessionTitle, setSessionTitle] = useState(`${defaultTitle} Run`);
  const [timeLimit, setTimeLimit] = useState("15");
  const [provider, setProvider] = useState<ModelProvider>("openai");
  const [model, setModel] = useState(getDefaultModel("openai"));
  const [modelOptions, setModelOptions] = useState<ModelOption[]>(MODEL_OPTIONS.openai);
  const [availableProviders, setAvailableProviders] = useState({
    openai: true,
    anthropic: true,
    openrouter: true,
  });
  const [inviteEmails, setInviteEmails] = useState("");
  const [anonymousCount, setAnonymousCount] = useState("0");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [inviteLinks, setInviteLinks] = useState<InviteLink[]>([]);
  const [metrics, setMetrics] = useState<{ sent: number; started: number; completed: number; completionRate: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<ErrorInfo | null>(null);
  const [inviteNotice, setInviteNotice] = useState(false);

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
      .catch(() => setModelOptions(MODEL_OPTIONS[provider]));
  }, [provider]);

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

  const handleInvites = async () => {
    if (!sessionId) return;
    setSaving(true);
    setError(null);
    setInviteNotice(false);
    try {
      const nextLinks: InviteLink[] = [];
      const emails = inviteEmails.split(",").map((email) => email.trim()).filter(Boolean);
      if (emails.length) {
        const invite = await postJson<{ participants: Participant[] }>(
          `/api/sessions/${sessionId}/invite`,
          { emails },
        );
        nextLinks.push(...invite.participants.map((participant) => ({
          token: participant.invite_token,
          label: participant.email ?? "Participant",
          email: participant.email,
        })));
      }

      const count = Number(anonymousCount) || 0;
      if (count > 0) {
        const invite = await postJson<{ participants: Participant[] }>(
          `/api/sessions/${sessionId}/invite-anonymous`,
          { count },
        );
        const startIndex = inviteLinks.filter((link) => !link.email).length;
        nextLinks.push(...invite.participants.map((participant, idx) => ({
          token: participant.invite_token,
          label: `Anonymous link #${startIndex + idx + 1}`,
          email: null,
        })));
      }

      if (nextLinks.length) {
        setInviteLinks((prev) => {
          const existing = new Set(prev.map((link) => link.token));
          const deduped = nextLinks.filter((link) => !existing.has(link.token));
          return [...prev, ...deduped];
        });
        setInviteNotice(true);
      }
      await refreshMetrics(sessionId);
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
        setError({ message: "Failed to invite" });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCreateTestLink = async () => {
    if (!sessionId) return;
    setSaving(true);
    setError(null);
    setInviteNotice(false);
    try {
      const invite = await postJson<{ participants: Participant[] }>(
        `/api/sessions/${sessionId}/invite-anonymous`,
        { count: 1 },
      );
      const token = invite.participants[0]?.invite_token;
      if (token) {
        setInviteLinks((prev) => {
          const existing = new Set(prev.map((link) => link.token));
          if (existing.has(token)) return prev;
          return [...prev, { token, label: "Test link (anonymous)" }];
        });
        setInviteNotice(true);
        window.open(`${window.location.origin}/interview/${token}`, "_blank", "noreferrer");
      }
      await refreshMetrics(sessionId);
    } catch (err) {
      setError({ message: err instanceof Error ? err.message : "Failed to create test link" });
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
          <ErrorBanner error={error} />
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
            <CardDescription>
              This MVP generates invite links. It does not send emails automatically — copy/share links via Slack/email.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-ink-200 bg-ink-50/70 p-4 text-sm text-ink-700">
              <p className="font-semibold text-ink-900">Send invites in 2 steps</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs text-ink-600">
                <li>Generate invite links (below).</li>
                <li>Copy a link (or message) and send it to the participant.</li>
              </ol>
              <div className="mt-3">
                <Button size="sm" variant="secondary" onClick={handleCreateTestLink} disabled={saving}>
                  Create & open a test link
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Emails to generate links for (comma-separated)</Label>
              <p className="text-xs text-ink-500">We won’t email them automatically. Emails are used only to label invite links.</p>
              <Textarea
                value={inviteEmails}
                onChange={(event) => setInviteEmails(event.target.value)}
                placeholder="alex@company.com, jamie@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Anonymous links (no email)</Label>
              <Input value={anonymousCount} onChange={(event) => setAnonymousCount(event.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={handleInvites}
                disabled={saving || (!inviteEmails.trim() && (Number(anonymousCount) || 0) < 1)}
              >
                Generate invite links
              </Button>
              <Button asChild variant="outline">
                <a href={`/api/sessions/${sessionId}/export.csv`}>Export CSV</a>
              </Button>
              <Button asChild variant="outline">
                <a href={`/surveys/${scriptId}/runs/${sessionId}`}>View results</a>
              </Button>
            </div>
            {inviteNotice && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-sm text-emerald-950">
                Invite links created. Copy a link (or message) and send it to participants.
              </div>
            )}
            {inviteLinks.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.3em] text-ink-400">Invite links</p>
                <div className="space-y-2">
                  {inviteLinks.map((link) => (
                    <InviteLinkRow
                      key={link.token}
                      token={link.token}
                      label={link.label}
                      email={link.email}
                      subject={sessionTitle}
                    />
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
