import type { LayoutProps } from "rwsdk/router";
import { ChevronDown } from "lucide-react";

import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { listSurveySummaries } from "@/server/store";
import { cn } from "@/lib/utils";

export const StudioLayout = async ({ children, requestInfo }: LayoutProps) => {
  const surveys = await listSurveySummaries();
  const pathname = requestInfo ? new URL(requestInfo.request.url).pathname : "";
  const activeNav = pathname.startsWith("/settings") ? "settings" : "surveys";

  return (
    <div className="min-h-screen bg-ink-50 text-ink-950 [background-image:radial-gradient(1200px_circle_at_top,_rgba(255,255,255,0.9),_transparent)]">
      <header className="sticky top-0 z-30 border-b border-ink-200/60 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-6 py-5">
          <a href="/surveys" className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-ink-200 bg-white">
              <img src="/logo.png" alt="Narrative Interviewer" className="h-10 w-10" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-ink-400">Narrative Interviewer</p>
              <h1 className="text-3xl font-semibold text-ink-950">King Larry</h1>
            </div>
          </a>
          <div className="flex items-center gap-3">
            <Badge variant="secondary">{surveys.length} surveys</Badge>
            <Button asChild>
              <a href="/surveys/new">Start new chat</a>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl gap-6 px-6 py-8">
        <aside className="sticky top-24 w-full max-w-[280px] space-y-4 self-start">
          <Card className="border-ink-200/70 bg-white/95">
            <CardHeader>
              <CardTitle className="text-base">Quick actions</CardTitle>
              <CardDescription>Navigate your workspace.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full" variant={activeNav === "surveys" ? "default" : "outline"}>
                <a href="/surveys">All surveys</a>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <a href="/surveys/new">Start new chat</a>
              </Button>
              <Button asChild className="w-full" variant={activeNav === "settings" ? "default" : "outline"}>
                <a href="/settings">Settings</a>
              </Button>
            </CardContent>
          </Card>

          <details className="group rounded-2xl border border-ink-200/70 bg-white/95 shadow-[0_20px_40px_-30px_rgba(15,23,42,0.35)]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-6">
              <div>
                <p className="text-base font-semibold text-ink-950">Your surveys</p>
                <p className="text-sm text-ink-500">Recent workspaces.</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{surveys.length}</Badge>
                <ChevronDown className="h-4 w-4 text-ink-500 transition-transform group-open:rotate-180" />
              </div>
            </summary>
            <div className="px-6 pb-6 pt-0">
              <div className="space-y-3">
                {surveys.slice(0, 8).map((survey) => (
                  <a
                    key={survey.id}
                    href={`/surveys/${survey.id}`}
                    className={cn(
                      "flex items-center justify-between rounded-xl border border-ink-200/60 bg-white px-3 py-2 text-sm text-ink-700 hover:border-ink-300",
                    )}
                  >
                    <span className="truncate">{survey.title}</span>
                    <div className="flex items-center gap-1">
                      {survey.active_run_count > 0 && <Badge variant="accent">Live</Badge>}
  
                    </div>
                  </a>
                ))}
                {surveys.length === 0 && (
                  <p className="text-sm text-ink-500">No surveys yet.</p>
                )}
              </div>
            </div>
          </details>
        </aside>

        <div className="min-w-0 flex-1">{children}</div>
      </main>
    </div>
  );
};
