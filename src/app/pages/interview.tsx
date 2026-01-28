"use server";

import InterviewClient from "./interview-client";
import { getParticipantByToken, getSession } from "@/server/store";

export const InterviewPage = async ({ params }: { params: { token: string } }) => {
  const participant = await getParticipantByToken(params.token);
  if (!participant) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-2xl font-semibold text-ink-950">Invalid invite</h1>
        <p className="text-sm text-ink-500">This interview link is not valid.</p>
      </div>
    );
  }

  if (participant.status === "completed") {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-2xl font-semibold text-ink-950">Interview complete</h1>
        <p className="text-sm text-ink-500">Thanks for participating.</p>
      </div>
    );
  }

  const session = await getSession(participant.session_id);
  if (!session) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-2xl font-semibold text-ink-950">Session not found</h1>
      </div>
    );
  }

  return (
    <InterviewClient
      token={params.token}
      sessionTitle={session.title}
      timeLimitMinutes={session.time_limit_minutes}
    />
  );
};
