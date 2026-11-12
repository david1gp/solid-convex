import { mdiChevronRight } from "@adaptive-ds/mdi/mdiChevronRight.js"
import { Link } from "@tanstack/solid-router"
import { For } from "solid-js"
import { overviewPageStateCreate } from "#src/app/pages/overviewPageStateCreate.ts"
import { AuthLinks } from "#src/auth/ui/AuthLinks.tsx"
import { PageHeader } from "#src/ui/header/PageHeader.tsx"
import { ttt } from "#ui/i18n/ttt.ts"
import { Icon } from "#ui/static/icon/Icon.jsx"
import { PageWrapper } from "#ui/static/page/PageWrapper.jsx"

export function OverviewPage(p: { demo?: boolean } = {}) {
  const state = overviewPageStateCreate()
  return (
    <PageWrapper>
      <PageHeader title={ttt("Overview")} subtitle={ttt("Organizations and resources in one place.")} />
      <section aria-label={ttt("Shortcuts")} class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <For each={state.cards()}>
          {(card) => (
            <Link
              to={card.href}
              class="focus-ring flex flex-col gap-3 rounded-md border border-border bg-background p-4 transition-colors hover:bg-hover sm:p-5"
            >
              <span class="flex size-9 items-center justify-center rounded-md bg-brand-soft text-brand-accent">
                <Icon path={card.icon} class="size-5" />
              </span>
              <span>
                <span class="flex items-center gap-1 text-sm font-semibold">
                  {card.title}
                  <Icon path={mdiChevronRight} class="size-4 text-muted-foreground" />
                </span>
                <span class="mt-1 block text-sm text-muted-foreground">{card.description}</span>
              </span>
            </Link>
          )}
        </For>
      </section>
      <section class="mt-8">
        <h2 class="mb-3 text-xs font-semibold text-muted-foreground">{ttt("Demo Auth Links")}</h2>
        <div class="rounded-md border border-border bg-background p-4 sm:p-5">
          <AuthLinks demo={p.demo} />
        </div>
      </section>
    </PageWrapper>
  )
}
