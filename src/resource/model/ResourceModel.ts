import type { ResourceDataModel } from "#src/resource/model/resourceSchema.ts"
import type { HasCreatedAtUpdatedAt } from "#src/utils/data/HasCreatedAtUpdatedAt.ts"

export interface ResourceModel extends ResourceDataModel, HasCreatedAtUpdatedAt {
  deletedAt?: string
}
