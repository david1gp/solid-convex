import * as a from "valibot"
import { orgDataSchema, orgSchema } from "#src/org/org_model/orgSchema.ts"

export type OrgDataModel = a.InferOutput<typeof orgDataSchema>

export type OrgModel = a.InferOutput<typeof orgSchema>

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
