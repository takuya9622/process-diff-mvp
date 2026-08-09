const minimumSecretLength = 32;

type BetterAuthEnvironment = Readonly<Record<string, string | undefined>>;

export function getBetterAuthEnvironment(
  environment: BetterAuthEnvironment = process.env,
) {
  const secret = environment.BETTER_AUTH_SECRET;

  if (!secret || secret.trim().length < minimumSecretLength) {
    throw new Error(
      `BETTER_AUTH_SECRET must contain at least ${minimumSecretLength} characters.`,
    );
  }

  const configuredUrl = environment.BETTER_AUTH_URL;

  if (!configuredUrl) {
    throw new Error("BETTER_AUTH_URL is not configured.");
  }

  let url: URL;

  try {
    url = new URL(configuredUrl);
  } catch {
    throw new Error("BETTER_AUTH_URL must be a valid absolute URL.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("BETTER_AUTH_URL must use the http or https protocol.");
  }

  if (
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error("BETTER_AUTH_URL must be an origin without a path.");
  }

  return {
    baseURL: url.origin,
    secret,
  } as const;
}
