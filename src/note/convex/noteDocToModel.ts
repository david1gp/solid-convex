import type { Doc } from "#convex/_generated/dataModel.js"
import type { Note } from "#src/note/model/noteSchema.ts"

export function noteDocToModel(doc: Doc<"notes">): Note {
  return {
    noteId: doc._id,
    projectId: doc.projectId,
    teamId: doc.teamId,
    orgId: doc.orgId,
    title: doc.title,
    content: doc.content,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    deleting: doc.deleting,
    deletionJobId: doc.deletionJobId,
  }
}
