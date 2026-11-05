import * as v from "valibot"
import { e2eSsoStepIds } from "./e2eSsoStepIds.ts"

export const e2eSsoWorkflowStateSchema = v.pipe(
  v.strictObject({
    backendUrl: v.pipe(v.string(), v.url()),
    accountKey: v.pipe(v.string(), v.regex(/^[a-f0-9]{64}$/u)),
    completedStepIds: v.array(v.picklist(e2eSsoStepIds)),
    // Written before browser mutations. Baseline IDs are observations, NOT owned resources.
    attempts: v.array(
      v.strictObject({
        attemptId: v.string(),
        startedAt: v.pipe(v.number(), v.finite(), v.minValue(1)),
        baselineSessionIds: v.array(v.string()),
        browser: v.optional(
          v.strictObject({
            userId: v.pipe(v.string(), v.minLength(1)),
            tokenDigest: v.pipe(v.string(), v.regex(/^[a-f0-9]{64}$/u)),
          }),
        ),
        sessionResourceId: v.optional(v.string()),
      }),
    ),
  }),
  v.check(
    (state) => state.completedStepIds.every((id, index) => id === e2eSsoStepIds[index]),
    "SSO completed steps must be an ordered prefix",
  ),
)

export type E2eSsoWorkflowState = v.InferOutput<typeof e2eSsoWorkflowStateSchema>
