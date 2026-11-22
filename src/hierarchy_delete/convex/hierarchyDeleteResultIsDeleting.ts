// Only suppress the explicit deletion guards; invalid or missing ancestry must still fail.
export function hierarchyDeleteResultIsDeleting(result: { op: string; errorMessage: string }): boolean {
  return (
    (result.op === "noteGetFn" && result.errorMessage === "Note is currently being deleted") ||
    (result.op === "projectGetFn" && result.errorMessage === "Project is currently being deleted") ||
    (result.op === "teamGetFn" && result.errorMessage === "Team is currently being deleted") ||
    (result.op === "teamOrgResolveFn" && result.errorMessage === "Organization is currently being deleted")
  )
}
