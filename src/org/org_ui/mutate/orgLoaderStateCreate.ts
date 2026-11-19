import { createEffect } from "solid-js"
import * as a from "valibot"
import { api } from "#convex/_generated/api.js"
import { userTokenGet } from "#src/auth/ui/signals/userSessionSignal.ts"
import { orgSchema } from "#src/org/org_model/orgSchema.ts"
import { createQueryCached } from "#src/utils/cache/createQueryCached.ts"
import { queryCreate } from "#src/utils/convex_client/queryCreate.ts"

export function orgLoaderStateCreate(p: { orgHandle: () => string }) {
  const getDataQuery = queryCreate(api.org.orgGetQuery, () => ({
    token: userTokenGet(),
    orgHandle: p.orgHandle(),
  }))
  const getData = createQueryCached(getDataQuery, `orgGetQuery/${p.orgHandle()}`, a.nullable(orgSchema))
  createEffect(
    () => getData(),
    (data) => {
      console.log("OrgLoader", data)
    },
  )

  return { getData }
}
