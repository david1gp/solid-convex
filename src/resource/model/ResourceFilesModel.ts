import * as a from "valibot"
import { fileSchema } from "#src/file/model/fileSchema.ts"
import { resourceSchema } from "#src/resource/model/resourceSchema.ts"

export const resourceFilesSchema = a.object({
  resource: resourceSchema,
  files: a.array(fileSchema),
})

export type ResourceFilesModel = a.InferOutput<typeof resourceFilesSchema>
