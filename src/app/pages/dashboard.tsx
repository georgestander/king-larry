"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar, FileText, Sparkles, Users } from "lucide-react";

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
import { Separator } from "@/app/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Textarea } from "@/app/components/ui/textarea";

type ScriptSummary = {
  id: string;
  title: string;
  created_at: string;
  active_version_id: string | null;
};

type SessionSummary = {
  id: string;
  title: string;
  provider: "openai" | "anthropic" | "openrouter";
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
    <div className="min-h-screen bg-white text-slate-950">
      <header className="border-b border-slate-200/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white">
              <img src="/logo.svg" alt="Narrative Interviewer" className="h-10 w-10" />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Narrative Interviewer</p>
              <h1 className="text-2xl font-semibold text-slate-900">Interview Ops Studio</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <GenerateScriptDialog scripts={scripts} />
            <CreateScriptDialog scripts={scripts} />
            <CreateSessionDialog scripts={scripts} />
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-8 px-6 py-8 lg:grid-cols-[2fr,1fr]">
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Scripts</h2>
              <p className="text-sm text-slate-500">Versioned interview scripts with narrative prompts.</p>
            </div>
            <Badge variant="secondary">{scripts.length} total</Badge>
          </div>

          <div className="space-y-4">
            {scripts.map((script) => (
              <Card key={script.id}>
                <CardHeader className="flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle>{script.title}</CardTitle>
                    <CardDescription>Active version: {script.active_version_id ?? "None"}</CardDescription>
                  </div>
                  <ScriptVersionsDialog scriptId={script.id} />
                </CardHeader>
              </Card>
            ))}
            {scripts.length === 0 && (
              <Card>
                <CardContent className="py-10 text-center text-sm text-slate-500">
                  No scripts yet. Generate one or create manually.
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Sessions</h2>
              <p className="text-sm text-slate-500">Active interview instances and completion tracking.</p>
            </div>
            <Badge variant="secondary">{sessions.length} total</Badge>
          </div>

          <div className="space-y-4">
            {sessions.map((session) => (
              <Card key={session.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-2">
                    <span>{session.title}</span>
                    <Badge variant={session.status === "active" ? "accent" : "secondary"}>
                      {session.status}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {session.provider} / {session.model} · {session.time_limit_minutes} min
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-3">
                  <a
                    className="text-sm font-medium text-slate-700 underline-offset-4 hover:underline"
                    href={`/sessions/${session.id}`}
                  >
                    View session
                  </a>
                  <span className="text-xs text-slate-400">
                    Created {new Date(session.created_at).toLocaleDateString()}
                  </span>
                </CardContent>
              </Card>
            ))}
            {sessions.length === 0 && (
              <Card>
                <CardContent className="py-10 text-center text-sm text-slate-500">
                  No sessions yet. Create one to invite participants.
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        <section className="lg:col-span-2">
          <Separator className="my-10" />
          <div className="grid gap-6 md:grid-cols-3">
            <InsightCard
              icon={<Sparkles className="h-5 w-5 text-amber-500" />}
              title="Narrative cadence"
              description="One question at a time, guided by adaptive prompts."
            />
            <InsightCard
              icon={<Users className="h-5 w-5 text-amber-500" />}
              title="Invite-only capture"
              description="Each interview is locked to participant tokens."
            />
            <InsightCard
              icon={<Calendar className="h-5 w-5 text-amber-500" />}
              title="15-minute limit"
              description="Time boxes keep interviews focused and efficient."
            />
          </div>
        </section>
      </main>
    </div>
  );
}

const InsightCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-base">
        {icon}
        {title}
      </CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
  </Card>
);

const CreateScriptDialog = ({ scripts }: { scripts: ScriptSummary[] }) => {
  const [open, setOpen] = useState(false);
  const [targetScriptId, setTargetScriptId] = useState("new");
  const [title, setTitle] = useState("");
  const [json, setJson] = useState("");
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const requiresTitle = targetScriptId === "new";
  const canSubmit = json.trim() && (!requiresTitle || title.trim());

  const scriptTargets = useMemo(
    () => scripts.map((script) => ({ value: script.id, label: script.title })),
    [scripts],
  );

  const handleSubmit = async () => {
    setError(null);
    try {
      const endpoint = targetScriptId === "new"
        ? "/api/scripts"
        : `/api/scripts/${targetScriptId}/versions`;
      await postJson(endpoint, {
        title,
        json,
        promptMarkdown: prompt,
      });
      setOpen(false);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create script");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">New Script</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create script</DialogTitle>
          <DialogDescription>Paste a validated interview JSON and optional prompt.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Save to</Label>
            <Select value={targetScriptId} onValueChange={setTargetScriptId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">Create new script</SelectItem>
                {scriptTargets.map((script) => (
                  <SelectItem key={script.value} value={script.value}>
                    {script.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">Selecting an existing script creates a new version.</p>
          </div>
          <div className="space-y-2">
            <Label>Script title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Role Documentation Interview" />
          </div>
          <div className="space-y-2">
            <Label>Interview JSON</Label>
            <Textarea value={json} onChange={(e) => setJson(e.target.value)} placeholder="{ ... }" />
          </div>
          <div className="space-y-2">
            <Label>Prompt markdown</Label>
            <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="# Narrative prompt" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            Save script
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const GenerateScriptDialog = ({ scripts }: { scripts: ScriptSummary[] }) => {
  const [open, setOpen] = useState(false);
  const [targetScriptId, setTargetScriptId] = useState("new");
  const [title, setTitle] = useState("");
  const [goal, setGoal] = useState("");
  const [audience, setAudience] = useState("");
  const [notes, setNotes] = useState("");
  const [provider, setProvider] = useState<SessionSummary["provider"]>("anthropic");
  const [model, setModel] = useState("claude-sonnet-4-20250514");
  const [generated, setGenerated] = useState<{ json: string; prompt: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scriptTargets = useMemo(
    () => scripts.map((script) => ({ value: script.id, label: script.title })),
    [scripts],
  );

  useEffect(() => {
    if (targetScriptId === "new") return;
    const match = scripts.find((script) => script.id === targetScriptId);
    if (match && !title.trim()) {
      setTitle(match.title);
    }
  }, [scripts, targetScriptId, title]);

  const handleGenerate = async () => {
    setError(null);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate");
    }
  };

  const handleSave = async () => {
    if (!generated) return;
    setError(null);
    try {
      const endpoint = targetScriptId === "new"
        ? "/api/scripts"
        : `/api/scripts/${targetScriptId}/versions`;
      await postJson(endpoint, {
        title,
        json: generated.json,
        promptMarkdown: generated.prompt,
      });
      setOpen(false);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => {
      setOpen(next);
      if (!next) setGenerated(null);
    }}>
      <DialogTrigger asChild>
        <Button variant="accent">
          <Sparkles className="h-4 w-4" />
          Generate Script
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Generate a script with AI</DialogTitle>
          <DialogDescription>Describe the goal and audience, then refine the result.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="brief">
          <TabsList>
            <TabsTrigger value="brief">Brief</TabsTrigger>
            <TabsTrigger value="result" disabled={!generated}>Result</TabsTrigger>
          </TabsList>
          <TabsContent value="brief" className="space-y-4">
            <div className="space-y-2">
              <Label>Save to</Label>
              <Select value={targetScriptId} onValueChange={setTargetScriptId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Create new script</SelectItem>
                  {scriptTargets.map((script) => (
                    <SelectItem key={script.value} value={script.value}>
                      {script.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">Selecting an existing script creates a new version.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Script title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Onboarding Research" />
              </div>
              <div className="space-y-2">
                <Label>Audience</Label>
                <Input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Product team" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Goal</Label>
              <Textarea value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Understand friction in onboarding." />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Tone, constraints, specifics." />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Provider</Label>
                <Select value={provider} onValueChange={(value) => setProvider(value as SessionSummary["provider"])}>
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
                <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="claude-sonnet-4-20250514" />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="result" className="space-y-4">
            {generated && (
              <>
                <div className="space-y-2">
                  <Label>Generated JSON</Label>
                  <Textarea value={generated.json} onChange={(e) => setGenerated({ ...generated, json: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Prompt markdown</Label>
                  <Textarea value={generated.prompt} onChange={(e) => setGenerated({ ...generated, prompt: e.target.value })} />
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          {!generated ? (
            <Button onClick={handleGenerate} disabled={!title || !goal}>
              Generate
            </Button>
          ) : (
            <Button onClick={handleSave}>Save Script</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const CreateSessionDialog = ({ scripts }: { scripts: ScriptSummary[] }) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [scriptVersionId, setScriptVersionId] = useState<string | null>(null);
  const [timeLimit, setTimeLimit] = useState("15");
  const [provider, setProvider] = useState<SessionSummary["provider"]>("anthropic");
  const [model, setModel] = useState("claude-sonnet-4-20250514");
  const [emails, setEmails] = useState("");
  const [error, setError] = useState<string | null>(null);

  const scriptOptions = useMemo(
    () => scripts.filter((script) => script.active_version_id).map((script) => ({
      label: script.title,
      value: script.active_version_id as string,
    })),
    [scripts],
  );

  useEffect(() => {
    if (!scriptVersionId && scriptOptions[0]) {
      setScriptVersionId(scriptOptions[0].value);
    }
  }, [scriptOptions, scriptVersionId]);

  const handleSubmit = async () => {
    setError(null);
    try {
      const session = await postJson<{ sessionId: string }>("/api/sessions", {
        title,
        scriptVersionId,
        timeLimitMinutes: Number(timeLimit) || 15,
        provider,
        model,
      });

      if (emails.trim()) {
        const emailList = emails.split(",").map((email) => email.trim()).filter(Boolean);
        if (emailList.length) {
          await postJson(`/api/sessions/${session.sessionId}/invite`, { emails: emailList });
        }
      }
      setOpen(false);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create session");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">
          <Users className="h-4 w-4" />
          New Session
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create session</DialogTitle>
          <DialogDescription>Launch a session and invite participants.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Session title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Onboarding Round 1" />
          </div>
          <div className="space-y-2">
            <Label>Script</Label>
            <Select value={scriptVersionId ?? ""} onValueChange={(value) => setScriptVersionId(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select script" />
              </SelectTrigger>
              <SelectContent>
                {scriptOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Time limit (minutes)</Label>
              <Input value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select value={provider} onValueChange={(value) => setProvider(value as SessionSummary["provider"])}>
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
            <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="claude-sonnet-4-20250514" />
          </div>
          <div className="space-y-2">
            <Label>Invite emails (comma separated)</Label>
            <Textarea value={emails} onChange={(e) => setEmails(e.target.value)} placeholder="alex@company.com, jamie@company.com" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!title || !scriptVersionId}>
            Create Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
        <Button variant="ghost">
          <FileText className="h-4 w-4" />
          Versions
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Script versions</DialogTitle>
          <DialogDescription>Rollback to a previous version when needed.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {loading && <p className="text-sm text-slate-500">Loading...</p>}
          {!loading && versions.length === 0 && (
            <p className="text-sm text-slate-500">No versions found.</p>
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
