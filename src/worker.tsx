import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { apiRoutes } from "@/app/api/routes";
import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { SurveysPage } from "@/app/pages/surveys";
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
    route("/sessions/:id", SessionPage),
    route("/interview/:token", InterviewPage),
  ]),
]);

export { InterviewDbDO } from "@/durable-objects/interview-db";
