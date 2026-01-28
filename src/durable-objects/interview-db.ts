"use server";

import { SqliteDurableObject } from "rwsdk/db";

import { migrations } from "@/db/migrations";

export class InterviewDbDO extends SqliteDurableObject {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env, migrations, "__interview_migrations");
  }
}
