"use server";

import { SurveyShell } from "@/app/components/builder/SurveyShell";
import { buildSurveySteps } from "@/app/components/builder/steps";
import { SurveyPublishClient } from "@/app/pages/survey-publish-client";
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
  });

  return (
    <SurveyShell
      title={script.title}
      subtitle="Publish & invite"
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
      {activeVersion ? (
        <SurveyPublishClient
          scriptId={script.id}
          versionId={activeVersion.id}
          defaultTitle={script.title}
        />
      ) : (
        <div className="rounded-2xl border border-ink-200 bg-white/90 p-8 text-sm text-ink-600">
          Save a script version before publishing a run.
        </div>
      )}
    </SurveyShell>
  );
};
