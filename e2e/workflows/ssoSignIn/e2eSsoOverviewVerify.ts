import { expect, type Page } from "@rstest/playwright"
import { createResult, createResultError, type Result } from "#result"

export async function e2eSsoOverviewVerify(page: Page, baseUrl: string): Promise<Result<void>> {
  const op = "e2eSsoOverviewVerify"
  try {
    const appOrigin = new URL(baseUrl).origin
    await page.waitForURL((url) => url.origin === appOrigin, { timeout: 60_000 })
    await page.waitForURL((url) => url.pathname === "/overview", { timeout: 60_000 })
    await expect(page.getByRole("heading", { name: "Overview", exact: true })).toBeVisible({ timeout: 30_000 })
    await expect(page.getByRole("heading", { name: "Demo Auth Links", exact: true })).toBeVisible()
  } catch {
    return createResultError(op, "SSO private overview verification failed")
  }
  return createResult(undefined)
}
