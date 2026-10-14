export function hierarchyDeleteConfirmationIsValid(typedInput: string, expectedName?: string): boolean {
  const typed = typedInput.trim()
  if (typed === "DELETE") return true
  const expected = expectedName?.trim() ?? ""
  if (expected.length > 0 && typed === expected) return true
  return false
}
