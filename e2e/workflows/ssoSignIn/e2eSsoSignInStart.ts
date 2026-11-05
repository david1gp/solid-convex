import { expect, type Page } from "@rstest/playwright"
import { createResult, createResultError, type Result } from "#result"

export async function e2eSsoSignInStart(page: Page, baseUrl: string): Promise<Result<void>> {
  const op = "e2eSsoSignInStart"
  try {
    await page.goto(`${baseUrl}/sign-in`)
    const ssoLink = page.locator('a[href*="/oidc/start"]')
    await expect(ssoLink).toBeVisible({ timeout: 30_000 })
    await ssoLink.click()
    await expect(page.getByRole("textbox", { name: /loginname|username|email/i })).toBeVisible({ timeout: 60_000 })
  } catch {
    return createResultError(op, "SSO sign-in start failed")
  }
  return createResult(undefined)
}
