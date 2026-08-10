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

  const baseURL = parseOrigin("BETTER_AUTH_URL", configuredUrl);
  const trustedOrigins = (environment.BETTER_AUTH_TRUSTED_ORIGINS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => parseOrigin("BETTER_AUTH_TRUSTED_ORIGINS", value));

  return {
    baseURL,
    secret,
    trustedOrigins,
  } as const;
}

function parseOrigin(variableName: string, value: string) {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error(`${variableName} must contain valid absolute URLs.`);
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`${variableName} must use the http or https protocol.`);
  }

  if (
    url.hostname.includes("*") ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error(`${variableName} must contain origins without a path.`);
  }

  return url.origin;
}
