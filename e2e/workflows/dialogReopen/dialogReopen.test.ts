import { expect } from "@rstest/playwright"
import { browserTest as test } from "../../browser/browserTest.ts"
import { e2eBaseUrlGet } from "../../config/e2eBaseUrlGet.ts"

const target = process.env.E2E_TARGET
if (target !== "production" && target !== "dev") throw new Error("E2E_TARGET must be production or dev")
const baseUrl = e2eBaseUrlGet(process.env, target)

test("dialog stays open after repeated dismissal and restores focus", async ({ page }) => {
  await page.goto(`${baseUrl}/demos/ui/DemoButtons`)
  const trigger = page.getByRole("button", { name: "Details", exact: true })
  const dialog = page.getByRole("dialog", { name: "Details dialog" })
  for (const close of ["escape", "button", "overlay"] as const) {
    await trigger.click()
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole("button", { name: "close" })).toBeFocused()
    if (close === "escape") await page.keyboard.press("Escape")
    if (close === "button") await dialog.getByRole("button", { name: "close" }).click()
    if (close === "overlay") await page.locator("[data-corvu-dialog-overlay]").click({ position: { x: 5, y: 5 } })
    await expect(dialog).not.toBeVisible()
    await expect(trigger).toBeFocused()
  }
  await trigger.click()
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole("button", { name: "close" })).toBeFocused()
})

test("labeled and icon popovers reopen and restore focus after Escape and outside clicks", async ({ page }) => {
  await page.goto(`${baseUrl}/demos/ui/DemoButtons`)
  for (const name of ["More", "Icon popover"]) {
    const trigger = page.getByRole("button", { name, exact: true })
    for (const close of ["escape", "outside", "escape"] as const) {
      await trigger.click()
      await expect(trigger).toHaveAttribute("aria-expanded", "true")
      await expect(page.locator("[data-corvu-popover-content][data-open]")).toBeVisible()
      if (close === "escape") await page.keyboard.press("Escape")
      if (close === "outside") await page.mouse.click(800, 100)
      await expect(trigger).toHaveAttribute("aria-expanded", "false")
      await expect(trigger).toBeFocused()
    }
  }
})
