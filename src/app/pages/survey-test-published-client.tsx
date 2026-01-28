"use client";

import { useState } from "react";
import { Copy, ExternalLink, RefreshCw } from "lucide-react";

import { ErrorBanner, type ErrorInfo } from "@/app/components/alerts/ErrorBanner";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";

type Participant = {
  invite_token: string;
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

type SurveyTestPublishedClientProps = {
  sessionId: string;
};

export const SurveyTestPublishedClient = ({ sessionId }: SurveyTestPublishedClientProps) => {
  const [token, setToken] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<ErrorInfo | null>(null);

  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const inviteUrl = token ? `${origin}/interview/${token}?embed=1` : "";

  const createTestLink = async () => {
    setCreating(true);
    setError(null);
    try {
      const invite = await postJson<{ participants: Participant[] }>(`/api/sessions/${sessionId}/invite-anonymous`, { count: 1 });
      const nextToken = invite.participants[0]?.invite_token;
      if (nextToken) setToken(nextToken);
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
        setError({ message: "Failed to create test link" });
      }
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-6">
      <Card className="border-ink-200/70 bg-white/95">
        <CardHeader>
          <CardTitle>Test respondent experience</CardTitle>
          <CardDescription>
            This uses a real invite link from the published run, so it matches what participants see.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ErrorBanner error={error} />
          <div className="flex flex-wrap gap-2">
            <Button onClick={createTestLink} disabled={creating} variant="secondary">
              <RefreshCw className="mr-2 h-4 w-4" />
              {token ? "Create a fresh test link" : "Create test link"}
            </Button>
            {token && (
              <Button asChild variant="outline">
                <a href={`/interview/${token}`} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open in new tab
                </a>
              </Button>
            )}
          </div>
          {token && (
            <div className="flex flex-wrap items-center gap-2">
              <Input readOnly value={inviteUrl.replace("?embed=1", "")} className="max-w-[460px] text-xs" />
              <Button size="sm" variant="outline" onClick={handleCopy}>
                <Copy className="mr-2 h-4 w-4" />
                {copied ? "Copied" : "Copy link"}
              </Button>
            </div>
          )}
          <p className="text-xs text-ink-500">
            Tip: This creates an anonymous participant in the run. You’ll see it show up in Results as a started/completed response.
          </p>
        </CardContent>
      </Card>

      {token ? (
        <iframe
          title="Respondent preview"
          className="h-[75vh] w-full rounded-2xl border border-ink-200/70 bg-white"
          src={`/interview/${token}?embed=1`}
        />
      ) : (
        <Card className="border-ink-200/70 bg-white/95">
          <CardContent className="py-10 text-center text-sm text-ink-600">
            Create a test link to load the respondent UI.
          </CardContent>
        </Card>
      )}
    </div>
  );
};
