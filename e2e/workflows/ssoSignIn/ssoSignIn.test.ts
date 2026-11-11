import { test } from "@rstest/playwright"
import { e2eAuthCredentialsGet } from "../../config/e2eAuthCredentialsGet.ts"
import { e2eBaseUrlGet } from "../../config/e2eBaseUrlGet.ts"
import { e2eTargetGet } from "../../config/e2eTargetGet.ts"
import { e2eSsoOverviewVerify } from "./e2eSsoOverviewVerify.ts"
import { e2eSsoPasswordSubmit } from "./e2eSsoPasswordSubmit.ts"
import { e2eSsoSignInStart } from "./e2eSsoSignInStart.ts"
import { e2eSsoUsernameSubmit } from "./e2eSsoUsernameSubmit.ts"

const target = e2eTargetGet(process.env)
const baseUrl = e2eBaseUrlGet(process.env, target)

test("an SSO test user can sign in and reach the private overview", { timeout: 180_000 }, async ({ page }) => {
  const credentials = e2eAuthCredentialsGet(process.env)
  await e2eSsoSignInStart(page, baseUrl)
  await e2eSsoUsernameSubmit(page, credentials)
  await e2eSsoPasswordSubmit(page, credentials)
  await e2eSsoOverviewVerify(page, baseUrl)
})
