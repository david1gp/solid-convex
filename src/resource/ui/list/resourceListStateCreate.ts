import { createEffect } from "solid-js"
import type { ResourceModel } from "#src/resource/model/ResourceModel.ts"
import { resourceNameAddList } from "#src/resource/ui/resourceNameRecordSignal.ts"

export function resourceListStateCreate(p: { demo: () => boolean | undefined; resources: () => ResourceModel[] }) {
  createEffect(() => {
    if (p.demo()) return
    const got = p.resources()
    if (!got) return
    if (got.length <= 0) return
    resourceNameAddList(got)
  })

  return {}
}
