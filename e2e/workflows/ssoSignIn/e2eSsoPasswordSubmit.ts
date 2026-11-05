import { expect, type Page } from "@rstest/playwright"
import { createResult, createResultError, type Result } from "#result"

export async function e2eSsoPasswordSubmit(
  page: Page,
  credentials: { username: string; password: string },
): Promise<Result<void>> {
  const op = "e2eSsoPasswordSubmit"
  try {
    const password = page.getByLabel(/password|passwort/i)
    await expect(password).toBeVisible({ timeout: 60_000 })
    await password.fill(credentials.password)
    await page.getByRole("button", { name: /next|continue|sign in|log in|weiter|anmelden/i }).click()
  } catch {
    return createResultError(op, "SSO password submission failed")
  }
  return createResult(undefined)
}
