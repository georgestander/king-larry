"use server";

import { Badge } from "@/app/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { SurveyTopBar } from "@/app/components/builder/SurveyTopBar";
import { buildSurveySteps } from "@/app/components/builder/steps";
import { getActiveScriptVersion, getScript, listScriptVersions, listSessionsByScriptId } from "@/server/store";

export const SurveyRunsPage = async ({ params }: { params: { id: string } }) => {
  const [script, versions, runs] = await Promise.all([
    getScript(params.id),
    listScriptVersions(params.id),
    listSessionsByScriptId(params.id),
  ]);

  if (!script) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-2xl font-semibold text-ink-950">Survey not found</h1>
      </div>
    );
  }

  const activeVersion = await getActiveScriptVersion(script.id);
  const steps = buildSurveySteps({
    surveyId: script.id,
    activeStep: "results",
    hasScript: versions.length > 0,
    hasPreview: Boolean(activeVersion?.preview_transcript_json),
    hasRuns: runs.length > 0,
    hasInvites: runs.some((run) => (run.sent_count ?? 0) > 0),
  });

  const formatTimestamp = (value: string) =>
    new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="space-y-6">
      <SurveyTopBar
        surveyId={script.id}
        title={script.title}
        steps={steps}
        versions={versions.map((version) => ({
          id: version.id,
          version: version.version,
          status: version.status,
          created_at: version.created_at,
        }))}
        runs={runs.map((run) => ({
          id: run.id,
          title: run.title,
          status: run.status,
          created_at: run.created_at,
          script_version_number: run.script_version_number,
          sent_count: run.sent_count,
          started_count: run.started_count,
          completed_count: run.completed_count,
        }))}
      />

      <Card className="border-ink-200/70 bg-white/95">
        <CardHeader>
          <CardTitle className="text-xl">Survey runs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {runs.map((run, index) => {
            const completionRate = run.sent_count
              ? Math.round((run.completed_count / run.sent_count) * 100)
              : 0;

            return (
              <Card key={run.id} className="border-ink-200/60 bg-white/95">
                <CardHeader className="flex-row items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-base">{run.title}</CardTitle>
                      {index === 0 && <Badge variant="accent">Latest</Badge>}
                      {run.script_version_number ? (
                        <Badge variant="secondary">Version {run.script_version_number}</Badge>
                      ) : null}
                      <Badge variant={run.status === "active" ? "accent" : "secondary"}>{run.status}</Badge>
                    </div>
                    <p className="text-xs text-ink-500">Created {formatTimestamp(run.created_at)}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-ink-500">
                      <span><span className="text-ink-400">Sent</span> {run.sent_count}</span>
                      <span><span className="text-ink-400">Started</span> {run.started_count}</span>
                      <span><span className="text-ink-400">Completed</span> {run.completed_count}</span>
                      <span><span className="text-ink-400">Completion</span> {completionRate}%</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a
                      className="rounded-lg border border-ink-200 px-3 py-1 text-xs font-semibold text-ink-900"
                      href={`/sessions/${run.id}`}
                    >
                      Legacy view
                    </a>
                    <a
                      className="rounded-lg bg-ink-900 px-3 py-1 text-xs font-semibold text-ink-50"
                      href={`/surveys/${script.id}/runs/${run.id}`}
                    >
                      View results
                    </a>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
          {runs.length === 0 && (
            <Card className="border-ink-200/60 bg-white/95">
              <CardContent className="py-10 text-center text-sm text-ink-500">
                No runs yet. Publish a run to see results here.
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
