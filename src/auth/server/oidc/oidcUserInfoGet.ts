import * as a from "valibot"
import { createResult, type PromiseResult } from "#result"
import type { OidcDiscovery } from "#src/auth/server/oidc/oidcDiscoverySchema.ts"

const oidcUserInfoSchema = a.looseObject({
  sub: a.pipe(a.string(), a.minLength(1)),
  name: a.optional(a.string()),
  picture: a.optional(a.string()),
})

type OidcUserInfoProfile = {
  name?: string
  picture?: string
  claims?: Record<string, unknown>
}

export async function oidcUserInfoGet(input: {
  discovery: OidcDiscovery
  accessToken?: string
  subject: string
  needsName: boolean
  needsPicture: boolean
  needsClaims?: boolean
}): PromiseResult<OidcUserInfoProfile | undefined> {
  if (
    (!input.needsName && !input.needsPicture && !input.needsClaims) ||
    !input.accessToken ||
    !input.discovery.userinfo_endpoint
  ) {
    return createResult(undefined)
  }

  let response: Response
  let json: unknown
  try {
    response = await fetch(input.discovery.userinfo_endpoint, {
      headers: { Accept: "application/json", Authorization: `Bearer ${input.accessToken}` },
    })
    if (!response.ok) return createResult(undefined)
    json = await response.json()
  } catch {
    return createResult(undefined)
  }

  const parsed = a.safeParse(oidcUserInfoSchema, json)
  if (!parsed.success || parsed.output.sub !== input.subject) return createResult(undefined)
  return createResult({
    claims: parsed.output as Record<string, unknown>,
    ...(input.needsName && parsed.output.name?.trim() ? { name: parsed.output.name } : {}),
    ...(input.needsPicture && parsed.output.picture?.trim() ? { picture: parsed.output.picture } : {}),
  })
}
