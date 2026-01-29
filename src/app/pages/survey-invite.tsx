import { SurveyTopBar } from "@/app/components/builder/SurveyTopBar";
import { buildSurveySteps } from "@/app/components/builder/steps";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { SurveyInviteClient } from "@/app/pages/survey-invite-client";
import { getActiveScriptVersion, getScript, listScriptVersions, listSessionsByScriptId } from "@/server/store";

export const SurveyInvitePage = async ({ params }: { params: { id: string } }) => {
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
    activeStep: "invite",
    hasScript: versions.length > 0,
    hasPreview: Boolean(activeVersion?.preview_transcript_json),
    hasRuns: runs.length > 0,
    hasInvites: runs.some((run) => (run.sent_count ?? 0) > 0),
  });

  const inviteRun = runs.find((run) => run.status === "active") ?? runs[0] ?? null;
  const initialMetrics = inviteRun
    ? {
      sent: inviteRun.sent_count ?? 0,
      started: inviteRun.started_count ?? 0,
      completed: inviteRun.completed_count ?? 0,
      completionRate: (inviteRun.sent_count ?? 0)
        ? Math.round(((inviteRun.completed_count ?? 0) / (inviteRun.sent_count ?? 1)) * 100)
        : 0,
    }
    : null;

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

      {inviteRun && initialMetrics ? (
        <SurveyInviteClient
          scriptId={script.id}
          sessionId={inviteRun.id}
          sessionTitle={inviteRun.title}
          initialMetrics={initialMetrics}
        />
      ) : (
        <Card className="border-ink-200/70 bg-white/95">
          <CardHeader>
            <CardTitle>Publish a run first</CardTitle>
            <CardDescription>Invite links are created for a published run.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-ink-600">
            Go to <a href={`/surveys/${script.id}/publish`} className="font-semibold underline underline-offset-4">Publish</a> to create a run, then come back here.
          </CardContent>
        </Card>
      )}
    </div>
  );
};
