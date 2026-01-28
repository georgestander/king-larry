declare module "cloudflare:workers" {
  interface Env {
    INTERVIEW_DB: DurableObjectNamespace;
  }
}
