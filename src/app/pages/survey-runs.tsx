"use server";

import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { SurveyShell } from "@/app/components/builder/SurveyShell";
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
  });

  return (
    <SurveyShell
      title={script.title}
      subtitle="Runs"
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
      }))}
    >
      <Card className="border-ink-200/70 bg-white/95">
        <CardHeader>
          <CardTitle className="text-xl">Survey runs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {runs.map((run) => (
            <Card key={run.id} className="border-ink-200/60 bg-white/95">
              <CardHeader className="flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">{run.title}</CardTitle>
                  <p className="text-xs text-ink-500">{new Date(run.created_at).toLocaleDateString()}</p>
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
          ))}
          {runs.length === 0 && (
            <Card className="border-ink-200/60 bg-white/95">
              <CardContent className="py-10 text-center text-sm text-ink-500">
                No runs yet. Publish a run to see results here.
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </SurveyShell>
  );
};
