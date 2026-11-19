import { createEffect } from "solid-js"
import type { ResourceModel } from "#src/resource/model/ResourceModel.ts"
import { resourceNameAddList } from "#src/resource/ui/resourceNameRecordSignal.ts"

export function resourceListStateCreate(p: { demo: () => boolean | undefined; resources: () => ResourceModel[] }) {
  createEffect(
    () => ({ demo: p.demo(), got: p.resources() }),
    ({ demo, got }) => {
      if (demo) return
      if (!got) return
      if (got.length <= 0) return
      resourceNameAddList(got)
    },
  )

  return {}
}
