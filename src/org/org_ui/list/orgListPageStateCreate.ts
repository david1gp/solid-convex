import { createEffect, untrack } from "solid-js"
import { api } from "#convex/_generated/api.js"
import { userSessionSignal, userTokenGet } from "#src/auth/ui/signals/userSessionSignal.ts"
import { orgSchema } from "#src/org/org_model/orgSchema.ts"
import { orgNameAddList } from "#src/org/org_ui/orgNameRecordSignal.ts"
import { cursorPaginationCreate } from "#src/utils/convex_client/cursorPaginationCreate.ts"

export function orgListPageStateCreate() {
  const pagination = cursorPaginationCreate({
    query: api.org.orgListQuery,
    queryKey: "orgListQuery",
    args: () => ({ token: userTokenGet() }),
    identity: () => userSessionSignal.get()?.profile.userId ?? null,
    itemSchema: orgSchema,
  })
  createEffect(
    () => pagination.page(),
    (result) => {
      // Merge with the current cache without making cache changes retrigger this effect.
      if (result?.success) untrack(() => orgNameAddList(result.data.page))
    },
  )
  return pagination
}
