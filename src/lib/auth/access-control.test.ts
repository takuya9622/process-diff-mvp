import { describe, expect, it } from "vitest";

import { organizationRoles } from "@/lib/auth/access-control";

describe("organization access control", () => {
  it("ownerはworkspaceを変更・初期化できるがMVP外の組織管理はできない", () => {
    expect(
      organizationRoles.owner.authorize({
        workspace: ["read", "change", "reset"],
      }).success,
    ).toBe(true);
    expect(
      organizationRoles.owner.authorize({ organization: ["update"] }).success,
    ).toBe(false);
    expect(
      organizationRoles.owner.authorize({ member: ["create"] }).success,
    ).toBe(false);
    expect(
      organizationRoles.owner.authorize({ invitation: ["create"] }).success,
    ).toBe(false);
  });

  it("editorは変更まで、viewerは参照だけを許可する", () => {
    expect(
      organizationRoles.editor.authorize({ workspace: ["change"] }).success,
    ).toBe(true);
    expect(
      organizationRoles.editor.authorize({ workspace: ["reset"] }).success,
    ).toBe(false);
    expect(
      organizationRoles.viewer.authorize({ workspace: ["read"] }).success,
    ).toBe(true);
    expect(
      organizationRoles.viewer.authorize({ workspace: ["change"] }).success,
    ).toBe(false);
  });
});
