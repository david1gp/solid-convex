import { For, Match, Switch } from "solid-js"
import { Separator } from "#ui/static/separator/Separator.jsx"
import type { MobileTableClassNames } from "#ui/table/shared/MobileTableClassNames.js"
import type { TableColumnDef } from "#ui/table/shared/TableColumnDef.js"
import { cn } from "cn"
import type { MayHaveChildren } from "#ui/utils/MayHaveChildren.js"

export type Table2MEntryProps<T> = {
  row: T
  columns: TableColumnDef<T>[]
  mobileClasses?: MobileTableClassNames
}

/** Renders one table2 mobile card with its field rows. */
export function Table2MEntry<T>(p: Table2MEntryProps<T>) {
  return (
    <div class={cn("flex flex-col flex-wrap gap-2", p.mobileClasses?.entry)}>
      <For each={p.columns}>
        {(header, i) => (
          <>
            <Separator />
            <Switch>
              <Match when={i() === 0}>
                <MobileEntryFirst mobileClasses={p.mobileClasses}>{header.cell(p.row)}</MobileEntryFirst>
              </Match>
              <Match when={i() !== 0}>
                <MobileEntryOther headerName={header.name} mobileClasses={p.mobileClasses}>
                  {header.cell(p.row)}
                </MobileEntryOther>
              </Match>
            </Switch>
          </>
        )}
      </For>
    </div>
  )
}

function MobileEntryFirst({ mobileClasses: c, children }: { mobileClasses?: MobileTableClassNames } & MayHaveChildren) {
  return <span class={cn("font-semibold", c?.first)}>{children}</span>
}

function MobileEntryOther({
  mobileClasses: c,
  headerName,
  children,
}: {
  headerName: string
  mobileClasses?: MobileTableClassNames
} & MayHaveChildren) {
  return (
    <span class={cn("flex flex-wrap justify-between", c?.entry)}>
      <span class={cn("text-gray-600 dark:text-gray-400", c?.header)}>{`${headerName}:`}</span>
      <span class={cn("text-right", c?.other)}>{children}</span>
    </span>
  )
}
