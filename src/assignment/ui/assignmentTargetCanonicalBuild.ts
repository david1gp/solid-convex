import * as a from "valibot"
import { createResult, createResultError, type Result } from "#result"
import type { AssignmentTargetKind } from "#src/assignment/model/assignmentTargetKindSchema.ts"
import { assignmentTargetSchema, type AssignmentTarget } from "#src/assignment/model/assignmentTargetSchema.ts"

export function assignmentTargetCanonicalBuild(
  kind: AssignmentTargetKind | "unassigned" | undefined | null,
  id?: string | null,
): Result<AssignmentTarget | undefined> {
  const op = "assignmentTargetCanonicalBuild"

  if (!kind || kind === "unassigned") {
    return createResult(undefined)
  }

  if (!id || typeof id !== "string" || id.trim().length === 0) {
    return createResultError(op, "Assignment target requires a valid ID", JSON.stringify({ kind, id }))
  }

  const parseResult = a.safeParse(assignmentTargetSchema, { kind, id: id.trim() })
  if (!parseResult.success) {
    return createResultError(op, a.summarize(parseResult.issues), JSON.stringify({ kind, id }))
  }

  return createResult(parseResult.output)
}
