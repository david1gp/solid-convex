import * as v from "valibot"
import type { Result } from "#result"
import { createResult, createResultError } from "#result"
import {
  type ZitadelServerConfig,
  zitadelServerConfigSchema,
} from "#src/user_management/server/zitadelServerConfigSchema.ts"

export function zitadelServerConfigFromEnv(
  env: Readonly<Record<string, string | undefined>> = process.env,
): Result<ZitadelServerConfig> {
  const op = "zitadelServerConfigFromEnv"

  const rawBaseUrl = env.ZITADEL_BASE_URL?.trim() || env.OIDC_ISSUER?.trim()
  const rawToken = env.ZITADEL_TOKEN?.trim() || env.ZITADEL_SERVICE_ACCOUNT_TOKEN?.trim()
  const rawOrganizationId = env.ZITADEL_ORGANIZATION_ID?.trim() || env.OIDC_ZITADEL_ORG_ID?.trim()
  const rawProjectId = env.ZITADEL_PROJECT_ID?.trim()

  const candidate = {
    baseUrl: rawBaseUrl,
    token: rawToken,
    organizationId: rawOrganizationId,
    projectId: rawProjectId,
  }

  const parsed = v.safeParse(zitadelServerConfigSchema, candidate)
  if (!parsed.success) {
    const missingFields: string[] = []
    const invalidFields: string[] = []
    const safeIssues: string[] = []

    for (const issue of parsed.issues) {
      const field = v.getDotPath(issue) ?? "configuration"
      const rawValue = field in candidate ? candidate[field as keyof typeof candidate] : undefined
      const isMissing = rawValue === undefined || rawValue === ""

      if (isMissing) {
        if (!missingFields.includes(field)) {
          missingFields.push(field)
        }
        const message = `Missing required field "${field}"`
        if (!safeIssues.includes(message)) {
          safeIssues.push(message)
        }
      } else {
        if (!invalidFields.includes(field)) {
          invalidFields.push(field)
        }
        const safeReason =
          issue.type === "url"
            ? "invalid URL format"
            : issue.type === "min_length"
              ? "must not be empty"
              : issue.type === "string"
                ? "must be a string"
                : "invalid value"
        const message = `Invalid field "${field}" (${safeReason})`
        if (!safeIssues.includes(message)) {
          safeIssues.push(message)
        }
      }
    }

    const issuesSummary = safeIssues.join("; ")
    return createResultError(
      op,
      `Invalid Zitadel server configuration in environment: ${issuesSummary}`,
      JSON.stringify({
        missingFields,
        invalidFields,
        issues: safeIssues,
      }),
    )
  }

  const normalizedConfig: ZitadelServerConfig = {
    ...parsed.output,
    baseUrl: parsed.output.baseUrl.replace(/\/+$/u, ""),
  }

  return createResult(normalizedConfig)
}
