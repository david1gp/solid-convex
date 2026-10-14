import type { Doc } from "#convex/_generated/dataModel.js"
import type { Project } from "#src/project/model/projectSchema.ts"

export function projectDocToModel({ _id, _creationTime, ...data }: Doc<"projects">): Project {
  return { ...data, projectId: _id }
}
