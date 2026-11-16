import { mdiCrane } from "@adaptive-ds/mdi/mdiCrane.js"
import { pageDemoHref } from "#src/app/demos/pageDemoHref.ts"
import { ttc } from "#src/app/i18n/ttc.ts"
import { GoBackLinkButton } from "#src/ui/links/GoBackLinkButton.tsx"
import { GoHomeLinkButton } from "#src/ui/links/GoHomeLinkButton.tsx"
import { Icon } from "#ui/static/icon/Icon.jsx"
import { cn } from "cn"
import type { MayHaveChildrenAndClass } from "#ui/utils/MayHaveChildrenAndClass.ts"
import type { MayHaveId } from "#ui/utils/MayHaveId.ts"
import type { MayHaveTitle } from "#ui/utils/MayHaveTitle.ts"

export interface TodoSectionProps extends MayHaveTitle, MayHaveId, MayHaveChildrenAndClass {
  iconClass?: string
  demo?: boolean
}

export function TodoSection(p: TodoSectionProps) {
  return (
    <section id={p.id} class={cn("flex w-full items-center justify-center", p.class)}>
      <div class={"flex flex-col items-center"}>
        <Icon path={mdiCrane} class={p.iconClass ?? "size-40"} />
        {p.title && <h1 class={"mb-4 text-5xl"}>{p.title}</h1>}
        <h2 class={"mb-4 text-3xl"}>{ttc("Work in progress")}</h2>
        <p class={"text-xl"}>{ttc("The current section is still under development and therefore not yet available")}</p>
        <div class={"mt-6 flex flex-wrap items-center gap-1"}>
          {!p.demo && <GoBackLinkButton />}
          <GoHomeLinkButton homeHref={p.demo ? pageDemoHref("/") : "/"} />
        </div>
      </div>
    </section>
  )
}
