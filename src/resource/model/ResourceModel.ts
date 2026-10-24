import * as a from "valibot"
import { resourceSchema } from "#src/resource/model/resourceSchema.ts"

export type ResourceModel = a.InferOutput<typeof resourceSchema>
