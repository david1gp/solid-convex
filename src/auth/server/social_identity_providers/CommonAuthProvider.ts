import * as a from "valibot"
import { loginProvider, socialLoginProvider } from "#src/auth/model_field/socialLoginProvider.ts"
import { userRoleSchema } from "#src/auth/model_field/userRole.ts"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { emailSchema } from "#src/utils/valibot/emailSchema.ts"

const commonAuthProviderDataSchema = {
  providerId: a.string(),
  givenName: a.string(),
  familyName: a.string(),
  image: a.string(),
  username: a.string(),
  email: a.optional(emailSchema),
} as const

const legacyAuthProviderSchema = a.object({
  provider: a.enum(socialLoginProvider),
  ...commonAuthProviderDataSchema,
})

const adminAuthProviderSchema = a.object({
  provider: a.literal(loginProvider.admin),
  ...commonAuthProviderDataSchema,
})

const oidcAuthProviderSchema = a.object({
  provider: a.literal(loginProvider.oidc),
  issuer: a.pipe(a.string(), a.minLength(1)),
  ...commonAuthProviderDataSchema,
  role: a.optional(userRoleSchema),
  roles: a.optional(a.array(userRoleSchema)),
})

const commonAuthProviderArgsFields = {
  provider: a.enum(loginProvider),
  issuer: a.optional(a.string()),
  role: a.optional(userRoleSchema),
  roles: a.optional(a.array(userRoleSchema)),
  ...commonAuthProviderDataSchema,
} as const

export const commonAuthProviderSchema = a.union([
  legacyAuthProviderSchema,
  adminAuthProviderSchema,
  oidcAuthProviderSchema,
])

export type CommonAuthProvider = a.InferOutput<typeof commonAuthProviderSchema>

export const commonAuthProviderValidator = valibotToConvex(commonAuthProviderArgsFields)

export function getUserNameFromCommonAuthProvider(
  user: Pick<CommonAuthProvider, "givenName" | "familyName" | "username" | "email">,
  ifMissing: string,
): string {
  const givenName = user.givenName.trim()
  const familyName = user.familyName.trim()
  const username = user.username.trim()
  const email = user.email?.trim()
  if (givenName && familyName) return `${givenName} ${familyName}`
  if (givenName) return givenName
  if (familyName) return familyName
  if (username) return username
  if (email) return email
  return ifMissing
}
