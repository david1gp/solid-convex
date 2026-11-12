import { classMerge } from "#ui/utils/classMerge.ts"
import type { MayHaveChildrenAndClass } from "#ui/utils/MayHaveChildrenAndClass.ts"
import type { MayHaveId } from "#ui/utils/MayHaveId.ts"

export interface NoDataProps extends MayHaveId, MayHaveChildrenAndClass {
  noDataText?: string
}

export function NoData(p: NoDataProps) {
  return (
    <section id={p.id} class={classMerge("col-span-full flex flex-col items-center gap-2 py-8 text-center", p.class)}>
      <p class="text-sm text-muted-foreground">{p.noDataText ?? "No Data"}</p>
      {p.children}
    </section>
  )
}
