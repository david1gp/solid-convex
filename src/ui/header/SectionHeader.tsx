import type { ComponentProps } from "solid-js"
import type { PageHeaderProps } from "#src/ui/header/PageHeader.tsx"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { LinkButtonExternal, LinkButtonInternal } from "#ui/interactive/link/LinkButton.jsx"
import { Icon } from "#ui/static/icon/Icon.jsx"
import { cn } from "cn"

export interface SectionHeaderProps extends PageHeaderProps {
  icon: string
  to?: ComponentProps<typeof LinkButtonInternal>["to"]
  href?: string
}

export function SectionHeader(p: SectionHeaderProps) {
  return (
    <div class={cn("flex flex-wrap items-center justify-between gap-4", p.class)}>
      <h2 class={cn("text-2xl font-semibold", p.titleClass)}>
        {p.to ? (
          <LinkButtonInternal to={p.to} icon={p.icon} variant={buttonVariant.link} class="pl-0">
            {p.title}
          </LinkButtonInternal>
        ) : p.href ? (
          <LinkButtonExternal href={p.href} icon={p.icon} variant={buttonVariant.link} class="pl-0">
            {p.title}
          </LinkButtonExternal>
        ) : (
          <div class="flex gap-1.5 items-center">
            {p.icon && <Icon path={p.icon} class={p.iconClass} />}
            <span>{p.title}</span>
          </div>
        )}
      </h2>
      {p.subtitle && <p class={cn("text-lg", p.subtitleClass)}>{p.subtitle}</p>}
      {p.children}
    </div>
  )
}
