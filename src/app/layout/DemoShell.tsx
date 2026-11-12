import { For } from "solid-js"
import { AppShell } from "#src/app/layout/AppShell.tsx"
import { appDemoUserCreate } from "#src/app/layout/appDemoUserCreate.ts"
import { PageHeader } from "#src/ui/header/PageHeader.tsx"
import { PageToolbar } from "#src/ui/header/PageToolbar.tsx"
import { Input } from "#ui/input/input/Input.jsx"
import { Button } from "#ui/interactive/button/Button.jsx"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { Badge } from "#ui/static/badge/Badge.jsx"
import { badgeVariant } from "#ui/static/badge/badgeCva.jsx"
import { PageWrapper } from "#ui/static/page/PageWrapper.jsx"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "#ui/table/Table.jsx"

const demoShellRows = [
  { name: "Acme Corp", members: "12 members", status: "Active", statusVariant: badgeVariant.filledGreen },
  { name: "Beta Labs", members: "4 members", status: "Pending", statusVariant: badgeVariant.filledYellow },
  { name: "Gamma Co", members: "1 member", status: "Archived", statusVariant: badgeVariant.subtle },
] as const

const demoShellTiles = [
  { label: "Organizations", value: "3" },
  { label: "Members", value: "17" },
  { label: "Pending invites", value: "2" },
]

/** No-auth preview of the real app shell with a fake user (Task 6a pulled forward for Task 2 verification). */
export function DemoShell(p: { activeHref?: string } = {}) {
  return (
    <AppShell user={appDemoUserCreate} onSignOut={() => {}} activeHref={p.activeHref}>
      <PageHeader title="Shell demo" subtitle="3 items">
        <Button variant={buttonVariant.filledIndigo}>New item</Button>
        <Button variant={buttonVariant.outline}>Filter</Button>
      </PageHeader>
      <PageToolbar>
        <Input placeholder="Search…" aria-label="Search" class="sm:w-[360px]" />
      </PageToolbar>
      <PageWrapper>
        <section aria-label="Organizations" class="flex flex-col gap-2">
          <div class="flex items-center gap-2">
            <h2 class="text-xs font-semibold text-muted-foreground">Organizations</h2>
            <Badge>3</Badge>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <For each={demoShellRows}>
                {(row) => (
                  <TableRow>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.members}</TableCell>
                    <TableCell>
                      <Badge variant={row.statusVariant}>{row.status}</Badge>
                    </TableCell>
                  </TableRow>
                )}
              </For>
            </TableBody>
          </Table>
        </section>
        <section aria-label="Stats" class="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <For each={demoShellTiles}>
            {(tile) => (
              <div class="rounded-md border border-border p-4">
                <p class="text-xs font-semibold text-muted-foreground">{tile.label}</p>
                <p class="mt-1 text-base font-semibold">{tile.value}</p>
              </div>
            )}
          </For>
        </section>
      </PageWrapper>
    </AppShell>
  )
}
