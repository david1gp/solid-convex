import type { PromiseResult } from "#result"
import { envAuthSecretResult } from "#src/app/env/private/envAuthSecretResult.ts"
import type { DecodedToken } from "#src/auth/model/DecodedToken.ts"
import { tokenVerify } from "#src/auth/server/jwt_token/tokenVerify.ts"

export async function tokenVerifyResult(token: string): PromiseResult<DecodedToken> {
  // env variable
  const secretSalt = envAuthSecretResult()
  if (!secretSalt.success) return secretSalt
  const salt = secretSalt.data
  // token
  return tokenVerify(token, salt)
}
