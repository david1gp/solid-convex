import type { IdUser } from "#src/auth/convex/IdUser.ts"
import type { FileDataModel } from "#src/file/model/fileSchema.ts"
import type { HasCreatedAtUpdatedAt } from "#src/utils/data/HasCreatedAtUpdatedAt.ts"

export interface FileModel extends FileDataModel, HasCreatedAtUpdatedAt {
  deletedAt?: string
}

export interface FileDataModelWithUserMetadata extends FileDataModel {
  userId: IdUser
  username?: string
}
