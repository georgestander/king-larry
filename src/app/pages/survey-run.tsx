import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Separator } from "@/app/components/ui/separator";
import { SurveyTopBar } from "@/app/components/builder/SurveyTopBar";
import { buildSurveySteps } from "@/app/components/builder/steps";
import { InviteMoreDialog, ParticipantActions } from "@/app/pages/session-client";
import { getActiveScriptVersion, getScript, getSessionSummary, listScriptVersions, listSessionsByScriptId } from "@/server/store";

export const SurveyRunPage = async ({ params }: { params: { id: string; runId: string } }) => {
  const [script, versions, runs, summary] = await Promise.all([
    getScript(params.id),
    listScriptVersions(params.id),
    listSessionsByScriptId(params.id),
    getSessionSummary(params.runId),
  ]);

  if (!script) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-2xl font-semibold text-ink-950">Survey not found</h1>
      </div>
    );
  }

  if (!summary || !runs.find((run) => run.id === params.runId)) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-2xl font-semibold text-ink-950">Run not found</h1>
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

  const { session, participants } = summary;
  const sentCount = participants.length;
  const startedCount = participants.filter((participant) => participant.status !== "invited").length;
  const completedCount = participants.filter((participant) => participant.status === "completed").length;
  const completionRate = sentCount
    ? Math.round((completedCount / sentCount) * 100)
    : 0;

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

      <div className="space-y-6">
        <Card className="border-ink-200/70 bg-white/95">
          <CardHeader className="flex-row items-start justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-ink-400">Run overview</p>
              <CardTitle className="text-2xl">{session.title}</CardTitle>
              <p className="text-sm text-ink-500">
                {session.provider} / {session.model} · {session.time_limit_minutes} minutes
              </p>
            </div>
            <div className="flex items-center gap-3">
              <InviteMoreDialog sessionId={session.id} />
              <Button asChild variant="outline">
                <a href={`/api/sessions/${session.id}/export.csv`}>Download CSV</a>
              </Button>
              <Button asChild variant="outline">
                <a href={`/api/sessions/${session.id}/export.pdf`}>Download PDF</a>
              </Button>
            </div>
          </CardHeader>
        </Card>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sent</CardTitle>
              <p className="text-2xl font-semibold text-ink-950">{sentCount}</p>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Started</CardTitle>
              <p className="text-2xl font-semibold text-ink-950">{startedCount}</p>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Completed</CardTitle>
              <p className="text-2xl font-semibold text-ink-950">{completedCount}</p>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Completion rate</CardTitle>
              <p className="text-2xl font-semibold text-ink-950">{completionRate}%</p>
            </CardHeader>
          </Card>
        </div>

        <Separator />

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-ink-950">Participants</h2>
          {participants.map((participant) => (
            <Card key={participant.id}>
              <CardHeader className="flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">
                    {participant.name ?? "Anonymous"}
                  </CardTitle>
                  <p className="text-sm text-ink-500">{participant.email ?? "No email"}</p>
                </div>
                <Badge variant={participant.status === "completed" ? "accent" : "secondary"}>
                  {participant.status}
                </Badge>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 text-xs text-ink-400">
                <span>Invited: {new Date(participant.invited_at).toLocaleDateString()}</span>
                <span>{participant.completed_at ? `Completed: ${new Date(participant.completed_at).toLocaleDateString()}` : "Not completed"}</span>
                <ParticipantActions
                  participantId={participant.id}
                  inviteToken={participant.invite_token}
                  label={participant.name ?? "Participant transcript"}
                />
              </CardContent>
            </Card>
          ))}
          {participants.length === 0 && (
            <Card>
              <CardContent className="py-10 text-center text-sm text-ink-500">
                No participants yet.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
