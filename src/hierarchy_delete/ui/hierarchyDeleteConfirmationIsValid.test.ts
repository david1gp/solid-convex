import { describe, expect, test } from "bun:test"
import { hierarchyDeleteConfirmationIsValid } from "#src/hierarchy_delete/ui/hierarchyDeleteConfirmationIsValid.ts"

describe("hierarchyDeleteConfirmationIsValid", () => {
  test('returns true when user types exact "DELETE"', () => {
    expect(hierarchyDeleteConfirmationIsValid("DELETE", "My Org")).toBe(true)
    expect(hierarchyDeleteConfirmationIsValid("  DELETE  ", "My Org")).toBe(true)
  })

  test("returns true when user types matching entity name", () => {
    expect(hierarchyDeleteConfirmationIsValid("Engineering Team", "Engineering Team")).toBe(true)
    expect(hierarchyDeleteConfirmationIsValid("  Engineering Team  ", "Engineering Team")).toBe(true)
  })

  test("returns false for partial, lowercase or mismatched inputs", () => {
    expect(hierarchyDeleteConfirmationIsValid("delete", "Engineering Team")).toBe(false)
    expect(hierarchyDeleteConfirmationIsValid("Engineer", "Engineering Team")).toBe(false)
    expect(hierarchyDeleteConfirmationIsValid("", "Engineering Team")).toBe(false)
    expect(hierarchyDeleteConfirmationIsValid("Random Input", "")).toBe(false)
  })
})
