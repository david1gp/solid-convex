import type { AssignmentTargetKind } from "#src/assignment/model/assignmentTargetKindSchema.ts"

export function assignmentTargetLabelFormat(target?: { kind: AssignmentTargetKind } | null): string {
  if (!target) return "Unassigned"
  switch (target.kind) {
    case "organization":
      return "Organization"
    case "team":
      return "Team"
    case "project":
      return "Project"
    case "note":
      return "Note"
  }
}
