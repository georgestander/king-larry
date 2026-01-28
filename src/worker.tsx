import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { apiRoutes } from "@/app/api/routes";
import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";
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
    route("/", Home),
    route("/sessions/:id", SessionPage),
    route("/interview/:token", InterviewPage),
  ]),
]);

export { InterviewDbDO } from "@/durable-objects/interview-db";
