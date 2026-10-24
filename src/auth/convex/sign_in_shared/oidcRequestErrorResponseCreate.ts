import { createResultError } from "#result"
import { apiError } from "#src/api/apiError.ts"

export function oidcRequestErrorResponseCreate(
  operationName: string,
  errorMessage: string,
  code: string,
  headers?: Headers,
): Response {
  const error = createResultError(operationName, errorMessage)
  console.warn(error)
  return apiError.fromResultError(code, error, undefined, headers)
}
