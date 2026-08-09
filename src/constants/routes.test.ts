import { describe, expect, it } from "vitest";

import {
  createChangePath,
  createEntityPath,
  createOrganizationPath,
  CURRENT_DEMO_ORGANIZATION_SLUG,
  isCurrentDemoOrganization,
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

  it("認証・組織実装前は共有デモslugだけを受け入れる", () => {
    expect(isCurrentDemoOrganization(CURRENT_DEMO_ORGANIZATION_SLUG)).toBe(
      true,
    );
    expect(isCurrentDemoOrganization("another-organization")).toBe(false);
  });
});
