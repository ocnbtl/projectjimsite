export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  APP_ORIGIN: string;
  ENVIRONMENT: string;
  ACCESS_TEAM_DOMAIN?: string;
  ACCESS_AUD?: string;
  AUTH_SECRET: string;
  OWNER_EMAIL?: string;
  BOOTSTRAP_TOKEN?: string;
}
export type Member = { id: string; name: string; email: string; role: 'owner' | 'crew'; sessionCreatedAt: Date };
