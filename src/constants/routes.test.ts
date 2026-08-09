import { describe, expect, it } from "vitest";

import {
  createChangePath,
  createEntityPath,
  createOrganizationPath,
  createSignInPath,
  sanitizeReturnTo,
} from "@/constants/routes";

describe("workspace routes", () => {
  it("組織、業務要素、変更結果をnested routeで表現する", () => {
    expect(createOrganizationPath("sample team")).toBe(
      "/organizations/sample%20team",
    );
    expect(createEntityPath("sample team", "entity/id")).toBe(
      "/organizations/sample%20team/entities/entity%2Fid",
    );
    expect(createChangePath("sample team", "change/id")).toBe(
      "/organizations/sample%20team/changes/change%2Fid",
    );
  });

  it("ログイン後の戻り先はアプリ内の絶対パスだけを受け入れる", () => {
    expect(createSignInPath("/organizations/sample")).toBe(
      "/sign-in?returnTo=%2Forganizations%2Fsample",
    );
    expect(sanitizeReturnTo("/organizations/sample")).toBe(
      "/organizations/sample",
    );
    expect(sanitizeReturnTo("//example.com")).toBe("/");
    expect(sanitizeReturnTo("https://example.com")).toBe("/");
  });
});
