import { expect, test } from "bun:test"
import { jwtVerify, SignJWT } from "jose"
import { jwtDecode } from "jwt-decode"
import * as a from "valibot"
import { decodedTokenSchema } from "#src/auth/model/DecodedToken.ts"

async function createToken(uid: string, oid: string | null, secret: string, expiresInDays: number): Promise<string> {
  const encodedSecret = new TextEncoder().encode(secret)
  const alg = "HS256"
  const jwt = await new SignJWT({
    org: oid,
  })
    .setProtectedHeader({ alg })
    .setSubject(uid)
    .setIssuedAt()
    .setExpirationTime(`${expiresInDays}d`)
    .sign(encodedSecret)
  return jwt
}

const secret = "super-secret-password"

test("createToken (server)", async () => {
  // require("dotenv").config({ path: ".env.development" })
  const uid = "abc"
  const created = await createToken(uid, null, secret, 3)
  expect(created).toBeString()

  const encodedSecret = new TextEncoder().encode(secret)
  const verified = await jwtVerify(created, encodedSecret)
  const parsed = a.parse(decodedTokenSchema, verified.payload)
  expect(parsed.sub).toEqual(uid)
})

test("createToken (server) with oid", async () => {
  // require("dotenv").config({ path: ".env.development" })
  const uid = "abc"
  const oid = "o123"
  const created = await createToken(uid, oid, secret, 3)
  expect(created).toBeString()

  const encodedSecret = new TextEncoder().encode(secret)
  const verified = await jwtVerify(created, encodedSecret)
  const parsed = a.parse(decodedTokenSchema, verified.payload)
  expect(parsed.sub).toEqual(uid)
  expect(parsed.org).toEqual(oid)
})

test("decodeToken (client): jwt_decode - fails", async () => {
  expect(() => {
    jwtDecode(secret)
  }).toThrow()
})

test("verifyToken (server)", async () => {
  // require("dotenv").config({ path: ".env.development" })
  const uid = "abc"
  const created = await createToken(uid, null, secret, 3)

  const encodedSecret = new TextEncoder().encode(secret)
  const verified = await jwtVerify(created, encodedSecret)
  // console.log(verified)
  expect(verified.payload.sub).toEqual(uid)
})

test("verifyToken (server) - wrong secret", async () => {
  // require("dotenv").config({ path: ".env.development" })
  const uid = "abc"
  const created = await createToken(uid, null, secret, 3)
  const encodedSecret = new TextEncoder().encode(`${secret}-wrong-secret-example`)
  expect(async () => {
    await jwtVerify(created, encodedSecret)
  }).toThrow()
})
