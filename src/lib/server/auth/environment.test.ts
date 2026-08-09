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

  it("rejects a URL that is not an origin", () => {
    expect(() =>
      getBetterAuthEnvironment({
        ...validEnvironment,
        BETTER_AUTH_URL: "https://example.com/api/auth",
      }),
    ).toThrow("BETTER_AUTH_URL must be an origin without a path.");
  });

  it("rejects a URL with an unsupported protocol", () => {
    expect(() =>
      getBetterAuthEnvironment({
        ...validEnvironment,
        BETTER_AUTH_URL: "ftp://example.com",
      }),
    ).toThrow("BETTER_AUTH_URL must use the http or https protocol.");
  });
});
