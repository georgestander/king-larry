import { SurveyTopBar } from "@/app/components/builder/SurveyTopBar";
import { buildSurveySteps } from "@/app/components/builder/steps";
import { SurveyPublishClient } from "@/app/pages/survey-publish-client";
import { defaultInterviewTemplate } from "@/data/default-script";
import { validateInterviewDefinition } from "@/lib/interview-validators";
import { getActiveScriptVersion, getScript, listScriptVersions, listSessionsByScriptId } from "@/server/store";

export const SurveyPublishPage = async ({ params }: { params: { id: string } }) => {
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
    activeStep: "publish",
    hasScript: versions.length > 0,
    hasPreview: Boolean(activeVersion?.preview_transcript_json),
    hasRuns: runs.length > 0,
    hasInvites: runs.some((run) => (run.sent_count ?? 0) > 0),
  });

  const latestRunWithResponses = runs.find((run) => (run.started_count ?? 0) > 0 || (run.completed_count ?? 0) > 0) ?? null;

  let interview = defaultInterviewTemplate;
  if (activeVersion?.json) {
    try {
      const parsed = JSON.parse(activeVersion.json) as unknown;
      const validation = validateInterviewDefinition(parsed);
      if (validation.ok) {
        interview = validation.data;
      }
    } catch {
      interview = interview;
    }
  }

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

      {activeVersion ? (
        <SurveyPublishClient
          scriptId={script.id}
          versionId={activeVersion.id}
          defaultTitle={script.title}
          interview={interview}
          scriptVersionNumber={activeVersion.version}
          scriptVersionCreatedAt={activeVersion.created_at}
          latestResponseRun={latestRunWithResponses ? {
            id: latestRunWithResponses.id,
            title: latestRunWithResponses.title,
            created_at: latestRunWithResponses.created_at,
            script_version_number: latestRunWithResponses.script_version_number,
            sent_count: latestRunWithResponses.sent_count,
            started_count: latestRunWithResponses.started_count,
            completed_count: latestRunWithResponses.completed_count,
          } : null}
          requiresResponseGate={Boolean(latestRunWithResponses && latestRunWithResponses.script_version_id !== activeVersion.id)}
        />
      ) : (
        <div className="rounded-2xl border border-ink-200 bg-white/90 p-8 text-sm text-ink-600">
          Save a script version before publishing a run.
        </div>
      )}
    </div>
  );
};
