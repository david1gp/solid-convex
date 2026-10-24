import * as a from "valibot"
import { userProfileSchema } from "#src/auth/model/UserProfile.ts"

export type UserProfileDictionary = a.InferOutput<typeof userProfileDistionarySchema>

export const userProfileDistionarySchema = a.record(a.string(), userProfileSchema)
