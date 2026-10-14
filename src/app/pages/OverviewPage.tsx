import { mdiChevronRight } from "@adaptive-ds/mdi/mdiChevronRight.js"
import { Link } from "@tanstack/solid-router"
import { For } from "solid-js"
import { ttt } from "#ui/i18n/ttt.ts"
import { AuthLinks } from "#src/auth/ui/AuthLinks.tsx"
import { overviewPageStateCreate } from "#src/app/pages/overviewPageStateCreate.ts"
import { PageHeader } from "#src/ui/header/PageHeader.tsx"
import { Icon } from "#ui/static/icon/Icon.jsx"
import { PageWrapper } from "#ui/static/page/PageWrapper.jsx"

export function OverviewPage(p: { demo?: boolean } = {}) {
  const state = overviewPageStateCreate()
  return (
    <PageWrapper>
      <PageHeader
        title={ttt("Overview")}
        subtitle={ttt("Everything you need — organizations and resources in one place.")}
        class="pb-8 pt-4"
      />
      <section aria-label={ttt("Shortcuts")} class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <For each={state.cards()}>
          {(card) => (
            <Link
              to={card.href}
              class="focus-ring group flex flex-col gap-3 rounded-card border border-border-subtle bg-surface p-5 shadow-sm shadow-slate-900/5 transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-slate-900/10 dark:shadow-black/20"
            >
              <span class="flex size-11 items-center justify-center rounded-control bg-brand-soft text-brand-accent">
                <Icon path={card.icon} class="size-6" />
              </span>
              <span>
                <span class="flex items-center gap-1 text-base font-semibold">
                  {card.title}
                  <Icon
                    path={mdiChevronRight}
                    class="size-4 text-content-muted transition-transform group-hover:translate-x-0.5"
                  />
                </span>
                <span class="mt-1 block text-sm text-content-muted">{card.description}</span>
              </span>
            </Link>
          )}
        </For>
      </section>
      <section class="mt-8">
        <h2 class="mb-3 text-lg font-semibold">{ttt("Demo Auth Links")}</h2>
        <div class="rounded-card border border-border-subtle bg-surface p-5 shadow-sm shadow-slate-900/5 dark:shadow-black/20">
          <AuthLinks demo={p.demo} />
        </div>
      </section>
    </PageWrapper>
  )
}
