import { api } from "#convex/_generated/api.js"
import type { Id } from "#convex/_generated/dataModel.js"
import { userSessionSignal, userTokenGet } from "#src/auth/ui/signals/userSessionSignal.ts"
import { projectSchema } from "#src/project/model/projectSchema.ts"
import { projectHrefGet } from "#src/project/ui/projectHrefGet.ts"
import { teamHrefGet } from "#src/team/ui/teamHrefGet.ts"
import { cursorPaginationCreate } from "#src/utils/convex_client/cursorPaginationCreate.ts"

export function projectListSectionStateCreate(orgHandle: () => string | undefined, teamId: () => string | undefined) {
  const pagination = cursorPaginationCreate({
    query: api.project.projectListQuery,
    queryKey: "projectListQuery",
    args: () => ({
      token: userTokenGet(),
      orgHandle: orgHandle(),
      teamId: teamId() ? (teamId() as Id<"teams">) : undefined,
    }),
    identity: () => userSessionSignal.get()?.profile.userId ?? null,
    scope: () => `${orgHandle() ?? ""}:${teamId() ?? ""}`,
    itemSchema: projectSchema,
  })
  return {
    pagination,
    projects: () => {
      const result = pagination.page()
      return result?.success ? result.data.page : []
    },
    error: () => {
      const result = pagination.page()
      return result && !result.success ? result.errorMessage : ""
    },
    createHref: () => projectHrefGet("create", { orgHandle: orgHandle(), teamId: teamId() }),
    detailHref: (projectId: string) =>
      projectHrefGet("detail", { orgHandle: orgHandle(), teamId: teamId(), projectId }),
    editHref: (projectId: string) => projectHrefGet("edit", { orgHandle: orgHandle(), teamId: teamId(), projectId }),
    contextual: () => Boolean(teamId()),
    teamListHref: () => teamHrefGet("list", orgHandle()),
  }
}
