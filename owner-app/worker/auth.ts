import { betterAuth } from 'better-auth';
import { admin } from 'better-auth/plugins';
import type { Env } from './env';

export function makeAuth(env: Env, receiveReset?: (token: string) => void) {
  if (!env.AUTH_SECRET || env.AUTH_SECRET.length < 32) throw new Error('Authentication not configured');
  return betterAuth({
    appName: 'MCC Office', database: env.DB, secret: env.AUTH_SECRET,
    baseURL: env.APP_ORIGIN, basePath: '/api/auth', trustedOrigins: [env.APP_ORIGIN],
    emailAndPassword: {
      enabled: true, disableSignUp: true, minPasswordLength: 14, maxPasswordLength: 128,
      revokeSessionsOnPasswordReset: true, resetPasswordTokenExpiresIn: 1800,
      // Reset links are handed to the owner through an authenticated administrative flow.
      // Public reset requests are not routed; no email or unapproved provider is used.
      sendResetPassword: async ({ token }) => {
        if (!receiveReset) throw new Error('Use the owner recovery workflow');
        receiveReset(token);
      },
    },
    session: { expiresIn: 60 * 60 * 12, updateAge: 60 * 30, freshAge: 60 * 15, cookieCache: { enabled: false } },
    rateLimit: { enabled: true, storage: 'database', window: 60, max: 40, customRules: { '/sign-in/email': { window: 60, max: 5 }, '/reset-password': { window: 60, max: 5 } } },
    advanced: { useSecureCookies: env.ENVIRONMENT === 'production', cookiePrefix: 'mcc-office', ipAddress: { ipAddressHeaders: ['cf-connecting-ip'] } },
    // Admin endpoints are NEVER exposed by the worker router. Only internal createUser is used.
    plugins: [admin()], logger: { disabled: true },
  });
}

export async function setupLink(env: Env, email: string) {
  let token = '';
  const auth = makeAuth(env, value => { token = value; });
  await auth.api.requestPasswordReset({ body: { email, redirectTo: `${env.APP_ORIGIN}/` } });
  if (!token) throw new Error('Could not create setup link');
  // Fragment is not sent to servers/referrers. The client clears it immediately.
  return `${env.APP_ORIGIN}/#set-password=${encodeURIComponent(token)}`;
}
