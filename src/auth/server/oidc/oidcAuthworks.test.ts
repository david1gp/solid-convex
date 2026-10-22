import { expect, test } from "bun:test"
import { oidcAuthworksAdmissionCheck } from "#src/auth/server/oidc/oidcAuthworksAdmissionCheck.ts"
import { oidcAuthworksConfigGet } from "#src/auth/server/oidc/oidcAuthworksConfigGet.ts"

const orgId = "0199c2a1-7b3e-7f01-9a2b-3c4d5e6f7081"

function claimsWithResourceOwner(value: string | undefined) {
  return {
    iss: "https://authworks.contentoren.de",
    sub: "subject-1",
    aud: "authworks-client-id",
    exp: Math.floor(Date.now() / 1000) + 300,
    iat: Math.floor(Date.now() / 1000),
    nonce: "nonce-value",
    ...(value === undefined ? {} : { "urn:zitadel:iam:user:resourceowner:id": value }),
  }
}

test("oidcAuthworksConfigGet reads AUTHWORKS_* settings with issuer default and scope defaults", async () => {
  await withEnvironment(
    {
      AUTHWORKS_ISSUER: undefined,
      AUTHWORKS_CLIENT_ID: "authworks-client-id",
      AUTHWORKS_CLIENT_SECRET: undefined,
      AUTHWORKS_SCOPES: undefined,
      AUTHWORKS_ORGANIZATION_ID: undefined,
    },
    async () => {
      const result = oidcAuthworksConfigGet()
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({
          issuer: "https://authworks.contentoren.de",
          clientId: "authworks-client-id",
          clientSecret: undefined,
          scopes: ["openid", "profile", "email"],
        })
      }
    },
  )

  await withEnvironment(
    {
      AUTHWORKS_ISSUER: "https://authworks.contentoren.de",
      AUTHWORKS_CLIENT_ID: "authworks-client-id",
      AUTHWORKS_CLIENT_SECRET: "authworks-client-secret",
      AUTHWORKS_SCOPES: "openid profile",
      AUTHWORKS_ORGANIZATION_ID: orgId,
    },
    async () => {
      const result = oidcAuthworksConfigGet()
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.clientSecret).toBe("authworks-client-secret")
        expect(result.data.scopes).toEqual(["openid", "profile"])
        expect(result.data.authworksOrgId).toBe(orgId)
      }
    },
  )
})

test("oidcAuthworksConfigGet rejects invalid AUTHWORKS_* settings", async () => {
  await withEnvironment(
    {
      AUTHWORKS_ISSUER: "https://authworks.contentoren.de",
      AUTHWORKS_CLIENT_ID: "",
      AUTHWORKS_CLIENT_SECRET: undefined,
      AUTHWORKS_SCOPES: undefined,
      AUTHWORKS_ORGANIZATION_ID: undefined,
    },
    async () => {
      expect(oidcAuthworksConfigGet().success).toBe(false)
    },
  )

  await withEnvironment(
    {
      AUTHWORKS_ISSUER: "http://authworks.contentoren.de",
      AUTHWORKS_CLIENT_ID: "authworks-client-id",
      AUTHWORKS_CLIENT_SECRET: undefined,
      AUTHWORKS_SCOPES: undefined,
      AUTHWORKS_ORGANIZATION_ID: undefined,
    },
    async () => {
      expect(oidcAuthworksConfigGet().success).toBe(false)
    },
  )

  await withEnvironment(
    {
      AUTHWORKS_ISSUER: "https://authworks.contentoren.de",
      AUTHWORKS_CLIENT_ID: "authworks-client-id",
      AUTHWORKS_CLIENT_SECRET: undefined,
      AUTHWORKS_SCOPES: "profile email",
      AUTHWORKS_ORGANIZATION_ID: undefined,
    },
    async () => {
      expect(oidcAuthworksConfigGet().success).toBe(false)
    },
  )

  await withEnvironment(
    {
      AUTHWORKS_ISSUER: "https://authworks.contentoren.de",
      AUTHWORKS_CLIENT_ID: "authworks-client-id",
      AUTHWORKS_CLIENT_SECRET: undefined,
      AUTHWORKS_SCOPES: undefined,
      AUTHWORKS_ORGANIZATION_ID: "not-a-uuid",
    },
    async () => {
      expect(oidcAuthworksConfigGet().success).toBe(false)
    },
  )
})

test("oidcAuthworksAdmissionCheck admits only matching organization members when configured", () => {
  expect(oidcAuthworksAdmissionCheck(claimsWithResourceOwner(undefined), undefined).success).toBe(true)
  expect(oidcAuthworksAdmissionCheck(claimsWithResourceOwner(undefined), "").success).toBe(true)
  expect(oidcAuthworksAdmissionCheck(claimsWithResourceOwner(orgId), orgId).success).toBe(true)
  expect(oidcAuthworksAdmissionCheck(claimsWithResourceOwner(undefined), orgId).success).toBe(false)
  expect(
    oidcAuthworksAdmissionCheck(claimsWithResourceOwner("0199c2a1-7b3e-7f01-9a2b-3c4d5e6f7082"), orgId).success,
  ).toBe(false)
})

async function withEnvironment<T>(values: Record<string, string | undefined>, callback: () => Promise<T>): Promise<T> {
  const previousValues = new Map<string, string | undefined>()
  for (const [name, value] of Object.entries(values)) {
    previousValues.set(name, process.env[name])
    if (value === undefined) delete process.env[name]
    else process.env[name] = value
  }
  try {
    return await callback()
  } finally {
    for (const [name, value] of previousValues) {
      if (value === undefined) delete process.env[name]
      else process.env[name] = value
    }
  }
}
