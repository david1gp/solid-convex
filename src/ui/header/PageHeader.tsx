import type { Element as JSXElement } from "solid-js"
import { Icon } from "#ui/static/icon/Icon.jsx"
import { cn } from "cn"
import type { HasTitle } from "#ui/utils/HasTitle.ts"
import type { MayHaveChildrenAndClass } from "#ui/utils/MayHaveChildrenAndClass.ts"
import type { MayHaveIcon } from "#ui/utils/MayHaveIcon.ts"
import type { MayHaveInnerClass } from "#ui/utils/MayHaveInnerClass.ts"
import type { MayHaveSubtitle } from "#ui/utils/MayHaveSubtitle.ts"

export interface PageHeaderProps
  extends HasTitle,
    MayHaveIcon,
    MayHaveSubtitle,
    MayHaveInnerClass,
    MayHaveChildrenAndClass {
  subtitleChildren?: JSXElement
}

export function PageHeader(p: PageHeaderProps) {
  return (
    <>
      <header
        class={cn(
          "sticky top-11 z-10 flex h-11 items-center gap-2 border-b border-border bg-background px-4 md:top-0 md:px-6",
          p.class,
        )}
      >
        <div class={cn("flex min-w-0 flex-1 items-center gap-2", p.innerClass)}>
          {p.icon && <Icon path={p.icon} class={p.iconClass} />}
          <h1 class={cn("truncate text-base font-semibold lg:text-lg", p.titleClass)}>{p.title}</h1>
          {p.subtitle && <p class={cn("truncate text-xs text-muted-foreground", p.subtitleClass)}>{p.subtitle}</p>}
        </div>
        {p.children && <div class="ml-auto flex shrink-0 items-center gap-2">{p.children}</div>}
      </header>
      {p.subtitleChildren}
    </>
  )
}
