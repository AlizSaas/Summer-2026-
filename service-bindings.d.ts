interface ServiceBindings extends Env {
  DB: D1Database;
  DAILY_SUMMARY: DurableObjectNamespace;
  OPENAI_API_KEY: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  RESEND_API_KEY: string;
  EMAIL_FROM: string;
}
