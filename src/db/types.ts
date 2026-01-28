export type ScriptRow = {
  id: string;
  title: string;
  created_at: string;
  active_version_id: string | null;
};

export type ScriptVersionRow = {
  id: string;
  script_id: string;
  version: number;
  json: string;
  prompt_markdown: string;
  editor_json: string | null;
  preview_transcript_json: string | null;
  preview_updated_at: string | null;
  status: "active" | "archived";
  created_at: string;
  previous_version_id: string | null;
};

export type SessionRow = {
  id: string;
  script_version_id: string;
  title: string;
  time_limit_minutes: number;
  provider: "openai" | "anthropic" | "openrouter";
  model: string;
  status: "draft" | "active" | "closed";
  created_at: string;
};

export type ParticipantRow = {
  id: string;
  session_id: string;
  email: string | null;
  name: string | null;
  invite_token: string;
  status: "invited" | "started" | "completed";
  invited_at: string;
  started_at: string | null;
  completed_at: string | null;
};

export type MessageRow = {
  id: string;
  participant_id: string;
  turn_index: number;
  role: "system" | "assistant" | "user";
  content: string;
  created_at: string;
};

export type CompletionRow = {
  id: string;
  participant_id: string;
  reason: "finished" | "timeout" | "manual";
  completed_at: string;
};

export interface Database {
  scripts: ScriptRow;
  script_versions: ScriptVersionRow;
  sessions: SessionRow;
  participants: ParticipantRow;
  messages: MessageRow;
  completions: CompletionRow;
}
