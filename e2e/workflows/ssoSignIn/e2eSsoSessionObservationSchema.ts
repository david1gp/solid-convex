import * as v from "valibot"
import { e2eSsoSessionProofSchema } from "./e2eSsoSessionProofSchema.ts"

/** A table observation may predate registration; it is not yet ownership proof. */
export const e2eSsoSessionObservationSchema = v.object({
  ...v.omit(e2eSsoSessionProofSchema, ["e2eRunId", "ownedAt"]).entries,
  ...v.partial(v.pick(e2eSsoSessionProofSchema, ["e2eRunId", "ownedAt"])).entries,
})

export type E2eSsoSessionObservation = v.InferOutput<typeof e2eSsoSessionObservationSchema>
