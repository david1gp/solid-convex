import type { HasCreatedAtUpdatedAt } from "#src/utils/data/HasCreatedAtUpdatedAt.ts"

export type OrgDataModel = {
  // id
  orgHandle: string
  // data
  name?: string
  description?: string
  url?: string
  image?: string
  deleting?: boolean
  deletionJobId?: string
}

export interface OrgModel extends OrgDataModel, HasCreatedAtUpdatedAt {}

export function orgModelCreateEmpty(): OrgModel {
  const now = new Date()
  const iso = now.toISOString()
  return {
    ...orgDataModelCreateEmpty(),
    createdAt: iso,
    updatedAt: iso,
  }
}

export function orgDataModelCreateEmpty(): OrgDataModel {
  return { name: "", orgHandle: "", description: "", url: "", image: "" }
}
