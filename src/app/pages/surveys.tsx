import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { listSurveySummaries } from "@/server/store";

export const SurveysPage = async () => {
  const surveys = await listSurveySummaries();

  return (
    <div className="min-h-screen bg-ink-50 text-ink-950 [background-image:radial-gradient(1200px_circle_at_top,_rgba(255,255,255,0.9),_transparent)]">
      <header className="border-b border-ink-200/60 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-ink-200 bg-white">
              <img src="/logo.png" alt="Narrative Interviewer" className="h-10 w-10" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-ink-400">Narrative Interviewer</p>
              <h1 className="text-3xl font-semibold text-ink-950">Survey Studio</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary">{surveys.length} surveys</Badge>
            <Button asChild>
              <a href="/surveys/new">Create survey</a>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-6 py-8">
        <section className="grid gap-4 md:grid-cols-[1.2fr,0.8fr]">
          <Card className="border-ink-200/70 bg-white/95">
            <CardHeader>
              <CardTitle>All surveys</CardTitle>
              <CardDescription>Draft, test, publish, and monitor your narrative interviews.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {surveys.map((survey) => {
                const completionRate = survey.sent_count
                  ? Math.round((survey.completed_count / survey.sent_count) * 100)
                  : 0;
                return (
                  <Card key={survey.id} className="border-ink-200/60 bg-white/95">
                    <CardHeader className="flex-row items-start justify-between gap-4">
                      <div>
                        <CardTitle className="text-base">{survey.title}</CardTitle>
                        <CardDescription>
                          Updated {new Date(survey.last_updated_at).toLocaleDateString()} · {survey.version_count} versions
                        </CardDescription>
                      </div>
                      <Badge variant={survey.active_run_count ? "accent" : "secondary"}>
                        {survey.active_run_count ? `${survey.active_run_count} active runs` : "No active runs"}
                      </Badge>
                    </CardHeader>
                    <CardContent className="grid gap-3 text-xs text-ink-500 md:grid-cols-3">
                      <div>
                        <p className="text-ink-400">Runs</p>
                        <p className="text-sm font-semibold text-ink-900">{survey.run_count}</p>
                      </div>
                      <div>
                        <p className="text-ink-400">Sent</p>
                        <p className="text-sm font-semibold text-ink-900">{survey.sent_count}</p>
                      </div>
                      <div>
                        <p className="text-ink-400">Completed</p>
                        <p className="text-sm font-semibold text-ink-900">
                          {survey.completed_count} · {completionRate}%
                        </p>
                      </div>
                    </CardContent>
                    <CardContent className="flex flex-wrap items-center gap-2">
                      <Button asChild size="sm" variant="outline">
                        <a href={`/surveys/${survey.id}/script`}>Edit script</a>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <a href={`/surveys/${survey.id}/test`}>Test chat</a>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <a href={`/surveys/${survey.id}/publish`}>Publish</a>
                      </Button>
                      <Button asChild size="sm">
                        <a href={`/surveys/${survey.id}`}>Open survey</a>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
              {surveys.length === 0 && (
                <Card className="border-ink-200/60 bg-white/95">
                  <CardContent className="py-12 text-center text-sm text-ink-500">
                    No surveys yet. Start a new one to see results here.
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          <Card className="border-ink-200/70 bg-white/90">
            <CardHeader>
              <CardTitle className="text-base">Build flow</CardTitle>
              <CardDescription>Typeform-meets-chat workflow with clear progress.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-ink-600">
              <div>
                <p className="font-semibold text-ink-900">1. Brief</p>
                <p>Capture intent, audience, and tone.</p>
              </div>
              <div>
                <p className="font-semibold text-ink-900">2. Script</p>
                <p>Edit questions in a human-readable editor.</p>
              </div>
              <div>
                <p className="font-semibold text-ink-900">3. Test</p>
                <p>Experience the exact respondent UI before publishing.</p>
              </div>
              <div>
                <p className="font-semibold text-ink-900">4. Publish</p>
                <p>Create a run and invite participants.</p>
              </div>
              <Button asChild className="w-full">
                <a href="/surveys/new">Create survey</a>
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};
