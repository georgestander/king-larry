"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Separator } from "@/app/components/ui/separator";
import { cn } from "@/lib/utils";
import type { SurveyStep } from "@/app/components/builder/steps";

export type SurveyVersionItem = {
  id: string;
  version: number;
  status: string;
  created_at: string;
};

export type SurveyRunItem = {
  id: string;
  title: string;
  status: string;
  created_at: string;
  sent_count?: number;
  completed_count?: number;
};

type SurveyShellProps = {
  title: string;
  subtitle?: string | null;
  steps: SurveyStep[];
  versions: SurveyVersionItem[];
  runs: SurveyRunItem[];
  children: React.ReactNode;
};

export const SurveyShell = ({
  title,
  subtitle,
  steps,
  versions,
  runs,
  children,
}: SurveyShellProps) => {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("surveySidebarCollapsed");
    if (stored) setCollapsed(stored === "true");
  }, []);

  useEffect(() => {
    window.localStorage.setItem("surveySidebarCollapsed", String(collapsed));
  }, [collapsed]);

  const activeStep = useMemo(
    () => steps.find((step) => step.status === "current"),
    [steps],
  );

  return (
    <div className="min-h-screen bg-ink-50 text-ink-950 [background-image:radial-gradient(1200px_circle_at_top,_rgba(255,255,255,0.9),_transparent)]">
      <div className="mx-auto flex max-w-7xl gap-6 px-6 py-8">
        <aside
          className={cn(
            "sticky top-6 h-[calc(100vh-3rem)] self-start overflow-hidden rounded-3xl border border-ink-200/70 bg-white/90 shadow-[0_20px_60px_-45px_rgba(15,23,42,0.5)]",
            collapsed ? "w-[72px]" : "w-[300px]",
          )}
        >
          <div className={cn("flex h-full flex-col", collapsed ? "items-center" : "items-stretch")}>
            <div className={cn("flex items-center justify-between p-4", collapsed ? "flex-col gap-3" : "gap-2")}>
              <div className={cn("flex items-center gap-3", collapsed ? "flex-col" : "flex-row")}>
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-ink-200 bg-white">
                  <img src="/logo.png" alt="Narrative Interviewer" className="h-8 w-8" />
                </div>
                {!collapsed && (
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-ink-400">Survey</p>
                    <h2 className="text-base font-semibold text-ink-950">{title}</h2>
                    {subtitle && <p className="text-xs text-ink-500">{subtitle}</p>}
                  </div>
                )}
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setCollapsed((prev) => !prev)}
              >
                {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
            </div>

            <Separator />

            <div className={cn("flex-1 space-y-6 overflow-y-auto p-4", collapsed && "px-2")}>
              <div className="space-y-2">
                {!collapsed && (
                  <p className="text-xs uppercase tracking-[0.3em] text-ink-400">Progress</p>
                )}
                <div className="space-y-2">
                  {steps.map((step) => (
                    <Button
                      key={step.id}
                      asChild
                      variant={step.status === "current" ? "secondary" : "ghost"}
                      className={cn("w-full justify-between text-left", collapsed && "justify-center")}
                    >
                      <a href={step.href}>
                        {!collapsed && <span>{step.label}</span>}
                        <Badge variant={step.status === "complete" ? "accent" : "secondary"}>
                          {step.status === "complete" ? "Done" : step.status === "current" ? "Now" : "Next"}
                        </Badge>
                      </a>
                    </Button>
                  ))}
                </div>
                {activeStep && !collapsed && (
                  <p className="text-xs text-ink-500">Current: {activeStep.label}</p>
                )}
              </div>

              <Separator />

              <div className="space-y-3">
                {!collapsed && (
                  <p className="text-xs uppercase tracking-[0.3em] text-ink-400">Versions</p>
                )}
                <div className="space-y-2">
                  {versions.slice(0, collapsed ? 2 : 4).map((version) => (
                    <Card key={version.id} className="border-ink-200/60 bg-white/95 p-2">
                      <div className={cn("flex items-center justify-between gap-2", collapsed && "flex-col")}>
                        {!collapsed && (
                          <div>
                            <p className="text-xs font-semibold text-ink-900">Version {version.version}</p>
                            <p className="text-[11px] text-ink-500">
                              {new Date(version.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                        <Badge variant={version.status === "active" ? "accent" : "secondary"}>
                          {version.status}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                  {versions.length === 0 && !collapsed && (
                    <p className="text-xs text-ink-500">No versions yet.</p>
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                {!collapsed && (
                  <p className="text-xs uppercase tracking-[0.3em] text-ink-400">Runs</p>
                )}
                <div className="space-y-2">
                  {runs.slice(0, collapsed ? 2 : 4).map((run) => (
                    <Card key={run.id} className="border-ink-200/60 bg-white/95 p-2">
                      <div className={cn("flex items-center justify-between gap-2", collapsed && "flex-col")}>
                        {!collapsed && (
                          <div>
                            <p className="text-xs font-semibold text-ink-900">{run.title}</p>
                            <p className="text-[11px] text-ink-500">
                              {new Date(run.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                        <Badge variant={run.status === "active" ? "accent" : "secondary"}>
                          {run.status}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                  {runs.length === 0 && !collapsed && (
                    <p className="text-xs text-ink-500">No runs yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
};
