import { v } from "convex/values"
import * as a from "valibot"
import { vIdUser } from "#src/auth/convex/vIdUser.ts"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { createTokenValidator } from "#src/utils/convex_backend/createTokenValidator.ts"

export const userDeleteFields = valibotToConvex({
  email: a.optional(a.string()),
})

export const userDeleteValidatorInternal = v.object({
  ...userDeleteFields,
  userId: vIdUser,
})

export type UserDeleteValidatorInternalType = typeof userDeleteValidatorInternal.type

export const userDeleteFieldsPublic = userDeleteFields

export const userDeleteValidatorPublic = createTokenValidator(userDeleteFieldsPublic)

export type UserDeleteValidatorPublicType = typeof userDeleteValidatorPublic.type
