import { createEffect } from "solid-js"
import * as a from "valibot"
import { api } from "#convex/_generated/api.js"
import { userTokenGet } from "#src/auth/ui/signals/userSessionSignal.ts"
import type { ResourceModel } from "#src/resource/model/ResourceModel.ts"
import { resourceSchema } from "#src/resource/model/resourceSchema.ts"
import { resourceNameSet } from "#src/resource/ui/resourceNameRecordSignal.ts"
import { createQueryCached } from "#src/utils/cache/createQueryCached.ts"
import { queryCreate } from "#src/utils/convex_client/queryCreate.ts"

export function resourceLoaderStateCreate(p: { resourceId: () => string }) {
  const getDataQuery = queryCreate(api.resource.resourceGetQuery, () => ({
    token: userTokenGet(),
    resourceId: p.resourceId(),
  }))
  const getData = createQueryCached<ResourceModel | null>(
    getDataQuery,
    `resourceGetQuery/${p.resourceId()}`,
    a.union([resourceSchema, a.null()]),
  )
  createEffect(() => {
    const got = getData()
    if (!got) return
    if (!got.success) return
    const data = got.data
    if (!data) return
    const name = data.name
    if (!name) return
    resourceNameSet(p.resourceId(), name)
  })

  function loadedData(): ResourceModel | null {
    const data = getData()
    if (!data) return null
    if (!data.success) return null
    if (!data.data) return null
    return data.data
  }

  return { getData, loadedData }
}
