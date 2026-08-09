import type { BusinessEntityType } from "@/constants/business-entity";

export type BusinessEntity = {
  id: string;
  type: BusinessEntityType;
  typeLabel: string;
  name: string;
  description: string | null;
  content: string;
  currentVersionId: string;
  currentVersionNumber: number;
  updatedAt: string;
};
