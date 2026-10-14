import { api } from "#convex/_generated/api.js"
import { userSessionSignal, userTokenGet } from "#src/auth/ui/signals/userSessionSignal.ts"
import { teamSchema } from "#src/team/model/teamSchema.ts"
import { teamHrefGet } from "#src/team/ui/teamHrefGet.ts"
import { cursorPaginationCreate } from "#src/utils/convex_client/cursorPaginationCreate.ts"

export function teamListSectionStateCreate(orgHandle: () => string | undefined) {
  const pagination = cursorPaginationCreate({
    query: api.team.teamListQuery,
    queryKey: "teamListQuery",
    args: () => ({ token: userTokenGet(), orgHandle: orgHandle() }),
    identity: () => userSessionSignal.get()?.profile.userId ?? null,
    scope: orgHandle,
    itemSchema: teamSchema,
  })
  return {
    pagination,
    teams: () => {
      const result = pagination.page()
      return result?.success ? result.data.page : []
    },
    error: () => {
      const result = pagination.page()
      return result && !result.success ? result.errorMessage : ""
    },
    createHref: () => teamHrefGet("create", orgHandle()),
    detailHref: (teamId: string) => teamHrefGet("detail", orgHandle(), teamId),
    editHref: (teamId: string) => teamHrefGet("edit", orgHandle(), teamId),
    contextual: () => !!orgHandle(),
  }
}
