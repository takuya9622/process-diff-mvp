import { describe, expect, it } from "vitest";

import { getBetterAuthEnvironment } from "./environment";

const validEnvironment = {
  BETTER_AUTH_SECRET: "a-secure-test-secret-with-at-least-32-characters",
  BETTER_AUTH_URL: "http://localhost:3000",
};

describe("getBetterAuthEnvironment", () => {
  it("returns a validated secret and normalized origin", () => {
    expect(
      getBetterAuthEnvironment({
        ...validEnvironment,
        BETTER_AUTH_URL: "https://example.com:8443/",
      }),
    ).toEqual({
      baseURL: "https://example.com:8443",
      secret: validEnvironment.BETTER_AUTH_SECRET,
      trustedOrigins: [],
    });
  });

  it("rejects a secret shorter than 32 characters", () => {
    expect(() =>
      getBetterAuthEnvironment({
        ...validEnvironment,
        BETTER_AUTH_SECRET: "too-short",
      }),
    ).toThrow("BETTER_AUTH_SECRET must contain at least 32 characters.");
  });

  it("derives the Preview origin from the Vercel branch URL", () => {
    expect(
      getBetterAuthEnvironment({
        BETTER_AUTH_SECRET: validEnvironment.BETTER_AUTH_SECRET,
        VERCEL_ENV: "preview",
        VERCEL_BRANCH_URL: "process-diff-mvp-git-feature.vercel.app",
        VERCEL_URL: "process-diff-mvp-unique.vercel.app",
      }).baseURL,
    ).toBe("https://process-diff-mvp-git-feature.vercel.app");
  });

  it("prefers an explicit URL in Vercel Preview", () => {
    expect(
      getBetterAuthEnvironment({
        ...validEnvironment,
        VERCEL_ENV: "preview",
        VERCEL_BRANCH_URL: "process-diff-mvp-git-feature.vercel.app",
      }).baseURL,
    ).toBe("http://localhost:3000");
  });

  it("falls back to the Vercel deployment URL when a branch URL is unavailable", () => {
    expect(
      getBetterAuthEnvironment({
        BETTER_AUTH_SECRET: validEnvironment.BETTER_AUTH_SECRET,
        VERCEL_ENV: "preview",
        VERCEL_URL: "process-diff-mvp-unique.vercel.app",
      }).baseURL,
    ).toBe("https://process-diff-mvp-unique.vercel.app");
  });

  it("requires an explicit URL outside Vercel Preview", () => {
    expect(() =>
      getBetterAuthEnvironment({
        BETTER_AUTH_SECRET: validEnvironment.BETTER_AUTH_SECRET,
        VERCEL_ENV: "production",
        VERCEL_URL: "process-diff-mvp.vercel.app",
      }),
    ).toThrow("BETTER_AUTH_URL is not configured.");
  });

  it("rejects a URL that is not an origin", () => {
    expect(() =>
      getBetterAuthEnvironment({
        ...validEnvironment,
        BETTER_AUTH_URL: "https://example.com/api/auth",
      }),
    ).toThrow("BETTER_AUTH_URL must contain origins without a path.");
  });

  it("rejects a URL with an unsupported protocol", () => {
    expect(() =>
      getBetterAuthEnvironment({
        ...validEnvironment,
        BETTER_AUTH_URL: "ftp://example.com",
      }),
    ).toThrow("BETTER_AUTH_URL must use the http or https protocol.");
  });

  it("accepts only explicit additional trusted origins", () => {
    expect(
      getBetterAuthEnvironment({
        ...validEnvironment,
        BETTER_AUTH_TRUSTED_ORIGINS:
          "http://web:3000, https://preview.example.com/",
      }).trustedOrigins,
    ).toEqual(["http://web:3000", "https://preview.example.com"]);

    expect(() =>
      getBetterAuthEnvironment({
        ...validEnvironment,
        BETTER_AUTH_TRUSTED_ORIGINS: "https://*.example.com",
      }),
    ).toThrow(
      "BETTER_AUTH_TRUSTED_ORIGINS must contain origins without a path.",
    );
  });
});
