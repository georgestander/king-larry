import { except, layout, render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { apiRoutes } from "@/app/api/routes";
import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { logRequests } from "@/app/logging";
import { StudioLayout } from "@/app/layouts/StudioLayout";
import { SurveysPage } from "@/app/pages/surveys";
import { SurveysNewPage } from "@/app/pages/surveys-new";
import { SettingsPage } from "@/app/pages/settings";
import { SurveyOverviewPage } from "@/app/pages/survey";
import { SurveyScriptPage } from "@/app/pages/survey-script";
import { SurveyTestPage } from "@/app/pages/survey-test";
import { SurveyPublishPage } from "@/app/pages/survey-publish";
import { SurveyInvitePage } from "@/app/pages/survey-invite";
import { SurveyRunsPage } from "@/app/pages/survey-runs";
import { SurveyRunPage } from "@/app/pages/survey-run";
import { SessionPage } from "@/app/pages/session";
import { InterviewPage } from "@/app/pages/interview";

export type AppContext = {};

export default defineApp([
  setCommonHeaders(),
  logRequests(),
  except((error, requestInfo) => {
    console.error(`[rwsdk] error ${requestInfo.request.method} ${requestInfo.path}`, error);
    return new Response("Internal Server Error", { status: 500 });
  }),
  ({ ctx }) => {
    // setup ctx here
    ctx;
  },
  ...apiRoutes,
  render(Document, [
    layout(StudioLayout, [
      route("/", SurveysPage),
      route("/surveys", SurveysPage),
      route("/surveys/new", SurveysNewPage),
      route("/surveys/:id", SurveyOverviewPage),
      route("/surveys/:id/script", SurveyScriptPage),
      route("/surveys/:id/test", SurveyTestPage),
      route("/surveys/:id/publish", SurveyPublishPage),
      route("/surveys/:id/invite", SurveyInvitePage),
      route("/surveys/:id/runs", SurveyRunsPage),
      route("/surveys/:id/runs/:runId", SurveyRunPage),
      route("/settings", SettingsPage),
    ]),
    route("/sessions/:id", SessionPage),
    route("/interview/:token", InterviewPage),
  ]),
]);

export { InterviewDbDO } from "@/durable-objects/interview-db";
