import type { ParentComponent } from "solid-js"
import { type Component, type Element as JSXElement, merge as mergeProps, Show, omit } from "solid-js"
import { cn } from "cn"
import { type ComponentProps } from "@solidjs/web"

export interface TimelinePropsItem
  extends Omit<TimelineItemProps, "isActive" | "isActiveBullet" | "bulletSize" | "lineSize"> {
  bulletSize?: number
}

export type TimelineProps = {
  items: TimelinePropsItem[]
  activeItem: number
  bulletSize?: number
  lineSize?: number
}

/*
  No bullet or line is active when activeItem is -1
  First bullet is active only if activeItem is 0 or more
  First line is active only if activeItem is 1 or more
*/

const Timeline: Component<TimelineProps> = (rawProps) => {
  const p = mergeProps({ bulletSize: 16, lineSize: 2 }, rawProps)

  return (
    <ul
      style={{
        "padding-left": `${p.bulletSize / 2}px`,
      }}
    >
      {p.items.map((item, index) => {
        return (
          <TimelineItem
            title={item.title}
            description={item.description}
            bullet={item.bullet}
            isLast={index === p.items.length - 1}
            isActive={p.activeItem === -1 ? false : p.activeItem >= index + 1}
            isActiveBullet={p.activeItem === -1 ? false : p.activeItem >= index}
            bulletSize={p.bulletSize}
            lineSize={p.lineSize}
          />
        )
      })}
    </ul>
  )
}

export type TimelineItemProps = {
  title: JSXElement
  description?: JSXElement
  bullet?: JSXElement
  isLast?: boolean
  isActive: boolean
  isActiveBullet: boolean
  class?: string
  bulletSize: number
  lineSize: number
}

const TimelineItem: Component<TimelineItemProps> = (p) => {
  const rest = omit(
    p,
    "class",
    "bullet",
    "description",
    "title",
    "isLast",
    "isActive",
    "isActiveBullet",
    "bulletSize",
    "lineSize",
  )
  return (
    <li
      class={cn(
        "relative border-l pb-8 pl-8",
        p.isLast && "border-l-transparent pb-0",
        p.isActive && !p.isLast && "border-l-primary",
        p.class,
      )}
      style={{
        "border-left-width": `${p.lineSize}px`,
      }}
      {...rest}
    >
      <TimelineItemBullet lineSize={p.lineSize} bulletSize={p.bulletSize} isActive={p.isActiveBullet}>
        {p.bullet}
      </TimelineItemBullet>
      <TimelineItemTitle>{p.title}</TimelineItemTitle>
      <Show when={p.description}>
        <TimelineItemDescription>{p.description}</TimelineItemDescription>
      </Show>
    </li>
  )
}

export type TimelineItemBulletProps = {
  children?: JSXElement
  isActive?: boolean
  bulletSize: number
  lineSize: number
}

const TimelineItemBullet: Component<TimelineItemBulletProps> = (p) => {
  return (
    <div
      class={cn("absolute top-0 flex items-center justify-center rounded-full border", p.isActive && "border-primary")}
      style={{
        width: `${p.bulletSize}px`,
        height: `${p.bulletSize}px`,
        left: `${-p.bulletSize / 2 - p.lineSize / 2}px`,
        "border-width": `${p.lineSize}px`,
      }}
      aria-hidden="true"
    >
      {p.children}
    </div>
  )
}

const TimelineItemTitle: ParentComponent = (p) => {
  return <div class={"mb-1 text-base font-semibold leading-none"}>{p.children}</div>
}

const TimelineItemDescription: Component<ComponentProps<"p">> = (p) => {
  const rest = omit(p, "class", "children")
  return (
    <p class={cn("text-muted-foreground text-sm", p.class)} {...rest}>
      {p.children}
    </p>
  )
}

export { Timeline }
