import { jwtVerify } from "jose"
import * as a from "valibot"
import { createResult, createResultError, type PromiseResult } from "#result"
import { type DecodedToken, decodedTokenSchema } from "#src/auth/model/DecodedToken.ts"

export async function tokenVerify(token: string, secret: string | undefined): PromiseResult<DecodedToken> {
  const op = "tokenVerify"
  if (!secret) return createResultError(op, "missing secret")
  try {
    const encodedSecret = new TextEncoder().encode(secret)
    const verified = await jwtVerify(token, encodedSecret)
    const decoded = a.parse(decodedTokenSchema, verified.payload)
    return createResult(decoded)
  } catch (e: any) {
    return createResultError(op, e.message)
  }
}
