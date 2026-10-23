import { createError, createResult, type PromiseResult } from "#result"
import { envAuthSecretResult } from "#src/app/env/private/envAuthSecretResult.ts"
import { passwordHashCreate } from "#src/auth/convex/pw/passwordHashCreate.ts"

export async function verifyHashedPassword2(password: string, hash: string): PromiseResult<boolean> {
  const op = "verifyHashedPassword2"
  const saltResult = envAuthSecretResult()
  if (!saltResult.success) return saltResult
  const salt = saltResult.data
  if (!salt) return createError(op, "AUTH_SECRET not defined")
  return createResult(await verifyHashedPassword(password, hash, salt))
}

export async function verifyHashedPassword(password: string, hash: string, salt: string): Promise<boolean> {
  const computedHash = await passwordHashCreate(password, salt)
  return computedHash === hash
}
