import { route } from "rwsdk/router";

import { handleExportCsv, handleExportPdf } from "@/server/api/exports";
import { handleInterviewComplete, handleInterviewMessage } from "@/server/api/interview";
import { handleScripts, handleScriptRollback, handleScriptsGenerate, handleScriptVersions } from "@/server/api/scripts";
import { handleParticipantTranscript, handleSessionDetail, handleSessionInvite, handleSessions } from "@/server/api/sessions";

export const apiRoutes = [
  route("/api/scripts/generate", ({ request }) => handleScriptsGenerate(request)),
  route("/api/scripts", ({ request }) => handleScripts(request)),
  route("/api/scripts/:id/versions", ({ request, params }) => handleScriptVersions(request, params.id)),
  route("/api/scripts/:id/rollback", ({ request, params }) => handleScriptRollback(request, params.id)),
  route("/api/sessions", ({ request }) => handleSessions(request)),
  route("/api/sessions/:id", ({ request, params }) => handleSessionDetail(request, params.id)),
  route("/api/sessions/:id/invite", ({ request, params }) => handleSessionInvite(request, params.id)),
  route("/api/participants/:id/transcript", ({ request, params }) => handleParticipantTranscript(request, params.id)),
  route("/api/interview/:token/message", ({ request, params }) => handleInterviewMessage(request, params.token)),
  route("/api/interview/:token/complete", ({ request, params }) => handleInterviewComplete(request, params.token)),
  route("/api/sessions/:id/export.csv", ({ params }) => handleExportCsv(params.id)),
  route("/api/sessions/:id/export.pdf", ({ params }) => handleExportPdf(params.id)),
];
