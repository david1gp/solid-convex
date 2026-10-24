import * as a from "valibot"
import type { IdUser } from "#src/auth/convex/IdUser.ts"
import { type FileDataModel, fileSchema } from "#src/file/model/fileSchema.ts"

export type FileModel = a.InferOutput<typeof fileSchema>

export interface FileDataModelWithUserMetadata extends FileDataModel {
  userId: IdUser
  username?: string
}
