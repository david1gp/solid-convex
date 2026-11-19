import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime.js"
import utc from "dayjs/plugin/utc.js"
import { createMemo, type Element as JSXElement } from "solid-js"
import { ttc } from "#src/app/i18n/ttc.ts"
import { cn } from "cn"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"

dayjs.extend(relativeTime)
dayjs.extend(utc)

export interface DateViewProps extends MayHaveClass {
  start?: string | JSXElement
  date: string
  showAt?: boolean
  end?: string | JSXElement
  relativeClass?: string
  absoluteClass?: string
}

export function DateView(p: DateViewProps) {
  const dateObj = createMemo(() => dayjs(p.date))
  const timeAgo = () => dateObj().fromNow()
  const absoluteTime = () =>
    dateObj().isSame(dayjs(), "day") ? dateObj().format("HH:mm") : dateObj().format("MMM D, YYYY")
  const utcTime = () => dateObj().utc().format("YYYY-MM-DD HH:mm:ss UTC")

  return (
    <time datetime={p.date} title={utcTime()} class={p.class}>
      {p.start}
      <span class={cn("font-medium", p.relativeClass)}>{timeAgo()}</span>
      {p.showAt || (p.showAt === undefined && <span>{" " + ttc("at") + " "}</span>)}
      <span class={p.absoluteClass}>{absoluteTime()}</span>
      {p.end}
    </time>
  )
}
