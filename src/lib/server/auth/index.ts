import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";

import { getBetterAuthEnvironment } from "@/lib/server/auth/environment";
import { database } from "@/lib/server/database/client";

const { baseURL, secret } = getBetterAuthEnvironment();

export const auth = betterAuth({
  appName: "Process Diff",
  baseURL,
  secret,
  database: drizzleAdapter(database, {
    provider: "pg",
    transaction: true,
    usePlural: true,
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    requireEmailVerification: false,
    minPasswordLength: 12,
    maxPasswordLength: 128,
  },
  user: {
    modelName: "users",
  },
  session: {
    modelName: "sessions",
  },
  account: {
    modelName: "accounts",
  },
  verification: {
    modelName: "verifications",
  },
  rateLimit: {
    storage: "database",
    modelName: "rateLimits",
  },
  advanced: {
    database: {
      generateId: "uuid",
    },
  },
  plugins: [
    organization({
      disableOrganizationDeletion: true,
      schema: {
        organization: {
          modelName: "organizations",
        },
        member: {
          modelName: "organizationMemberships",
        },
        invitation: {
          modelName: "invitations",
        },
      },
    }),
  ],
});
