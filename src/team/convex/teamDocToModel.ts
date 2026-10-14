import type { Doc } from "#convex/_generated/dataModel.js"
import type { Team } from "#src/team/model/teamSchema.ts"

export function teamDocToModel({ _id, _creationTime, ...data }: Doc<"teams">): Team {
  return { ...data, teamId: _id }
}
