import { expect, type Page } from "@rstest/playwright"

export async function e2eSsoOverviewVerify(page: Page, baseUrl: string): Promise<void> {
  const appOrigin = new URL(baseUrl).origin
  await page.waitForURL((url) => url.origin === appOrigin, { timeout: 60_000 })
  await page.waitForURL((url) => url.pathname === "/overview", { timeout: 60_000 })
  await expect(page.getByRole("heading", { name: "Overview", exact: true })).toBeVisible({ timeout: 30_000 })
  await expect(page.getByRole("heading", { name: "Demo Auth Links", exact: true })).toBeVisible()
}
