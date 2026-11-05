import { expect, type Page } from "@rstest/playwright"
import { createResult, createResultError, type Result } from "#result"

export async function e2eSsoUsernameSubmit(
  page: Page,
  credentials: { username: string; password: string },
): Promise<Result<void>> {
  const op = "e2eSsoUsernameSubmit"
  try {
    const username = page.getByRole("textbox", { name: /loginname|username|email/i })
    await expect(username).toBeVisible({ timeout: 60_000 })
    await username.fill(credentials.username)

    const nextButton = page.getByRole("button", { name: /next|continue|weiter/i })
    if (await nextButton.isVisible().catch(() => false)) await nextButton.click()
    await expect(page.getByLabel(/password|passwort/i)).toBeVisible({ timeout: 60_000 })
  } catch {
    return createResultError(op, "SSO username submission failed")
  }
  return createResult(undefined)
}
