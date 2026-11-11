import { createHash } from "node:crypto"
import { expect } from "@rstest/playwright"
import { browserTest as test } from "../../browser/browserTest.ts"
import { e2eAuthCredentialsGet } from "../../config/e2eAuthCredentialsGet.ts"
import { e2eBaseUrlGet } from "../../config/e2eBaseUrlGet.ts"
import { e2eConvexBackendGet } from "../../config/e2eConvexBackendGet.ts"
import { e2eSsoOverviewVerify } from "./e2eSsoOverviewVerify.ts"
import { e2eSsoPasswordSubmit } from "./e2eSsoPasswordSubmit.ts"
import { e2eSsoSignInStart } from "./e2eSsoSignInStart.ts"
import { e2eSsoUsernameSubmit } from "./e2eSsoUsernameSubmit.ts"
import { e2eSsoBrowserSessionRead } from "./e2eSsoBrowserSessionRead.ts"
import { e2eSsoCheckpointStoreCreate } from "./e2eSsoCheckpointStoreCreate.ts"
import { e2eSsoSessionTransportCreate } from "./e2eSsoSessionTransportCreate.ts"
import { e2eSsoSessionMarkTransportCreate } from "./e2eSsoSessionMarkTransportCreate.ts"
import { e2eSsoWorkflowRun } from "./e2eSsoWorkflowRun.ts"

const targetArgument = process.env.E2E_TARGET
if (targetArgument !== "production" && targetArgument !== "dev")
  throw new Error("E2E_TARGET must be <production|dev>; run SSO through the canonical E2E runner")
const target: "production" | "dev" = targetArgument
const baseUrl = e2eBaseUrlGet(process.env, target)

test("an SSO test user can sign in and reach the private overview", { timeout: 180_000 }, async ({ page }) => {
  const credentials = e2eAuthCredentialsGet(process.env)
  const { backendUrl: convexUrl, adminKey } = e2eConvexBackendGet(process.env, target)
  const backendUrl = new URL(convexUrl).toString().replace(/\/$/u, "")
  const checkpointPath = process.env.E2E_CHECKPOINT_PATH
  const runId = process.env.E2E_RUN_ID
  if (!checkpointPath || !runId) throw new Error("Run SSO through the canonical E2E runner")
  const result = await e2eSsoWorkflowRun({
    store: e2eSsoCheckpointStoreCreate({ checkpointPath, runId, target, baseUrl }),
    backendUrl,
    accountKey: createHash("sha256").update(credentials.username.trim().toLowerCase()).digest("hex"),
    sessionsRead: e2eSsoSessionTransportCreate({ backendUrl, adminKey }),
    sessionMark: e2eSsoSessionMarkTransportCreate({ backendUrl }),
    browserSessionRead: () => e2eSsoBrowserSessionRead(page, baseUrl),
    steps: {
      "sign-in-start": () => e2eSsoSignInStart(page, baseUrl),
      "username-submit": () => e2eSsoUsernameSubmit(page, credentials),
      "password-submit": () => e2eSsoPasswordSubmit(page, credentials),
      "overview-verify": () => e2eSsoOverviewVerify(page, baseUrl),
    },
  })
  if (result.success && process.env.E2E_FAIL_AFTER_SSO_PERSIST === "1")
    throw new Error("Controlled failure after persisted SSO session ownership and completed steps")
  expect(result.success, result.success ? undefined : `${result.op}: ${result.errorMessage}`).toBe(true)
})
