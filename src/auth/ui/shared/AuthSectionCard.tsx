import { classesAuthCard } from "#src/auth/ui/shared/classesAuthCard.ts"
import { Icon } from "#ui/static/icon/Icon.jsx"
import { classArr } from "#ui/utils/classArr.ts"
import type { HasIcon } from "#ui/utils/HasIcon.ts"
import type { HasSubtitle } from "#ui/utils/HasSubtitle.ts"
import type { HasTitle } from "#ui/utils/HasTitle.ts"
import type { MayHaveChildrenAndClass } from "#ui/utils/MayHaveChildrenAndClass.ts"

export interface AuthSectionCardProps extends HasIcon, HasTitle, HasSubtitle, MayHaveChildrenAndClass {}

export function AuthSectionCard(p: AuthSectionCardProps) {
  return (
    <section class={classArr(classesAuthCard, p.class)}>
      <div class="mb-3 flex items-center gap-3">
        <span class="grid size-9 shrink-0 place-items-center rounded-md bg-hover">
          <Icon path={p.icon} class={classArr("size-5", p.iconClass)} />
        </span>
        <div class="min-w-0">
          <h2 class="text-sm font-semibold">{p.title}</h2>
          <p class="text-xs text-muted-foreground">{p.subtitle}</p>
        </div>
      </div>
      {p.children}
    </section>
  )
}
