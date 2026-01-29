import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { SurveyTopBar } from "@/app/components/builder/SurveyTopBar";
import { buildSurveySteps } from "@/app/components/builder/steps";
import { getActiveScriptVersion, getScript, listScriptVersions, listSessionsByScriptId } from "@/server/store";

export const SurveyOverviewPage = async ({ params }: { params: { id: string } }) => {
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
    activeStep: "brief",
    hasScript: versions.length > 0,
    hasPreview: Boolean(activeVersion?.preview_transcript_json),
    hasRuns: runs.length > 0,
    hasInvites: runs.some((run) => (run.sent_count ?? 0) > 0),
  });

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
          <CardTitle className="text-xl">Brief</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-ink-600">
          <p>Capture your survey brief and move into the script editor.</p>
          <div className="flex flex-wrap gap-2">
            <a
              className="rounded-lg bg-ink-900 px-4 py-2 text-sm font-semibold text-ink-50"
              href={`/surveys/${script.id}/script`}
            >
              Open script editor
            </a>
            <a
              className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-semibold text-ink-900"
              href={`/surveys/${script.id}/test`}
            >
              Test chat
            </a>
            <a
              className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-semibold text-ink-900"
              href={`/surveys/${script.id}/publish`}
            >
              Publish run
            </a>
            {runs.length > 0 && (
              <a
                className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-semibold text-ink-900"
                href={`/surveys/${script.id}/invite`}
              >
                Invite participants
              </a>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
