"use server";

import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Separator } from "@/app/components/ui/separator";
import { TranscriptDialog } from "@/app/pages/session-client";
import { getSessionSummary } from "@/server/store";

export const SessionPage = async ({ params }: { params: { id: string } }) => {
  const summary = await getSessionSummary(params.id);
  if (!summary) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-2xl font-semibold text-slate-900">Session not found</h1>
      </div>
    );
  }

  const { session, participants } = summary;

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">{session.title}</h1>
          <p className="text-sm text-slate-500">
            {session.provider} / {session.model} · {session.time_limit_minutes} minutes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="outline">
            <a href={`/api/sessions/${session.id}/export.csv`}>Download CSV</a>
          </Button>
          <Button asChild variant="outline">
            <a href={`/api/sessions/${session.id}/export.pdf`}>Download PDF</a>
          </Button>
        </div>
      </div>

      <Separator className="my-8" />

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">Participants</h2>
        {participants.map((participant) => (
          <Card key={participant.id}>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">
                  {participant.name ?? "Anonymous"}
                </CardTitle>
                <p className="text-sm text-slate-500">{participant.email ?? "No email"}</p>
              </div>
              <Badge variant={participant.status === "completed" ? "accent" : "secondary"}>
                {participant.status}
              </Badge>
            </CardHeader>
            <CardContent className="flex items-center justify-between text-xs text-slate-400">
              <span>Invited: {new Date(participant.invited_at).toLocaleDateString()}</span>
              <span>{participant.completed_at ? `Completed: ${new Date(participant.completed_at).toLocaleDateString()}` : "Not completed"}</span>
              <TranscriptDialog
                participantId={participant.id}
                label={participant.name ?? "Participant transcript"}
              />
            </CardContent>
          </Card>
        ))}
        {participants.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center text-sm text-slate-500">
              No participants yet.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
