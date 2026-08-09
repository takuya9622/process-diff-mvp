import { createAccessControl } from "better-auth/plugins/access";
import {
  defaultStatements,
  memberAc,
} from "better-auth/plugins/organization/access";

const statement = {
  ...defaultStatements,
  workspace: ["read", "change", "reset"],
} as const;

export const organizationAccessControl = createAccessControl(statement);

export const organizationRoles = {
  owner: organizationAccessControl.newRole({
    ...memberAc.statements,
    workspace: ["read", "change", "reset"],
  }),
  editor: organizationAccessControl.newRole({
    ...memberAc.statements,
    workspace: ["read", "change"],
  }),
  viewer: organizationAccessControl.newRole({
    ...memberAc.statements,
    workspace: ["read"],
  }),
} as const;

export type OrganizationRole = keyof typeof organizationRoles;

export const ORGANIZATION_ROLE_LABELS: Record<OrganizationRole, string> = {
  owner: "オーナー",
  editor: "編集者",
  viewer: "閲覧者",
};
