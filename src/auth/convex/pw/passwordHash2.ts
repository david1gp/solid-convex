import { createError, createResult, type PromiseResult } from "#result"
import { envAuthSecretResult } from "#src/app/env/private/envAuthSecretResult.ts"
import { passwordHashCreate } from "#src/auth/convex/pw/passwordHashCreate.ts"

export async function passwordHash2(password: string): PromiseResult<string> {
  const op = "passwordHash2"
  const saltResult = envAuthSecretResult()
  if (!saltResult.success) return saltResult
  const salt = saltResult.data
  if (!salt) return createError(op, "env.AUTH_SECRET not defined")
  return createResult(await passwordHashCreate(password, salt))
}
