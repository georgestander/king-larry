"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Calendar, FileText, Sparkles, Users } from "lucide-react";

import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Textarea } from "@/app/components/ui/textarea";
import { MODEL_OPTIONS, getDefaultModel, type ModelProvider } from "@/lib/models";

type ScriptSummary = {
  id: string;
  title: string;
  created_at: string;
  active_version_id: string | null;
};

type SessionSummary = {
  id: string;
  title: string;
  provider: ModelProvider;
  model: string;
  time_limit_minutes: number;
  status: "draft" | "active" | "closed";
  created_at: string;
};

type ScriptVersion = {
  id: string;
  version: number;
  created_at: string;
  status: string;
  prompt_markdown: string;
  json: string;
};

type DashboardProps = {
  scripts: ScriptSummary[];
  sessions: SessionSummary[];
};

const postJson = async <T,>(url: string, body: unknown): Promise<T> => {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const message = typeof (payload as { error?: string }).error === "string"
      ? (payload as { error?: string }).error
      : "Request failed";
    throw new Error(message);
  }
  return response.json() as Promise<T>;
};

export default function Dashboard({ scripts, sessions }: DashboardProps) {
  return (
    <div className="min-h-screen bg-ink-50 text-ink-950 [background-image:radial-gradient(1200px_circle_at_top,_rgba(255,255,255,0.9),_transparent)]">
      <header className="border-b border-ink-200/60 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-ink-200 bg-white">
              <img src="/logo.png" alt="Narrative Interviewer" className="h-10 w-10" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-ink-400">Narrative Interviewer</p>
              <h1 className="text-3xl font-semibold text-ink-950">Survey Studio</h1>
            </div>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <Badge variant="secondary">{scripts.length} surveys</Badge>
            <Badge variant="secondary">{sessions.length} sessions</Badge>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-8 px-6 py-8 lg:grid-cols-[1.2fr,1fr]">
        <section className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your surveys</CardTitle>
              <CardDescription>Past narrative surveys and their current versions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {scripts.map((script) => (
                <Card key={script.id} className="border-ink-200/50 bg-white/95">
                  <CardHeader className="flex-row items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-base">{script.title}</CardTitle>
                      <CardDescription>Active version: {script.active_version_id ?? "None"}</CardDescription>
                    </div>
                    <ScriptVersionsDialog scriptId={script.id} />
                  </CardHeader>
                </Card>
              ))}
              {scripts.length === 0 && (
                <Card className="border-ink-200/50 bg-white/95">
                  <CardContent className="py-10 text-center text-sm text-ink-500">
                    No surveys yet. Start a new one on the right.
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent sessions</CardTitle>
              <CardDescription>Live or completed survey runs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {sessions.map((session) => (
                <Card key={session.id} className="border-ink-200/50 bg-white/95">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between gap-2 text-base">
                      <span>{session.title}</span>
                      <Badge variant={session.status === "active" ? "accent" : "secondary"}>
                        {session.status}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {session.provider} / {session.model} · {session.time_limit_minutes} min
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between text-xs text-ink-400">
                    <span>Created {new Date(session.created_at).toLocaleDateString()}</span>
                    <a
                      className="text-sm font-medium text-ink-700 underline-offset-4 hover:underline"
                      href={`/sessions/${session.id}`}
                    >
                      View session
                    </a>
                  </CardContent>
                </Card>
              ))}
              {sessions.length === 0 && (
                <Card className="border-ink-200/50 bg-white/95">
                  <CardContent className="py-10 text-center text-sm text-ink-500">
                    No sessions yet. Publish a survey to invite participants.
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="space-y-6">
          <Card className="border-ink-200/70 bg-white/95">
            <CardHeader>
              <CardTitle>Create a new survey</CardTitle>
              <CardDescription>Typeform‑style flow: brief → generate → publish.</CardDescription>
            </CardHeader>
            <CardContent>
              <CreateSurveyWizard scripts={scripts} />
            </CardContent>
          </Card>

          <Card className="border-ink-200/70 bg-white/90">
            <CardHeader>
              <CardTitle className="text-base">What you can do next</CardTitle>
              <CardDescription>Where to test and send your survey.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-ink-600">
              <div className="flex items-center gap-3">
                <Sparkles className="h-4 w-4 text-accent-500" />
                Generate a narrative script from your brief.
              </div>
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-accent-500" />
                Publish a session and create invite links.
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-accent-500" />
                Send invites and monitor completions.
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-accent-500" />
                Export results as CSV or PDF.
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}

const CreateSurveyWizard = ({ scripts }: { scripts: ScriptSummary[] }) => {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [goal, setGoal] = useState("");
  const [audience, setAudience] = useState("");
  const [notes, setNotes] = useState("");
  const [provider, setProvider] = useState<ModelProvider>("anthropic");
  const [model, setModel] = useState(getDefaultModel("anthropic"));
  const [generated, setGenerated] = useState<{ json: string; prompt: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [targetScriptId, setTargetScriptId] = useState("new");
  const [savedScriptId, setSavedScriptId] = useState<string | null>(null);
  const [savedVersionId, setSavedVersionId] = useState<string | null>(null);
  const [sessionTitle, setSessionTitle] = useState("");
  const [timeLimit, setTimeLimit] = useState("15");
  const [inviteEmails, setInviteEmails] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [inviteTokens, setInviteTokens] = useState<string[]>([]);
  const [origin, setOrigin] = useState("");

  const scriptTargets = useMemo(
    () => scripts.map((script) => ({ value: script.id, label: script.title })),
    [scripts],
  );

  const modelOptions = useMemo(() => MODEL_OPTIONS[provider], [provider]);

  useEffect(() => {
    if (!modelOptions.find((option) => option.id === model)) {
      setModel(getDefaultModel(provider));
    }
  }, [model, modelOptions, provider]);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const handleGenerate = async () => {
    setError(null);
    setSaving(true);
    try {
      const result = await postJson<{ script: unknown; promptMarkdown: string }>("/api/scripts/generate", {
        title,
        goal,
        audience,
        notes,
        provider,
        model,
      });
      setGenerated({
        json: JSON.stringify(result.script, null, 2),
        prompt: result.promptMarkdown ?? "",
      });
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveScript = async () => {
    if (!generated) return;
    setError(null);
    setSaving(true);
    try {
      const endpoint = targetScriptId === "new"
        ? "/api/scripts"
        : `/api/scripts/${targetScriptId}/versions`;
      const response = await postJson<{ scriptId?: string; versionId: string }>(endpoint, {
        title,
        json: generated.json,
        promptMarkdown: generated.prompt,
      });
      const scriptId = response.scriptId ?? targetScriptId;
      setSavedScriptId(scriptId);
      setSavedVersionId(response.versionId);
      setSessionTitle(`${title || "Survey"} Session`);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save script");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!savedVersionId) return;
    setError(null);
    setSaving(true);
    try {
      const session = await postJson<{ sessionId: string }>("/api/sessions", {
        title: sessionTitle || "Survey Session",
        scriptVersionId: savedVersionId,
        timeLimitMinutes: Number(timeLimit) || 15,
        provider,
        model,
      });
      setSessionId(session.sessionId);
      if (inviteEmails.trim()) {
        const emailList = inviteEmails.split(",").map((email) => email.trim()).filter(Boolean);
        if (emailList.length) {
          const invite = await postJson<{ participants: { invite_token: string }[] }>(
            `/api/sessions/${session.sessionId}/invite`,
            { emails: emailList },
          );
          setInviteTokens(invite.participants.map((participant) => participant.invite_token));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish session");
    } finally {
      setSaving(false);
    }
  };

  const inviteLink = inviteTokens[0] && origin ? `${origin}/interview/${inviteTokens[0]}` : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-ink-400">
        <span className={step >= 1 ? "text-ink-700" : undefined}>Brief</span>
        <ArrowRight className="h-3 w-3" />
        <span className={step >= 2 ? "text-ink-700" : undefined}>Script</span>
        <ArrowRight className="h-3 w-3" />
        <span className={step >= 3 ? "text-ink-700" : undefined}>Publish</span>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Survey title</Label>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Onboarding Experience" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Audience</Label>
              <Input value={audience} onChange={(event) => setAudience(event.target.value)} placeholder="New users" />
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
            <Textarea value={goal} onChange={(event) => setGoal(event.target.value)} placeholder="Understand why users drop during onboarding." />
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Tone, constraints, specifics." />
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
          <Button onClick={handleGenerate} disabled={!title || !goal || saving} className="w-full">
            Generate narrative script
          </Button>
        </div>
      )}

      {step === 2 && generated && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Save to</Label>
            <Select value={targetScriptId} onValueChange={setTargetScriptId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">Create new survey</SelectItem>
                {scriptTargets.map((script) => (
                  <SelectItem key={script.value} value={script.value}>
                    {script.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-ink-500">Selecting an existing survey creates a new version.</p>
          </div>
          <div className="space-y-2">
            <Label>Script JSON</Label>
            <Textarea value={generated.json} onChange={(event) => setGenerated({ ...generated, json: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Prompt markdown</Label>
            <Textarea value={generated.prompt} onChange={(event) => setGenerated({ ...generated, prompt: event.target.value })} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button onClick={handleSaveScript} disabled={saving}>
              Save script
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Session title</Label>
            <Input value={sessionTitle} onChange={(event) => setSessionTitle(event.target.value)} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
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
            <Label>Invite emails</Label>
            <Textarea value={inviteEmails} onChange={(event) => setInviteEmails(event.target.value)} placeholder="alex@company.com, jamie@company.com" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {!sessionId ? (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button onClick={handlePublish} disabled={saving}>
                Publish & invite
              </Button>
            </div>
          ) : (
            <div className="space-y-3 rounded-xl border border-ink-200 bg-ink-50/70 p-4 text-sm">
              <p className="font-semibold text-ink-900">Survey is live.</p>
              <div className="flex flex-wrap items-center gap-2">
                <Button asChild size="sm">
                  <a href={`/sessions/${sessionId}`}>Open session</a>
                </Button>
                {inviteLink && (
                  <Button asChild size="sm" variant="outline">
                    <a href={inviteLink} target="_blank" rel="noreferrer">Open invite link</a>
                  </Button>
                )}
              </div>
              {!inviteLink && <p className="text-xs text-ink-500">Add invite emails to generate a participant link.</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ScriptVersionsDialog = ({ scriptId }: { scriptId: string }) => {
  const [open, setOpen] = useState(false);
  const [versions, setVersions] = useState<ScriptVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(`/api/scripts/${scriptId}/versions`)
      .then((res) => res.json())
      .then((data) => setVersions((data as { versions?: ScriptVersion[] }).versions ?? []))
      .catch(() => setError("Failed to load versions"))
      .finally(() => setLoading(false));
  }, [open, scriptId]);

  const handleRollback = async (versionId: string) => {
    setError(null);
    try {
      await postJson(`/api/scripts/${scriptId}/rollback`, { versionId });
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rollback");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <FileText className="h-4 w-4" />
          Versions
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Survey versions</DialogTitle>
          <DialogDescription>Rollback to a previous version when needed.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {loading && <p className="text-sm text-ink-500">Loading...</p>}
          {!loading && versions.length === 0 && (
            <p className="text-sm text-ink-500">No versions found.</p>
          )}
          {versions.map((version) => (
            <Card key={version.id}>
              <CardHeader className="flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Version {version.version}</CardTitle>
                  <CardDescription>{new Date(version.created_at).toLocaleString()}</CardDescription>
                </div>
                <Button size="sm" onClick={() => handleRollback(version.id)}>
                  Rollback
                </Button>
              </CardHeader>
            </Card>
          ))}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
