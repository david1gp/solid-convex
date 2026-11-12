import { appPageDemoActiveHrefCreate } from "#src/app/demos/appPageDemoActiveHrefCreate.ts"
import { PageDemoContent } from "#src/app/demos/PageDemoContent.tsx"
import { pageRouteInventory } from "#src/app/demos/pageRouteInventory.ts"
import { appDemoUserCreate } from "#src/app/layout/appDemoUserCreate.ts"
import { AppShell } from "#src/app/layout/AppShell.tsx"

/** Shell-wrapped twin of a gallery page demo: the same fixture transport inside the
 * real AppShell with a fake demo user and the matching sidebar highlight. */
export function AppPageDemo(p: { entry: (typeof pageRouteInventory)[number] }) {
  return (
    <AppShell user={appDemoUserCreate} onSignOut={() => {}} activeHref={appPageDemoActiveHrefCreate(p.entry.route)}>
      <PageDemoContent entry={p.entry} />
    </AppShell>
  )
}
