import { defineTable } from "convex/server"
import * as a from "valibot"
import { vIdUser } from "#src/auth/convex/vIdUser.ts"
import { apiKeyNameSchema } from "#src/auth/model/apiKeyNameSchema.ts"
import { userDataSchemaFields } from "#src/auth/model/userDataSchemaFields.ts"
import { loginMethodSchema } from "#src/auth/model_field/loginMethod.ts"
import { otpPurposeSchema } from "#src/auth/model_field/otpPurpose.ts"
import { otpSchema } from "#src/auth/model_field/otpSchema.ts"
import { loginProviderSchema } from "#src/auth/model_field/socialLoginProvider.ts"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { fieldsSchemaCreatedAtUpdatedAt } from "#src/utils/data/fieldsSchemaCreatedAtUpdatedAt.ts"
import { fieldsSchemaCreatedAtUpdatedAtDeletedAt } from "#src/utils/data/fieldsSchemaCreatedAtUpdatedAtDeletedAt.ts"
import { emailSchema } from "#src/utils/valibot/emailSchema.ts"
import { tokenSchema } from "#src/utils/valibot/tokenSchema.ts"
import { dateTimeSchema } from "#utils/valibot/dateTimeSchema.js"

const authUserDataSchemaFields = {
  ...userDataSchemaFields,
  hashedPassword: a.optional(a.string()),
} as const

const authAccountDataSchemaFields = {
  provider: loginProviderSchema,
  issuer: a.optional(a.string()),
  providerAccountId: a.string(),
} as const

const authSessionDataSchemaFields = {
  loginMethod: loginMethodSchema,
  token: tokenSchema,
  expiresAt: dateTimeSchema,
  e2eRunId: a.optional(a.string()),
  e2eOwnedAt: a.optional(a.number()),
} as const

const authRateLimitDataSchemaFields = {
  identifier: a.string(),
  attemptsLeft: a.number(),
  lastAttemptedAt: a.number(),
} as const

const authUserEmailRegistrationDataSchemaFields = {
  email: emailSchema,
  code: otpSchema,
  name: userDataSchemaFields.name,
  hashedPassword: a.optional(a.string()),
  createdAt: dateTimeSchema,
  consumedAt: a.optional(dateTimeSchema),
} as const

const authEmailLoginCodeDataSchemaFields = {
  code: otpSchema,
  email: emailSchema,
  createdAt: dateTimeSchema,
  consumedAt: a.optional(dateTimeSchema),
} as const

const authOtpDataSchemaFields = {
  name: a.string(),
  email: emailSchema,
  code: otpSchema,
  purpose: otpPurposeSchema,
  createdAt: dateTimeSchema,
  consumedAt: a.optional(dateTimeSchema),
} as const

const authApiKeyDataSchemaFields = {
  name: apiKeyNameSchema,
  digest: a.string(),
  previewFirst3: a.string(),
  previewLast3: a.string(),
  createdAt: dateTimeSchema,
  expiresAt: a.optional(dateTimeSchema),
  revokedAt: a.optional(dateTimeSchema),
  expiredAt: a.optional(dateTimeSchema),
} as const

export const authTables = {
  users: defineTable({
    ...valibotToConvex(authUserDataSchemaFields),
    ...valibotToConvex(fieldsSchemaCreatedAtUpdatedAtDeletedAt),
  })
    //
    .index("email", ["email"])
    .index("username", ["username"]),

  authAccounts: defineTable({
    userId: vIdUser,
    ...valibotToConvex(authAccountDataSchemaFields),
    ...valibotToConvex(fieldsSchemaCreatedAtUpdatedAt),
  })
    //
    .index("userIdAndProvider", ["userId", "provider"])
    .index("providerAndAccountId", ["provider", "providerAccountId"])
    .index("providerIssuerAndAccountId", ["provider", "issuer", "providerAccountId"]),

  authSessions: defineTable({
    userId: vIdUser,
    ...valibotToConvex(authSessionDataSchemaFields),
    ...valibotToConvex(fieldsSchemaCreatedAtUpdatedAtDeletedAt),
  })
    //
    .index("userId", ["userId"])
    .index("token", ["token"])
    .index("userIdAndE2eOwnedAt", ["userId", "e2eOwnedAt"])
    .index("userIdAndE2eRun", ["userId", "e2eRunId", "e2eOwnedAt"]),

  authRateLimits: defineTable({
    ...valibotToConvex(authRateLimitDataSchemaFields),
  })
    //
    .index("identifier", ["identifier"]),

  authUserEmailRegistrations: defineTable({
    ...valibotToConvex(authUserEmailRegistrationDataSchemaFields),
  })
    //
    .index("emailCode", ["email", "code"])
    .index("createdAt", ["createdAt"]),

  authEmailLoginCodes: defineTable({
    userId: vIdUser,
    ...valibotToConvex(authEmailLoginCodeDataSchemaFields),
  })
    //
    .index("emailCode", ["email", "code"])
    .index("userId", ["userId"])
    .index("createdAt", ["createdAt"]),

  authOtps: defineTable({
    userId: vIdUser,
    ...valibotToConvex(authOtpDataSchemaFields),
  })
    //
    .index("emailCode", ["email", "code"])
    .index("userId", ["userId"])
    .index("emailCodePurposeConsumedAt", ["email", "code", "purpose", "consumedAt"]),

  authApiKeys: defineTable({
    userId: vIdUser,
    ...valibotToConvex(authApiKeyDataSchemaFields),
  })
    //
    .index("userId", ["userId"])
    .index("digest", ["digest"]),
} as const
