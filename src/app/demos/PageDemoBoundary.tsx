import { Show } from "solid-js"
import { PageDemoContent } from "#src/app/demos/PageDemoContent.tsx"
import { pageRouteInventory } from "#src/app/demos/pageRouteInventory.ts"
import { LinkButtonInternal } from "#ui/interactive/link/LinkButton.tsx"

/** Gallery page demo: gallery chrome (All demos link, centering, title) around the
 * shared fixture transport. Shell-wrapped twins render PageDemoContent without this chrome. */
export function PageDemoBoundary(p: { entry?: (typeof pageRouteInventory)[number] }) {
  return (
    <main class="mx-auto max-w-4xl p-4">
      <nav class="flex gap-4">
        <LinkButtonInternal to="/demos">All demos</LinkButtonInternal>
      </nav>
      <Show
        when={p.entry}
        fallback={
          <>
            <h1 class="my-4 text-2xl font-semibold">Page demo not found</h1>
          </>
        }
      >
        {(entry) => (
          <>
            <h1 class="my-4 text-2xl font-semibold">{entry().title}</h1>
            <PageDemoContent entry={entry()} />
          </>
        )}
      </Show>
    </main>
  )
}
