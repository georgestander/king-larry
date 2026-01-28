import type { Migration } from "kysely";

export const migrations: Record<string, Migration> = {
  "001_init": {
    up: async (db) => {
      await db.schema
        .createTable("scripts")
        .addColumn("id", "text", (col) => col.primaryKey())
        .addColumn("title", "text", (col) => col.notNull())
        .addColumn("created_at", "text", (col) => col.notNull())
        .addColumn("active_version_id", "text")
        .execute();

      await db.schema
        .createTable("script_versions")
        .addColumn("id", "text", (col) => col.primaryKey())
        .addColumn("script_id", "text", (col) => col.notNull())
        .addColumn("version", "integer", (col) => col.notNull())
        .addColumn("json", "text", (col) => col.notNull())
        .addColumn("prompt_markdown", "text", (col) => col.notNull())
        .addColumn("status", "text", (col) => col.notNull())
        .addColumn("created_at", "text", (col) => col.notNull())
        .addColumn("previous_version_id", "text")
        .execute();

      await db.schema
        .createTable("sessions")
        .addColumn("id", "text", (col) => col.primaryKey())
        .addColumn("script_version_id", "text", (col) => col.notNull())
        .addColumn("title", "text", (col) => col.notNull())
        .addColumn("time_limit_minutes", "integer", (col) => col.notNull())
        .addColumn("provider", "text", (col) => col.notNull())
        .addColumn("model", "text", (col) => col.notNull())
        .addColumn("status", "text", (col) => col.notNull())
        .addColumn("created_at", "text", (col) => col.notNull())
        .execute();

      await db.schema
        .createTable("participants")
        .addColumn("id", "text", (col) => col.primaryKey())
        .addColumn("session_id", "text", (col) => col.notNull())
        .addColumn("email", "text")
        .addColumn("name", "text")
        .addColumn("invite_token", "text", (col) => col.notNull().unique())
        .addColumn("status", "text", (col) => col.notNull())
        .addColumn("invited_at", "text", (col) => col.notNull())
        .addColumn("started_at", "text")
        .addColumn("completed_at", "text")
        .execute();

      await db.schema
        .createTable("messages")
        .addColumn("id", "text", (col) => col.primaryKey())
        .addColumn("participant_id", "text", (col) => col.notNull())
        .addColumn("turn_index", "integer", (col) => col.notNull())
        .addColumn("role", "text", (col) => col.notNull())
        .addColumn("content", "text", (col) => col.notNull())
        .addColumn("created_at", "text", (col) => col.notNull())
        .execute();

      await db.schema
        .createTable("completions")
        .addColumn("id", "text", (col) => col.primaryKey())
        .addColumn("participant_id", "text", (col) => col.notNull())
        .addColumn("reason", "text", (col) => col.notNull())
        .addColumn("completed_at", "text", (col) => col.notNull())
        .execute();

      await db.schema
        .createIndex("script_versions_script_id_idx")
        .on("script_versions")
        .column("script_id")
        .execute();

      await db.schema
        .createIndex("sessions_script_version_id_idx")
        .on("sessions")
        .column("script_version_id")
        .execute();

      await db.schema
        .createIndex("participants_session_id_idx")
        .on("participants")
        .column("session_id")
        .execute();

      await db.schema
        .createIndex("messages_participant_id_idx")
        .on("messages")
        .column("participant_id")
        .execute();
    },
    down: async (db) => {
      await db.schema.dropTable("completions").execute();
      await db.schema.dropTable("messages").execute();
      await db.schema.dropTable("participants").execute();
      await db.schema.dropTable("sessions").execute();
      await db.schema.dropTable("script_versions").execute();
      await db.schema.dropTable("scripts").execute();
    },
  },
  "002_editor_fields": {
    up: async (db) => {
      await db.schema
        .alterTable("script_versions")
        .addColumn("editor_json", "text")
        .execute();
      await db.schema
        .alterTable("script_versions")
        .addColumn("preview_transcript_json", "text")
        .execute();
      await db.schema
        .alterTable("script_versions")
        .addColumn("preview_updated_at", "text")
        .execute();
    },
    down: async (db) => {
      await db.schema
        .alterTable("script_versions")
        .dropColumn("editor_json")
        .execute();
      await db.schema
        .alterTable("script_versions")
        .dropColumn("preview_transcript_json")
        .execute();
      await db.schema
        .alterTable("script_versions")
        .dropColumn("preview_updated_at")
        .execute();
    },
  },
};
