"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from "lucide-react";

import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { ErrorBanner, type ErrorInfo } from "@/app/components/alerts/ErrorBanner";
import type { ScriptEditorDraft } from "@/lib/editor-types";

type SurveyScriptClientProps = {
  scriptId: string;
  versionId: string | null;
  initialDraft: ScriptEditorDraft;
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

export const SurveyScriptClient = ({ scriptId, versionId, initialDraft }: SurveyScriptClientProps) => {
  const [draft, setDraft] = useState<ScriptEditorDraft>(initialDraft);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<ErrorInfo | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const handleMetaChange = (field: "title" | "subtitle", value: string) => {
    setDraft((prev) => ({
      ...prev,
      meta: { ...prev.meta, [field]: value },
    }));
  };

  const handleQuestionChange = (index: number, field: "topic" | "question" | "probes", value: string) => {
    setDraft((prev) => {
      const questions = [...prev.questions];
      const current = questions[index];
      if (!current) return prev;
      if (field === "probes") {
        const probes = value
          .split("\n")
          .map((probe) => probe.trim())
          .filter(Boolean);
        questions[index] = { ...current, probes };
      } else {
        questions[index] = { ...current, [field]: value };
      }
      return { ...prev, questions };
    });
  };

  const moveQuestion = (index: number, direction: -1 | 1) => {
    setDraft((prev) => {
      const questions = [...prev.questions];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= questions.length) return prev;
      const temp = questions[targetIndex];
      questions[targetIndex] = questions[index];
      questions[index] = temp;
      return { ...prev, questions };
    });
  };

  const removeQuestion = (index: number) => {
    setDraft((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, idx) => idx !== index),
    }));
  };

  const addQuestion = () => {
    setDraft((prev) => {
      const nextId = prev.questions.reduce((max, question) => Math.max(max, question.id), 0) + 1;
      return {
        ...prev,
        questions: [
          ...prev.questions,
          { id: nextId, topic: "Insight", question: "", probes: [] },
        ],
      };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await postJson<{ versionId: string; version: number }>(
        `/api/scripts/${scriptId}/versions`,
        { draft },
      );
      setSavedAt(new Date().toISOString());
      if (response.versionId && response.versionId !== versionId) {
        window.location.reload();
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
        setError({ message: "Failed to save" });
      }
    } finally {
      setSaving(false);
    }
  };


  return (
    <div className="space-y-6">
      <Card className="border-ink-200/70 bg-white/95">
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl">Script editor</CardTitle>
            <CardDescription>Edit questions and tone without touching JSON.</CardDescription>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            Save changes
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={draft.meta.title} onChange={(event) => handleMetaChange("title", event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Subtitle</Label>
              <Input value={draft.meta.subtitle} onChange={(event) => handleMetaChange("subtitle", event.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Briefing</Label>
            <Textarea
              value={draft.briefingMarkdown}
              onChange={(event) => setDraft((prev) => ({ ...prev, briefingMarkdown: event.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-ink-200/70 bg-white/95">
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg">Questions</CardTitle>
            <CardDescription>Reorder, refine, and add follow-ups.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={addQuestion}>
            <Plus className="mr-2 h-4 w-4" />
            Add question
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {draft.questions.map((question, index) => (
            <Card key={question.id} className="border-ink-200/60 bg-white/95">
              <CardHeader className="flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-base">Question {index + 1}</CardTitle>
                  <CardDescription>ID {question.id}</CardDescription>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" onClick={() => moveQuestion(index, -1)}>
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => moveQuestion(index, 1)}>
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => removeQuestion(index)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label>Topic</Label>
                  <Input
                    value={question.topic}
                    onChange={(event) => handleQuestionChange(index, "topic", event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Question</Label>
                  <Textarea
                    value={question.question}
                    onChange={(event) => handleQuestionChange(index, "question", event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Probes (one per line)</Label>
                  <Textarea
                    value={question.probes.join("\n")}
                    onChange={(event) => handleQuestionChange(index, "probes", event.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
          {draft.questions.length === 0 && (
            <p className="text-sm text-ink-500">No questions yet. Add your first question.</p>
          )}
        </CardContent>
      </Card>

      <ErrorBanner error={error} />
      {savedAt && <p className="text-sm text-ink-500">Saved {new Date(savedAt).toLocaleTimeString()}</p>}
    </div>
  );
};
