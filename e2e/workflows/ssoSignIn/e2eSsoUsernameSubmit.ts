import { expect, type Page } from "@rstest/playwright"
import { createResult, createResultError, type Result } from "#result"

export async function e2eSsoUsernameSubmit(
  page: Page,
  credentials: { username: string; password: string },
): Promise<Result<void>> {
  const op = "e2eSsoUsernameSubmit"
  let stage = "username visibility"
  try {
    const username = page.getByRole("textbox", { name: /loginname|username|email/i })
    await expect(username).toBeVisible({ timeout: 60_000 })
    stage = "username entry"
    await username.fill(credentials.username)

    stage = "continue readiness"
    const nextButton = page.getByRole("button", { name: /next|continue|weiter/i })
    await expect(nextButton).toBeVisible({ timeout: 60_000 })
    await expect(nextButton).toBeEnabled({ timeout: 60_000 })
    stage = "continue submission"
    await nextButton.click()
    stage = "password visibility"
    await expect(page.getByLabel(/password|passwort/i)).toBeVisible({ timeout: 60_000 })
  } catch {
    return createResultError(op, `SSO username submission failed during ${stage}`)
  }
  return createResult(undefined)
}
