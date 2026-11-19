import { flush } from "solid-js"
import { describe, expect, test } from "bun:test"
import { userManagementRolesDialogStateCreate } from "./userManagementRolesDialogStateCreate.ts"

describe("user management roles dialog copy", () => {
  test("dialog exposes edit, roles, save, and cancel copy", async () => {
    const dialogSource = await Bun.file(new URL("./UserManagementRolesDialog.tsx", import.meta.url)).text()

    expect(dialogSource).toContain("Edit project roles")
    expect(dialogSource).toContain("Project roles")
    expect(dialogSource).toContain("Save roles")
    expect(dialogSource).toContain("Cancel")
    expect(dialogSource).toContain("Changes write through to Zitadel")
  })

  test("page exposes a per-row edit button, role filter, and dialog wiring", async () => {
    const pageSource = await Bun.file(new URL("./UserManagementPage.tsx", import.meta.url)).text()

    expect(pageSource).toContain("Edit roles for")
    expect(pageSource).toContain("user-management-role-filter")
    expect(pageSource).toContain("<UserManagementRolesDialog")
    expect(pageSource).toContain("rolesDialog.openEdit(user)")
  })

  test("empty role sets are rejected with guidance copy", async () => {
    const state = userManagementRolesDialogStateCreate({})
    const dialogSource = await Bun.file(new URL("./UserManagementRolesDialog.tsx", import.meta.url)).text()

    expect(dialogSource).toContain("draftRoles.get().length === 0")
    state.openEdit({
      userId: "user-1",
      organizationId: "org-1",
      roles: ["admin"],
      teamIds: [],
      syncedAt: "2026-10-14T00:00:00.000Z",
    })
    state.draftRoles.set([])
    flush()
    await state.saveRoles()
    flush()
    expect(state.errorMessage()).toBe("At least one role is required")
  })
})
