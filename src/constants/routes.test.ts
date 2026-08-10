import { describe, expect, it } from "vitest";

import {
  createChangePath,
  createCasePath,
  createCasesPath,
  createCommunicationPath,
  createDocumentLibraryPath,
  createEntityPath,
  createOrganizationPath,
  createSignInPath,
  createWorkflowCatalogPath,
  createWorkflowStartPath,
  createWorkItemPath,
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
    expect(createDocumentLibraryPath("sample team")).toBe(
      "/organizations/sample%20team/documents",
    );
    expect(createCommunicationPath("sample team")).toBe(
      "/organizations/sample%20team/communication",
    );
    expect(createCommunicationPath("sample team", "channel/id")).toBe(
      "/organizations/sample%20team/communication?channel=channel%2Fid",
    );
    expect(createChangePath("sample team", "change/id")).toBe(
      "/organizations/sample%20team/changes/change%2Fid",
    );
    expect(createWorkflowCatalogPath("sample team")).toBe(
      "/organizations/sample%20team/workflows",
    );
    expect(createWorkflowStartPath("sample team", "workflow/id")).toBe(
      "/organizations/sample%20team/workflows/workflow%2Fid/start",
    );
    expect(createCasesPath("sample team")).toBe(
      "/organizations/sample%20team/cases",
    );
    expect(createCasePath("sample team", "case/id")).toBe(
      "/organizations/sample%20team/cases/case%2Fid",
    );
    expect(createWorkItemPath("sample team", "case/id", "work/item")).toBe(
      "/organizations/sample%20team/cases/case%2Fid/work-items/work%2Fitem",
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
