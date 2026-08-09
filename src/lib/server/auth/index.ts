import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";

import {
  organizationAccessControl,
  organizationRoles,
} from "@/lib/auth/access-control";
import { getBetterAuthEnvironment } from "@/lib/server/auth/environment";
import { database, databaseSchema } from "@/lib/server/database/client";

const { baseURL, secret, trustedOrigins } = getBetterAuthEnvironment();

export const auth = betterAuth({
  appName: "Process Diff",
  baseURL,
  secret,
  trustedOrigins,
  database: drizzleAdapter(database, {
    provider: "pg",
    schema: databaseSchema,
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
  rateLimit: {
    storage: "database",
  },
  advanced: {
    database: {
      generateId: "uuid",
    },
  },
  plugins: [
    organization({
      ac: organizationAccessControl,
      roles: organizationRoles,
      organizationLimit: 1,
      membershipLimit: 1,
      invitationLimit: 0,
      disableOrganizationDeletion: true,
      schema: {
        member: {
          modelName: "organizationMembership",
        },
      },
    }),
    nextCookies(),
  ],
});
