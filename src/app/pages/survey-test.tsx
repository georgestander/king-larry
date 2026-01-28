"use server";

import { buildSurveySteps } from "@/app/components/builder/steps";
import { SurveyTopBar } from "@/app/components/builder/SurveyTopBar";
import { SurveyTestPublishedClient } from "@/app/pages/survey-test-published-client";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { getActiveScriptVersion, getScript, listScriptVersions, listSessionsByScriptId } from "@/server/store";

export const SurveyTestPage = async ({ params }: { params: { id: string } }) => {
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
    activeStep: "test",
    hasScript: versions.length > 0,
    hasPreview: Boolean(activeVersion?.preview_transcript_json),
    hasRuns: runs.length > 0,
  });

  const testRun = runs.find((run) => run.status === "active") ?? runs[0] ?? null;

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

      {testRun ? (
        <SurveyTestPublishedClient sessionId={testRun.id} />
      ) : (
        <Card className="border-ink-200/70 bg-white/95">
          <CardHeader>
            <CardTitle>Publish first</CardTitle>
            <CardDescription>
              Testing uses a real invite link so the UI and behavior match what respondents see.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-ink-600">
            <p>Publish a run to generate invite links and start a test interview.</p>
            <Button asChild>
              <a href={`/surveys/${script.id}/publish`}>Go to Publish & invite</a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
