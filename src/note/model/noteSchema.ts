import * as a from "valibot"
import type { Id } from "#convex/_generated/dataModel.js"
import { hierarchyDeleteMarkerSchemaFields } from "#src/hierarchy_delete/model/hierarchyDeleteMarkerSchemaFields.ts"
import { noteDataSchema } from "#src/note/model/noteDataSchema.ts"
import { fieldsSchemaCreatedAtUpdatedAt } from "#src/utils/data/fieldsSchemaCreatedAtUpdatedAt.ts"

export const noteSchema = a.object({
  ...noteDataSchema.entries,
  ...fieldsSchemaCreatedAtUpdatedAt,
  ...hierarchyDeleteMarkerSchemaFields,
  noteId: a.custom<Id<"notes">>((input) => typeof input === "string" && input.length > 0),
  projectId: a.custom<Id<"projects">>((input) => typeof input === "string" && input.length > 0),
  teamId: a.custom<Id<"teams">>((input) => typeof input === "string" && input.length > 0),
  orgId: a.custom<Id<"orgs">>((input) => typeof input === "string" && input.length > 0),
  title: a.string(),
})

export type Note = a.InferOutput<typeof noteSchema>
