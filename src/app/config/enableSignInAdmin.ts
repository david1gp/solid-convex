import { isDevEnv } from "#src/utils/env/isDevEnv.ts"

export function enableSignInAdmin() {
  // return false
  return isDevEnv()
}
