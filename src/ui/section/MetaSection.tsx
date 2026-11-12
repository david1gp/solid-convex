import { classesCard } from "#src/ui/card/classesCard.ts"
import { Icon } from "#ui/static/icon/Icon.jsx"
import { classMerge } from "#ui/utils/classMerge.ts"
import type { HasChildren } from "#ui/utils/HasChildren.ts"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"

export interface MetaSectionProps<T extends string> extends MayHaveClass, HasChildren {
  s: T
  getTexts: (section: string) => string
  icons: Record<T, string>
  headerClass?: string
}

export function MetaSection<T extends string>(p: MetaSectionProps<T>) {
  return (
    <section
      id={p.s}
      class={classMerge(
        classesCard,
        "flex flex-col gap-2",
        "rounded-md border-border bg-background",
        "dark:border-border dark:bg-background",
        p.class,
      )}
    >
      <div class={classMerge("flex items-center gap-2", "text-muted-foreground", p.headerClass)}>
        <Icon path={p.icons[p.s]} class="fill-muted-foreground" />
        <h2 class={classMerge("text-sm font-semibold")}>{p.getTexts(p.s)}</h2>
      </div>
      {p.children}
    </section>
  )
}
