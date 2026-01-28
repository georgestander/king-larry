"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Circle, GitBranch, History } from "lucide-react";

import type { SurveyStep } from "@/app/components/builder/steps";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { cn } from "@/lib/utils";

type SurveyVersionItem = {
  id: string;
  version: number;
  status: string;
  created_at: string;
};

type SurveyRunItem = {
  id: string;
  title: string;
  status: string;
  created_at: string;
  script_version_number?: number;
  sent_count?: number;
  started_count?: number;
  completed_count?: number;
};

type SurveyTopBarProps = {
  surveyId: string;
  title: string;
  steps: SurveyStep[];
  versions?: SurveyVersionItem[];
  runs?: SurveyRunItem[];
  notice?: React.ReactNode;
};

const formatTimestamp = (value: string) =>
  new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

export const SurveyTopBar = ({
  surveyId,
  title,
  steps,
  versions = [],
  runs = [],
  notice,
}: SurveyTopBarProps) => {
  const [traceOpen, setTraceOpen] = useState(false);

  const activeStep = useMemo(
    () => steps.find((step) => step.status === "current"),
    [steps],
  );
  const currentIndex = useMemo(
    () => steps.findIndex((step) => step.status === "current"),
    [steps],
  );
  const nextStep = currentIndex >= 0 ? steps[currentIndex + 1] : undefined;
  const prevStep = currentIndex > 0 ? steps[currentIndex - 1] : undefined;

  const completedCount = useMemo(
    () => steps.filter((step) => step.status === "complete").length,
    [steps],
  );
  const progressPercent = steps.length ? Math.round((completedCount / steps.length) * 100) : 0;

  return (
    <>
      <div className="sticky top-6 z-20 rounded-2xl border border-ink-200/70 bg-white/90 p-5 shadow-[0_20px_40px_-35px_rgba(15,23,42,0.35)] backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.35em] text-ink-400">Survey</p>
            <h2 className="truncate text-lg font-semibold text-ink-950">{title}</h2>
            {activeStep && (
              <p className="mt-1 text-xs text-ink-500">
                Step {currentIndex + 1} of {steps.length}: {activeStep.label}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setTraceOpen(true)}>
              Trace
            </Button>
            {prevStep && (
              <Button asChild variant="outline" size="sm">
                <a href={prevStep.href}>Back</a>
              </Button>
            )}
            {nextStep && (
              <Button asChild size="sm">
                <a href={nextStep.href}>Next: {nextStep.label}</a>
              </Button>
            )}
          </div>
        </div>

        {notice && <div className="mt-4">{notice}</div>}

        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-ink-500">
            <span>{progressPercent}% complete</span>
            <span className="font-semibold text-ink-900">{completedCount} / {steps.length}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-ink-100">
            <div className="h-2 rounded-full bg-ink-900" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="flex flex-wrap gap-2">
            {steps.map((step) => (
              <Button
                key={step.id}
                asChild
                size="sm"
                variant={step.status === "current" ? "secondary" : "ghost"}
                className={cn(
                  "justify-start gap-2 border border-transparent bg-white/60 text-xs",
                  step.status === "complete" && "text-ink-700",
                  step.status === "current" && "border-ink-200 bg-ink-50",
                )}
              >
                <a href={step.href}>
                  {step.status === "complete" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Circle className="h-4 w-4 text-ink-300" />
                  )}
                  {step.label}
                </a>
              </Button>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={traceOpen} onOpenChange={setTraceOpen}>
        <DialogContent className="max-w-2xl border-ink-200">
          <DialogHeader>
            <DialogTitle className="text-ink-950">Survey trace</DialogTitle>
            <DialogDescription>
              Review versions and runs for this survey. Versions are drafts. Runs are published sessions.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="versions">
            <TabsList>
              <TabsTrigger value="versions" className="gap-2">
                <History className="h-4 w-4" />
                Versions
                <Badge variant="secondary">{versions.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="runs" className="gap-2">
                <GitBranch className="h-4 w-4" />
                Runs
                <Badge variant="secondary">{runs.length}</Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="versions">
              <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
                {versions.map((version) => (
                  <Card key={version.id} className="border-ink-200/70 bg-white/95 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-ink-950">Version {version.version}</p>
                        <p className="text-xs text-ink-500">{formatTimestamp(version.created_at)}</p>
                      </div>
                      <Badge variant={version.status === "active" ? "accent" : "secondary"}>
                        {version.status}
                      </Badge>
                    </div>
                    <div className="mt-3">
                      <Button asChild size="sm" variant="outline">
                        <a href={`/surveys/${surveyId}/script`}>Open script editor</a>
                      </Button>
                    </div>
                  </Card>
                ))}
                {versions.length === 0 && (
                  <p className="text-sm text-ink-500">No versions yet.</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="runs">
              <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
                {runs.map((run, index) => {
                  const completionRate = run.sent_count
                    ? Math.round(((run.completed_count ?? 0) / run.sent_count) * 100)
                    : 0;
                  return (
                    <Card key={run.id} className="border-ink-200/70 bg-white/95 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-ink-950">{run.title}</p>
                            {index === 0 && <Badge variant="accent">Latest</Badge>}
                            {run.script_version_number ? (
                              <Badge variant="secondary">Version {run.script_version_number}</Badge>
                            ) : null}
                            <Badge variant={run.status === "active" ? "accent" : "secondary"}>{run.status}</Badge>
                          </div>
                          <p className="mt-1 text-xs text-ink-500">Created {formatTimestamp(run.created_at)}</p>
                          <div className="mt-2 flex flex-wrap gap-4 text-xs text-ink-500">
                            <span><span className="text-ink-400">Sent</span> {run.sent_count ?? 0}</span>
                            <span><span className="text-ink-400">Started</span> {run.started_count ?? 0}</span>
                            <span><span className="text-ink-400">Completed</span> {run.completed_count ?? 0}</span>
                            <span><span className="text-ink-400">Completion</span> {completionRate}%</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button asChild size="sm" variant="outline">
                            <a href={`/sessions/${run.id}`}>Legacy view</a>
                          </Button>
                          <Button asChild size="sm">
                            <a href={`/surveys/${surveyId}/runs/${run.id}`}>View results</a>
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
                {runs.length === 0 && (
                  <p className="text-sm text-ink-500">No runs yet.</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
};

