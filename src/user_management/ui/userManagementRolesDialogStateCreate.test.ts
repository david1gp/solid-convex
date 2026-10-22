import { describe, expect, test } from "bun:test"
import type { UserProjection } from "#src/user_management/model/userProjectionSchema.ts"
import { userManagementRolesDialogStateCreate } from "./userManagementRolesDialogStateCreate.ts"

function userFixture(roles: string[]): UserProjection {
  return {
    userId: "user-1",
    organizationId: "org-1",
    displayName: "Test User",
    email: "test@example.com",
    roles,
    teamIds: [],
    syncedAt: "2026-10-14T00:00:00.000Z",
  }
}

describe("userManagementRolesDialogStateCreate", () => {
  test("openEdit seeds draft roles from the member and closeEdit clears the dialog", () => {
    const state = userManagementRolesDialogStateCreate({})
    expect(state.editingUser()).toBeUndefined()

    state.openEdit(userFixture(["admin", "member"]))
    expect(state.editingUser()?.userId).toBe("user-1")
    expect(state.draftRoles.get()).toEqual(["admin", "member"])

    state.closeEdit()
    expect(state.editingUser()).toBeUndefined()
  })

  test("saveRoles rejects an empty role set without calling setRoles", async () => {
    let calls = 0
    const state = userManagementRolesDialogStateCreate({
      setRoles: async () => {
        calls += 1
        return { success: true, errorMessage: "" }
      },
    })
    state.openEdit(userFixture(["admin"]))
    state.draftRoles.set([])
    await state.saveRoles()
    expect(calls).toBe(0)
    expect(state.errorMessage()).toBe("At least one role is required")
    expect(state.editingUser()).not.toBeUndefined()
  })

  test("saveRoles reports a missing session instead of saving", async () => {
    const state = userManagementRolesDialogStateCreate({})
    state.openEdit(userFixture(["admin"]))
    await state.saveRoles()
    expect(state.errorMessage()).toBe("Role saving is unavailable: no session")
  })

  test("saveRoles writes through {roles, userId} and closes on success", async () => {
    let received: unknown = null
    const state = userManagementRolesDialogStateCreate({
      setRoles: async (input) => {
        received = input
        return { success: true, errorMessage: "" }
      },
    })
    state.openEdit(userFixture(["user"]))
    state.draftRoles.set(["admin", "member"])
    await state.saveRoles()
    expect(received).toEqual({ roles: ["admin", "member"], userId: "user-1" })
    expect(state.editingUser()).toBeUndefined()
    expect(state.savedUserId()).toBe("user-1")
    expect(state.errorMessage()).toBe("")
  })

  test("saveRoles surfaces backend errors and keeps the dialog open", async () => {
    const state = userManagementRolesDialogStateCreate({
      setRoles: async () => ({ success: false, errorMessage: "The last admin role cannot be removed" }),
    })
    state.openEdit(userFixture(["admin"]))
    await state.saveRoles()
    expect(state.errorMessage()).toBe("The last admin role cannot be removed")
    expect(state.editingUser()).not.toBeUndefined()
    expect(state.isUpdating("user-1")).toBe(false)
  })

  test("saveRoles does nothing when no member is being edited", async () => {
    let calls = 0
    const state = userManagementRolesDialogStateCreate({
      setRoles: async () => {
        calls += 1
        return { success: true, errorMessage: "" }
      },
    })
    await state.saveRoles()
    expect(calls).toBe(0)
  })
})
