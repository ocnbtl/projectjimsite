import { business } from "@/content/site";

const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : undefined;

export const siteUrl = configuredUrl ?? vercelUrl ?? `https://${business.domain}`;
export const isLaunchReady = configuredUrl === `https://${business.domain}`;
