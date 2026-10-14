import { expect, test } from "bun:test"
import type { OidcIdTokenClaims } from "#src/auth/server/oidc/oidcIdTokenClaimsSchema.ts"
import { oidcZitadelRoleGet } from "#src/auth/server/oidc/oidcZitadelRoleGet.ts"
import { oidcZitadelRolesGet } from "#src/auth/server/oidc/oidcZitadelRolesGet.ts"

const organizationId = "380716752838852623"

test("Zitadel roles map trusted organization claims to canonical roles", () => {
  expect(
    oidcZitadelRoleGet(
      [{ user: { [organizationId]: "contentoren.example" } }, { admin: { [organizationId]: "contentoren.example" } }],
      organizationId,
    ),
  ).toBe("admin")
  expect(oidcZitadelRoleGet([{ admin: { [organizationId]: "contentoren.example" } }], organizationId)).toBe("admin")
  expect(oidcZitadelRoleGet([{ member: { [organizationId]: "contentoren.example" } }], organizationId)).toBe("member")
  expect(oidcZitadelRoleGet([{ user: { [organizationId]: "contentoren.example" } }], organizationId)).toBe("user")
  expect(oidcZitadelRoleGet([{ admin: { other: "other.example" } }], organizationId)).toBe("user")
  expect(oidcZitadelRoleGet([{ contributor: { [organizationId]: "contentoren.example" } }], organizationId)).toBe(
    "user",
  )
})

test("Zitadel roles prioritize admin > member > user for effective scalar role", () => {
  expect(
    oidcZitadelRoleGet(
      [{ user: { [organizationId]: "contentoren.example" } }, { member: { [organizationId]: "contentoren.example" } }],
      organizationId,
    ),
  ).toBe("member")
  expect(
    oidcZitadelRoleGet(
      [{ member: { [organizationId]: "contentoren.example" } }, { admin: { [organizationId]: "contentoren.example" } }],
      organizationId,
    ),
  ).toBe("admin")
})

test("oidcZitadelRolesGet extracts only verified canonical roles for target organization", () => {
  const claims: NonNullable<OidcIdTokenClaims["urn:zitadel:iam:org:project:roles"]> = [
    { user: { [organizationId]: "contentoren.example" } },
    { member: { [organizationId]: "contentoren.example" } },
    { admin: { other: "other.example" } },
    { contributor: { [organizationId]: "contentoren.example" } },
  ]
  const extracted = oidcZitadelRolesGet(claims, organizationId)
  expect(extracted).toEqual(["member", "user"])

  const allClaims: NonNullable<OidcIdTokenClaims["urn:zitadel:iam:org:project:roles"]> = [
    { user: { [organizationId]: "contentoren.example" } },
    { member: { [organizationId]: "contentoren.example" } },
    { admin: { [organizationId]: "contentoren.example" } },
  ]
  expect(oidcZitadelRolesGet(allClaims, organizationId)).toEqual(["admin", "member", "user"])
  expect(oidcZitadelRolesGet(claims, "non-existent-org")).toEqual([])
  expect(oidcZitadelRolesGet(undefined, organizationId)).toEqual([])
  expect(oidcZitadelRolesGet(claims, undefined)).toBeUndefined()
})

test("oidcZitadelRolesGet accepts native object role claims for the target organization", () => {
  const projectRoles = { admin: { [organizationId]: "contentoren.example" } }
  expect(oidcZitadelRolesGet(projectRoles, organizationId)).toEqual(["admin"])
  expect(oidcZitadelRolesGet(projectRoles, "other-organization")).toEqual([])
})

test("oidcZitadelRolesGet treats missing claims for configured organization as empty roles mapping to effective user", () => {
  const claimsWithOtherOrg: NonNullable<OidcIdTokenClaims["urn:zitadel:iam:org:project:roles"]> = [
    { admin: { other: "other.example" } },
  ]
  expect(oidcZitadelRolesGet(claimsWithOtherOrg, organizationId)).toEqual([])
  expect(oidcZitadelRoleGet(claimsWithOtherOrg, organizationId)).toBe("user")

  const emptyClaims: NonNullable<OidcIdTokenClaims["urn:zitadel:iam:org:project:roles"]> = []
  expect(oidcZitadelRolesGet(emptyClaims, organizationId)).toEqual([])
  expect(oidcZitadelRoleGet(emptyClaims, organizationId)).toBe("user")

  expect(oidcZitadelRolesGet(undefined, organizationId)).toEqual([])
  expect(oidcZitadelRoleGet(undefined, organizationId)).toBe("user")

  expect(oidcZitadelRolesGet(claimsWithOtherOrg, undefined)).toBeUndefined()
  expect(oidcZitadelRoleGet(claimsWithOtherOrg, undefined)).toBeUndefined()
  expect(oidcZitadelRolesGet(undefined, undefined)).toBeUndefined()
  expect(oidcZitadelRoleGet(undefined, undefined)).toBeUndefined()
})
