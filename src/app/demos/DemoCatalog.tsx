import { For } from "solid-js"
import { appPageDemoHref } from "#src/app/demos/appPageDemoHref.ts"
import { demoCatalogAreaCreate } from "#src/app/demos/demoCatalogAreaCreate.ts"
import { demoCatalogDataCreate } from "#src/app/demos/demoCatalogDataCreate.ts"
import { demoList } from "#src/app/demos/demoList.ts"

const areaOrder = [
  "Overview",
  "Organizations",
  "Teams",
  "Projects",
  "Notes",
  "Resources",
  "User management",
  "Profile",
  "Auth",
]

type CatalogEntry = { name: string; path: string; href: string }

function areaGroupsCreate(
  entries: { title: string; route: string; href: string }[],
): { area: string; entries: CatalogEntry[] }[] {
  return areaOrder
    .map((area) => ({
      area,
      entries: entries
        .filter((entry) => demoCatalogAreaCreate(entry.route) === area)
        .map((entry) => ({ name: entry.title, path: entry.route, href: entry.href })),
    }))
    .filter((group) => group.entries.length > 0)
}

function CatalogRow(p: { entry: CatalogEntry }) {
  return (
    <a
      href={p.entry.href}
      class="flex items-center gap-2 border-b border-border px-3 py-2 text-sm last:border-b-0 hover:bg-hover"
    >
      <span class="min-w-0 flex-1 truncate">{p.entry.name}</span>
      <span class="hidden max-w-[50%] shrink-0 truncate text-xs text-muted-foreground sm:block">{p.entry.path}</span>
    </a>
  )
}

function CatalogGroup(p: { name: string; entries: CatalogEntry[] }) {
  return (
    <section>
      <div class="mb-2 flex items-center gap-2">
        <h3 class="text-xs font-semibold text-muted-foreground">{p.name}</h3>
        <span class="rounded-full bg-hover px-1.5 py-0.5 text-xs">{p.entries.length}</span>
      </div>
      <div class="rounded-md border border-border">
        <For each={p.entries}>{(entry) => <CatalogRow entry={entry} />}</For>
      </div>
    </section>
  )
}

export function DemoCatalog() {
  const catalog = demoCatalogDataCreate(demoList)
  const appEntries = catalog.pageDemos.map((entry) => ({ ...entry, href: appPageDemoHref(entry.route) }))
  const shellEntries = [{ name: "Shell", path: "/demos/shell", href: "/demos/shell" }]
  const appPageCount = appEntries.length + shellEntries.length
  const appGroups = areaGroupsCreate(appEntries)
  const galleryGroups = areaGroupsCreate(catalog.pageDemos)
  const componentCount = catalog.componentCategories.reduce((sum, category) => sum + category.demos.length, 0)

  return (
    <main class="bg-background text-foreground">
      <div class="mx-auto w-full max-w-5xl px-4 py-6 md:px-6">
        <header class="border-b border-border pb-4">
          <h1 class="text-lg font-semibold">Demos</h1>
          <p class="text-xs text-muted-foreground">
            {appPageCount} app pages · {catalog.pageDemos.length} page gallery · {componentCount} component
            examples
          </p>
        </header>
        <div class="mt-6 space-y-8">
          <section>
            <div class="mb-2 flex items-center gap-2">
              <h2 class="text-xs font-semibold text-muted-foreground">App pages</h2>
              <span class="rounded-full bg-hover px-1.5 py-0.5 text-xs">{appPageCount}</span>
            </div>
            <div class="space-y-4">
              <CatalogGroup name="Shell" entries={shellEntries} />
              <For each={appGroups}>{(group) => <CatalogGroup name={group.area} entries={group.entries} />}</For>
            </div>
          </section>
          <section>
            <div class="mb-2 flex items-center gap-2">
              <h2 class="text-xs font-semibold text-muted-foreground">Page gallery</h2>
              <span class="rounded-full bg-hover px-1.5 py-0.5 text-xs">{catalog.pageDemos.length}</span>
            </div>
            <div class="space-y-4">
              <For each={galleryGroups}>{(group) => <CatalogGroup name={group.area} entries={group.entries} />}</For>
            </div>
          </section>
          <section>
            <div class="mb-2 flex items-center gap-2">
              <h2 class="text-xs font-semibold text-muted-foreground">Component examples</h2>
              <span class="rounded-full bg-hover px-1.5 py-0.5 text-xs">{componentCount}</span>
            </div>
            <div class="space-y-4">
              <For each={catalog.componentCategories}>
                {(category) => (
                  <CatalogGroup
                    name={category.category}
                    entries={category.demos.map((demo) => ({
                      name: demo,
                      path: `/demos/${category.category}/${demo}`,
                      href: `/demos/${category.category}/${demo}`,
                    }))}
                  />
                )}
              </For>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
