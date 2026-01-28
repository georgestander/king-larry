"use client";

import { useEffect, useState } from "react";
import { Copy, ExternalLink, Mail } from "lucide-react";

import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { ErrorBanner, type ErrorInfo } from "@/app/components/alerts/ErrorBanner";

type Participant = {
  invite_token: string;
  status: "invited" | "started" | "completed";
  email: string | null;
};

type InviteLink = {
  token: string;
  label: string;
  email?: string | null;
};

type Metrics = {
  sent: number;
  started: number;
  completed: number;
  completionRate: number;
};

type SurveyInviteClientProps = {
  scriptId: string;
  sessionId: string;
  sessionTitle: string;
  initialMetrics: Metrics;
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

const summarizeParticipants = (participants: Participant[]): Metrics => {
  const sent = participants.length;
  const started = participants.filter((participant) => participant.status !== "invited").length;
  const completed = participants.filter((participant) => participant.status === "completed").length;
  const completionRate = sent ? Math.round((completed / sent) * 100) : 0;
  return { sent, started, completed, completionRate };
};

const InviteLinkRow = ({ token, label, email, subject, baseUrl }: InviteLink & { subject: string; baseUrl: string }) => {
  const [copied, setCopied] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);

  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
  const inviteUrl = normalizedBaseUrl ? `${normalizedBaseUrl}/interview/${token}` : `/interview/${token}`;

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
            <ExternalLink className="mr-1 h-3.5 w-3.5" />
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

export const SurveyInviteClient = ({ scriptId, sessionId, sessionTitle, initialMetrics }: SurveyInviteClientProps) => {
  const [inviteEmails, setInviteEmails] = useState("");
  const [anonymousCount, setAnonymousCount] = useState("0");
  const [inviteLinks, setInviteLinks] = useState<InviteLink[]>([]);
  const [inviteNotice, setInviteNotice] = useState(false);
  const [inviteBaseUrl, setInviteBaseUrl] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<ErrorInfo | null>(null);
  const [metrics, setMetrics] = useState<Metrics>(initialMetrics);

  useEffect(() => {
    const stored = window.localStorage.getItem("inviteBaseUrl") ?? "";
    setInviteBaseUrl(stored.trim() || window.location.origin);
  }, []);

  useEffect(() => {
    if (!inviteBaseUrl) return;
    window.localStorage.setItem("inviteBaseUrl", inviteBaseUrl);
  }, [inviteBaseUrl]);

  useEffect(() => {
    const refresh = async () => {
      const response = await fetch(`/api/sessions/${sessionId}`);
      if (!response.ok) return;
      const payload = await response.json().catch(() => ({})) as { participants?: Participant[] };
      if (payload.participants) {
        setMetrics(summarizeParticipants(payload.participants));
      }
    };
    void refresh();
  }, [sessionId]);

  const handleInvites = async () => {
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

      const response = await fetch(`/api/sessions/${sessionId}`);
      if (response.ok) {
        const payload = await response.json().catch(() => ({})) as { participants?: Participant[] };
        if (payload.participants) setMetrics(summarizeParticipants(payload.participants));
      }
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

  return (
    <div className="space-y-6">
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
          </div>

          <div className="space-y-2">
            <Label>Invite link base URL</Label>
            <p className="text-xs text-ink-500">
              Links using <span className="font-semibold">localhost</span> only work on your machine. To test with someone else, run{" "}
              <code className="rounded bg-ink-100 px-1">pnpm dev --host</code>{" "}
              and set this to your LAN URL (or deploy and use your public URL).
            </p>
            <Input
              value={inviteBaseUrl}
              onChange={(event) => setInviteBaseUrl(event.target.value)}
              placeholder="https://your-domain.com"
            />
            {inviteBaseUrl.includes("localhost") && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-950">
                This link will not work for other people. Replace <span className="font-semibold">localhost</span> with your machine’s IP (same Wi‑Fi) or a deployed URL.
              </div>
            )}
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

          <ErrorBanner error={error} />

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
                    baseUrl={inviteBaseUrl}
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
    </div>
  );
};

