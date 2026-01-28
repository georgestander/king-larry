declare global {
  interface Env {
    INTERVIEW_DB: DurableObjectNamespace;
    AI_PROVIDER?: string;
    OPENAI_API_KEY?: string;
    OPENAI_MODEL?: string;
    ANTHROPIC_API_KEY?: string;
    ANTHROPIC_MODEL?: string;
    OPENROUTER_API_KEY?: string;
    OPENROUTER_MODEL?: string;
  }
}

declare namespace Cloudflare {
  interface Env {
    INTERVIEW_DB: DurableObjectNamespace;
    AI_PROVIDER?: string;
    OPENAI_API_KEY?: string;
    OPENAI_MODEL?: string;
    ANTHROPIC_API_KEY?: string;
    ANTHROPIC_MODEL?: string;
    OPENROUTER_API_KEY?: string;
    OPENROUTER_MODEL?: string;
  }
}

declare module "cloudflare:workers" {
  interface Env {
    INTERVIEW_DB: DurableObjectNamespace;
    AI_PROVIDER?: string;
    OPENAI_API_KEY?: string;
    OPENAI_MODEL?: string;
    ANTHROPIC_API_KEY?: string;
    ANTHROPIC_MODEL?: string;
    OPENROUTER_API_KEY?: string;
    OPENROUTER_MODEL?: string;
  }
}

export {};
