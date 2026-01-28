"use server";

import { env } from "cloudflare:workers";
import { createDb } from "rwsdk/db";

import type { Database } from "@/db/types";

let dbInstance: ReturnType<typeof createDb<Database>> | null = null;

export const getDb = () => {
  if (!dbInstance) {
    dbInstance = createDb<Database>(env.INTERVIEW_DB, "main");
  }
  return dbInstance;
};
