export type ApiErrorStatus = 400 | 401 | 403 | 404 | 409 | 429 | 500 | 503

export type ApiErrorDetails = Record<string, unknown>

export type ApiErrorBody = {
  error: {
    code: string
    message: string
    op: string
    status: ApiErrorStatus
    requestId: string
    retryable: boolean
    details?: ApiErrorDetails
  }
}

export type ApiErrorCatalogEntry = {
  code: string
  httpStatus: ApiErrorStatus
  retryable: boolean
}

const platformInternalEntry: ApiErrorCatalogEntry = {
  code: "platform.internal",
  httpStatus: 500,
  retryable: true,
}

/**
 * Per-feature error catalog. `code` is `{feature}.{slug}`; the entry owns the
 * HTTP status and retryability, so callers (and messages) never pick them.
 * `httpStatus` is restricted to 400|401|403|404|409|429|500|503.
 */
export const apiErrorCatalog: Record<string, ApiErrorCatalogEntry> = {
  "platform.internal": platformInternalEntry,
  "auth.method-not-allowed": { code: "auth.method-not-allowed", httpStatus: 400, retryable: false },
  "auth.bad-request": { code: "auth.bad-request", httpStatus: 400, retryable: false },
  "auth.unauthorized": { code: "auth.unauthorized", httpStatus: 401, retryable: false },
  "auth.forbidden": { code: "auth.forbidden", httpStatus: 403, retryable: false },
  "auth.not-found": { code: "auth.not-found", httpStatus: 404, retryable: false },
  "auth.conflict": { code: "auth.conflict", httpStatus: 409, retryable: false },
  "auth.internal": { code: "auth.internal", httpStatus: 500, retryable: true },
  "resource.bad-request": { code: "resource.bad-request", httpStatus: 400, retryable: false },
  "resource.forbidden": { code: "resource.forbidden", httpStatus: 403, retryable: false },
  "resource.not-found": { code: "resource.not-found", httpStatus: 404, retryable: false },
  "r2.bad-request": { code: "r2.bad-request", httpStatus: 400, retryable: false },
  "r2.unauthorized": { code: "r2.unauthorized", httpStatus: 401, retryable: false },
  "r2.not-found": { code: "r2.not-found", httpStatus: 404, retryable: false },
  "r2.internal": { code: "r2.internal", httpStatus: 500, retryable: true },
  "api-keys.bad-request": { code: "api-keys.bad-request", httpStatus: 400, retryable: false },
  "api-keys.unauthorized": { code: "api-keys.unauthorized", httpStatus: 401, retryable: false },
  "api-keys.not-found": { code: "api-keys.not-found", httpStatus: 404, retryable: false },
  "api-keys.internal": { code: "api-keys.internal", httpStatus: 500, retryable: true },
  "api-org-team.bad-request": { code: "api-org-team.bad-request", httpStatus: 400, retryable: false },
  "api-org-team.unauthorized": { code: "api-org-team.unauthorized", httpStatus: 401, retryable: false },
  "api-org-team.not-found": { code: "api-org-team.not-found", httpStatus: 404, retryable: false },
  "api-org-team.internal": { code: "api-org-team.internal", httpStatus: 500, retryable: true },
  "api-project-note-resource.bad-request": {
    code: "api-project-note-resource.bad-request",
    httpStatus: 400,
    retryable: false,
  },
  "api-project-note-resource.unauthorized": {
    code: "api-project-note-resource.unauthorized",
    httpStatus: 401,
    retryable: false,
  },
  "api-project-note-resource.not-found": {
    code: "api-project-note-resource.not-found",
    httpStatus: 404,
    retryable: false,
  },
  "api-project-note-resource.internal": {
    code: "api-project-note-resource.internal",
    httpStatus: 500,
    retryable: true,
  },
}

function entryFor(code: string): ApiErrorCatalogEntry {
  return apiErrorCatalog[code] ?? platformInternalEntry
}

function response(
  code: string,
  op: string,
  message: string,
  details?: ApiErrorDetails,
  headers?: HeadersInit,
): Response {
  const entry = entryFor(code)
  const body: ApiErrorBody = {
    error: {
      code: entry.code,
      message,
      op,
      status: entry.httpStatus,
      requestId: crypto.randomUUID(),
      retryable: entry.retryable,
      ...(details === undefined ? {} : { details }),
    },
  }
  return Response.json(body, { status: entry.httpStatus, ...(headers === undefined ? {} : { headers }) })
}

function fromResultError(
  code: string,
  error: { op: string; errorMessage: string },
  details?: ApiErrorDetails,
  headers?: HeadersInit,
): Response {
  return response(code, error.op, error.errorMessage, details, headers)
}

/**
 * Unified HTTP error envelope shared by the api route modules.
 * Every error body is `{ error: { code, message, op, status, requestId, retryable, details? } }`
 * with `code = {feature}.{slug}` resolved through the per-feature catalog above.
 * Unknown codes map to `platform.internal` / 500.
 */
export const apiError = {
  response,
  fromResultError,
}
