import * as a from "valibot"

const oidcZitadelProjectRolesSchema = a.array(a.record(a.string(), a.record(a.string(), a.string())))

const oidcIdTokenClaimsSchema = a.object({
  iss: a.pipe(a.string(), a.minLength(1)),
  sub: a.pipe(a.string(), a.minLength(1)),
  aud: a.union([a.pipe(a.string(), a.minLength(1)), a.pipe(a.array(a.string()), a.minLength(1))]),
  exp: a.number(),
  iat: a.number(),
  nonce: a.pipe(a.string(), a.minLength(1)),
  azp: a.optional(a.pipe(a.string(), a.minLength(1))),
  auth_time: a.optional(a.number()),
  acr: a.optional(a.string()),
  amr: a.optional(a.array(a.string())),
  name: a.optional(a.string()),
  given_name: a.optional(a.string()),
  family_name: a.optional(a.string()),
  middle_name: a.optional(a.string()),
  nickname: a.optional(a.string()),
  preferred_username: a.optional(a.string()),
  profile: a.optional(a.string()),
  picture: a.optional(a.string()),
  website: a.optional(a.string()),
  email: a.optional(a.string()),
  email_verified: a.optional(a.boolean()),
  gender: a.optional(a.string()),
  birthdate: a.optional(a.string()),
  zoneinfo: a.optional(a.string()),
  locale: a.optional(a.string()),
  address: a.optional(a.record(a.string(), a.unknown())),
  updated_at: a.optional(a.number()),
  at_hash: a.optional(a.string()),
  c_hash: a.optional(a.string()),
  s_hash: a.optional(a.string()),
  jti: a.optional(a.string()),
  "urn:zitadel:iam:org:project:roles": a.optional(oidcZitadelProjectRolesSchema),
  "urn:zitadel:iam:user:resourceowner:id": a.optional(a.string()),
})

export type OidcIdTokenClaims = a.InferOutput<typeof oidcIdTokenClaimsSchema>

export { oidcIdTokenClaimsSchema }
