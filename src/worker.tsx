import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { apiRoutes } from "@/app/api/routes";
import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { SurveysPage } from "@/app/pages/surveys";
import { SurveysNewPage } from "@/app/pages/surveys-new";
import { SurveyOverviewPage } from "@/app/pages/survey";
import { SurveyScriptPage } from "@/app/pages/survey-script";
import { SurveyTestPage } from "@/app/pages/survey-test";
import { SurveyPublishPage } from "@/app/pages/survey-publish";
import { SessionPage } from "@/app/pages/session";
import { InterviewPage } from "@/app/pages/interview";

export type AppContext = {};

export default defineApp([
  setCommonHeaders(),
  ({ ctx }) => {
    // setup ctx here
    ctx;
  },
  ...apiRoutes,
  render(Document, [
    route("/", SurveysPage),
    route("/surveys", SurveysPage),
    route("/surveys/new", SurveysNewPage),
    route("/surveys/:id", SurveyOverviewPage),
    route("/surveys/:id/script", SurveyScriptPage),
    route("/surveys/:id/test", SurveyTestPage),
    route("/surveys/:id/publish", SurveyPublishPage),
    route("/sessions/:id", SessionPage),
    route("/interview/:token", InterviewPage),
  ]),
]);

export { InterviewDbDO } from "@/durable-objects/interview-db";
